import type { ValidationError } from "@clinic-scheduling/domain";

/** Base URL is empty in the browser (same-origin); tests need an absolute URL for node fetch. */
const API_BASE = process.env.NODE_ENV === "test" ? "http://localhost:3000" : "";

export class ApiError extends Error {
  readonly status: number;
  readonly errors: ValidationError[];

  constructor(status: number, message: string, errors: ValidationError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    let errors: ValidationError[] = [];
    try {
      const body = (await response.json()) as { errors?: ValidationError[] };
      if (Array.isArray(body.errors)) errors = body.errors;
    } catch {
      // Non-JSON error body; fall through to the generic message.
    }
    throw new ApiError(
      response.status,
      errors[0]?.message ?? `Request failed with status ${response.status}`,
      errors,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
