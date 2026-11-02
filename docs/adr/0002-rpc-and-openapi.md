# 0002: Hono RPC for the client, OpenAPI for the documentation

**Status:** accepted, 2026-11-02

## Context

A common way to type an API's clients is to generate them from a committed OpenAPI document, which pays off when
clients such as mobile apps stay on old versions in the wild. Terhal's only client is its own web app, deployed with the
API, and it was already typed through Hono RPC (`hc<AppType>`). We still want API documentation and a reviewable
contract.

## Decision

Routes are declared with `@hono/zod-openapi`. Its `OpenAPIHono` keeps Hono's RPC types, so the same declaration
validates requests, types the web app's `hc` client, and produces the OpenAPI document served at `/v1/openapi.json`
and `/v1/docs` outside production. The document is also committed as `apps/server/openapi.json` and checked by a test,
so every API change shows up in review. No generated client package.

## What we gave up

- The web app type checks against the server's source, so server imports can't use an `@/` path alias.
- Module routers must stay chained for their types to carry through, which constrains how routes are written.
- Should a second client appear (e.g. a mobile app), it would need a generated client from the committed document.
