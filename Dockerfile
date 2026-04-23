# ---------- Build Stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Accept API URL as build argument
ARG VITE_API_BASE_URL=https://api.infraudit.com
ARG VITE_OAUTH_BACKEND_BASE=https://api.infraudit.com
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OAUTH_BACKEND_BASE=$VITE_OAUTH_BACKEND_BASE

COPY package.json package-lock.json ./
RUN npm ci

COPY client ./client
COPY shared ./shared 2>/dev/null || true
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

RUN npm run build

# ---------- Production Stage ----------
# TLS is terminated at ALB/Ingress — Nginx serves HTTP only
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

# Copy built assets
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Fix permissions so nginx can serve files
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
