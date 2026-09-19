import z from "zod";

export const signUpSchema = z.object({
    
})

export type SignUpSchemaPayload = z.infer<typeof signUpSchema>;
