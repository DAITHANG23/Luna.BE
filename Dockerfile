# ---- Stage 1: Build ----
    FROM node:22-slim AS base
    FROM base AS builder
    
    WORKDIR /app
    
    COPY package*.json tsconfig.json ./
    RUN npm install --legacy-peer-deps
    
    COPY . .
    RUN npm run build
    
    # ---- Stage 2: Production ----
    FROM base AS production
    
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install --omit=dev
    
    COPY --from=builder /app/dist ./dist

    # Sao chép .env vào container
    COPY .env .env
    
    ENV NODE_ENV=production
    EXPOSE 3000
    
    CMD ["npm", "run", "start"]