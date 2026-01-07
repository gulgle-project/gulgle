FROM oven/bun:1.2.22-alpine AS builder

COPY . /build
WORKDIR /build

RUN [ "$(uname -m)" = "x86_64" ] && export TARGET_ARCH="x64" || export TARGET_ARCH="$(uname -m)"; \
  bun install &&\
  bun build src/main.ts --target=bun-linux-${TARGET_ARCH}-musl --compile --outfile=dist/settings-sync &&\
  ls -la dist

# RUN bun install &&\
#   bun build src/main.ts --target=bun --minify --outfile=dist/settings-sync.js &&\
#   ls -la dist

FROM alpine:3.20
# FROM oven/bun:1.2.22-alpine

COPY --from=builder /build/dist/settings-sync /usr/bin/settings-sync
# COPY --from=builder /build/dist/settings-sync.js /home/bun/app/settings-sync.js

RUN apk add gcompat libstdc++ &&\
  addgroup --gid 10000 settingssync && adduser -S --uid 10000 -G settingssync settingssync &&\
  chmod +x /usr/bin/settings-sync

# USER settingssync

ENTRYPOINT [ "/usr/bin/settings-sync" ]
# ENTRYPOINT [ "/usr/bin/env", "bun", "settings-sync.js" ]
