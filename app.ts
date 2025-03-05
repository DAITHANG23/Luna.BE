import express, { NextFunction } from "express";
import morgan from "morgan";
import rateLimit, { Options } from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import userRouter from "./routes/userRoutes";
import compression from "compression";
import errController from "./controllers/errorController";
import cors from "cors";
const AppError = require("./utils/appError");
const xss = require("xss-clean");
import hpp from "hpp";

const app = express();

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(
//   cors({
//     origin: "http://localhost:3000",
//   })
// );

app.options("*", cors({ origin: "http://localhost:3000", credentials: true }));
// app.options('/api/v1/tours/:id', cors());

app.get("/", (req, res) => {
  res.status(200).send("Hello from the server side!");
});

app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const rateLimitHandler: Options["handler"] = (req, res, _next) => {
  res.setHeader("Retry-After", "60"); // Thêm header Retry-After
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
// Limit requests from same API
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
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
  standardHeaders: true, // Thêm `RateLimit-*` headers vào response
  legacyHeaders: false, // Ẩn `X-RateLimit-*` headers cũ
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
// app.use('/api/v1/tours', tourRouter);
app.use("/api/v1/users", userRouter);
// app.use('/api/v1/reviews', reviewRouter);
// app.use('/api/v1/bookings', bookingRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errController);

module.exports = app;
