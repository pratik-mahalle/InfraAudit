# InfrAudit

InfrAudit is a cloud infrastructure auditing and monitoring platform that helps organizations track, analyze, and optimize their cloud resources. It provides real-time monitoring, cost analysis, security drift detection, and automated recommendations for infrastructure optimization.

## Frontend (this repo)
- React + TypeScript (Vite)
- Configure API base via `VITE_API_BASE_URL` and OAuth backend via `VITE_OAUTH_BACKEND_BASE`

## Quickstart
```bash
npm install
npm run dev
```

## Docker
```bash
docker compose up --build -d
# open http://localhost:8080
```

## Environment
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_OAUTH_BACKEND_BASE=http://localhost:5000
```

---
Made with ❤️ by [thedevopsguy](https://github.com/pratik-mahalle) 