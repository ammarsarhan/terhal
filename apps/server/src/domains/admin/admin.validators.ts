import z from "zod";

// Normalized the same way everywhere an admin email comes in, so it always matches how it was stored.
export const emailSchema = z
    .string({ error: "Email is required." })
    .trim()
    .toLowerCase()
    .max(75, "Email must contain 75 characters at most.")
    .pipe(z.email("Please enter a valid email address."));

const tokenSchema = z.string({ error: "Invitation token is required." }).min(1, "Invitation token is required.");

const nameSchema = (label: string) => z
    .string({ error: `${label} is required.` })
    .trim()
    .min(2, `${label} must contain at least 2 letters.`)
    .max(50, `${label} must contain 50 letters at most.`);

const passwordSchema = z
    .string({ error: "Password is required." })
    .min(8, "Password must contain at least 8 characters.")
    .max(72, "Password must contain 72 characters at most.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/\d/, "Password must contain at least one number.");

const codeSchema = z
    .string({ error: "Authentication code is required." })
    .trim()
    .regex(/^\d{6}$/, "Please enter the 6-digit code from your authenticator app.");

export const adminInvitationTokenSchema = z.object({
    token: tokenSchema,
});

// The email comes from the invitation. The code confirms their authenticator app works.
export const acceptAdminInvitationSchema = z.object({
    token: tokenSchema,
    firstName: nameSchema("First name"),
    lastName: nameSchema("Last name"),
    password: passwordSchema,
    code: codeSchema,
});

export type AcceptAdminInvitationPayload = z.infer<typeof acceptAdminInvitationSchema>;

// Only checks the password is there: rule changes must never lock out passwords set under the old rules.
export const adminSignInSchema = z.object({
    email: emailSchema,
    password: z.string({ error: "Password is required." }).min(1, "Password is required."),
});

export const adminVerifySchema = z.object({
    code: codeSchema,
});
