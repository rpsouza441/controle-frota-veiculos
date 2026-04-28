import { pool } from "../db.js";
import { publicUser, toBool } from "../utils/domain.js";
import { toIsoMinute } from "../utils/date.js";
import { settingsFromRows } from "./settingsRepository.js";

export async function getFleetState() {
  const [teams] = await pool.query("SELECT id, name, active FROM teams ORDER BY name");
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
  const settings = settingsFromRows(settingsRows);

  const usageClientMap = usageClients.reduce((acc, item) => {
    acc[item.usageId] ??= { ids: [], names: [] };
    acc[item.usageId].ids.push(item.clientId);
    acc[item.usageId].names.push(item.clientName);
    return acc;
  }, {});

  return {
    teams: teams.map((team) => ({ ...team, active: toBool(team.active) })),
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
      employeesCanSeeInUseVehicles: settings.employeesCanSeeInUseVehicles,
      corporateEmailDomain: settings.corporateEmailDomain,
      footerBrandLabel: settings.footerBrandLabel,
    },
  };
}

export async function ensureClients(connection, names) {
  const normalized = [...new Set(names.map((name) => String(name).trim()).filter(Boolean))];
  const clients = [];
  for (const name of normalized) {
    const [existing] = await connection.execute("SELECT id, name, active FROM clients WHERE LOWER(name) = LOWER(?) LIMIT 1", [name]);
    if (existing[0]) {
      clients.push(existing[0]);
      continue;
    }
    const client = { id: `client-${crypto.randomUUID()}`, name };
    await connection.execute("INSERT INTO clients (id, name, active) VALUES (?, ?, TRUE)", [client.id, client.name]);
    clients.push(client);
  }
  return clients;
}

export async function findVehicleForUpdate(connection, vehicleId) {
  const [vehicleRows] = await connection.execute("SELECT * FROM vehicles WHERE id = ? FOR UPDATE", [vehicleId]);
  return vehicleRows[0];
}

export async function userHasOpenUsage(connection, userId) {
  const [openUser] = await connection.execute("SELECT id FROM vehicle_usages WHERE user_id = ? AND status = 'ABERTO' LIMIT 1", [userId]);
  return Boolean(openUser[0]);
}

export async function createUsage(connection, usageId, input) {
  await connection.execute(
    `INSERT INTO vehicle_usages
     (id, vehicle_id, user_id, team_id, origin, destination, purpose, withdrawal_km, withdrawal_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ABERTO')`,
    [usageId, input.vehicleId, input.userId, input.teamId, input.origin, input.destination, input.purpose, input.withdrawalKm, input.withdrawalAt],
  );
}

export async function addUsageClient(connection, usageId, client) {
  await connection.execute(
    "INSERT INTO vehicle_usage_clients (usage_id, client_id, client_name_snapshot) VALUES (?, ?, ?)",
    [usageId, client.id, client.name],
  );
}

export async function markVehicleInUse(connection, vehicleId) {
  await connection.execute("UPDATE vehicles SET status = 'EM_USO' WHERE id = ?", [vehicleId]);
}

export async function findUsageForUpdate(connection, usageId) {
  const [usageRows] = await connection.execute("SELECT * FROM vehicle_usages WHERE id = ? FOR UPDATE", [usageId]);
  return usageRows[0];
}

export async function closeUsage(connection, usageId, input) {
  await connection.execute(
    "UPDATE vehicle_usages SET return_km = ?, return_at = ?, return_note = ?, status = 'FECHADO' WHERE id = ?",
    [input.returnKm, input.returnAt, input.returnNote || null, usageId],
  );
}

export async function updateVehicleAfterReturn(connection, vehicleId, returnKm) {
  await connection.execute("UPDATE vehicles SET current_km = ?, status = 'DISPONIVEL' WHERE id = ? AND active = TRUE", [returnKm, vehicleId]);
}

export async function getVehiclePlate(connection, vehicleId) {
  const [vehicleRows] = await connection.execute("SELECT plate FROM vehicles WHERE id = ?", [vehicleId]);
  return vehicleRows[0]?.plate;
}
