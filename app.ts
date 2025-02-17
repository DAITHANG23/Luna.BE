import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
const xss = require("xss-clean");
import hpp from "hpp";

const app = express();

app.get("/", (req, res) => {
  res.status(200).send("Hello from the server side!");
});

app.use(helmet());

module.exports = app;
