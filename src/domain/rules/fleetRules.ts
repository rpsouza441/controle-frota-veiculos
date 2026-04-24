import { UserRole, Vehicle, VehicleUsage } from "../types";

export const CORPORATE_EMAIL_DOMAIN = "@empresa.com.br";

export function isCorporateEmail(email: string, domain = CORPORATE_EMAIL_DOMAIN) {
  return email.trim().toLowerCase().endsWith(domain);
}

export function canAccess(userRole: UserRole | undefined, allowed: UserRole[]) {
  return Boolean(userRole && allowed.includes(userRole));
}

export function getOpenUsageForUser(usages: VehicleUsage[], userId: string) {
  return usages.find((usage) => usage.userId === userId && usage.status === "ABERTO");
}

export function getOpenUsageForVehicle(usages: VehicleUsage[], vehicleId: string) {
  return usages.find((usage) => usage.vehicleId === vehicleId && usage.status === "ABERTO");
}

export function isVehicleAvailable(vehicle: Vehicle) {
  return vehicle.active && vehicle.status === "DISPONIVEL";
}
