import mongoose from "mongoose";
import dotenv = require("dotenv");
import { Request, Response } from "express";

dotenv.config({ path: "./.env" });

const DB =
  process.env.MONGO_URI?.replace(
    "<PASSWORD>",
    process.env.MONGO_PASSWORD || ""
  ) || "";

mongoose
  .connect(DB)
  .then(() => console.log("DB connection successful!"))
  .catch((err) => console.log(err));

const app = require("./app");
app.get("/favicon.ico", (_req: Request, res: Response) =>
  res.status(204).end()
);
const port = process.env.PORT || 8001;
const server = app.listen(port, () => {
  console.log(`App running on the ${port}...`);
});

process.on("unhandleRecjection", (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
