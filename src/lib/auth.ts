import { verifyAccessToken, AccessTokenPayload } from "@/lib/jwt";
import { getAuthCookies } from "@/lib/cookies";

/**
 * Get the currently authenticated user from cookies
 * Returns the token payload if valid, null if not authenticated
 */
export async function getCurrentUser(): Promise<AccessTokenPayload | null> {
    try {
        const { accessToken } = await getAuthCookies();

        if (!accessToken) {
            return null;
        }

        const payload = verifyAccessToken(accessToken);
        return payload;
    } catch {
        // Token expired or invalid
        return null;
    }
}
