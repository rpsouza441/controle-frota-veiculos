import { Router } from "express";
import { pool } from "../db.js";

export const healthRoutes = Router();

healthRoutes.get("/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
