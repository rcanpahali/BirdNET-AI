export type DomainError =
  | { kind: 'validation'; message: string; details?: unknown }
  | { kind: 'not_found'; message: string }
  | { kind: 'upstream'; status: number; message: string; upstreamBody?: unknown };

export function validationError(message: string, details?: unknown): DomainError {
  return { kind: 'validation', message, details };
}

export function notFoundError(message: string): DomainError {
  return { kind: 'not_found', message };
}

export function upstreamError(status: number, message: string, upstreamBody?: unknown): DomainError {
  return { kind: 'upstream', status, message, upstreamBody };
}
