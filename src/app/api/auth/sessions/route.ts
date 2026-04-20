import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse, SessionResponse } from "@/types";

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json<ApiResponse>(
                { success: false, message: "Not authenticated", statusCode: 401 },
                { status: 401 }
            );
        }

        const sessions = await prisma.session.findMany({
            where: { userId: currentUser.userId },
            select: {
                id: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
                expiresAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const sessionResponses: SessionResponse[] = sessions.map((s) => ({
            id: s.id,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            createdAt: s.createdAt.toISOString(),
            expiresAt: s.expiresAt.toISOString(),
        }));

        return NextResponse.json<ApiResponse<SessionResponse[]>>(
            {
                success: true,
                message: "Sessions retrieved successfully",
                data: sessionResponses,
                statusCode: 200,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get sessions error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, message: "Internal server error", statusCode: 500 },
            { status: 500 }
        );
    }
}
