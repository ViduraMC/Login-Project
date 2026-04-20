import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { clearRefreshTokenCookie } from "@/lib/cookies";
import { isValidPassword } from "@/lib/validations";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, password } = body;

        if (!token || !password) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Token and new password are required", statusCode: 400 },
                { status: 400 }
            );
        }

        const passwordError = isValidPassword(password);
        if (passwordError) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: passwordError, statusCode: 422 },
                { status: 422 }
            );
        }

        // Find valid reset token
        const hashedToken = hashToken(token);

        const resetToken = await prisma.passwordResetToken.findFirst({
            where: {
                token: hashedToken,
                expiresAt: { gt: new Date() },
            },
        });

        if (!resetToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid or expired reset token", statusCode: 400 },
                { status: 400 }
            );
        }

        // Hash new password and update user
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: resetToken.userId },
            data: {
                password: hashedPassword,
                // Also reset brute-force counters
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });

        // Delete the used token
        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id },
        });

        // Invalidate ALL sessions (force re-login with new password)
        await prisma.session.deleteMany({
            where: { userId: resetToken.userId },
        });

        // Clear the refresh token cookie on THIS browser too
        await clearRefreshTokenCookie();

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "Password reset successfully. Please log in with your new password.",
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Password reset error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
