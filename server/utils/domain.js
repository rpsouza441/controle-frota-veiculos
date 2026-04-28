export function newId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function normalizeCorporateEmailDomain(domain) {
  const normalized = String(domain || "@empresa.com.br").trim().toLowerCase();
  return normalized.startsWith("@") ? normalized : `@${normalized}`;
}

export function isCorporateEmail(email, domain) {
  return String(email).trim().toLowerCase().endsWith(normalizeCorporateEmailDomain(domain));
}

export function toBool(value) {
  return Boolean(Number(value));
}

export function normalizeVehicleStatus(vehicle) {
  if (!vehicle.active) return "INATIVO";
  return vehicle.status === "EM_USO" ? "EM_USO" : "DISPONIVEL";
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    teamId: user.teamId,
    active: toBool(user.active),
  };
}
