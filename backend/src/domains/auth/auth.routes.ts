import { Hono } from "hono";
import { signUpHandler } from "./auth.handlers.js";

const auth = new Hono()
    .post("/sign-up", ...signUpHandler)

export default auth;