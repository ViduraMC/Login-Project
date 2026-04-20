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

        // Hash the token and look it up
        const hashedToken = hashToken(token);

        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token: hashedToken,
                expiresAt: { gt: new Date() },
            },
        });

        if (!verificationToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid or expired verification token", statusCode: 400 },
                { status: 400 }
            );
        }

        return NextResponse.json<ApiResponse<{ email: string }>>(
            {
                success: true,
                message: "Email verified. You can now complete your registration.",
                data: { email: verificationToken.email },
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Verify token error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
