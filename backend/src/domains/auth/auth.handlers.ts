import { createFactory } from "hono/factory";
import AuthService from "./auth.service.js";
import { signUpSchema } from "./auth.validators.js";
import validate from "../../shared/middleware/validate.js";

const factory = createFactory();

const authService = new AuthService();

export const signUpHandler = factory.createHandlers(
    validate("json", signUpSchema), 
    async (c) => {
        
    }
)