import {
  AddAuditLogInput,
  CloseUsageInput,
  CreateCorrectionRequestInput,
  CreateWithdrawalInput,
  FleetRepository,
  ReviewCorrectionRequestInput,
  UpdateSettingsInput,
  UpsertVehicleInput,
} from "../../../domain/ports/FleetRepository";
import { AppSettings, AuditLogEntry, Client, FleetState, OdometerCorrectionRequest, Team, User, Vehicle, VehicleStatus, VehicleUsage } from "../../../domain/types";
import { ConflictError, NotFoundError, ValidationError } from "../../../domain/errors/DomainError";
import { readLocalFleetState, writeLocalFleetState } from "./localStorageFleet";

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function mutateState(mutator: (state: FleetState) => void) {
  const state = readLocalFleetState();
  mutator(state);
  writeLocalFleetState(state);
}

export class LocalFleetRepository implements FleetRepository {
  async getFleetState(): Promise<FleetState> {
    return readLocalFleetState();
  }

  async addAuditLog(input: AddAuditLogInput): Promise<void> {
    mutateState((state) => {
      state.auditLogs.unshift({
        id: newId("audit"),
        createdAt: nowIso(),
        ...input,
      });
    });
  }

  async createWithdrawal(input: CreateWithdrawalInput): Promise<void> {
    mutateState((state) => {
      const vehicle = state.vehicles.find((item) => item.id === input.vehicleId);
      if (!vehicle) throw new NotFoundError("Veiculo nao encontrado.");
      if (!vehicle.active || vehicle.status !== "DISPONIVEL") throw new ConflictError("Veiculo indisponivel para retirada.");

      const usage: VehicleUsage = {
        ...input,
        id: newId("usage"),
        withdrawalAt: new Date(input.withdrawalAt).toISOString(),
        status: "ABERTO",
      };

      vehicle.status = "EM_USO";
      state.usages.unshift(usage);
      state.auditLogs.unshift(this.audit(input.userId, "VEHICLE_WITHDRAWAL", "VehicleUsage", `Retirada do veiculo ${vehicle.plate}.`));
    });
  }

  async closeUsage(input: CloseUsageInput): Promise<void> {
    mutateState((state) => {
      const usage = state.usages.find((item) => item.id === input.usageId);
      if (!usage) throw new NotFoundError("Uso nao encontrado.");
      if (usage.status !== "ABERTO") throw new ConflictError("Uso ja encerrado.");
      if (input.returnKm < usage.withdrawalKm) throw new ValidationError("KM de devolucao nao pode ser menor que a KM de retirada.");

      const vehicle = state.vehicles.find((item) => item.id === usage.vehicleId);
      if (!vehicle) throw new NotFoundError("Veiculo nao encontrado.");

      usage.returnKm = input.returnKm;
      usage.returnAt = new Date(input.returnAt).toISOString();
      usage.returnNote = input.returnNote;
      usage.status = "FECHADO";
      vehicle.currentKm = input.returnKm;
      vehicle.status = vehicle.active ? "DISPONIVEL" : "INATIVO";
      state.auditLogs.unshift(this.audit(usage.userId, "VEHICLE_RETURN", "VehicleUsage", `Devolucao do veiculo ${vehicle.plate} com KM ${input.returnKm}.`));
    });
  }

  async createCorrectionRequest(input: CreateCorrectionRequestInput): Promise<void> {
    mutateState((state) => {
      const request: OdometerCorrectionRequest = {
        ...input,
        id: newId("corr"),
        status: "PENDENTE",
        createdAt: nowIso(),
      };
      state.correctionRequests.unshift(request);
      state.auditLogs.unshift(this.audit(input.requestedByUserId, "ODOMETER_CORRECTION_REQUEST", "OdometerCorrectionRequest", "Solicitacao de correcao de KM criada."));
    });
  }

  async reviewCorrectionRequest(input: ReviewCorrectionRequestInput): Promise<void> {
    mutateState((state) => {
      const request = state.correctionRequests.find((item) => item.id === input.requestId);
      if (!request) throw new NotFoundError("Solicitacao nao encontrada.");
      if (request.status !== "PENDENTE") throw new ConflictError("Solicitacao ja revisada.");

      request.status = input.status;
      request.reviewedByUserId = input.reviewerId;
      request.reviewedAt = nowIso();
      request.reviewNote = input.note;

      if (input.status === "APROVADA") {
        const vehicle = state.vehicles.find((item) => item.id === request.vehicleId);
        if (vehicle) vehicle.currentKm = request.informedKm;
      }

      state.auditLogs.unshift(this.audit(input.reviewerId, "ODOMETER_CORRECTION_REVIEW", "OdometerCorrectionRequest", `Solicitacao de KM ${input.status.toLowerCase()}.`));
    });
  }

  async upsertVehicle(input: UpsertVehicleInput): Promise<void> {
    mutateState((state) => {
      const id = input.id || newId("vehicle");
      const status: VehicleStatus = input.active ? (input.status === "EM_USO" ? "EM_USO" : "DISPONIVEL") : "INATIVO";
      const vehicle: Vehicle = { ...input, id, status };
      const index = state.vehicles.findIndex((item) => item.id === id);
      if (index >= 0) state.vehicles[index] = vehicle;
      else state.vehicles.push(vehicle);
    });
  }

  async upsertUser(input: User): Promise<void> {
    mutateState((state) => {
      const user = { ...input, id: input.id || newId("user") };
      const index = state.users.findIndex((item) => item.id === user.id);
      if (index >= 0) state.users[index] = user;
      else state.users.push(user);
    });
  }

  async upsertTeam(input: Team): Promise<void> {
    mutateState((state) => {
      const team = { ...input, id: input.id || newId("team") };
      const index = state.teams.findIndex((item) => item.id === team.id);
      if (index >= 0) state.teams[index] = team;
      else state.teams.push(team);
    });
  }

  async upsertClient(input: Client): Promise<void> {
    mutateState((state) => {
      const client = { ...input, id: input.id || newId("client") };
      const index = state.clients.findIndex((item) => item.id === client.id);
      if (index >= 0) state.clients[index] = client;
      else state.clients.push(client);
    });
  }

  async updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
    mutateState((state) => {
      state.settings = input.settings;
      state.auditLogs.unshift(this.audit(input.actorUserId, "SETTINGS_UPDATE", "AppSettings", "Configuracoes atualizadas."));
    });
    return input.settings;
  }

  private audit(actorUserId: string, action: AuditLogEntry["action"], entity: string, summary: string): AuditLogEntry {
    return {
      id: newId("audit"),
      createdAt: nowIso(),
      actorUserId,
      action,
      entity,
      summary,
    };
  }
}
