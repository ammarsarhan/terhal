import type { ErrorCode } from "@terhal/contracts";

// Statuses an AppError may carry. Kept to a list so a typo can't produce a 2xx error.
export type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 500 | 503;

export interface AppErrorInit {
  // Stable and machine-readable, from @terhal/contracts. Clients switch on it; never rename one.
  code: ErrorCode;
  status: ErrorStatus;
  // For people. Clients must not parse it.
  detail: string;
  // Sent to the client as extra problem members, so never put internals or secrets here.
  extensions?: Record<string, unknown>;
  // Response headers, e.g. Retry-After on a 429.
  headers?: Record<string, string>;
  cause?: unknown;
}

// An expected failure with a known HTTP outcome. Anything else that is thrown is a bug and becomes a 500. No HTTP
// imports here: domain code throws these too.
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: ErrorStatus;
  readonly extensions: Record<string, unknown>;
  readonly headers: Record<string, string>;

  constructor({ code, status, detail, extensions = {}, headers = {}, cause }: AppErrorInit) {
    super(detail, { cause });
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.extensions = extensions;
    this.headers = headers;
  }
}
