import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { isValidEmail, isValidPassword, isValidName } from "@/lib/validations";
import { ApiResponse, UserResponse } from "@/types";

export async function POST(request: NextRequest) {
    try {
        // Step 1: Parse the request body
        const body = await request.json();
        const { name, email, password } = body;

        // Step 2: Validate all inputs
        if (!name || !email || !password) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    message: "Name, email, and password are required",
                    statusCode: 400,
                },
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

        if (!isValidEmail(email)) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid email format", statusCode: 422 },
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

        // Step 3: Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Email already registered", statusCode: 409 },
                { status: 409 }
            );
        }

        // Step 4: Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Step 5: Create the user
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase(),
                password: hashedPassword,
            },
        });

        // Step 6: Generate verification token
        const plainToken = generateToken();
        const hashedTokenValue = hashToken(plainToken);

        await prisma.verificationToken.create({
            data: {
                userId: user.id,
                token: hashedTokenValue,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // Step 7: Send verification email
        await sendVerificationEmail(user.email, plainToken);

        // Step 8: Return success (never return password!)
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
                message: "Registration successful. Please check your email to verify your account.",
                data: userResponse,
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
