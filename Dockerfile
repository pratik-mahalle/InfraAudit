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
    
    # Fix permissions so nginx can serve files
    RUN chown -R nginx:nginx /usr/share/nginx/html
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    