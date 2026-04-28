import { AddAuditLogInput, FleetRepository } from "../../../domain/ports/FleetRepository";

export function addAuditLog(fleetRepository: FleetRepository, input: AddAuditLogInput) {
  return fleetRepository.addAuditLog(input);
}
