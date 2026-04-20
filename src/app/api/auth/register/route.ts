import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/validations";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Step 1: Validate email
        if (!email) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Email is required", statusCode: 400 },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid email format", statusCode: 422 },
                { status: 422 }
            );
        }

        const normalizedEmail = email.toLowerCase();

        // Step 2: Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Email is already registered", statusCode: 409 },
                { status: 409 }
            );
        }

        // Step 3: Delete any existing verification tokens for this email
        await prisma.verificationToken.deleteMany({
            where: { email: normalizedEmail },
        });

        // Step 4: Generate verification token
        const plainToken = generateToken();
        const hashedTokenValue = hashToken(plainToken);

        await prisma.verificationToken.create({
            data: {
                email: normalizedEmail,
                token: hashedTokenValue,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // Step 5: Send verification email
        await sendVerificationEmail(normalizedEmail, plainToken);

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "Verification email sent. Please check your inbox.",
                statusCode: 201,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
