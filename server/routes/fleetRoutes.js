import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getFleetState } from "../repositories/fleetRepository.js";
import { addAuditLogEntry, closeUsage, createWithdrawal } from "../services/fleetService.js";
import { createCorrectionRequest, reviewCorrectionRequest } from "../services/correctionService.js";
import { auditLogSchema, correctionReviewSchema, correctionSchema, returnSchema, withdrawalSchema } from "../validation/schemas.js";
import { validate } from "../validation/validate.js";

export const fleetRoutes = Router();

fleetRoutes.get("/fleet-state", requireAuth, async (_req, res, next) => {
  try {
    res.json(await getFleetState());
  } catch (error) {
    next(error);
  }
});

fleetRoutes.post("/audit-logs", requireAuth, async (req, res, next) => {
  try {
    const input = validate(auditLogSchema, req.body);
    await addAuditLogEntry(input);
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

fleetRoutes.post("/usages/withdrawals", requireAuth, async (req, res, next) => {
  try {
    const input = validate(withdrawalSchema, req.body);
    await createWithdrawal(input);
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

fleetRoutes.post("/usages/:id/return", requireAuth, async (req, res, next) => {
  try {
    const input = validate(returnSchema, req.body);
    await closeUsage({ usageId: req.params.id, ...input }, req.user);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

fleetRoutes.post("/corrections", requireAuth, async (req, res, next) => {
  try {
    const input = validate(correctionSchema, req.body);
    await createCorrectionRequest(input);
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

fleetRoutes.post("/corrections/:id/review", requireAuth, requireRole(["MANAGER", "ADMIN"]), async (req, res, next) => {
  try {
    const input = validate(correctionReviewSchema, req.body);
    await reviewCorrectionRequest(req.params.id, input);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
