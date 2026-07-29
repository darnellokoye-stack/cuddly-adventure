import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import { WebSocketServer, WebSocket } from 'ws';
import { Application } from 'express';
import { logger } from '../utils/logger.js';
import { DiscoveryEventType, AnyDiscoveryEvent } from '../types/Events.js';

export interface StreamSubscription {
  clientId: string;
  eventTypes: DiscoveryEventType[];
}

export class EventStreamServer {
  private readonly wss: WebSocketServer;
  private readonly clients = new Map<string, WebSocket>();
  private readonly subscriptions = new Map<string, StreamSubscription>();
  private server?: HttpServer;
  private readonly app: Application;

  constructor(app: Application) {
    this.app = app;
    this.wss = new WebSocketServer({ noServer: true });
    this.server = createServer(this.app as any);
    this.server.on('upgrade', (request, socket, head) => {
      const pathname = request.url ?? '/';
      if (pathname !== '/events') {
        socket.destroy();
        return;
      }

      this.wss.handleUpgrade(request, socket as any, head, (socket) => {
        this.wss.emit('connection', socket, request);
      });
    });

    this.wss.on('connection', (socket) => {
      const clientId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      this.clients.set(clientId, socket);
      this.subscriptions.set(clientId, { clientId, eventTypes: Object.values(DiscoveryEventType) });

      socket.on('message', (raw) => {
        try {
          const message = JSON.parse(raw.toString());
          if (message.type === 'subscribe') {
            this.subscriptions.set(clientId, {
              clientId,
              eventTypes: (message.eventTypes ?? Object.values(DiscoveryEventType)) as DiscoveryEventType[]
            });
          }
        } catch (error) {
          logger.warn({ error }, 'Invalid websocket message');
        }
      });

      socket.on('close', () => {
        this.clients.delete(clientId);
        this.subscriptions.delete(clientId);
      });

      socket.send(JSON.stringify({ type: 'connected', clientId }));

      setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.ping();
        }
      }, 30000);
    });
  }

  async start(port = 0): Promise<number> {
    return new Promise((resolve) => {
      this.server?.listen(port, () => {
        const address = this.server?.address() as AddressInfo;
        logger.info({ port: address.port }, 'WebSocket event stream started');
        resolve(address.port);
      });
    });
  }

  async stop(): Promise<void> {
    for (const socket of this.clients.values()) {
      socket.close();
    }
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
  }

  broadcast(event: AnyDiscoveryEvent): void {
    const payload = JSON.stringify(event);
    for (const [clientId, socket] of this.clients.entries()) {
      const subscription = this.subscriptions.get(clientId);
      if (!subscription || !subscription.eventTypes.includes(event.type as DiscoveryEventType)) {
        continue;
      }
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }
}
