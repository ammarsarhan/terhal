import { Hono } from "hono";
import { refreshHandler, signInHandler, signOutHandler, signUpHandler } from "./auth.handlers.js";

const auth = new Hono()
    .post("/sign-up", ...signUpHandler)
    .post("/sign-in", ...signInHandler)
    .post("/refresh", ...refreshHandler)
    .post("/sign-out", ...signOutHandler)

export default auth;