# Sử dụng Node.js 22 với Alpine
FROM node:22-alpine AS base

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép file package.json và cài đặt dependencies
COPY package.json tsconfig.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Biên dịch TypeScript sang JavaScript
RUN npm run build

# Mở cổng 3000
EXPOSE 3000

# Chạy ứng dụng
CMD ["npm", "start"]