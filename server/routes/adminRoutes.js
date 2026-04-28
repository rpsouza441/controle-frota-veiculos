import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { updateSettings, upsertClient, upsertTeam, upsertUser, upsertVehicle } from "../services/adminService.js";
import { clientSchema, settingsSchema, teamSchema, userSchema, vehicleSchema } from "../validation/schemas.js";
import { validate } from "../validation/validate.js";

export const adminRoutes = Router();

adminRoutes.put("/vehicles/:id", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const vehicle = validate(vehicleSchema, { ...req.body, id: req.params.id });
    await upsertVehicle(vehicle, req.user.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRoutes.put("/users/:id", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const user = validate(userSchema, { ...req.body, id: req.params.id });
    await upsertUser(user, req.user.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRoutes.put("/teams/:id", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const team = validate(teamSchema, { ...req.body, id: req.params.id });
    await upsertTeam(team, req.user.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRoutes.put("/clients/:id", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const client = validate(clientSchema, { ...req.body, id: req.params.id });
    await upsertClient(client, req.user.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRoutes.put("/settings", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const { settings, actorUserId } = validate(settingsSchema, req.body);
    res.json({ ok: true, settings: await updateSettings(settings, actorUserId) });
  } catch (error) {
    next(error);
  }
});
