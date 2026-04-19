import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateAccessToken } from "@/lib/jwt";
import { generateToken, hashToken } from "@/lib/tokens";
import { setAuthCookies } from "@/lib/cookies";
import { isValidEmail } from "@/lib/validations";
import { ApiResponse, UserResponse } from "@/types";

const MAX_SESSIONS = 2;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Step 1: Validate input
        if (!email || !password) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Email and password are required", statusCode: 400 },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid email format", statusCode: 422 },
                { status: 422 }
            );
        }

        // Step 2: Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid email or password", statusCode: 401 },
                { status: 401 }
            );
        }

        // Step 3: Check if email is verified
        if (!user.emailVerified) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Please verify your email before logging in", statusCode: 403 },
                { status: 403 }
            );
        }

        // Step 4: Compare password with hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid email or password", statusCode: 401 },
                { status: 401 }
            );
        }

        // Step 5: Enforce 2-session limit
        const existingSessions = await prisma.session.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "asc" }, // oldest first
        });

        if (existingSessions.length >= MAX_SESSIONS) {
            // Delete the oldest session(s) to make room
            const sessionsToDelete = existingSessions.slice(
                0,
                existingSessions.length - MAX_SESSIONS + 1
            );

            await prisma.session.deleteMany({
                where: {
                    id: { in: sessionsToDelete.map((s) => s.id) },
                },
            });
        }

        // Step 6: Generate tokens
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });

        const plainRefreshToken = generateToken();
        const hashedRefreshToken = hashToken(plainRefreshToken);

        // Step 7: Create session in database
        const userAgent = request.headers.get("user-agent") || "unknown";
        const forwarded = request.headers.get("x-forwarded-for");
        const ipAddress = forwarded?.split(",")[0]?.trim() || "unknown";

        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken: hashedRefreshToken,
                userAgent,
                ipAddress,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // Step 8: Set cookies
        await setAuthCookies(accessToken, plainRefreshToken);

        // Step 9: Return user data
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
                message: "Login successful",
                data: userResponse,
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
