import { Client, Team, User } from "../../../domain/types";
import { FleetRepository, UpsertVehicleInput } from "../../../domain/ports/FleetRepository";

export function upsertVehicle(fleetRepository: FleetRepository, input: UpsertVehicleInput) {
  return fleetRepository.upsertVehicle(input);
}

export function upsertUser(fleetRepository: FleetRepository, input: User) {
  return fleetRepository.upsertUser(input);
}

export function upsertTeam(fleetRepository: FleetRepository, input: Team) {
  return fleetRepository.upsertTeam(input);
}

export function upsertClient(fleetRepository: FleetRepository, input: Client) {
  return fleetRepository.upsertClient(input);
}
