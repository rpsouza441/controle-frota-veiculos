import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createFleetIndexes, FleetIndexes } from "../../application/selectors/fleetSelectors";
import { addAuditLog as addAuditLogUseCase } from "../../application/usecases/fleet/addAuditLog";
import { closeUsage as closeUsageUseCase } from "../../application/usecases/fleet/closeUsage";
import { createWithdrawal as createWithdrawalUseCase } from "../../application/usecases/fleet/createWithdrawal";
import { getFleetState } from "../../application/usecases/fleet/getFleetState";
import { requestCorrection as requestCorrectionUseCase } from "../../application/usecases/fleet/requestCorrection";
import { reviewCorrection as reviewCorrectionUseCase } from "../../application/usecases/fleet/reviewCorrection";
import { updateSettings as updateSettingsUseCase } from "../../application/usecases/fleet/updateSettings";
import { upsertClient as upsertClientUseCase, upsertTeam as upsertTeamUseCase, upsertUser as upsertUserUseCase, upsertVehicle as upsertVehicleUseCase } from "../../application/usecases/fleet/upserts";
import { FleetRepository } from "../../domain/ports/FleetRepository";
import {
  AuditAction,
  AppSettings,
  Client,
  CorrectionStatus,
  FleetState,
  OdometerCorrectionRequest,
  Team,
  User,
  Vehicle,
  VehicleUsage,
} from "../../domain/types";
import { authChangedEvent, getAuthToken } from "../../services/api/authToken";

type FleetContextValue = {
  state: FleetState;
  indexes: FleetIndexes;
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
  upsertTeam: (team: Team) => Promise<void>;
  upsertClient: (client: Client) => Promise<void>;
  updateSettings: (settings: AppSettings, actorUserId: string) => Promise<AppSettings>;
};

type FleetProviderProps = PropsWithChildren<{
  fleetRepository: FleetRepository;
}>;

const emptyFleetState: FleetState = {
  users: [],
  teams: [],
  vehicles: [],
  usages: [],
  clients: [],
  correctionRequests: [],
  auditLogs: [],
  settings: { employeesCanSeeInUseVehicles: false, corporateEmailDomain: "@empresa.com.br", footerBrandLabel: "Espaço para sua marca" },
};

const FleetContext = createContext<FleetContextValue | null>(null);

export function FleetProvider({ fleetRepository, children }: FleetProviderProps) {
  const [state, setState] = useState<FleetState>(emptyFleetState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const indexes = useMemo(() => createFleetIndexes(state), [state]);

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
      setState(await getFleetState(fleetRepository));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar dados do banco.");
    } finally {
      setLoading(false);
    }
  }, [fleetRepository]);

  useEffect(() => {
    void refresh();
    window.addEventListener(authChangedEvent, refresh);
    return () => window.removeEventListener(authChangedEvent, refresh);
  }, [refresh]);

  const value = useMemo<FleetContextValue>(
    () => ({
      state,
      indexes,
      loading,
      error,
      refresh,

      async addAuditLog(actorUserId, action, entity, summary) {
        await addAuditLogUseCase(fleetRepository, { actorUserId, action, entity, summary });
        await refresh();
      },
      async createWithdrawal(input) {
        await createWithdrawalUseCase(fleetRepository, input);
        await refresh();
      },
      async closeUsage(usageId, returnKm, returnAt, returnNote) {
        await closeUsageUseCase(fleetRepository, { usageId, returnKm, returnAt, returnNote });
        await refresh();
      },
      async createCorrectionRequest(input) {
        await requestCorrectionUseCase(fleetRepository, input);
        await refresh();
      },
      async reviewCorrectionRequest(requestId, status, reviewerId, note) {
        await reviewCorrectionUseCase(fleetRepository, { requestId, status, reviewerId, note });
        await refresh();
      },
      async upsertVehicle(vehicle) {
        await upsertVehicleUseCase(fleetRepository, vehicle);
        await refresh();
      },
      async upsertUser(user) {
        await upsertUserUseCase(fleetRepository, user);
        await refresh();
      },
      async upsertTeam(team) {
        await upsertTeamUseCase(fleetRepository, team);
        await refresh();
      },
      async upsertClient(client) {
        await upsertClientUseCase(fleetRepository, client);
        await refresh();
      },
      async updateSettings(settings, actorUserId) {
        const response = await updateSettingsUseCase(fleetRepository, { settings, actorUserId });
        await refresh();
        return response;
      },
    }),
    [error, fleetRepository, indexes, loading, refresh, state],
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error("useFleet deve ser usado dentro de FleetProvider.");
  return context;
}
