import { FleetRepository, UpdateSettingsInput } from "../../../domain/ports/FleetRepository";

export function updateSettings(fleetRepository: FleetRepository, input: UpdateSettingsInput) {
  return fleetRepository.updateSettings(input);
}
