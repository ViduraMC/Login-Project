import { headers } from "next/headers";
import { verifyAccessToken, AccessTokenPayload } from "@/lib/jwt";

/**
 * Get the currently authenticated user from the Authorization header.
 * Expects: Authorization: Bearer <access_token>
 */
export async function getCurrentUser(): Promise<AccessTokenPayload | null> {
    try {
        const headersList = await headers();
        const authHeader = headersList.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        const token = authHeader.split(" ")[1];
        const payload = verifyAccessToken(token);
        return payload;
    } catch {
        return null;
    }
}
