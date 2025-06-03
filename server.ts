import mongoose from "mongoose";
import dotenv = require("dotenv");
import { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { startReminderJob } from "./jobs/reminderJob";

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
const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL_PROD
    : process.env.FRONTEND_URL;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
export { io };

startReminderJob();

app.get("/favicon.ico", (_req: Request, res: Response) =>
  res.status(204).end()
);

const port = process.env.PORT || 8001;
const server = httpServer.listen(port, () => {
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
