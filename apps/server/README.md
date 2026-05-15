# settings-sync-service

To install dependencies:

```bash
pnpm install
```

To run the development server:

Configuration is loaded from `.env.local` and then `.env`; see `.env.template` for the required variables.

```bash
pnpm --filter gulgle-server dev
```

To build and start the Node.js service:

```bash
pnpm --filter gulgle-server build
pnpm --filter gulgle-server start
```
