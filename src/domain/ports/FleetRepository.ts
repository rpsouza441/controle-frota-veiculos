import {
  AppSettings,
  AuditAction,
  Client,
  CorrectionStatus,
  FleetState,
  OdometerCorrectionRequest,
  Team,
  User,
  Vehicle,
  VehicleUsage,
} from "../types";

export type CreateWithdrawalInput = Omit<VehicleUsage, "id" | "status">;
export type CloseUsageInput = {
  usageId: string;
  returnKm: number;
  returnAt: string;
  returnNote?: string;
};
export type CreateCorrectionRequestInput = Omit<OdometerCorrectionRequest, "id" | "status" | "createdAt">;
export type ReviewCorrectionRequestInput = {
  requestId: string;
  status: Exclude<CorrectionStatus, "PENDENTE">;
  reviewerId: string;
  note?: string;
};
export type UpsertVehicleInput = Omit<Vehicle, "status"> & { status?: Vehicle["status"] };
export type AddAuditLogInput = {
  actorUserId: string;
  action: AuditAction;
  entity: string;
  summary: string;
};
export type UpdateSettingsInput = {
  settings: AppSettings;
  actorUserId: string;
};

export interface FleetRepository {
  getFleetState(): Promise<FleetState>;
  addAuditLog(input: AddAuditLogInput): Promise<void>;
  createWithdrawal(input: CreateWithdrawalInput): Promise<void>;
  closeUsage(input: CloseUsageInput): Promise<void>;
  createCorrectionRequest(input: CreateCorrectionRequestInput): Promise<void>;
  reviewCorrectionRequest(input: ReviewCorrectionRequestInput): Promise<void>;
  upsertVehicle(input: UpsertVehicleInput): Promise<void>;
  upsertUser(input: User): Promise<void>;
  upsertTeam(input: Team): Promise<void>;
  upsertClient(input: Client): Promise<void>;
  updateSettings(input: UpdateSettingsInput): Promise<AppSettings>;
}
