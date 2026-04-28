import jwt from "jsonwebtoken";
import { jwtSecret } from "../config.js";
import { findActiveUserById } from "../repositories/usersRepository.js";

export async function requireAuth(req, res, next) {
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

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acesso negado." });
    }
    next();
  };
}
