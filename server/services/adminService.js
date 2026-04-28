import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../db.js";
import { addAuditLog } from "../repositories/auditRepository.js";
import { ensureTeamCanBeInactivated, ensureVehicleCanBeInactivated, upsertClient as saveClient, upsertTeam as saveTeam, upsertVehicle as saveVehicle } from "../repositories/adminRepository.js";
import { getAppSettings, updateSettings as saveSettings } from "../repositories/settingsRepository.js";
import { upsertUser as saveUser, userExists } from "../repositories/usersRepository.js";
import { isCorporateEmail, normalizeCorporateEmailDomain, normalizeVehicleStatus } from "../utils/domain.js";
import { apiLog } from "../utils/logger.js";

export async function upsertVehicle(vehicle, actorUserId) {
  const status = normalizeVehicleStatus(vehicle);
  await withTransaction(async (connection) => {
    await ensureVehicleCanBeInactivated(connection, vehicle);
    await saveVehicle(connection, vehicle, status);
  });
  apiLog("info", "crud.vehicle_upsert", {
    actorUserId,
    vehicleId: vehicle.id,
    plate: vehicle.plate,
    status,
    active: vehicle.active,
  });
}

export async function upsertUser(user, actorUserId) {
  const settings = await getAppSettings();
  if (!isCorporateEmail(user.email, settings.corporateEmailDomain)) {
    const error = new Error(`Use um e-mail corporativo ${settings.corporateEmailDomain}.`);
    error.status = 400;
    throw error;
  }
  if (!(await userExists(user.id)) && !user.password) {
    const error = new Error("Senha obrigatoria para criar usuario.");
    error.status = 400;
    throw error;
  }

  const passwordHash = user.password ? await bcrypt.hash(user.password, 10) : null;
  await saveUser(user, passwordHash);
  apiLog("info", "crud.user_upsert", { actorUserId, userId: user.id, email: user.email, role: user.role, active: user.active });
}

export async function upsertTeam(team, actorUserId) {
  await withTransaction(async (connection) => {
    await ensureTeamCanBeInactivated(connection, team);
    await saveTeam(connection, team);
  });
  apiLog("info", "crud.team_upsert", { actorUserId, teamId: team.id, name: team.name, active: team.active });
}

export async function upsertClient(client, actorUserId) {
  await saveClient(pool, client);
  apiLog("info", "crud.client_upsert", { actorUserId, clientId: client.id, name: client.name, active: client.active });
}

export async function updateSettings(settings, actorUserId) {
  const corporateEmailDomain = normalizeCorporateEmailDomain(settings.corporateEmailDomain);
  await withTransaction(async (connection) => {
    await saveSettings(connection, { ...settings, corporateEmailDomain }, actorUserId);
    await addAuditLog(connection, actorUserId, "SETTINGS_UPDATE", "AppSettings", `Configuracoes atualizadas: funcionarios ${settings.employeesCanSeeInUseVehicles ? "podem" : "nao podem"} ver veiculos em uso; dominio ${corporateEmailDomain}.`);
    apiLog("info", "crud.settings_update", {
      actorUserId,
      employeesCanSeeInUseVehicles: settings.employeesCanSeeInUseVehicles,
      corporateEmailDomain,
    });
  });

  return {
    employeesCanSeeInUseVehicles: settings.employeesCanSeeInUseVehicles,
    corporateEmailDomain,
  };
}
