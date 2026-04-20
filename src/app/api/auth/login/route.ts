import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateAccessToken } from "@/lib/jwt";
import { generateToken, hashToken } from "@/lib/tokens";
import { setRefreshTokenCookie } from "@/lib/cookies";
import { isValidEmail } from "@/lib/validations";
import { ApiResponse, LoginResponse } from "@/types";

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

        // Step 2: Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Invalid email or password", statusCode: 401 },
                { status: 401 }
            );
        }

        // Step 3: Check if account is locked (brute-force protection)
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    message: `Account is temporarily locked. Try again in ${minutesLeft} minute(s).`,
                    statusCode: 403,
                },
                { status: 403 }
            );
        }

        // Step 4: Check if email is verified
        if (!user.emailVerified) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Please verify your email before logging in", statusCode: 403 },
                { status: 403 }
            );
        }

        // Step 5: Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // Increment failed attempts
            const newAttempts = user.failedLoginAttempts + 1;
            let lockedUntil = null;

            if (newAttempts >= 5) {
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: newAttempts, lockedUntil },
            });

            const attemptsLeft = 5 - newAttempts;
            const message =
                attemptsLeft > 0
                    ? `Invalid email or password. ${attemptsLeft} attempt(s) remaining.`
                    : "Too many failed attempts. Account locked for 15 minutes.";

            return NextResponse.json<ApiResponse>(
                { success: false, message, statusCode: 401 },
                { status: 401 }
            );
        }

        // Step 6: Reset failed attempts on successful login
        if (user.failedLoginAttempts > 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: 0, lockedUntil: null },
            });
        }

        // Step 7: Enforce 2-session limit
        const existingSessions = await prisma.session.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "asc" },
        });

        if (existingSessions.length >= MAX_SESSIONS) {
            const sessionsToDelete = existingSessions.slice(
                0,
                existingSessions.length - MAX_SESSIONS + 1
            );

            await prisma.session.deleteMany({
                where: { id: { in: sessionsToDelete.map((s) => s.id) } },
            });
        }

        // Step 8: Generate tokens
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });

        const plainRefreshToken = generateToken();
        const hashedRefreshToken = hashToken(plainRefreshToken);

        // Step 9: Create session
        const userAgent = request.headers.get("user-agent") || "unknown";
        const forwarded = request.headers.get("x-forwarded-for");
        const ipAddress = forwarded?.split(",")[0]?.trim() || "unknown";

        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken: hashedRefreshToken,
                userAgent,
                ipAddress,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // Step 10: Set ONLY refresh token as cookie
        await setRefreshTokenCookie(plainRefreshToken);

        // Step 11: Return access token in response body
        return NextResponse.json<ApiResponse<LoginResponse>>(
            {
                success: true,
                message: "Login successful",
                data: {
                    accessToken,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        emailVerified: user.emailVerified,
                        createdAt: user.createdAt.toISOString(),
                    },
                },
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
