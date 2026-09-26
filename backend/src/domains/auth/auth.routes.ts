import { Hono } from "hono";
import { signInHandler, signUpHandler } from "./auth.handlers.js";

const auth = new Hono()
    .post("/sign-up", ...signUpHandler)
    .post("/sign-in", ...signInHandler)

export default auth;