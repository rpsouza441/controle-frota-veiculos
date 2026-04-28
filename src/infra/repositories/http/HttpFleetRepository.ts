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
import { AppSettings, Client, FleetState, Team, User } from "../../../domain/types";
import { HttpClient } from "../../http/httpClient";

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export class HttpFleetRepository implements FleetRepository {
  constructor(private readonly http: HttpClient) {}

  getFleetState(): Promise<FleetState> {
    return this.http.request<FleetState>("/fleet-state");
  }

  addAuditLog(input: AddAuditLogInput): Promise<void> {
    return this.http.request<void>("/audit-logs", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  createWithdrawal(input: CreateWithdrawalInput): Promise<void> {
    return this.http.request<void>("/usages/withdrawals", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        withdrawalAt: new Date(input.withdrawalAt).toISOString(),
      }),
    });
  }

  closeUsage(input: CloseUsageInput): Promise<void> {
    return this.http.request<void>(`/usages/${input.usageId}/return`, {
      method: "POST",
      body: JSON.stringify({
        returnKm: input.returnKm,
        returnAt: new Date(input.returnAt).toISOString(),
        returnNote: input.returnNote,
      }),
    });
  }

  createCorrectionRequest(input: CreateCorrectionRequestInput): Promise<void> {
    return this.http.request<void>("/corrections", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  reviewCorrectionRequest(input: ReviewCorrectionRequestInput): Promise<void> {
    return this.http.request<void>(`/corrections/${input.requestId}/review`, {
      method: "POST",
      body: JSON.stringify({
        status: input.status,
        reviewerId: input.reviewerId,
        note: input.note,
      }),
    });
  }

  upsertVehicle(input: UpsertVehicleInput): Promise<void> {
    const id = input.id || newId("vehicle");
    const status = input.active ? (input.status === "EM_USO" ? "EM_USO" : "DISPONIVEL") : "INATIVO";
    return this.http.request<void>(`/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...input, id, status }),
    });
  }

  upsertUser(input: User): Promise<void> {
    const id = input.id || newId("user");
    return this.http.request<void>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...input, id }),
    });
  }

  upsertTeam(input: Team): Promise<void> {
    const id = input.id || newId("team");
    return this.http.request<void>(`/teams/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...input, id }),
    });
  }

  upsertClient(input: Client): Promise<void> {
    const id = input.id || newId("client");
    return this.http.request<void>(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...input, id }),
    });
  }

  async updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
    const response = await this.http.request<{ settings?: AppSettings }>("/settings", {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return response.settings ?? input.settings;
  }
}
