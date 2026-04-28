import { AuthRepository } from "../../../domain/ports/AuthRepository";
import { LoginCommand } from "../../dto/auth";

export function login(authRepository: AuthRepository, command: LoginCommand) {
  return authRepository.login(command);
}
