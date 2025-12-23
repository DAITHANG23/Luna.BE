# ---- Stage 1: BASE ----
FROM node:20-alpine AS base

# Install dependencies for building và runtime tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    netcat-openbsd \
    bash

# ---- Stage 2: BUILDER ----
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Install dev dependencies for building
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ---- Stage 3: PRODUCTION ----
FROM base AS production
WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/views ./views

# Copy package.json
COPY package*.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose ports
EXPOSE 8001 3333

# Use entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Default command
CMD ["npm", "run", "start"]