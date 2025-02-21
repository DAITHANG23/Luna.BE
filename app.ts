import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import userRouter from "./routes/userRoutes";
import compression from "compression";
import errController from "./controllers/errorController";
const AppError = require("./utils/appError");
const xss = require("xss-clean");
import hpp from "hpp";

const app = express();

app.get("/", (req, res) => {
  res.status(200).send("Hello from the server side!");
});

app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
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
