import { createFactory } from "hono/factory";
import AuthService from "./auth.service.js";
import { signUpSchema } from "./auth.validators.js";
import validate from "../../shared/middleware/validate.js";
import TokenService from "../token/token.service.js";

const factory = createFactory();

const authService = new AuthService();

export const signUpHandler = factory.createHandlers(
    validate("json", signUpSchema), 
    async (c) => {
        const userPayload = c.req.valid("json");

        const ipAddress = c.req.header("x-forwarded-for")?.split(",")[0].trim() 
            ?? null;
        
        const userAgent = c.req.header("user-agent") ?? null;

        // Create the user and then verify they have actually been created by signing them in.
        await authService.createUser(userPayload);

        // Use the same function we use to sign in a user through the route.
        const tokenPayload = { identifier: { email: userPayload.email }, password: userPayload.password };
        const { user, ...tokens } = await authService.signIn(tokenPayload, ipAddress, userAgent);

        // Tokens are only sent as http-only cookies so they can't be read by scripts on the page.
        TokenService.setAuthenticationCookies(c, "user", tokens);
        return c.json({ success: true, data: { user } }, 201);
    }
)