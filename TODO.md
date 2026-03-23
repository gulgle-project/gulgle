# Project Improvement Backlog

Use this as a one-by-one checklist. Work top to bottom unless priorities change.

## 1) Testing Foundation
- [ ] Add a test runner for each app/package (`vitest` recommended for TS).
- [ ] Add unit tests for shared logic (`packages/shared`).
- [ ] Add backend unit/integration tests for core server behavior.
- [ ] Add frontend component tests for critical UI flows.
- [ ] Add one E2E smoke test for the main user journey.

## 2) CI Quality Gates
- [ ] Create or update CI workflow to run `biome`, `typecheck`, tests, and builds on PRs.
- [ ] Fail CI on any lint/type/test/build regression.
- [ ] Add status checks as required before merge.

## 3) Backend Security Hardening
- [ ] Add rate limiting for sensitive/public endpoints.
- [ ] Define strict CORS policy per environment.
- [ ] Standardize auth error handling and response shape.
- [ ] Document JWT expiry and refresh/rotation strategy.

## 4) API Runtime/Framework Direction
- [ ] Decide whether to keep custom Bun server approach or adopt a framework (e.g. Hono/Fastify).
- [ ] If staying custom, document architecture and conventions.
- [ ] If adopting framework, create migration plan and phased rollout.

## 5) Observability
- [ ] Ensure structured JSON logging in all environments.
- [ ] Add request correlation IDs.
- [ ] Add health/readiness endpoints.
- [ ] Add metrics/tracing plan (OpenTelemetry-compatible).

## 6) Configuration and Env Validation
- [ ] Centralize env loading + schema validation with Zod.
- [ ] Fail fast on startup for invalid/missing config.
- [ ] Export typed config module shared where appropriate.

## 7) Frontend PWA Update Strategy
- [ ] Define explicit caching policy for static assets vs dynamic bang data.
- [ ] Implement update prompts/refresh behavior for new versions.
- [ ] Validate offline and stale-cache behavior.

## 8) Dependency and Upgrade Policy
- [ ] Enable Dependabot or Renovate.
- [ ] Define update cadence (weekly/monthly) and ownership.
- [ ] Keep lockfile policy explicit and documented.

## 9) Workspace Standards
- [ ] Create/verify shared base `tsconfig` and extend in each package.
- [ ] Standardize script names: `lint`, `typecheck`, `test`, `build`.
- [ ] Ensure consistent Biome config usage across all workspaces.

## 10) Delivery and Deployment Readiness
- [ ] Add deployment documentation for web and server.
- [ ] Add containerization or runtime deployment artifacts for server.
- [ ] Define environment matrix (dev/staging/prod) and release flow.

## Optional Tracking Fields (per task)
- Owner:
- Target date:
- Notes:
