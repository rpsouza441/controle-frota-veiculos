import { CreateWithdrawalInput, FleetRepository } from "../../../domain/ports/FleetRepository";

export function createWithdrawal(fleetRepository: FleetRepository, input: CreateWithdrawalInput) {
  return fleetRepository.createWithdrawal(input);
}
