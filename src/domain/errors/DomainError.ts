export type DomainErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Sessao invalida.", details?: unknown) {
    super("UNAUTHORIZED", message, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Acesso negado.", details?: unknown) {
    super("FORBIDDEN", message, details);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Registro nao encontrado.", details?: unknown) {
    super("NOT_FOUND", message, details);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DomainError {
  constructor(message = "Conflito com o estado atual.", details?: unknown) {
    super("CONFLICT", message, details);
    this.name = "ConflictError";
  }
}

export class ValidationError extends DomainError {
  constructor(message = "Dados invalidos.", details?: unknown) {
    super("VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class NetworkError extends DomainError {
  constructor(message = "Falha na comunicacao com a API.", details?: unknown) {
    super("NETWORK_ERROR", message, details);
    this.name = "NetworkError";
  }
}

export function toDomainError(error: unknown, fallbackMessage = "Falha inesperada.") {
  if (error instanceof DomainError) return error;
  if (error instanceof Error) return new DomainError("UNKNOWN_ERROR", error.message || fallbackMessage, error);
  return new DomainError("UNKNOWN_ERROR", fallbackMessage, error);
}
