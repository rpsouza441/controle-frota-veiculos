import { FleetRepository, ReviewCorrectionRequestInput } from "../../../domain/ports/FleetRepository";

export function reviewCorrection(fleetRepository: FleetRepository, input: ReviewCorrectionRequestInput) {
  return fleetRepository.reviewCorrectionRequest(input);
}
