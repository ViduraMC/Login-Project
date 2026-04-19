import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAccessToken } from "@/lib/jwt";
import { getAuthCookies, setAuthCookies } from "@/lib/cookies";
import { generateToken, hashToken } from "@/lib/tokens";
import { ApiResponse } from "@/types";

export async function POST() {
    try {
        const { refreshToken } = await getAuthCookies();

        if (!refreshToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "No refresh token provided", statusCode: 401 },
                { status: 401 }
            );
        }

        // Find the session by hashed refresh token
        const hashedToken = hashToken(refreshToken);

        const session = await prisma.session.findFirst({
            where: {
                refreshToken: hashedToken,
                expiresAt: { gt: new Date() }, // not expired
            },
            include: { user: true }, // join with user table
        });

        if (!session) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid or expired refresh token", statusCode: 401 },
                { status: 401 }
            );
        }

        // Generate NEW tokens (token rotation)
        const newAccessToken = generateAccessToken({
            userId: session.user.id,
            email: session.user.email,
        });

        const newPlainRefreshToken = generateToken();
        const newHashedRefreshToken = hashToken(newPlainRefreshToken);

        // Update the session with the new refresh token
        await prisma.session.update({
            where: { id: session.id },
            data: {
                refreshToken: newHashedRefreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // Set new cookies
        await setAuthCookies(newAccessToken, newPlainRefreshToken);

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "Tokens refreshed successfully",
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
