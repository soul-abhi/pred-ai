FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --ignore-scripts
COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter api build

FROM node:24-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json .
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/server.js"]
