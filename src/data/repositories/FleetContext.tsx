import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import {
  AuditAction,
  AppSettings,
  Client,
  CorrectionStatus,
  FleetState,
  OdometerCorrectionRequest,
  User,
  Vehicle,
  VehicleUsage,
} from "../../domain/types";
import { getOpenUsageForUser, getOpenUsageForVehicle } from "../../domain/rules/fleetRules";
import { initialFleetState } from "../mock/seed";

type FleetContextValue = {
  state: FleetState;
  findUserByEmail: (email: string) => User | undefined;
  addAuditLog: (actorUserId: string, action: AuditAction, entity: string, summary: string) => void;
  createWithdrawal: (input: Omit<VehicleUsage, "id" | "status">) => VehicleUsage;
  closeUsage: (usageId: string, returnKm: number, returnAt: string, returnNote?: string) => void;
  createCorrectionRequest: (input: Omit<OdometerCorrectionRequest, "id" | "status" | "createdAt">) => void;
  reviewCorrectionRequest: (requestId: string, status: Exclude<CorrectionStatus, "PENDENTE">, reviewerId: string, note?: string) => void;
  upsertVehicle: (vehicle: Omit<Vehicle, "status"> & { status?: Vehicle["status"] }) => void;
  upsertUser: (user: User) => void;
  upsertClient: (client: Client) => void;
  ensureClients: (names: string[]) => Client[];
  updateSettings: (settings: AppSettings, actorUserId: string) => void;
};

const FleetContext = createContext<FleetContextValue | null>(null);

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowLocal() {
  return new Date().toISOString().slice(0, 16);
}

export function FleetProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FleetState>(initialFleetState);

  const value = useMemo<FleetContextValue>(
    () => ({
      state,
      findUserByEmail(email) {
        return state.users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
      },
      addAuditLog(actorUserId, action, entity, summary) {
        setState((current) => ({
          ...current,
          auditLogs: [
            { id: newId("audit"), createdAt: nowLocal(), actorUserId, action, entity, summary },
            ...current.auditLogs,
          ],
        }));
      },
      createWithdrawal(input) {
        const vehicle = state.vehicles.find((item) => item.id === input.vehicleId);
        if (!vehicle || !vehicle.active || vehicle.status !== "DISPONIVEL") {
          throw new Error("Veiculo indisponivel para retirada.");
        }
        if (getOpenUsageForUser(state.usages, input.userId)) {
          throw new Error("Funcionario ja possui uma saida em aberto.");
        }
        if (getOpenUsageForVehicle(state.usages, input.vehicleId)) {
          throw new Error("Veiculo ja possui uso em aberto.");
        }
        const usage: VehicleUsage = { ...input, id: newId("usage"), status: "ABERTO" };
        setState((current) => ({
          ...current,
          usages: [usage, ...current.usages],
          vehicles: current.vehicles.map((item) =>
            item.id === input.vehicleId ? { ...item, status: "EM_USO" } : item,
          ),
          auditLogs: [
            {
              id: newId("audit"),
              createdAt: nowLocal(),
              actorUserId: input.userId,
              action: "VEHICLE_WITHDRAWAL",
              entity: "VehicleUsage",
              summary: `Retirada do veiculo ${vehicle.plate} com KM ${input.withdrawalKm}.`,
            },
            ...current.auditLogs,
          ],
        }));
        return usage;
      },
      closeUsage(usageId, returnKm, returnAt, returnNote) {
        const usage = state.usages.find((item) => item.id === usageId);
        if (!usage) throw new Error("Uso nao encontrado.");
        const vehicle = state.vehicles.find((item) => item.id === usage.vehicleId);
        setState((current) => ({
          ...current,
          usages: current.usages.map((item) =>
            item.id === usageId ? { ...item, returnKm, returnAt, returnNote, status: "FECHADO" } : item,
          ),
          vehicles: current.vehicles.map((item) =>
            item.id === usage.vehicleId ? { ...item, currentKm: returnKm, status: item.active ? "DISPONIVEL" : "INATIVO" } : item,
          ),
          auditLogs: [
            {
              id: newId("audit"),
              createdAt: nowLocal(),
              actorUserId: usage.userId,
              action: "VEHICLE_RETURN",
              entity: "VehicleUsage",
              summary: `Devolucao do veiculo ${vehicle?.plate ?? usage.vehicleId} com KM ${returnKm}.`,
            },
            ...current.auditLogs,
          ],
        }));
      },
      createCorrectionRequest(input) {
        setState((current) => ({
          ...current,
          correctionRequests: [
            { ...input, id: newId("corr"), status: "PENDENTE", createdAt: nowLocal() },
            ...current.correctionRequests,
          ],
          auditLogs: [
            {
              id: newId("audit"),
              createdAt: nowLocal(),
              actorUserId: input.requestedByUserId,
              action: "ODOMETER_CORRECTION_REQUEST",
              entity: "OdometerCorrectionRequest",
              summary: `Solicitacao de correcao de KM: sistema ${input.systemKm}, informado ${input.informedKm}.`,
            },
            ...current.auditLogs,
          ],
        }));
      },
      reviewCorrectionRequest(requestId, status, reviewerId, note) {
        const request = state.correctionRequests.find((item) => item.id === requestId);
        setState((current) => ({
          ...current,
          correctionRequests: current.correctionRequests.map((item) =>
            item.id === requestId
              ? { ...item, status, reviewedByUserId: reviewerId, reviewedAt: nowLocal(), reviewNote: note }
              : item,
          ),
          vehicles:
            status === "APROVADA" && request
              ? current.vehicles.map((vehicle) =>
                  vehicle.id === request.vehicleId ? { ...vehicle, currentKm: request.informedKm } : vehicle,
                )
              : current.vehicles,
          auditLogs: [
            {
              id: newId("audit"),
              createdAt: nowLocal(),
              actorUserId: reviewerId,
              action: "ODOMETER_CORRECTION_REVIEW",
              entity: "OdometerCorrectionRequest",
              summary: `Solicitacao ${status.toLowerCase()}${request ? ` para KM ${request.informedKm}` : ""}.`,
            },
            ...current.auditLogs,
          ],
        }));
      },
      upsertVehicle(vehicle) {
        setState((current) => {
          const exists = current.vehicles.some((item) => item.id === vehicle.id);
          const normalized: Vehicle = {
            ...vehicle,
            id: vehicle.id || newId("vehicle"),
            status: vehicle.active ? vehicle.status ?? "DISPONIVEL" : "INATIVO",
          };
          return {
            ...current,
            vehicles: exists
              ? current.vehicles.map((item) => (item.id === normalized.id ? normalized : item))
              : [normalized, ...current.vehicles],
          };
        });
      },
      upsertUser(user) {
        setState((current) => ({
          ...current,
          users: current.users.some((item) => item.id === user.id)
            ? current.users.map((item) => (item.id === user.id ? user : item))
            : [{ ...user, id: user.id || newId("user") }, ...current.users],
        }));
      },
      upsertClient(client) {
        setState((current) => ({
          ...current,
          clients: current.clients.some((item) => item.id === client.id)
            ? current.clients.map((item) => (item.id === client.id ? client : item))
            : [{ ...client, id: client.id || newId("client") }, ...current.clients],
        }));
      },
      ensureClients(names) {
        const normalizedNames = names.map((name) => name.trim()).filter(Boolean);
        const existing = state.clients.filter((client) =>
          normalizedNames.some((name) => name.toLowerCase() === client.name.toLowerCase()),
        );
        const missing = normalizedNames
          .filter((name) => !existing.some((client) => client.name.toLowerCase() === name.toLowerCase()))
          .map<Client>((name) => ({ id: newId("client"), name, active: true }));
        if (missing.length) {
          setState((current) => ({ ...current, clients: [...current.clients, ...missing] }));
        }
        return [...existing, ...missing];
      },
      updateSettings(settings, actorUserId) {
        setState((current) => ({
          ...current,
          settings,
          auditLogs: [
            {
              id: newId("audit"),
              createdAt: nowLocal(),
              actorUserId,
              action: "SETTINGS_UPDATE",
              entity: "AppSettings",
              summary: `Configurações atualizadas: funcionários ${settings.employeesCanSeeInUseVehicles ? "podem" : "não podem"} ver veículos em uso.`,
            },
            ...current.auditLogs,
          ],
        }));
      },
    }),
    [state],
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error("useFleet deve ser usado dentro de FleetProvider.");
  return context;
}
