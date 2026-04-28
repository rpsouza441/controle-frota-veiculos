import "dotenv/config";
import { normalizeCorporateEmailDomain } from "./utils/domain.js";

export const port = Number(process.env.API_PORT || 3333);
export const jwtSecret = process.env.JWT_SECRET || "dev-only-change-me";
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "8h";
export const defaultCorporateEmailDomain = normalizeCorporateEmailDomain(process.env.CORPORATE_EMAIL_DOMAIN || "@empresa.com.br");

export function warnUnsafeConfig() {
  if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET nao configurado. Usando segredo local de desenvolvimento.");
  }
}
