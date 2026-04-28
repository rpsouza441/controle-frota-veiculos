import { pool } from "../db.js";
import { publicUser, toBool } from "../utils/domain.js";

export async function findActiveUserById(userId) {
  const [rows] = await pool.execute(
    "SELECT id, name, email, role, team_id AS teamId, active FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  const user = rows[0];
  if (!user || !toBool(user.active)) return null;
  return publicUser(user);
}

export async function findUserForLogin(connection, email) {
  const [rows] = await connection.execute(
    "SELECT id, name, email, password_hash AS passwordHash, role, team_id AS teamId, active FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    [email],
  );
  return rows[0];
}

export async function userExists(userId) {
  const [existing] = await pool.execute("SELECT id FROM users WHERE id = ? LIMIT 1", [userId]);
  return Boolean(existing[0]);
}

export async function upsertUser(user, passwordHash) {
  if (passwordHash) {
    await pool.execute(
      `INSERT INTO users (id, name, email, password_hash, role, team_id, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), password_hash = VALUES(password_hash),
         role = VALUES(role), team_id = VALUES(team_id), active = VALUES(active)`,
      [user.id, user.name, user.email, passwordHash, user.role, user.teamId, user.active],
    );
    return;
  }

  await pool.execute(
    `UPDATE users
        SET name = ?, email = ?, role = ?, team_id = ?, active = ?
      WHERE id = ?`,
    [user.name, user.email, user.role, user.teamId, user.active, user.id],
  );
}
