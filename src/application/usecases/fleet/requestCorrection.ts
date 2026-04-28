import { CreateCorrectionRequestInput, FleetRepository } from "../../../domain/ports/FleetRepository";

export function requestCorrection(fleetRepository: FleetRepository, input: CreateCorrectionRequestInput) {
  return fleetRepository.createCorrectionRequest(input);
}
