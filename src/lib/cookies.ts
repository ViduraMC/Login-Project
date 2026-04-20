import { cookies } from "next/headers";

const REFRESH_TOKEN_NAME = "refresh_token";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Set refresh token cookie
 */
export async function setRefreshTokenCookie(refreshToken: string): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(REFRESH_TOKEN_NAME, refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: "/",
    });
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshTokenCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_TOKEN_NAME)?.value;
}

/**
 * Clear refresh token cookie
 */
export async function clearRefreshTokenCookie(): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(REFRESH_TOKEN_NAME, "", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });
}
