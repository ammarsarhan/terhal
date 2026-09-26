import { Hono } from "hono";
import { refreshHandler, sessionHandler, signInHandler, signOutHandler, signUpHandler } from "./auth.handlers.js";

const auth = new Hono()
    .post("/sign-up", ...signUpHandler)
    .post("/sign-in", ...signInHandler)
    .post("/refresh", ...refreshHandler)
    .post("/sign-out", ...signOutHandler)
    .get("/session", ...sessionHandler)

export default auth;