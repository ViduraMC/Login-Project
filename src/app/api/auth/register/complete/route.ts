import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { isValidPassword, isValidName } from "@/lib/validations";
import { ApiResponse, UserResponse } from "@/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, name, password } = body;

        // Step 1: Validate inputs
        if (!token || !name || !password) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Token, name, and password are required", statusCode: 400 },
                { status: 400 }
            );
        }

        const nameError = isValidName(name);
        if (nameError) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: nameError, statusCode: 422 },
                { status: 422 }
            );
        }

        const passwordError = isValidPassword(password);
        if (passwordError) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: passwordError, statusCode: 422 },
                { status: 422 }
            );
        }

        // Step 2: Find valid verification token
        const hashedToken = hashToken(token);

        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token: hashedToken,
                expiresAt: { gt: new Date() },
            },
        });

        if (!verificationToken) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid or expired token. Please register again.", statusCode: 400 },
                { status: 400 }
            );
        }

        // Step 3: Check if user already exists (race condition guard)
        const existingUser = await prisma.user.findUnique({
            where: { email: verificationToken.email },
        });

        if (existingUser) {
            // Clean up the token
            await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Account already exists. Please login.", statusCode: 409 },
                { status: 409 }
            );
        }

        // Step 4: Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: verificationToken.email,
                password: hashedPassword,
                emailVerified: true, // Already verified via email link!
            },
        });

        // Step 5: Delete the used verification token
        await prisma.verificationToken.delete({ where: { id: verificationToken.id } });

        const userResponse: UserResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt.toISOString(),
        };

        return NextResponse.json<ApiResponse<UserResponse>>(
            {
                success: true,
                message: "Account created successfully. You can now login.",
                data: userResponse,
                statusCode: 201,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Complete registration error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
