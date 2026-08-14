import type { ZodType } from 'zod';
import { err, ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import { validationError } from '../errors';
import type { DomainError } from '../errors';

export function parseOrError<T>(schema: ZodType<T>, data: unknown): Result<T, DomainError> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return err(validationError('Invalid request parameters', parsed.error.flatten()));
  }
  return ok(parsed.data);
}

export function parseIdParam(raw: string | string[] | undefined): Result<number, DomainError> {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  if (value === undefined || !Number.isInteger(id) || id <= 0) {
    return err(validationError(`Invalid id parameter: ${String(raw)}`));
  }
  return ok(id);
}
