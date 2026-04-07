# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Cài đặt toàn bộ dependencies (bao gồm devDependencies để build)
COPY package*.json ./
RUN npm ci

# Sao chép source code và build
COPY . .
RUN npm run build


# ---- Stage 2: Production ----
FROM node:20-alpine

WORKDIR /usr/src/app

# Chỉ cài đặt các dependencies cần thiết cho production
COPY package*.json ./
RUN npm ci --omit=dev

# Sao chép thư mục dist đã được build từ stage builder
COPY --from=builder /usr/src/app/dist ./dist

# Expose port (nên match với PORT trong file .env và server.ts)
EXPOSE 8001

# Lệnh khởi chạy server (dựa theo scripts.start trong package.json)
CMD ["npm", "run", "start"]
