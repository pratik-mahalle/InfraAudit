# ---------- Build Stage ----------
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    COPY package.json package-lock.json ./
    RUN npm ci
    
    COPY client ./client
    COPY shared ./shared
    COPY tsconfig.json ./
    COPY vite.config.ts ./
    COPY tailwind.config.ts ./
    COPY postcss.config.js ./
    COPY components.json ./
    
    RUN npm run build
    
    # ---------- Production Stage ----------
FROM nginx:alpine
    
    RUN rm -rf /usr/share/nginx/html/*
    
    # Copy from /app/dist/public (your vite config output path)
    COPY --from=builder /app/dist/public /usr/share/nginx/html
    
    # Use our nginx config with SSL support
    COPY nginx.conf /etc/nginx/nginx.conf
    # Also copy an HTTP-only config for initial certificate issuance
    COPY nginx.http.conf /etc/nginx/nginx.http.conf
    
    # Fix permissions so nginx can serve files
    RUN chown -R nginx:nginx /usr/share/nginx/html
    
    # Expose HTTP and HTTPS
    EXPOSE 80 443
    CMD ["nginx", "-g", "daemon off;"]
    
