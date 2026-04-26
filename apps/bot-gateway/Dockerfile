FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.15.0

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/bot-gateway/package.json ./apps/bot-gateway/

RUN pnpm install --frozen-lockfile

COPY packages/types ./packages/types
COPY apps/bot-gateway ./apps/bot-gateway

RUN pnpm --filter @warike-business/types build
RUN pnpm --filter bot-gateway build

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm@9.15.0

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/bot-gateway/package.json ./apps/bot-gateway/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/apps/bot-gateway/dist ./apps/bot-gateway/dist

EXPOSE 3002

CMD ["node", "apps/bot-gateway/dist/main"]
