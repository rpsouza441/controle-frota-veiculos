import { AuthRepository } from "../../../domain/ports/AuthRepository";

export function getPublicSettings(authRepository: AuthRepository) {
  return authRepository.getPublicSettings();
}
