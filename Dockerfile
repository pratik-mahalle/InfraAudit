# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Build-time configuration for API endpoints
ARG VITE_API_BASE_URL=
ARG VITE_OAUTH_BACKEND_BASE=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_OAUTH_BACKEND_BASE=${VITE_OAUTH_BACKEND_BASE}

# Install deps first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source needed for build
COPY client ./client
COPY shared ./shared
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Build the app (outputs to dist/public per vite config)
RUN npm run build

# --- Runtime stage ---
FROM nginx:alpine

# Copy custom nginx config for SPA routing and caching
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets to nginx web root
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Expose port
EXPOSE 80

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost/ || exit 1

# Default command
CMD ["nginx", "-g", "daemon off;"] 