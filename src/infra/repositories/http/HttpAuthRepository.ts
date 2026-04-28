import { AuthRepository, AuthSession, LoginCredentials, PublicSettings } from "../../../domain/ports/AuthRepository";
import { User } from "../../../domain/types";
import { HttpClient } from "../../http/httpClient";

export class HttpAuthRepository implements AuthRepository {
  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginCredentials): Promise<AuthSession> {
    return this.http.request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  getCurrentUser(token: string): Promise<User> {
    return this.http.request<User>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  getPublicSettings(): Promise<PublicSettings> {
    return this.http.request<PublicSettings>("/public-settings");
  }
}
