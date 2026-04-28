import { withTransaction } from "../db.js";
import { addAuditLog } from "../repositories/auditRepository.js";
import {
  addUsageClient,
  closeUsage as closeUsageRecord,
  createUsage,
  ensureClients,
  findUsageForUpdate,
  findVehicleForUpdate,
  getVehiclePlate,
  markVehicleInUse,
  updateVehicleAfterReturn,
  userHasOpenUsage,
} from "../repositories/fleetRepository.js";
import { dbDateTime } from "../utils/date.js";
import { newId, toBool } from "../utils/domain.js";
import { apiLog } from "../utils/logger.js";

export async function addAuditLogEntry(input) {
  await withTransaction((connection) => addAuditLog(connection, input.actorUserId, input.action, input.entity, input.summary));
}

export async function createWithdrawal(input) {
  await withTransaction(async (connection) => {
    const vehicle = await findVehicleForUpdate(connection, input.vehicleId);
    if (!vehicle || !toBool(vehicle.active) || vehicle.status !== "DISPONIVEL") {
      const error = new Error("Veiculo indisponivel para retirada.");
      error.status = 409;
      throw error;
    }
    if (await userHasOpenUsage(connection, input.userId)) {
      const error = new Error("Funcionario ja possui uma saida em aberto.");
      error.status = 409;
      throw error;
    }

    const usageId = newId("usage");
    const clients = await ensureClients(connection, input.clientNames);
    await createUsage(connection, usageId, { ...input, withdrawalAt: dbDateTime(input.withdrawalAt) });
    for (const client of clients) {
      await addUsageClient(connection, usageId, client);
    }
    await markVehicleInUse(connection, input.vehicleId);
    await addAuditLog(connection, input.userId, "VEHICLE_WITHDRAWAL", "VehicleUsage", `Retirada do veiculo ${vehicle.plate} com KM ${input.withdrawalKm}.`);
    apiLog("info", "usage.withdrawal_created", {
      actorUserId: input.userId,
      usageId,
      vehicleId: input.vehicleId,
      plate: vehicle.plate,
      withdrawalKm: input.withdrawalKm,
    });
  });
}

export async function closeUsage({ usageId, returnKm, returnAt, returnNote }, actorUser) {
  await withTransaction(async (connection) => {
    const usage = await findUsageForUpdate(connection, usageId);
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
    if (usage.user_id !== actorUser.id && actorUser.role !== "ADMIN") {
      const error = new Error("Apenas o responsavel ou um administrador pode registrar esta devolucao.");
      error.status = 403;
      throw error;
    }

    await closeUsageRecord(connection, usageId, { returnKm, returnAt: dbDateTime(returnAt), returnNote });
    await updateVehicleAfterReturn(connection, usage.vehicle_id, returnKm);
    const plate = await getVehiclePlate(connection, usage.vehicle_id);
    await addAuditLog(connection, actorUser.id, "VEHICLE_RETURN", "VehicleUsage", `Devolucao do veiculo ${plate ?? usage.vehicle_id} com KM ${returnKm}.`);
    apiLog("info", "usage.return_created", {
      actorUserId: actorUser.id,
      usageId,
      vehicleId: usage.vehicle_id,
      plate,
      returnKm,
    });
  });
}
