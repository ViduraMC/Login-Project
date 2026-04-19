import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/validations";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email || !isValidEmail(email)) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Valid email is required", statusCode: 400 },
                { status: 400 }
            );
        }

        // Always return success (don't reveal if email exists)
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (user) {
            // Delete any existing reset tokens for this user
            await prisma.passwordResetToken.deleteMany({
                where: { userId: user.id },
            });

            // Generate new reset token
            const plainToken = generateToken();
            const hashedTokenValue = hashToken(plainToken);

            await prisma.passwordResetToken.create({
                data: {
                    userId: user.id,
                    token: hashedTokenValue,
                    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                },
            });

            await sendPasswordResetEmail(user.email, plainToken);
        }

        // Same response whether user exists or not
        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "If an account with that email exists, a password reset link has been sent.",
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
