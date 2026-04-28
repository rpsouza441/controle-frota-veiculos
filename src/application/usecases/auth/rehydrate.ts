import { AuthRepository } from "../../../domain/ports/AuthRepository";

export function rehydrate(authRepository: AuthRepository, token: string) {
  return authRepository.getCurrentUser(token);
}
