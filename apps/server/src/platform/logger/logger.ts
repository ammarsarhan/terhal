import { pino } from "pino";
import { env } from "../config/env";
import { currentContext } from "../context/request-context";

// Values that must never reach the logs, wherever they appear in a logged object (top level or one level down).
// Request bodies are never logged whole.
const secrets = [
  "password",
  "passwordHash",
  "refreshToken",
  "accessToken",
  "token",
  "totpSecret",
  "secret",
  "code",
  "email",
];

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { env: env.APP_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Every line written inside a request carries its id.
  mixin: () => {
    const context = currentContext();
    return context ? { requestId: context.requestId } : {};
  },
  redact: {
    paths: [
      ...secrets.flatMap((key) => [key, `*.${key}`]),
      "headers.authorization",
      "headers.cookie",
      'headers["set-cookie"]',
    ],
    censor: "[redacted]",
  },
  // JSON on the VPS, so `docker compose logs` can be searched and shipped; readable lines locally.
  ...(env.NODE_ENV === "development" && { transport: { target: "pino-pretty" } }),
});
