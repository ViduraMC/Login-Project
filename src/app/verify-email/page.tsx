"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") || "";

    const [status, setStatus] = useState<"verifying" | "verified" | "error">("verifying");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifiedEmail, setVerifiedEmail] = useState("");

    // Auto-verify the token when page loads
    useEffect(() => {
        if (!token) {
            setStatus("error");
            setError("No verification token found. Please register again.");
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch("/api/auth/register/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus("verified");
                    setVerifiedEmail(data.data?.email || "");
                } else {
                    setStatus("error");
                    setError(data.message || "Invalid or expired token.");
                }
            } catch {
                setStatus("error");
                setError("Something went wrong. Please try again.");
            }
        };

        verifyToken();
    }, [token]);

    // Complete registration
    const handleComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, name, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message);
            } else {
                setSuccess("Account created successfully! Redirecting to login...");
                setTimeout(() => router.push("/login"), 2000);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (status === "verifying") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-600 text-2xl mb-4 animate-pulse">
                        ✉️
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Verifying your email...</h1>
                    <p className="text-gray-500 mt-2">Please wait a moment.</p>
                </div>
            </div>
        );
    }

    // Error state
    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 text-red-600 text-2xl mb-4">
                        ❌
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
                    <p className="text-red-600 mt-2">{error}</p>
                    <Link
                        href="/register"
                        className="inline-block mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Register Again
                    </Link>
                </div>
            </div>
        );
    }

    // Verified — show complete form
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 text-2xl mb-4">
                        ✅
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Email Verified!</h1>
                    <p className="text-gray-500 mt-1">
                        <span className="font-medium text-gray-700">{verifiedEmail}</span> has been verified.
                        <br />Complete your profile to finish registration.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleComplete}>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="John Doe"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Min 8 chars, 1 uppercase, 1 number"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <p className="text-gray-500">Loading...</p>
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
