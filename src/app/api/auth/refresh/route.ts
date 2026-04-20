import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAccessToken } from "@/lib/jwt";
import { getRefreshTokenCookie, setRefreshTokenCookie, clearRefreshTokenCookie } from "@/lib/cookies";
import { generateToken, hashToken } from "@/lib/tokens";
import { ApiResponse, RefreshResponse } from "@/types";

export async function POST() {
    try {
        const refreshToken = await getRefreshTokenCookie();

        if (!refreshToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "No refresh token provided", statusCode: 401 },
                { status: 401 }
            );
        }

        // Find session by hashed refresh token
        const hashedToken = hashToken(refreshToken);

        const session = await prisma.session.findFirst({
            where: {
                refreshToken: hashedToken,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        if (!session) {
            // Clear stale cookie — session no longer exists in DB
            await clearRefreshTokenCookie();
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid or expired refresh token", statusCode: 401 },
                { status: 401 }
            );
        }

        // Prevent locked accounts from refreshing tokens
        if (session.user.lockedUntil && session.user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil(
                (session.user.lockedUntil.getTime() - Date.now()) / 60000
            );
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    message: `Account is temporarily locked. Try again in ${minutesLeft} minute(s).`,
                    statusCode: 403,
                },
                { status: 403 }
            );
        }

        // Generate NEW tokens (rotation)
        const newAccessToken = generateAccessToken({
            userId: session.user.id,
            email: session.user.email,
        });

        const newPlainRefreshToken = generateToken();
        const newHashedRefreshToken = hashToken(newPlainRefreshToken);

        // Update session with new refresh token
        await prisma.session.update({
            where: { id: session.id },
            data: {
                refreshToken: newHashedRefreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // Set new refresh token cookie
        await setRefreshTokenCookie(newPlainRefreshToken);

        // Return new access token in body
        return NextResponse.json<ApiResponse<RefreshResponse>>(
            {
                success: true,
                message: "Tokens refreshed successfully",
                data: { accessToken: newAccessToken },
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Token refresh error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
