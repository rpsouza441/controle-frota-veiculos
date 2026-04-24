import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool, withTransaction } from "./db.js";

const app = express();
const port = Number(process.env.API_PORT || 3333);
const jwtSecret = process.env.JWT_SECRET || "dev-only-change-me";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "8h";

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET nao configurado. Usando segredo local de desenvolvimento.");
}

app.use(cors());
app.use(express.json());

const idSchema = z.string().min(1).max(64);
const roleSchema = z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]);
const correctionStatusSchema = z.enum(["APROVADA", "REJEITADA"]);

const loginSchema = z.object({
  email: z.string().email().max(190),
  password: z.string().min(1).max(200),
});

const auditLogSchema = z.object({
  actorUserId: idSchema,
  action: z.string().min(1).max(80),
  entity: z.string().min(1).max(120),
  summary: z.string().min(1).max(2000),
});

const withdrawalSchema = z.object({
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

const returnSchema = z.object({
  returnKm: z.coerce.number().int().nonnegative(),
  returnAt: z.string().min(1),
  returnNote: z.string().max(2000).optional().nullable(),
});

const correctionSchema = z.object({
  vehicleId: idSchema,
  requestedByUserId: idSchema,
  informedKm: z.coerce.number().int().nonnegative(),
  systemKm: z.coerce.number().int().nonnegative(),
  reason: z.string().trim().min(10).max(2000),
});

const correctionReviewSchema = z.object({
  status: correctionStatusSchema,
  reviewerId: idSchema,
  note: z.string().max(2000).optional().nullable(),
});

const vehicleSchema = z.object({
  id: idSchema,
  plate: z.string().trim().min(7).max(16),
  model: z.string().trim().min(2).max(160),
  currentKm: z.coerce.number().int().nonnegative(),
  teamId: idSchema,
  status: z.enum(["DISPONIVEL", "EM_USO", "INATIVO"]),
  active: z.coerce.boolean(),
});

const userSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(160),
  email: z.string().email().max(190),
  password: z.string().min(8).max(200).optional().or(z.literal("")),
  role: roleSchema,
  teamId: idSchema,
  active: z.coerce.boolean(),
});

const clientSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(190),
  active: z.coerce.boolean(),
});

const settingsSchema = z.object({
  settings: z.object({
    employeesCanSeeInUseVehicles: z.coerce.boolean(),
  }),
  actorUserId: idSchema,
});

function newId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function toIsoMinute(value) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dbDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("Data invalida.");
    error.status = 400;
    throw error;
  }
  return String(value).replace("T", " ").slice(0, 19);
}

function toBool(value) {
  return Boolean(Number(value));
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    teamId: user.teamId,
    active: toBool(user.active),
  };
}

function validate(schema, payload) {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;
  const error = new Error(result.error.issues.map((issue) => issue.message).join(" "));
  error.status = 400;
  throw error;
}

async function findActiveUserById(userId) {
  const [rows] = await pool.execute(
    "SELECT id, name, email, role, team_id AS teamId, active FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  const user = rows[0];
  if (!user || !toBool(user.active)) return null;
  return publicUser(user);
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Nao autenticado." });
    }
    const payload = jwt.verify(header.slice("Bearer ".length), jwtSecret);
    const user = await findActiveUserById(payload.sub);
    if (!user) return res.status(401).json({ message: "Sessao invalida." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Token invalido ou expirado." });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acesso negado." });
    }
    next();
  };
}

async function addAuditLog(connection, actorUserId, action, entity, summary) {
  await connection.execute(
    `INSERT INTO audit_log_entries (id, created_at, actor_user_id, action, entity, summary)
     VALUES (?, NOW(), ?, ?, ?, ?)`,
    [newId("audit"), actorUserId, action, entity, summary],
  );
}

async function getFleetState() {
  const [teams] = await pool.query("SELECT id, name FROM teams ORDER BY name");
  const [users] = await pool.query("SELECT id, name, email, role, team_id AS teamId, active FROM users ORDER BY name");
  const [vehicles] = await pool.query(
    "SELECT id, plate, model, current_km AS currentKm, team_id AS teamId, status, active FROM vehicles ORDER BY plate",
  );
  const [clients] = await pool.query("SELECT id, name, active FROM clients ORDER BY name");
  const [usages] = await pool.query(
    `SELECT id, vehicle_id AS vehicleId, user_id AS userId, team_id AS teamId, origin, destination, purpose,
            withdrawal_km AS withdrawalKm, withdrawal_at AS withdrawalAt, return_km AS returnKm,
            return_at AS returnAt, return_note AS returnNote, status
       FROM vehicle_usages
      ORDER BY withdrawal_at DESC`,
  );
  const [usageClients] = await pool.query(
    "SELECT usage_id AS usageId, client_id AS clientId, client_name_snapshot AS clientName FROM vehicle_usage_clients",
  );
  const [correctionRequests] = await pool.query(
    `SELECT id, vehicle_id AS vehicleId, requested_by_user_id AS requestedByUserId, informed_km AS informedKm,
            system_km AS systemKm, reason, status, created_at AS createdAt, reviewed_by_user_id AS reviewedByUserId,
            reviewed_at AS reviewedAt, review_note AS reviewNote
       FROM odometer_correction_requests
      ORDER BY created_at DESC`,
  );
  const [auditLogs] = await pool.query(
    `SELECT id, created_at AS createdAt, actor_user_id AS actorUserId, action, entity, summary
       FROM audit_log_entries
      ORDER BY created_at DESC
      LIMIT 300`,
  );
  const [settingsRows] = await pool.query("SELECT setting_key AS settingKey, setting_value AS settingValue FROM app_settings");

  const usageClientMap = usageClients.reduce((acc, item) => {
    acc[item.usageId] ??= { ids: [], names: [] };
    acc[item.usageId].ids.push(item.clientId);
    acc[item.usageId].names.push(item.clientName);
    return acc;
  }, {});

  return {
    teams,
    users: users.map(publicUser),
    vehicles: vehicles.map((vehicle) => ({ ...vehicle, active: toBool(vehicle.active) })),
    clients: clients.map((client) => ({ ...client, active: toBool(client.active) })),
    usages: usages.map((usage) => ({
      ...usage,
      withdrawalAt: toIsoMinute(usage.withdrawalAt),
      returnAt: toIsoMinute(usage.returnAt),
      returnKm: usage.returnKm ?? undefined,
      returnNote: usage.returnNote ?? undefined,
      clientIds: usageClientMap[usage.id]?.ids ?? [],
      clientNames: usageClientMap[usage.id]?.names ?? [],
    })),
    correctionRequests: correctionRequests.map((request) => ({
      ...request,
      createdAt: toIsoMinute(request.createdAt),
      reviewedAt: toIsoMinute(request.reviewedAt),
      reviewedByUserId: request.reviewedByUserId ?? undefined,
      reviewNote: request.reviewNote ?? undefined,
    })),
    auditLogs: auditLogs.map((log) => ({ ...log, createdAt: toIsoMinute(log.createdAt), actorUserId: log.actorUserId ?? "system" })),
    settings: {
      employeesCanSeeInUseVehicles:
        settingsRows.find((row) => row.settingKey === "employees_can_see_in_use_vehicles")?.settingValue === "true",
    },
  };
}

async function ensureClients(connection, names) {
  const normalized = [...new Set(names.map((name) => String(name).trim()).filter(Boolean))];
  const clients = [];
  for (const name of normalized) {
    const [existing] = await connection.execute("SELECT id, name, active FROM clients WHERE LOWER(name) = LOWER(?) LIMIT 1", [name]);
    if (existing[0]) {
      clients.push(existing[0]);
      continue;
    }
    const client = { id: newId("client"), name };
    await connection.execute("INSERT INTO clients (id, name, active) VALUES (?, ?, TRUE)", [client.id, client.name]);
    clients.push(client);
  }
  return clients;
}

app.get("/api/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email, password } = validate(loginSchema, req.body);
    await withTransaction(async (connection) => {
      const [rows] = await connection.execute(
        "SELECT id, name, email, password_hash AS passwordHash, role, team_id AS teamId, active FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
        [email],
      );
      const user = rows[0];
      if (!user || !toBool(user.active)) return res.status(401).json({ message: "Credenciais invalidas." });
      if (!user.passwordHash) return res.status(401).json({ message: "Senha nao configurada para este usuario." });

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) return res.status(401).json({ message: "Credenciais invalidas." });

      const safeUser = publicUser(user);
      const token = jwt.sign({ sub: safeUser.id, role: safeUser.role, email: safeUser.email }, jwtSecret, { expiresIn: jwtExpiresIn });
      await addAuditLog(connection, safeUser.id, "LOGIN", "Auth", `Login realizado por ${safeUser.email}.`);
      res.json({ token, user: safeUser });
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json(req.user);
});

app.get("/api/fleet-state", requireAuth, async (_req, res, next) => {
  try {
    res.json(await getFleetState());
  } catch (error) {
    next(error);
  }
});

app.post("/api/audit-logs", requireAuth, async (req, res, next) => {
  try {
    const input = validate(auditLogSchema, req.body);
    await withTransaction((connection) => addAuditLog(connection, input.actorUserId, input.action, input.entity, input.summary));
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/usages/withdrawals", requireAuth, async (req, res, next) => {
  try {
    const input = validate(withdrawalSchema, req.body);
    await withTransaction(async (connection) => {
      const [vehicleRows] = await connection.execute("SELECT * FROM vehicles WHERE id = ? FOR UPDATE", [input.vehicleId]);
      const vehicle = vehicleRows[0];
      if (!vehicle || !toBool(vehicle.active) || vehicle.status !== "DISPONIVEL") {
        const error = new Error("Veiculo indisponivel para retirada.");
        error.status = 409;
        throw error;
      }
      const [openUser] = await connection.execute("SELECT id FROM vehicle_usages WHERE user_id = ? AND status = 'ABERTO' LIMIT 1", [
        input.userId,
      ]);
      if (openUser[0]) {
        const error = new Error("Funcionario ja possui uma saida em aberto.");
        error.status = 409;
        throw error;
      }

      const usageId = newId("usage");
      const clients = await ensureClients(connection, input.clientNames);
      await connection.execute(
        `INSERT INTO vehicle_usages
         (id, vehicle_id, user_id, team_id, origin, destination, purpose, withdrawal_km, withdrawal_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ABERTO')`,
        [usageId, input.vehicleId, input.userId, input.teamId, input.origin, input.destination, input.purpose, input.withdrawalKm, dbDateTime(input.withdrawalAt)],
      );
      for (const client of clients) {
        await connection.execute(
          "INSERT INTO vehicle_usage_clients (usage_id, client_id, client_name_snapshot) VALUES (?, ?, ?)",
          [usageId, client.id, client.name],
        );
      }
      await connection.execute("UPDATE vehicles SET status = 'EM_USO' WHERE id = ?", [input.vehicleId]);
      await addAuditLog(connection, input.userId, "VEHICLE_WITHDRAWAL", "VehicleUsage", `Retirada do veiculo ${vehicle.plate} com KM ${input.withdrawalKm}.`);
    });
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/usages/:id/return", requireAuth, async (req, res, next) => {
  try {
    const { returnKm, returnAt, returnNote } = validate(returnSchema, req.body);
    await withTransaction(async (connection) => {
      const [usageRows] = await connection.execute("SELECT * FROM vehicle_usages WHERE id = ? FOR UPDATE", [req.params.id]);
      const usage = usageRows[0];
      if (!usage) {
        const error = new Error("Uso nao encontrado.");
        error.status = 404;
        throw error;
      }
      if (usage.status !== "ABERTO") {
        const error = new Error("Uso ja foi finalizado.");
        error.status = 409;
        throw error;
      }
      await connection.execute(
        "UPDATE vehicle_usages SET return_km = ?, return_at = ?, return_note = ?, status = 'FECHADO' WHERE id = ?",
        [returnKm, dbDateTime(returnAt), returnNote || null, req.params.id],
      );
      await connection.execute("UPDATE vehicles SET current_km = ?, status = 'DISPONIVEL' WHERE id = ? AND active = TRUE", [returnKm, usage.vehicle_id]);
      const [vehicleRows] = await connection.execute("SELECT plate FROM vehicles WHERE id = ?", [usage.vehicle_id]);
      await addAuditLog(connection, usage.user_id, "VEHICLE_RETURN", "VehicleUsage", `Devolucao do veiculo ${vehicleRows[0]?.plate ?? usage.vehicle_id} com KM ${returnKm}.`);
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/corrections", requireAuth, async (req, res, next) => {
  try {
    const input = validate(correctionSchema, req.body);
    await withTransaction(async (connection) => {
      await connection.execute(
        `INSERT INTO odometer_correction_requests
         (id, vehicle_id, requested_by_user_id, informed_km, system_km, reason, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDENTE', NOW())`,
        [newId("corr"), input.vehicleId, input.requestedByUserId, input.informedKm, input.systemKm, input.reason],
      );
      await addAuditLog(connection, input.requestedByUserId, "ODOMETER_CORRECTION_REQUEST", "OdometerCorrectionRequest", `Solicitacao de correcao de KM: sistema ${input.systemKm}, informado ${input.informedKm}.`);
    });
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/corrections/:id/review", requireAuth, requireRole(["MANAGER", "ADMIN"]), async (req, res, next) => {
  try {
    const { status, reviewerId, note } = validate(correctionReviewSchema, req.body);
    await withTransaction(async (connection) => {
      const [rows] = await connection.execute("SELECT * FROM odometer_correction_requests WHERE id = ? FOR UPDATE", [req.params.id]);
      const request = rows[0];
      if (!request) {
        const error = new Error("Solicitacao nao encontrada.");
        error.status = 404;
        throw error;
      }
      await connection.execute(
        "UPDATE odometer_correction_requests SET status = ?, reviewed_by_user_id = ?, reviewed_at = NOW(), review_note = ? WHERE id = ?",
        [status, reviewerId, note || null, req.params.id],
      );
      if (status === "APROVADA") {
        await connection.execute("UPDATE vehicles SET current_km = ? WHERE id = ?", [request.informed_km, request.vehicle_id]);
      }
      await addAuditLog(connection, reviewerId, "ODOMETER_CORRECTION_REVIEW", "OdometerCorrectionRequest", `Solicitacao ${String(status).toLowerCase()} para KM ${request.informed_km}.`);
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.put("/api/vehicles/:id", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const vehicle = validate(vehicleSchema, { ...req.body, id: req.params.id });
    await pool.execute(
      `INSERT INTO vehicles (id, plate, model, current_km, team_id, status, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE plate = VALUES(plate), model = VALUES(model), current_km = VALUES(current_km),
         team_id = VALUES(team_id), status = VALUES(status), active = VALUES(active)`,
      [vehicle.id, vehicle.plate, vehicle.model, vehicle.currentKm, vehicle.teamId, vehicle.status, vehicle.active],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:id", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const user = validate(userSchema, { ...req.body, id: req.params.id });
    const [existing] = await pool.execute("SELECT id FROM users WHERE id = ? LIMIT 1", [user.id]);
    if (!existing[0] && !user.password) {
      return res.status(400).json({ message: "Senha obrigatoria para criar usuario." });
    }

    const passwordHash = user.password ? await bcrypt.hash(user.password, 10) : null;
    if (passwordHash) {
      await pool.execute(
        `INSERT INTO users (id, name, email, password_hash, role, team_id, active)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), password_hash = VALUES(password_hash),
           role = VALUES(role), team_id = VALUES(team_id), active = VALUES(active)`,
        [user.id, user.name, user.email, passwordHash, user.role, user.teamId, user.active],
      );
    } else {
      await pool.execute(
        `UPDATE users
            SET name = ?, email = ?, role = ?, team_id = ?, active = ?
          WHERE id = ?`,
        [user.name, user.email, user.role, user.teamId, user.active, user.id],
      );
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.put("/api/clients/:id", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const client = validate(clientSchema, { ...req.body, id: req.params.id });
    await pool.execute(
      `INSERT INTO clients (id, name, active)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), active = VALUES(active)`,
      [client.id, client.name, client.active],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.put("/api/settings", requireAuth, requireRole(["ADMIN"]), async (req, res, next) => {
  try {
    const { settings, actorUserId } = validate(settingsSchema, req.body);
    await withTransaction(async (connection) => {
      await connection.execute(
        `INSERT INTO app_settings (setting_key, setting_value, updated_by_user_id)
         VALUES ('employees_can_see_in_use_vehicles', ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by_user_id = VALUES(updated_by_user_id)`,
        [settings.employeesCanSeeInUseVehicles ? "true" : "false", actorUserId],
      );
      await addAuditLog(connection, actorUserId, "SETTINGS_UPDATE", "AppSettings", `Configuracoes atualizadas: funcionarios ${settings.employeesCanSeeInUseVehicles ? "podem" : "nao podem"} ver veiculos em uso.`);
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Registro duplicado." });
  }
  res.status(error.status || 500).json({ message: error.message || "Erro interno da API." });
});

app.listen(port, () => {
  console.log(`Fleet API listening on http://127.0.0.1:${port}`);
});
