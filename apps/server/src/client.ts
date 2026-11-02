// The only thing the web app imports from the server: types, never runtime code. Hono comes from the workspace catalog,
// so every package resolves the same copy and the routes type check.
export type { AppType } from "./http/router.js";
