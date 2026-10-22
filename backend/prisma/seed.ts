// Invites the first admin by email. Run with `pnpm --filter @terhal/backend db:seed`.
// No names or passwords live in the environment: the admin gets a single-use link and sets up their own account.
// Only works while no admin exists. Every admin after the first is invited by an admin.
import { prisma } from "../src/shared/utils/prisma.js";
import { ConflictError } from "../src/shared/utils/error.js";
import { emailSchema } from "../src/domains/admin/admin.validators.js";
import AdminService from "../src/domains/admin/admin.service.js";

const main = async () => {
    const value = process.env.ADMIN_EMAIL?.trim();
    if (!value) throw new Error("ADMIN_EMAIL isn't set. Set it to the first admin's email.");

    const result = emailSchema.safeParse(value);
    if (!result.success) throw new Error(`ADMIN_EMAIL: ${result.error.issues[0].message}`);

    try {
        const { email, expiresAt } = await new AdminService().inviteFirstAdmin(result.data);
        console.log(`Invitation sent to ${email}, valid until ${expiresAt.toUTCString()}.`);
    } catch (error) {
        // Not a failure: the platform is already set up.
        if (error instanceof ConflictError) return console.log(`${error.message} Skipping.`);
        throw error;
    }
};

main()
    .catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
