import { withTransaction } from "../db.js";
import { addAuditLog } from "../repositories/auditRepository.js";
import { newId } from "../utils/domain.js";
import { apiLog } from "../utils/logger.js";

export async function createCorrectionRequest(input) {
  await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO odometer_correction_requests
       (id, vehicle_id, requested_by_user_id, informed_km, system_km, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDENTE', UTC_TIMESTAMP())`,
      [newId("corr"), input.vehicleId, input.requestedByUserId, input.informedKm, input.systemKm, input.reason],
    );
    await addAuditLog(connection, input.requestedByUserId, "ODOMETER_CORRECTION_REQUEST", "OdometerCorrectionRequest", `Solicitacao de correcao de KM: sistema ${input.systemKm}, informado ${input.informedKm}.`);
    apiLog("info", "correction.request_created", {
      actorUserId: input.requestedByUserId,
      vehicleId: input.vehicleId,
      systemKm: input.systemKm,
      informedKm: input.informedKm,
    });
  });
}

export async function reviewCorrectionRequest(requestId, { status, reviewerId, note }) {
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute("SELECT * FROM odometer_correction_requests WHERE id = ? FOR UPDATE", [requestId]);
    const request = rows[0];
    if (!request) {
      const error = new Error("Solicitacao nao encontrada.");
      error.status = 404;
      throw error;
    }
    if (request.status !== "PENDENTE") {
      const error = new Error("Esta solicitação já foi processada ou não está mais pendente.");
      error.status = 409;
      throw error;
    }
    await connection.execute(
      "UPDATE odometer_correction_requests SET status = ?, reviewed_by_user_id = ?, reviewed_at = UTC_TIMESTAMP(), review_note = ? WHERE id = ?",
      [status, reviewerId, note || null, requestId],
    );
    if (status === "APROVADA") {
      await connection.execute("UPDATE vehicles SET current_km = ? WHERE id = ?", [request.informed_km, request.vehicle_id]);
    }
    await addAuditLog(connection, reviewerId, "ODOMETER_CORRECTION_REVIEW", "OdometerCorrectionRequest", `Solicitacao ${String(status).toLowerCase()} para KM ${request.informed_km}.`);
    apiLog("info", "correction.request_reviewed", {
      actorUserId: reviewerId,
      requestId,
      vehicleId: request.vehicle_id,
      status,
      informedKm: request.informed_km,
    });
  });
}
