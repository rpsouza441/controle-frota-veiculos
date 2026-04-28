import { AuthRepository, AuthSession, LoginCredentials, PublicSettings } from "../../../domain/ports/AuthRepository";
import { UnauthorizedError, ValidationError } from "../../../domain/errors/DomainError";
import { User } from "../../../domain/types";
import { readLocalFleetState } from "./localStorageFleet";

const LOCAL_TOKEN_PREFIX = "local-token:";

export class LocalAuthRepository implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const email = credentials.email.trim().toLowerCase();
    if (!email || !credentials.password) {
      throw new ValidationError("Informe e-mail e senha.");
    }

    const user = readLocalFleetState().users.find((item) => item.email.toLowerCase() === email && item.active);
    if (!user) {
      throw new UnauthorizedError("Credenciais invalidas.");
    }

    return { token: `${LOCAL_TOKEN_PREFIX}${user.id}`, user };
  }

  async getCurrentUser(token: string): Promise<User> {
    if (!token.startsWith(LOCAL_TOKEN_PREFIX)) {
      throw new UnauthorizedError();
    }

    const userId = token.slice(LOCAL_TOKEN_PREFIX.length);
    const user = readLocalFleetState().users.find((item) => item.id === userId && item.active);
    if (!user) {
      throw new UnauthorizedError();
    }

    return user;
  }

  async getPublicSettings(): Promise<PublicSettings> {
    return {
      corporateEmailDomain: readLocalFleetState().settings.corporateEmailDomain,
    };
  }
}
