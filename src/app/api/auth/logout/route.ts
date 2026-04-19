import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthCookies, clearAuthCookies } from "@/lib/cookies";
import { hashToken } from "@/lib/tokens";
import { ApiResponse } from "@/types";

export async function POST() {
    try {
        const { refreshToken } = await getAuthCookies();

        if (refreshToken) {
            // Delete the session from database
            const hashedToken = hashToken(refreshToken);

            // Find and delete the session with this refresh token
            await prisma.session.deleteMany({
                where: { refreshToken: hashedToken },
            });
        }

        // Clear cookies regardless
        await clearAuthCookies();

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "Logged out successfully",
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Logout error:", error);
        // Even if DB operation fails, clear cookies
        await clearAuthCookies();

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "Logged out successfully",
                statusCode: 200,
            },
            { status: 200 }
        );
    }
}
