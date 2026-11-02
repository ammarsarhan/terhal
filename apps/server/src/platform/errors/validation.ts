import type { ValidationIssue } from "@terhal/contracts";
import { AppError } from "./app-error";

// 400 VALIDATION_FAILED listing each problem, the same shape whether the schema or a use case found it.
export const validationFailed = (errors: ValidationIssue[]) =>
  new AppError({
    code: "VALIDATION_FAILED",
    status: 400,
    detail: "The request is invalid. See `errors` for each problem.",
    extensions: { errors },
  });
