import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse, UserResponse } from "@/types";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Not authenticated", statusCode: 401 },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
        });

        if (!user) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "User not found", statusCode: 404 },
                { status: 404 }
            );
        }

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
                message: "User retrieved successfully",
                data: userResponse,
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get me error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}