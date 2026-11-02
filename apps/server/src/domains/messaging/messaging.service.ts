import { sendEmail } from "./providers/email.js";

// The single place that talks to messaging providers, so other domains only say what to send and to whom.
export default class MessagingService {
    // Emails a link to create an admin account. Throws when the provider fails to deliver it.
    sendAdminInvitation = async (email: string, link: string, expiresAt: Date) => {
        const message = [
            "You've been invited to join Terhal as an admin.",
            "",
            `Create your account here: ${link}`,
            "",
            `This link can only be used once and expires on ${expiresAt.toUTCString()}. If you weren't expecting this invitation, you can ignore this email.`,
        ].join("\n");

        await sendEmail(email, "You're invited to join Terhal as an admin", message);
    }
}
