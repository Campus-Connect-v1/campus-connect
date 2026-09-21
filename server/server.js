import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { swaggerDocs } from "./utils/swagger.js";
import { COLORS } from "./helper/logger.js";
import { corsOptions } from "./config/cors.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import universityRoutes from "./routes/university.routes.js";
import socialRoutes from "./routes/social.routes.js";
import locationRoutes from "./routes/location.routes.js";
import eventRoutes from "./routes/event.routes.js";
import studyGroupRoutes from "./routes/studyGroup.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import pollRoutes from "./routes/poll.routes.js";
import storyRoutes from "./routes/story.routes.js";
import moderationRoutes from "./routes/moderation.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

import connectMongoDB from "./config/mongoDB.js";

import socketServer from "./socket.js";

// ============= DOTENV ======================
dotenv.config({ debug: false });

const app = express();
const server = http.createServer(app);

// ============= MONGO DB ====================
connectMongoDB();

// ============= SWAGGER =====================
swaggerDocs(app);

// ============ DEBUG =====================
console.log(COLORS[process.env.SUCCESS], "PORT:", process.env.PORT);
console.log(COLORS[process.env.SUCCESS], "NODE_ENV:", process.env.NODE_ENV);

// ============= EXPRESS ======================
// Render terminates TLS at its proxy and forwards the client address in
// X-Forwarded-For. Without this, express-rate-limit sees every request as
// coming from the proxy and throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR, so
// rate limiting is effectively disabled. 1 = trust exactly one hop.
app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(express.json());

// ============= MORGAN ======================
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ============= ROUTES ======================
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "API is healthy" });
});
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/university", universityRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/geofencing", locationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/study-group", studyGroupRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/notifications", notificationRoutes);

// ============= OPERATOR WEB APP (app/) ======================
// Built bundle from ../app, served at /admin. Single service, so the UI and
// the API share an origin and there is no CORS between them.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminDist = path.resolve(__dirname, "../app/dist");

if (fs.existsSync(path.join(adminDist, "index.html"))) {
  // Hashed assets are immutable; index.html must never be cached or operators
  // keep loading a stale bundle after a deploy.
  app.use(
    "/admin",
    express.static(adminDist, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-store");
        }
      },
    })
  );

  // Client-side routing: any /admin/* path that is not a real file returns the
  // shell so a deep link or a refresh does not 404.
  app.get(/^\/admin(?:\/.*)?$/, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(path.join(adminDist, "index.html"));
  });

  console.log(
    COLORS[process.env.SUCCESS],
    "Operator app served at /admin"
  );
} else {
  // Not fatal: the API must still boot if the UI was never built.
  app.get(/^\/admin(?:\/.*)?$/, (req, res) =>
    res.status(503).json({
      message:
        "Operator app is not built. Run: cd app && npm install && npm run build",
    })
  );
  console.warn(
    COLORS[process.env.WARNING],
    "app/dist not found → /admin will return 503 until the app is built"
  );
}

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
