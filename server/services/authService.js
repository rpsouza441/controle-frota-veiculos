import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { withTransaction } from "../db.js";
import { jwtExpiresIn, jwtSecret } from "../config.js";
import { addAuditLog } from "../repositories/auditRepository.js";
import { findUserForLogin } from "../repositories/usersRepository.js";
import { publicUser, toBool } from "../utils/domain.js";
import { apiLog } from "../utils/logger.js";

export async function login({ email, password }) {
  return withTransaction(async (connection) => {
    const user = await findUserForLogin(connection, email);
    if (!user || !toBool(user.active)) {
      apiLog("warn", "auth.login_failed", { email, reason: "invalid_or_inactive_user" });
      const error = new Error("Credenciais invalidas.");
      error.status = 401;
      throw error;
    }
    if (!user.passwordHash) {
      apiLog("warn", "auth.login_failed", { email, userId: user.id, reason: "missing_password_hash" });
      const error = new Error("Senha nao configurada para este usuario.");
      error.status = 401;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      apiLog("warn", "auth.login_failed", { email, userId: user.id, reason: "invalid_password" });
      const error = new Error("Credenciais invalidas.");
      error.status = 401;
      throw error;
    }

    const safeUser = publicUser(user);
    const token = jwt.sign({ sub: safeUser.id, role: safeUser.role, email: safeUser.email }, jwtSecret, { expiresIn: jwtExpiresIn });
    await addAuditLog(connection, safeUser.id, "LOGIN", "Auth", `Login realizado por ${safeUser.email}.`);
    return { token, user: safeUser };
  });
}
