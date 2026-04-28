import { FleetState, VehicleUsage } from "../../domain/types";

export type FleetIndexes = {
  usersById: ReadonlyMap<string, FleetState["users"][number]>;
  vehiclesById: ReadonlyMap<string, FleetState["vehicles"][number]>;
  teamsById: ReadonlyMap<string, FleetState["teams"][number]>;
  clientsById: ReadonlyMap<string, FleetState["clients"][number]>;
  openUsagesByUserId: ReadonlyMap<string, VehicleUsage>;
  openUsagesByVehicleId: ReadonlyMap<string, VehicleUsage>;
};

function indexById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

export function createFleetIndexes(state: FleetState): FleetIndexes {
  const openUsages = state.usages.filter((usage) => usage.status === "ABERTO");
  return {
    usersById: indexById(state.users),
    vehiclesById: indexById(state.vehicles),
    teamsById: indexById(state.teams),
    clientsById: indexById(state.clients),
    openUsagesByUserId: new Map(openUsages.map((usage) => [usage.userId, usage])),
    openUsagesByVehicleId: new Map(openUsages.map((usage) => [usage.vehicleId, usage])),
  };
}
