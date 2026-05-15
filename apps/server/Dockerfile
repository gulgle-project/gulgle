FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile && \
  pnpm --filter gulgle-server build

FROM node:22-alpine AS runtime

ARG ENV=production
ENV NODE_ENV=${ENV}

WORKDIR /app

RUN corepack enable && \
  addgroup --gid 10000 settingssync && \
  adduser -S --uid 10000 -G settingssync settingssync

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
RUN pnpm install --frozen-lockfile --prod --filter gulgle-server

COPY --from=builder /app/apps/server/dist apps/server/dist

USER settingssync
WORKDIR /app/apps/server

ENTRYPOINT ["node", "dist/main.mjs"]
