import {
  ConflictError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../domain/errors/DomainError";

export type HttpClientOptions = {
  baseUrl?: string;
  getToken?: () => string | null;
};

export class HttpClient {
  private readonly baseUrl: string;
  private readonly getToken?: () => string | null;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? "/api";
    this.getToken = options.getToken;
  }

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const token = this.getToken?.();
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      });
    } catch (error) {
      throw new NetworkError("Falha na comunicacao com a API.", error);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string; details?: unknown } | null;
      const message = body?.message || "Falha na comunicacao com a API.";
      const details = body?.details ?? body;

      if (response.status === 401) throw new UnauthorizedError(message, details);
      if (response.status === 403) throw new ForbiddenError(message, details);
      if (response.status === 404) throw new NotFoundError(message, details);
      if (response.status === 409) throw new ConflictError(message, details);
      if (response.status === 422 || response.status === 400) throw new ValidationError(message, details);
      throw new NetworkError(message, details);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}
