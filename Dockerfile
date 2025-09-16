FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY client ./client
COPY shared ./shared
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

RUN npm run build

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "8080", "--strictPort"] 