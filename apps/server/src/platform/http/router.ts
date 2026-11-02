import { OpenAPIHono, type Hook } from "@hono/zod-openapi";
import { Problem, type ValidationIssue } from "@terhal/contracts";
import type { Env } from "hono";
import { validationFailed } from "../errors/validation.js";

// Turns a failed request validation into our problem format instead of a raw ZodError dump.
const rejectInvalid: Hook<unknown, Env, string, unknown> = (result) => {
  if (result.success) return;
  const errors: ValidationIssue[] = result.error.issues.map((issue) => ({
    in: result.target as ValidationIssue["in"],
    path: issue.path.join("."),
    code: issue.code,
    message: issue.message,
  }));
  throw validationFailed(errors);
};

// Every router (the root and each module's) is created here, so they all validate the same way and add their routes to
// one OpenAPI document.
export const createRouter = () => new OpenAPIHono({ defaultHook: rejectInvalid });

// For a route's `responses`: an error that route can return, documented as a Problem.
export const problemResponse = (description: string) => ({
  description,
  content: { "application/problem+json": { schema: Problem } },
});

// Pieces most routes share.
export const json = <T>(schema: T) => ({ content: { "application/json": { schema } } });
export const body = <T>(schema: T) => ({ body: { required: true, ...json(schema) } });
