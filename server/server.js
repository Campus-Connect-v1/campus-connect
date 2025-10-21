import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { db } from "./config/db.js";
import { swaggerDocs } from "./utils/swagger.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import universityRoutes from "./routes/university.routes.js";
import socialRoutes from "./routes/social.routes.js";
import locationRoutes from "./routes/location.routes.js";
import connectMongoDB from "./config/mongoDB.js";

dotenv.config();
const app = express();

// ============= MONGO DB ====================
connectMongoDB();

// ============= SWAGGER =====================
swaggerDocs(app);

// ============ DEBUG =====================
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);

// ============= EXPRESS ======================
app.use(express.urlencoded({ extended: true }));
app.use(cors());
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
  console.error("Unhandled error:", error);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

app.get("/", (req, res) => res.send("Campus Connect API running..."));

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
