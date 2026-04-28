import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRoutes } from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/api", apiRoutes);

  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });

  app.use(errorHandler);

  return app;
}
