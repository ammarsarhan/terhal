import argon2 from "argon2";

export const hash = async (password: string) => {
    return argon2.hash(password, { type: argon2.argon2id });
}

export const compare = async (password: string, hash: string) => {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
}

// A real hash of a password nobody has, made once. Checking against it when an account doesn't exist takes as long as
// checking a real password, so response times don't reveal which accounts exist.
let dummy: Promise<string> | undefined;

export const compareAgainstNothing = async (password: string) => {
    dummy ??= hash("not-a-real-password");
    await compare(password, await dummy);
    return false;
}
