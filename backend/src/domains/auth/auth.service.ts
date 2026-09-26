import { createUserResponse, SignInSchemaPayload, SignUpSchemaPayload } from "./auth.validators.js";
import { prisma } from "../../shared/utils/prisma.js";
import { ERROR_CODES, ConflictError, ForbiddenError, UnauthorizedError } from "../../shared/utils/error.js";
import { hash, compare } from "../../shared/utils/hash.js";
import TokenService from "../token/token.service.js";
import { UserStatus } from "../../../generated/prisma/enums.js";

export default class AuthService {
    private readonly MAXIMUM_SESSION_LIMIT = 5;
    private readonly INACTIVE_STATUS: UserStatus[] = [UserStatus.SUSPENDED, UserStatus.DELETED];

    createUser = async (payload: SignUpSchemaPayload) => {
        // Start by making sure that user doesn't exist in our database first.
        const exists = await prisma.user.findFirst({
            where: { OR: [{ email: payload.email }, { phone: payload.phone }] },
            select: { email: true, phone: true },
        });

        if (exists?.email === payload.email) throw new ConflictError("An account with this email already exists.", ERROR_CODES.EMAIL_ALREADY_IN_USE);
        if (exists?.phone === payload.phone) throw new ConflictError("An account with this phone number already exists.", ERROR_CODES.PHONE_ALREADY_IN_USE);

        // If the user does not exist yet, hash the password, and extract data.
        const passwordHash = await hash(payload.password);
        const { password, ...data } = payload;

        // Create the user in the proper user response shape.
        const user = await prisma.user.create({ 
            data: {
                ...data,
                passwordHash
            }
        });

        return createUserResponse(user);
    }

    signIn = async (payload: SignInSchemaPayload, ipAddress: string | null, userAgent: string | null) => {
        // Find the user account, make sure the password is correct, and make sure the status is ok to sign in.
        const user = await prisma.user.findUnique({ where: payload.identifier });

        // Use the same error for both cases so the response doesn't reveal which accounts exist.
        if (!user) throw new UnauthorizedError("Could not find user account with the specified credentials.", ERROR_CODES.INVALID_CREDENTIALS);

        const isValid = await compare(payload.password, user.passwordHash);
        if (!isValid) throw new UnauthorizedError("Could not find user account with the specified credentials.", ERROR_CODES.INVALID_CREDENTIALS);

        if (this.INACTIVE_STATUS.includes(user.status)) throw new ForbiddenError("User account is not active. You are not allowed to sign in.", ERROR_CODES.ACCOUNT_NOT_ACTIVE);

        // If the user passes the validation, generate the refresh and access tokens.
        const { accessToken, refreshToken, refreshTokenHash, expiresAt } = await TokenService.generateTokenPair("user", user.id, { role: user.role });

        // Invalidate other sessions if they are above the maximum limit and store this session with the information extracted from the request.
        const activeSessions = await prisma.userSession.findMany({
            where: {
                userId: user.id,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: "asc" }, // Sort by the oldest to the newest.
            select: { id: true }
        });

        // Revoke the oldest sessions to make way for the new session being created.
        const sessionsToRevoke = activeSessions.slice(0, Math.max(0, activeSessions.length - this.MAXIMUM_SESSION_LIMIT + 1));

        // Wrap in a transaction to make sure this happens atomically.
        await prisma.$transaction(async (tx) => {
            if (sessionsToRevoke.length > 0) {
                await tx.userSession.updateMany({
                    where: { id: { in: sessionsToRevoke.map((session) => session.id) } },
                    data: { revokedAt: new Date() }
                });
            };

            await tx.userSession.create({
                data: {
                    userId: user.id,
                    refreshToken: refreshTokenHash,
                    expiresAt,
                    ipAddress,
                    userAgent
                }
            });
        });

        return {
            user: createUserResponse(user),
            accessToken,
            refreshToken,
            expiresAt
        };
    }
}
