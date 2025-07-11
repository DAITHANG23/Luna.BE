import express from "express";
import morgan from "morgan";
import rateLimit, { Options } from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import userRouter from "./routes/userRoutes";
import authRouter from "./routes/authRoutes";
import bookingRouter from "./routes/bookingRoutes";
import notificationRouter from "./routes/notificationRoutes";
import restaurantRouter from "./routes/restaurantRoutes";
import conceptRouter from "./routes/conceptRoutes";
import compression from "compression";
import errController from "./controllers/errorController";
import cors from "cors";
import passport from "./utils/passport";
import session from "express-session";
import AppError from "./utils/appError";
import redis from "./utils/redis";
import qs from "qs";
import { RedisStore } from "connect-redis";
const xss = require("xss-clean");
import hpp from "hpp";

const app = express();
const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL_PROD
    : process.env.FRONTEND_URL;
// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

app.set("trust proxy", 1);
app.set("query parser", (str: any) =>
  qs.parse(str, { arrayLimit: 100, allowDots: true })
);
app.use(
  session({
    store: new RedisStore({
      client: redis,
      prefix: "sess:",
    }),
    secret: process.env.SESSION_SECRET || "",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.status(200).send("Hello from the server side!");
});

app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const rateLimitHandler: Options["handler"] = (req, res, _next) => {
  res.setHeader("Retry-After", "60");
  res.status(429).json({
    status: "fail",
    error: {
      messageError: "Too many requests, please try again later",
      statusCode: 429,
      status: "fail",
      isOperational: true,
    },
    message: "Too many requests, please try again later",
  });
};

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: {
    status: "fail",
    error: {
      messageError: "Too many requests, please try again later",
      statusCode: 429,
      status: "fail",
      isOperational: true,
    },
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use(compression());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ["ratingsQuantity", "ratingsAverage", "price"],
  })
);

// 3) ROUTES
// app.use('/', viewRouter);
app.use("/api/v1/restaurants", restaurantRouter);
app.use("/api/v1/concepts", conceptRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);
// app.use('/api/v1/reviews', reviewRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/notifications", notificationRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errController);

module.exports = app;
