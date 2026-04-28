import { Router } from "express";
import { getAppSettings } from "../repositories/settingsRepository.js";
import { requireAuth } from "../middleware/auth.js";
import { login as loginUser } from "../services/authService.js";
import { loginSchema } from "../validation/schemas.js";
import { validate } from "../validation/validate.js";

export const authRoutes = Router();

authRoutes.get("/public-settings", async (_req, res, next) => {
  try {
    const settings = await getAppSettings();
    res.json({ corporateEmailDomain: settings.corporateEmailDomain });
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/auth/login", async (req, res, next) => {
  try {
    const input = validate(loginSchema, req.body);
    res.json(await loginUser(input));
  } catch (error) {
    next(error);
  }
});

authRoutes.get("/auth/me", requireAuth, (req, res) => {
  res.json(req.user);
});
