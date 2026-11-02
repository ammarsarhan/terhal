import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { validationFailed } from "../../platform/errors/validation.js";

// Turns a failed request validation into our problem format instead of a raw ZodError dump.
const validate = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result) => {
    if (result.success) return;
    throw validationFailed(
      result.error.issues.map((issue) => ({
        in: target as "json" | "query" | "param" | "header" | "cookie" | "form",
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
      })),
    );
  });

export default validate;
