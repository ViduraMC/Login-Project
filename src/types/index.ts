/**
 * Standard API response format
 * Every API endpoint returns this shape
 */
export interface ApiResponse<T = undefined> {
    success: boolean;
    message: string;
    data?: T;
    statusCode: number;
}

/**
 * User data returned to the client (never includes password!)
 */
export interface UserResponse {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
}
