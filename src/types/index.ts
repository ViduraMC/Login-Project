export interface ApiResponse<T = undefined> {
    success: boolean;
    message: string;
    data?: T;
    statusCode: number;
}

export interface UserResponse {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
}

export interface LoginResponse {
    accessToken: string;
    user: UserResponse;
}

export interface RefreshResponse {
    accessToken: string;
}

export interface SessionResponse {
    id: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    expiresAt: string;
}
