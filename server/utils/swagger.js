import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { COLORS } from "../helper/logger.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Campus Connect API",
      version: "1.0.0",
      description: "API documentation for Campus Connect",
    },
    servers: [{ url: "http://localhost:8000/api" }],
  },
  apis: ["./routes/*.js"], // paths to your route files
};

export const swaggerSpec = swaggerJSDoc(options);

export function swaggerDocs(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(
    COLORS[process.env.WARNING],
    "Swagger docs available at: http://localhost:8000/api-docs"
  );
}
