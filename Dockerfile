FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package.json package-lock.json* tsconfig.json tsup.config.ts ./
COPY src ./src
RUN npm install
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json
ENV NODE_ENV=production
EXPOSE 4000 4100
CMD ["node", "dist/server.js"]
