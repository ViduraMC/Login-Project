import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Verification token is required", statusCode: 400 },
                { status: 400 }
            );
        }

        // Hash the received token to compare with stored hash
        const hashedToken = hashToken(token);

        // Find the token in database
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token: hashedToken,
                expiresAt: { gt: new Date() }, // gt = "greater than" = not expired
            },
        });

        if (!verificationToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid or expired verification token", statusCode: 400 },
                { status: 400 }
            );
        }

        // Update user: mark email as verified
        await prisma.user.update({
            where: { id: verificationToken.userId },
            data: { emailVerified: true },
        });

        // Delete the used token (one-time use)
        await prisma.verificationToken.delete({
            where: { id: verificationToken.id },
        });

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "Email verified successfully! You can now log in.",
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Email verification error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
