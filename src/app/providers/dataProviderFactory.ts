import { AuthRepository } from "../../domain/ports/AuthRepository";
import { FleetRepository } from "../../domain/ports/FleetRepository";
import { getAuthToken } from "../../services/api/authToken";
import { HttpClient } from "../../infra/http/httpClient";
import { HttpAuthRepository } from "../../infra/repositories/http/HttpAuthRepository";
import { HttpFleetRepository } from "../../infra/repositories/http/HttpFleetRepository";
import { LocalAuthRepository } from "../../infra/repositories/local/LocalAuthRepository";
import { LocalFleetRepository } from "../../infra/repositories/local/LocalFleetRepository";

export type DataProviderKind = "http" | "local";

export type DataProvider = {
  kind: DataProviderKind;
  authRepository: AuthRepository;
  fleetRepository: FleetRepository;
};

export function createDataProvider(): DataProvider {
  const kind = (import.meta.env.VITE_DATA_PROVIDER || "http") as DataProviderKind;

  if (kind === "local") {
    return {
      kind,
      authRepository: new LocalAuthRepository(),
      fleetRepository: new LocalFleetRepository(),
    };
  }

  const http = new HttpClient({ getToken: getAuthToken });
  return {
    kind: "http",
    authRepository: new HttpAuthRepository(http),
    fleetRepository: new HttpFleetRepository(http),
  };
}
