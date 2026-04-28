import { CloseUsageInput, FleetRepository } from "../../../domain/ports/FleetRepository";

export function closeUsage(fleetRepository: FleetRepository, input: CloseUsageInput) {
  return fleetRepository.closeUsage(input);
}
