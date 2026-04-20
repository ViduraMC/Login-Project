import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET environment variable is not set");
}

// Token expiry times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes

export interface AccessTokenPayload {
    userId: string;
    email: string;
}

/**
 * Generate an access token (short-lived, for API authentication)
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET!, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
}

/**
 * Verify and decode an access token
 * Returns the payload if valid, throws an error if expired or tampered
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, ACCESS_TOKEN_SECRET!) as AccessTokenPayload;
}
