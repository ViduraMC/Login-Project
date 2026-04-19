import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

// 15 minutes in seconds
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
// 7 days in seconds
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * Set authentication cookies (access token + refresh token)
 */
export async function setAuthCookies(
    accessToken: string,
    refreshToken: string
): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: ACCESS_TOKEN_MAX_AGE,
        path: "/",
    });

    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: "/",
    });
}

/**
 * Get tokens from cookies
 */
export async function getAuthCookies(): Promise<{
    accessToken: string | undefined;
    refreshToken: string | undefined;
}> {
    const cookieStore = await cookies();

    return {
        accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
        refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
    };
}

/**
 * Clear authentication cookies (for logout)
 */
export async function clearAuthCookies(): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(ACCESS_TOKEN_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });

    cookieStore.set(REFRESH_TOKEN_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });
}
