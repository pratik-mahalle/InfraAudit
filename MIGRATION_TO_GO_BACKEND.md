## Migration Plan: Move Backend to Go and Keep This Repo Frontend-Only

This document describes how to migrate InfraAudit’s backend from Node/Express to a new Go service in a separate repository, while keeping this repository for the frontend only.

### Goals
- Split monorepo into two:
  - This repo: frontend (Vite/React only)
  - New repo: backend (Go)
- Preserve current API behavior for the UI
- Use typed SQL and robust auth (JWT + OAuth)
- Keep one Postgres database and migrate with SQL files

## Repositories
- Frontend repo (this repository)
  - Contents: `client/`, `README.md`, CI for web build
  - Env: `VITE_API_BASE_URL`, `VITE_OAUTH_BACKEND_BASE`
- Backend repo (new)
  - Name suggestion: `infraaudit-backend-go`
  - Contents: Go server, `migrations/`, CI/CD, Dockerfiles

## Target Backend Stack (Go)
- Router: chi or Gin
- DB: pgx + sqlc (preferred) or bun/gorm
- Migrations: golang-migrate
- Auth:
  - Local: scrypt password verify (compatible with current `hex.salt` format)
  - JWT (access + refresh) with HTTP-only Secure cookies
  - OAuth (Google, GitHub) via goth or `golang.org/x/oauth2`
- Middleware: logging, CORS, request ID

### Suggested Layout (Go repo)
```
infraaudit-backend-go/
  cmd/api/main.go
  internal/http/          # routes, handlers, middleware
  internal/auth/          # local auth, JWT, OAuth
  internal/store/         # sqlc generated queries
  internal/models/        # DTOs and domain models
  migrations/             # SQL migrations (migrate-managed)
  pkg/                    # shared helpers
  Dockerfile
  docker-compose.yml
  .env.example
  README.md
```

## Database & Migrations
- Keep the same Postgres instance
- Move existing SQL migrations from this repo to Go repo `migrations/`:
  - `001_initial_schema.sql`
  - `002_add_oauth_fields.sql`
- Manage future schema changes only from the Go repo
- Apply with golang-migrate:
```bash
migrate -path migrations -database "$DATABASE_URL" up
```

## API Contract (Phase 1 parity)
Implement these first to keep the UI working:
- POST `/api/register`
- POST `/api/login`
- POST `/api/logout`
- POST `/api/auth/refresh`
- GET  `/api/user`
- POST `/api/start-trial`
- GET  `/api/trial-status`
- OAuth:
  - GET `/api/auth/google`, `/api/auth/google/callback`
  - GET `/api/auth/github`, `/api/auth/github/callback`
- Health: GET `/api/status`

## Auth Strategy (Go)
- Switch to JWT-based auth (simplifies cross-origin setup)
  - Login: set `refresh_token` as HTTP-only Secure cookie (`SameSite=None` if cross-site)
  - Response body returns short-lived `access_token`
  - `/api/auth/refresh` rotates refresh + returns new access token
  - `/api/logout` revokes and clears cookies
- Password hashing:
  - `scrypt(password, salt, N/r/p, keyLen=64)` and store as `hexHash.salt`
- OAuth (Google, GitHub):
  - On callback, create/link user (fields: `oauth_provider`, `oauth_id`, `email`, `username`, `avatar_url`, `trialStatus`, `trialStartedAt`)
  - Set refresh cookie; redirect to `${FRONTEND_URL}/dashboard`

## Cross-Origin & Cookies
- Backend CORS:
  - Allow origin: `FRONTEND_URL`
  - `credentials: true`
  - Allowed headers: `Content-Type`, `Authorization`
- Cookies when FE/BE origins differ:
  - `Secure: true`, `SameSite=None`

## Frontend (this repo) Changes
- Environment variables (add to `.env`):
```env
VITE_API_BASE_URL=http://localhost:5000        # or https://api.yourdomain.com
VITE_OAUTH_BACKEND_BASE=http://localhost:5000  # used for OAuth redirects
```
- API helper (`client/src/lib/queryClient.ts`): prefix all requests with `VITE_API_BASE_URL`; keep `credentials: 'include'`
- OAuth buttons:
```ts
window.location.href = `${import.meta.env.VITE_OAUTH_BACKEND_BASE}/api/auth/google`;
```
- After cutover, remove Node server code from this repo (`server/`, `k8s/` for backend, etc.) and update `README.md` to state "frontend only"

## Rollout Phases
1) Bootstrap Go service
- GET `/api/status` returns 200
- CORS configured for `FRONTEND_URL`

2) Port Auth (local + OAuth)
- Implement login/register/logout/refresh/user
- Verify cookies and cross-origin behavior from the frontend

3) Port read-only endpoints used by UI
- Bring over any additional endpoints the UI needs (subscriptions, resources, etc.)

4) Cutover & Cleanup
- Update frontend `.env` to point to Go API in all environments
- Remove Node server from this repo; keep only `client/`
- Future DB migrations happen in Go repo only

## Environment & OAuth Configuration
- Frontend `.env` (this repo):
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_OAUTH_BACKEND_BASE=http://localhost:5000
```
- Backend `.env` (Go repo):
```env
DATABASE_URL=postgres://...
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:5000
JWT_SECRET=change_me
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```
- OAuth callback URLs (dev):
  - Google: `http://localhost:5000/api/auth/google/callback`
  - GitHub: `http://localhost:5000/api/auth/github/callback`

## CI/CD Checklist
- Backend repo:
  - Build + unit tests
  - Run `migrate up` on deploy
  - Dockerize (multi-stage build)
- Frontend repo:
  - Vite build
  - Deploy to static hosting (S3+CloudFront, Vercel, Netlify, etc.)

## Task Checklist
- [ ] Create new Go repo (`infraaudit-backend-go`)
- [ ] Move SQL migrations (`001_*`, `002_*`) to Go repo
- [ ] Scaffold Go server (chi/Gin + pgx + sqlc + migrate + goth)
- [ ] Implement auth endpoints + OAuth callbacks
- [ ] Configure CORS and cookies (cross-origin)
- [ ] Point frontend to `VITE_API_BASE_URL`
- [ ] Test login, refresh, logout, OAuth from the UI
- [ ] Port remaining endpoints needed by UI
- [ ] Remove Node server from this repo after cutover
- [ ] Update docs and CI for both repos

---
Questions or changes to the plan? Update this file and track decisions here. 