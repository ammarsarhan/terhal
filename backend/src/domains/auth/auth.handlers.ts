import { createFactory } from "hono/factory";
import AuthService from "@/src/domains/auth/auth.service.js";
import { signUpSchema } from "@/src/domains/auth/auth.validators.js";
import validate from "@/src/shared/middleware/validate.js";

const factory = createFactory();

const authService = new AuthService();

export const signUpHandler = factory.createHandlers(
    validate("json", signUpSchema), 
    async (c) => {
        
    }
)