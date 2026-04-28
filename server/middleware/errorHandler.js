import { apiLog } from "../utils/logger.js";

export function errorHandler(error, _req, res, _next) {
  apiLog("error", "request.error", {
    status: error.status || 500,
    code: error.code,
    message: error.message || "Erro interno da API.",
  });
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Registro duplicado." });
  }
  res.status(error.status || 500).json({ message: error.message || "Erro interno da API." });
}
