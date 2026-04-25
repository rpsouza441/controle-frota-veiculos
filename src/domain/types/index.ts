export type UserRole = "EMPLOYEE" | "MANAGER" | "ADMIN";
export type VehicleStatus = "DISPONIVEL" | "EM_USO" | "INATIVO";
export type UsageStatus = "ABERTO" | "FECHADO" | "CANCELADO";
export type CorrectionStatus = "PENDENTE" | "APROVADA" | "REJEITADA";
export type AuditAction =
  | "LOGIN"
  | "VEHICLE_WITHDRAWAL"
  | "VEHICLE_RETURN"
  | "VEHICLE_UPSERT"
  | "USER_UPSERT"
  | "CLIENT_UPSERT"
  | "ODOMETER_CORRECTION_REQUEST"
  | "ODOMETER_CORRECTION_REVIEW"
  | "SETTINGS_UPDATE";

export interface Team {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string;
  active: boolean;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  currentKm: number;
  teamId: string;
  status: VehicleStatus;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  active: boolean;
}

export interface VehicleUsage {
  id: string;
  vehicleId: string;
  userId: string;
  teamId: string;
  clientIds: string[];
  clientNames: string[];
  origin: string;
  destination: string;
  purpose: string;
  withdrawalKm: number;
  withdrawalAt: string;
  returnKm?: number;
  returnAt?: string;
  returnNote?: string;
  status: UsageStatus;
}

export interface OdometerCorrectionRequest {
  id: string;
  vehicleId: string;
  requestedByUserId: string;
  informedKm: number;
  systemKm: number;
  reason: string;
  status: CorrectionStatus;
  createdAt: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  actorUserId: string;
  action: AuditAction;
  entity: string;
  summary: string;
}

export interface AppSettings {
  employeesCanSeeInUseVehicles: boolean;
  corporateEmailDomain: string;
  footerBrandLabel: string;
}

export interface FleetState {
  users: User[];
  teams: Team[];
  vehicles: Vehicle[];
  usages: VehicleUsage[];
  clients: Client[];
  correctionRequests: OdometerCorrectionRequest[];
  auditLogs: AuditLogEntry[];
  settings: AppSettings;
}
