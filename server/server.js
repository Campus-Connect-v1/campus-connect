import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import mongoose from "mongoose";

import { swaggerDocs } from "./utils/swagger.js";
import { COLORS } from "./helper/logger.js";
import db, { verifyMySqlConnection } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import universityRoutes from "./routes/university.routes.js";
import socialRoutes from "./routes/social.routes.js";
import locationRoutes from "./routes/location.routes.js";
import eventRoutes from "./routes/event.routes.js";
import studyGroupRoutes from "./routes/studyGroup.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";

import connectMongoDB from "./config/mongoDB.js";

import socketServer from "./socket.js";

// ============= DOTENV ======================
dotenv.config({ debug: false });

const app = express();
const server = http.createServer(app);

// ============= MONGO DB ====================
await connectMongoDB();
await verifyMySqlConnection();

// ============= SWAGGER =====================
swaggerDocs(app);

// ============ DEBUG =====================
console.log(COLORS[process.env.SUCCESS], "PORT:", process.env.PORT);
console.log(COLORS[process.env.SUCCESS], "NODE_ENV:", process.env.NODE_ENV);

// ============= EXPRESS ======================
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

// ============= MORGAN ======================
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ============= ROUTES ======================
const getDbHealth = async () => {
  const health = {
    api: "ok",
    mysql: "unknown",
    mongo: mongoose.connection.readyState === 1 ? "ok" : "unavailable",
  };

  try {
    await db.query("SELECT 1");
    health.mysql = "ok";
  } catch (error) {
    health.mysql = "error";
    health.mysql_error =
      process.env.NODE_ENV === "development" ? error.message : undefined;
  }

  return health;
};

app.get("/api/health", async (req, res) => {
  const health = await getDbHealth();
  const statusCode = health.mysql === "ok" && health.mongo === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});
app.get("/api/health/db", async (req, res) => {
  const health = await getDbHealth();
  const statusCode = health.mysql === "ok" && health.mongo === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/university", universityRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/geofencing", locationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/study-group", studyGroupRoutes);
app.use("/api/conversations", conversationRoutes);

// ============= MIDDLWAREs ======================
// =========================404 handler
app.use((req, res, next) => {
  res.status(404).json({
    message: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      `let's assume you are a hacker, why would i tell you the available endpoints?`,
    ],
  });
});

// =========================Error handling middleware
app.use((error, req, res, next) => {
  console.error(COLORS[process.env.ERROR], "Unhandled error:", error);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

app.get("/", (req, res) => res.send("Campus Connect API running..."));

// ========================= SOCKET SERVER ======================
socketServer(server);

// ========================= SERVER ======================
server.listen(process.env.PORT || 5000, () =>
  console.log(
    COLORS[process.env.SUCCESS],
    `Server running on port ${process.env.PORT}`
  )
);
