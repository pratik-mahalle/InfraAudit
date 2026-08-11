# ---------- Build Stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Accept API URL as build argument
ARG VITE_API_BASE_URL=https://api.infraudit.com
ARG VITE_OAUTH_BACKEND_BASE=https://api.infraudit.com
ARG VITE_SUPABASE_URL
ARG SUPABASE_PUBLIC_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OAUTH_BACKEND_BASE=$VITE_OAUTH_BACKEND_BASE
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY client ./client
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

RUN VITE_SUPABASE_ANON_KEY="$SUPABASE_PUBLIC_KEY" npm run build

# ---------- Production Stage ----------
# TLS is terminated at ALB/Ingress — Nginx serves HTTP only
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

# Copy built assets
COPY --from=builder /app/dist/public /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Fix permissions so nginx can serve files
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
