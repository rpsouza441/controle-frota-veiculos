import { newId } from "../utils/domain.js";
import { apiLog } from "../utils/logger.js";

export async function addAuditLog(connection, actorUserId, action, entity, summary) {
  await connection.execute(
    `INSERT INTO audit_log_entries (id, created_at, actor_user_id, action, entity, summary)
     VALUES (?, UTC_TIMESTAMP(), ?, ?, ?, ?)`,
    [newId("audit"), actorUserId, action, entity, summary],
  );
  apiLog("info", "audit.event", { actorUserId, action, entity, summary });
}
