import { Hono } from "hono";
import { refreshHandler, signInHandler, signUpHandler } from "./auth.handlers.js";

const auth = new Hono()
    .post("/sign-up", ...signUpHandler)
    .post("/sign-in", ...signInHandler)
    .post("/refresh", ...refreshHandler)

export default auth;