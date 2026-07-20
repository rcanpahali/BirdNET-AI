export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = 'error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(400, message, 'validation_error');
    this.details = details;
  }
}

export class UpstreamError extends AppError {
  upstreamBody?: unknown;

  constructor(status: number, message: string, upstreamBody?: unknown) {
    super(status, message, 'upstream_error');
    this.upstreamBody = upstreamBody;
  }
}
