import { FleetState } from "../../../domain/types";
import { initialFleetState } from "../../../dev/fixtures/seed";

const LOCAL_STATE_KEY = "fleetmanager:local-state:v1";

export function readLocalFleetState(): FleetState {
  const stored = localStorage.getItem(LOCAL_STATE_KEY);
  if (!stored) {
    writeLocalFleetState(initialFleetState);
    return structuredClone(initialFleetState);
  }
  return JSON.parse(stored) as FleetState;
}

export function writeLocalFleetState(state: FleetState) {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
}

export function resetLocalFleetState() {
  writeLocalFleetState(initialFleetState);
}
