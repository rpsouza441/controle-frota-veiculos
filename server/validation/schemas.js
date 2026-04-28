import { z } from "zod";

export const idSchema = z.string().min(1).max(64);
export const roleSchema = z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]);
export const correctionStatusSchema = z.enum(["APROVADA", "REJEITADA"]);

export const loginSchema = z.object({
  email: z.string().email().max(190),
  password: z.string().min(1).max(200),
});

export const auditLogSchema = z.object({
  actorUserId: idSchema,
  action: z.string().min(1).max(80),
  entity: z.string().min(1).max(120),
  summary: z.string().min(1).max(2000),
});

export const withdrawalSchema = z.object({
  vehicleId: idSchema,
  userId: idSchema,
  teamId: idSchema,
  clientNames: z.array(z.string().trim().min(1).max(190)).default([]),
  origin: z.string().trim().min(1).max(190),
  destination: z.string().trim().min(1).max(190),
  purpose: z.string().trim().min(1).max(2000),
  withdrawalKm: z.coerce.number().int().nonnegative(),
  withdrawalAt: z.string().min(1),
});

export const returnSchema = z.object({
  returnKm: z.coerce.number().int().nonnegative(),
  returnAt: z.string().min(1),
  returnNote: z.string().max(2000).optional().nullable(),
});

export const correctionSchema = z.object({
  vehicleId: idSchema,
  requestedByUserId: idSchema,
  informedKm: z.coerce.number().int().nonnegative(),
  systemKm: z.coerce.number().int().nonnegative(),
  reason: z.string().trim().min(10).max(2000),
});

export const correctionReviewSchema = z.object({
  status: correctionStatusSchema,
  reviewerId: idSchema,
  note: z.string().max(2000).optional().nullable(),
});

export const vehicleSchema = z.object({
  id: idSchema,
  plate: z.string().trim().min(7).max(16),
  model: z.string().trim().min(2).max(160),
  currentKm: z.coerce.number().int().nonnegative(),
  teamId: idSchema,
  status: z.enum(["DISPONIVEL", "EM_USO", "INATIVO"]),
  active: z.coerce.boolean(),
});

export const userSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(160),
  email: z.string().email().max(190),
  password: z.string().min(8).max(200).optional().or(z.literal("")),
  role: roleSchema,
  teamId: idSchema,
  active: z.coerce.boolean(),
});

export const clientSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(190),
  active: z.coerce.boolean(),
});

export const teamSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(160),
  active: z.coerce.boolean(),
});

export const settingsSchema = z.object({
  settings: z.object({
    employeesCanSeeInUseVehicles: z.coerce.boolean(),
    corporateEmailDomain: z.string().trim().min(2).max(80),
  }),
  actorUserId: idSchema,
});
