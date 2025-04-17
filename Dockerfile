# ---- Stage 1: Build ----
# Sử dụng Node.js 22 Alpine làm base image cho việc build
FROM node:22-alpine AS base
FROM base AS builder

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép package.json, package-lock.json (nếu có) và tsconfig.json
# Việc sao chép riêng các file này trước giúp tận dụng cache của Docker
# nếu các file này không thay đổi giữa các lần build
COPY package*.json tsconfig.json ./

# Cài đặt tất cả dependencies, bao gồm cả devDependencies cần thiết cho việc build (vd: typescript)
RUN npm install --legacy-peer-deps

# Sao chép toàn bộ mã nguồn còn lại
COPY . .

# Build ứng dụng TypeScript thành JavaScript
# Thư mục output mặc định thường là 'dist' theo tsconfig.json
RUN npm run build

# ---- Stage 2: Production ----
# Sử dụng cùng base image Node.js 22 Alpine cho production
FROM base AS production

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt *chỉ* dependencies cần thiết cho production
# Sử dụng --omit=dev (npm v7+) hoặc --production (npm v6 trở về trước)
RUN npm install --omit=dev

# Sao chép các file đã build từ stage 'builder' vào thư mục hiện tại
# Chỉ sao chép thư mục 'dist' chứa code JavaScript đã biên dịch
COPY --from=builder /app/dist ./dist

# Sao chép các tài nguyên khác cần thiết cho production (nếu có, ví dụ: thư mục public, templates,...)
# Ví dụ: COPY --from=builder /app/public ./public

# Thiết lập biến môi trường cho production
ENV NODE_ENV=production
# Có thể thêm các biến môi trường khác ở đây
# ENV PORT=3000

# Mở cổng 3000 (hoặc cổng ứng dụng của bạn)
EXPOSE 3000

# Lệnh để chạy ứng dụng
# Sử dụng trực tiếp node để chạy file server đã biên dịch
# Hoặc có thể dùng lại script npm nếu muốn, nhưng trực tiếp node thường rõ ràng hơn
# CMD ["node", "dist/server.js"]

# Giữ lại CMD gốc của bạn nếu bạn muốn chạy qua npm script
# Đảm bảo script "start:prod" hoặc "start" trong package.json chỉ chạy `node dist/server.js`
# Lưu ý: cross-env và NODE_ENV=production trong script là không cần thiết nữa vì đã set ENV trong Dockerfile
CMD ["npm", "run", "start"]
# Hoặc nếu script của bạn tên là start:prod:
# CMD ["npm", "run", "start:prod"]