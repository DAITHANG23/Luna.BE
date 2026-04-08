# 🌙 Luna.BE — Restaurant Booking Backend

A robust, production-ready REST API backend for a restaurant booking platform. Built with **Node.js**, **Express**, **TypeScript**, and **MongoDB**, featuring real-time notifications, authentication, image uploads and bookings more.

---

## 🚀 Tech Stack

| Layer            | Technology                                    |
|------------------|-----------------------------------------------|
| Runtime          | Node.js 20.x                                  |
| Language         | TypeScript                                    |
| Framework        | Express.js                                    |
| Database         | MongoDB (via Mongoose)                        |
| Cache / Session  | Redis (via ioredis + connect-redis)           |
| Authentication   | JWT + Passport.js (Google OAuth 2.0)          |
| Email            | Resend + Nodemailer + Pug templates           |
| Image Upload     | Cloudinary + Multer + Sharp                   |
| Real-time        | Socket.IO                                     |
| Scheduler        | node-cron                                     |
| Containerization | Docker + Docker Compose                       |
| CI/CD            | GitHub Actions → VPS (SSH deploy)             |

---

## 📁 Project Structure

```
Luna.BE/
├── controllers/        # Route handlers & business logic
├── models/             # Mongoose schemas & models
├── routes/             # Express route definitions
├── utils/              # Helpers: AppError, redis, passport, email...
├── socket/             # Socket.IO event handlers
├── jobs/               # Cron jobs (e.g. reminder emails)
├── views/              # Pug email templates
├── @types/             # Custom TypeScript type declarations
├── app.ts              # Express app setup & middleware
├── server.ts           # HTTP server + Socket.IO init
├── Dockerfile          # Production Docker image
├── Dockerfile.dev      # Development Docker image
├── docker-compose.yml          # Production Compose config
├── docker-compose.dev.yaml     # Development Compose config
└── .github/workflows/
    └── production.yml  # GitHub Actions CI/CD pipeline
```

---

## 🌐 API Endpoints

| Prefix                    | Description              |
|---------------------------|--------------------------|
| `GET /`                   | Health check             |
| `/api/v1/auth`            | Authentication (login, register, OAuth) |
| `/api/v1/users`           | User management & profile |
| `/api/v1/restaurants`     | Restaurant CRUD          |
| `/api/v1/concepts`        | Restaurant concepts      |
| `/api/v1/bookings`        | Booking management       |
| `/api/v1/notifications`   | User notifications       |

> All `/api` routes are rate-limited to **50 requests/minute** per IP.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable              | Description                              |
|-----------------------|------------------------------------------|
| `NODE_ENV`            | `development` or `production`            |
| `PORT`                | Server port (default: `8001`)            |
| `FRONTEND_URL`        | Local frontend URL (dev)                 |
| `FRONTEND_URL_PROD`   | Production frontend URL                  |
| `BACKEND_URL`         | Backend public URL                       |
| `MONGO_URI`           | MongoDB connection string                |
| `MONGO_PASSWORD`      | MongoDB password                         |
| `JWT_SECRET`          | Secret key for signing JWT tokens        |
| `OTP_KEY_SECRET`      | Secret key for OTP generation            |
| `REDIS_HOST`          | Redis host                               |
| `REDIS_PORT`          | Redis port                               |
| `REDIS_PASSWORD`      | Redis password                           |
| `CLOUDINARY_NAME`     | Cloudinary cloud name                    |
| `CLOUDINARY_API_KEY`  | Cloudinary API key                       |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                  |
| `GOOGLE_CLIENT_ID`    | Google OAuth 2.0 client ID               |
| `GOOGLE_CLIENT_SECRET`| Google OAuth 2.0 client secret           |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL                |
| `SESSION_SECRET`      | Express session secret                   |
| `RESEND_API_KEY`      | Resend API key for transactional email   |

---

## 🛠️ Getting Started (Local Development)

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- Docker & Docker Compose (optional)

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

The server starts at `http://localhost:8001` with hot-reload via `nodemon`.

---

## 🐳 Docker

### Development

```bash
npm run docker:dev
# or
docker compose -f docker-compose.dev.yaml up --build
```

### Production

```bash
npm run docker:prod
# or
docker compose -f docker-compose.yml up -d --build
```

### Tear down

```bash
npm run docker:dev:down   # stop dev containers
npm run docker:prod:down  # stop prod containers
```

---

## 🏗️ Build

```bash
npm run build
```

Compiles TypeScript → `dist/` and resolves path aliases with `tsc-alias`. Email templates (Pug views) are copied to `dist/views/` automatically via `postbuild`.

---

## 🔒 Security Features

- **Helmet** — HTTP security headers
- **Rate limiting** — 50 req/min on all `/api` routes
- **CORS** — Restricted to configured frontend origin
- **MongoDB sanitization** — Prevents NoSQL injection
- **XSS clean** — Strips malicious HTML from request bodies
- **HPP** — Prevents HTTP parameter pollution
- **JWT** — Stateless authentication with short-lived access tokens
- **Redis sessions** — Secure, HttpOnly, SameSite cookies

---

## 🚢 CI/CD Pipeline

Pushes and PRs to `main` trigger a GitHub Actions workflow:

1. **Build** — Installs dependencies and verifies the project compiles (`npm ci`)
2. **Deploy** — SSHs into the VPS, writes the `.env` from GitHub Secrets, pulls the latest code, and rebuilds the Docker container

Required **GitHub Secrets**:

`HOST`, `USERNAME`, `PASSWORD`, `FRONTEND_URL`, `FRONTEND_URL_PROD`, `BACKEND_URL`, `MONGO_URI`, `MONGO_PASSWORD`, `JWT_SECRET`, `OTP_KEY_SECRET`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `SESSION_SECRET`, `RESEND_API_KEY`

---

## 📜 Available Scripts

| Script                  | Description                                  |
|-------------------------|----------------------------------------------|
| `npm run dev`           | Start development server with hot-reload     |
| `npm run build`         | Compile TypeScript for production            |
| `npm start`             | Start production server from `dist/`         |
| `npm run lint`          | Run ESLint                                   |
| `npm run lint:fix`      | Run ESLint and auto-fix issues               |
| `npm run docker:dev`    | Start development Docker containers          |
| `npm run docker:dev:down` | Stop development Docker containers         |
| `npm run docker:prod`   | Start production Docker containers           |
| `npm run docker:prod:down` | Stop production Docker containers         |

---

## 👤 Author

**Dom Nguyen**

---

## 📄 License

ISC
