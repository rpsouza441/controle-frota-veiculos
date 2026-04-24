import { CorrectionStatus, UsageStatus, UserRole, VehicleStatus } from "../domain/types";

export const roleLabels: Record<UserRole, string> = {
  EMPLOYEE: "Funcionário",
  MANAGER: "Gestor",
  ADMIN: "Admin",
};

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em uso",
  INATIVO: "Inativo",
};

export const usageStatusLabels: Record<UsageStatus, string> = {
  ABERTO: "Aberto",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
};

export const correctionStatusLabels: Record<CorrectionStatus, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
};
