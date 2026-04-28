import { FleetRepository } from "../../../domain/ports/FleetRepository";

export function getFleetState(fleetRepository: FleetRepository) {
  return fleetRepository.getFleetState();
}
