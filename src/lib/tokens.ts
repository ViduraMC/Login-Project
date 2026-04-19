import crypto from "crypto";

/**
 * Generate a cryptographically secure random token
 * Used for email verification and password reset tokens
 */
export function generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token using SHA-256
 * store HASHED tokens in the database, never plain tokens
 * This way, even if the database is breached, tokens are unusable
 */
export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}
