# Simple single-stage Dockerfile for the frontend
FROM node:20-alpine
WORKDIR /app

# Build-time configuration for API endpoints (compiled into the app)
ARG VITE_API_BASE_URL=
ARG VITE_OAUTH_BACKEND_BASE=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_OAUTH_BACKEND_BASE=${VITE_OAUTH_BACKEND_BASE}

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY client ./client
COPY shared ./shared
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

RUN npm run build

# Serve built app using Vite preview
EXPOSE 8080
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "8080", "--strictPort"] 