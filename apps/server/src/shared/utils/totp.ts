import { Secret, TOTP } from "otpauth";

// Time-based one-time passwords (RFC 6238), the 6-digit codes from authenticator apps like Google Authenticator or 1Password.
// A 30-second period is the standard every authenticator app supports; some ignore any other value in the setup link.
const period = 30;

const build = (secret: string, label = "") => new TOTP({ issuer: "Terhal Admin", label, secret: Secret.fromBase32(secret), algorithm: "SHA1", digits: 6, period: period });

// A new random secret, as the base32 text authenticator apps accept for manual entry.
export const createTotpSecret = () => new Secret({ size: 20 }).base32;

// The otpauth:// link the QR code encodes, which adds the account to an authenticator app.
export const getTotpUri = (secret: string, email: string) => build(secret, email).toString();

// Checks a code and returns the 30-second step it belongs to, or null when it's wrong.
// Codes from the step before and after are accepted too, to allow for clocks being slightly off.
// Pass the last step that was used so the same code can't be replayed while it's still valid.
export const verifyTotp = (secret: string, code: string, lastUsedStep: number | null) => {
    const delta = build(secret).validate({ token: code, window: 1 });
    if (delta === null) return null;

    const step = TOTP.counter({ period: period }) + delta;
    return lastUsedStep !== null && step <= lastUsedStep ? null : step;
};
