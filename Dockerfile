# Use Node.js LTS version as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Database Configuration
ENV DATABASE_URL=postgresql://pratik:infraaudit@infra.cpukeoom0b97.ap-south-1.rds.amazonaws.com:5432/cloudwatchdog?sslmode=require&ssl=true&rejectUnauthorized=false
ENV PGDATABASE=cloudwatchdog
ENV PGHOST=infra.cpukeoom0b97.ap-south-1.rds.amazonaws.com
ENV PGPORT=5432
ENV PGUSER=pratik
ENV PGPASSWORD=infraaudit

# OpenAI Configuration
ENV OPENAI_API_KEY=ysk-proj-McnbNR2qMVExbBHDUWdLJI9NVyGNkDX1CEoWuArLWEwibi043MCYiB5I2Dhk9DJIIZUawMkM5QT3BlbkFJC8E4yVlmghChuR8z3kVC7xYZwppml4Ix5mgUK_wWLoXW6HE7StUEdrDDIqGkf4TxW6eiugRtsA

# Slack Configuration
ENV SLACK_BOT_TOKEN=nT4UjnzVH2cZFChyzsam8wRx
ENV SLACK_CHANNEL_ID=A08R84G3BRD

# Stripe Configuration
ENV STRIPE_SECRET_KEY=sk_test_51RNBFq2c41yfi4sIHNsx75wH8wut653p8BpnjLkX3R2AxZ8eHcpwbwqoBTtdZgVs24gdxI5EqocaeIzlBMhSE9J100NXdsyTpt
ENV VITE_STRIPE_PUBLIC_KEY=pk_test_51RNBFq2c41yfi4sIf6R9IFhQngKq8LVirF8iR3RytsKZUIyLdD2tPDTgjCCiXhIAxndeX98HV5f4HgKK0axvoJQF006BVMbimn

# Session Configuration
ENV SESSION_SECRET=WrIp1aS66Bb5Z1SACwiQqffAQCa//eWDSyw4FJvAiN2h9hT2Ius628bb3eWYQP5vinCGVwNQTMdhZMFUpbn1gw==

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]
