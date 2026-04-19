import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

// Token expiry times
const ACCESS_TOKEN_EXPIRY = "15m";   // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d";   // 7 days

export interface AccessTokenPayload {
    userId: string;
    email: string;
}

/**
 * Generate an access token (short-lived, for API authentication)
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
}

/**
 * Verify and decode an access token
 * Returns the payload if valid, throws an error if expired or tampered
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}
