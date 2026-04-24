import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
import { authChangedEvent, getAuthToken } from "../../services/api/authToken";

type FleetContextValue = {
  state: FleetState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  addAuditLog: (actorUserId: string, action: AuditAction, entity: string, summary: string) => Promise<void>;
  createWithdrawal: (input: Omit<VehicleUsage, "id" | "status">) => Promise<void>;
  closeUsage: (usageId: string, returnKm: number, returnAt: string, returnNote?: string) => Promise<void>;
  createCorrectionRequest: (input: Omit<OdometerCorrectionRequest, "id" | "status" | "createdAt">) => Promise<void>;
  reviewCorrectionRequest: (requestId: string, status: Exclude<CorrectionStatus, "PENDENTE">, reviewerId: string, note?: string) => Promise<void>;
  upsertVehicle: (vehicle: Omit<Vehicle, "status"> & { status?: Vehicle["status"] }) => Promise<void>;
  upsertUser: (user: User) => Promise<void>;
  upsertClient: (client: Client) => Promise<void>;
  updateSettings: (settings: AppSettings, actorUserId: string) => Promise<void>;
};

const emptyFleetState: FleetState = {
  users: [],
  teams: [],
  vehicles: [],
  usages: [],
  clients: [],
  correctionRequests: [],
  auditLogs: [],
  settings: { employeesCanSeeInUseVehicles: false },
};

const FleetContext = createContext<FleetContextValue | null>(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "Falha na comunicação com a API.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function FleetProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FleetState>(emptyFleetState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!getAuthToken()) {
      setState(emptyFleetState);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setState(await request<FleetState>("/fleet-state"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar dados do banco.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener(authChangedEvent, refresh);
    return () => window.removeEventListener(authChangedEvent, refresh);
  }, [refresh]);

  const value = useMemo<FleetContextValue>(
    () => ({
      state,
      loading,
      error,
      refresh,

      async addAuditLog(actorUserId, action, entity, summary) {
        await request("/audit-logs", {
          method: "POST",
          body: JSON.stringify({ actorUserId, action, entity, summary }),
        });
        await refresh();
      },
      async createWithdrawal(input) {
        await request("/usages/withdrawals", {
          method: "POST",
          body: JSON.stringify(input),
        });
        await refresh();
      },
      async closeUsage(usageId, returnKm, returnAt, returnNote) {
        await request(`/usages/${usageId}/return`, {
          method: "POST",
          body: JSON.stringify({ returnKm, returnAt, returnNote }),
        });
        await refresh();
      },
      async createCorrectionRequest(input) {
        await request("/corrections", {
          method: "POST",
          body: JSON.stringify(input),
        });
        await refresh();
      },
      async reviewCorrectionRequest(requestId, status, reviewerId, note) {
        await request(`/corrections/${requestId}/review`, {
          method: "POST",
          body: JSON.stringify({ status, reviewerId, note }),
        });
        await refresh();
      },
      async upsertVehicle(vehicle) {
        const id = vehicle.id || newId("vehicle");
        await request(`/vehicles/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...vehicle,
            id,
            status: vehicle.active ? vehicle.status ?? "DISPONIVEL" : "INATIVO",
          }),
        });
        await refresh();
      },
      async upsertUser(user) {
        const id = user.id || newId("user");
        await request(`/users/${id}`, {
          method: "PUT",
          body: JSON.stringify({ ...user, id }),
        });
        await refresh();
      },
      async upsertClient(client) {
        const id = client.id || newId("client");
        await request(`/clients/${id}`, {
          method: "PUT",
          body: JSON.stringify({ ...client, id }),
        });
        await refresh();
      },
      async updateSettings(settings, actorUserId) {
        await request("/settings", {
          method: "PUT",
          body: JSON.stringify({ settings, actorUserId }),
        });
        await refresh();
      },
    }),
    [error, loading, refresh, state],
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error("useFleet deve ser usado dentro de FleetProvider.");
  return context;
}
