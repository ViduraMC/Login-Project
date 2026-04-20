"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

interface Session {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const getAccessToken = (): string | null => {
    return localStorage.getItem("accessToken");
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        return data.data.accessToken;
      }
    } catch { }
    return null;
  };

  const fetchWithAuth = useCallback(async (url: string): Promise<Response | null> => {
    let token = getAccessToken();

    // Try with current token
    if (token) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return res;
    }

    // If failed, try refreshing
    token = await refreshAccessToken();
    if (token) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return res;
    }

    return null;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // Fetch user
      const userRes = await fetchWithAuth("/api/auth/me");
      if (!userRes) {
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setUser(userData.data);

      // Fetch sessions
      const sessionsRes = await fetchWithAuth("/api/auth/sessions");
      if (!sessionsRes) {
        // Session evicted or unauthorized — force logout
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }
      const sessionsData = await sessionsRes.json();
      setSessions(sessionsData.data || []);

      setLoading(false);

    };

    loadData();
  }, [router, fetchWithAuth]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("accessToken");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* User Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-gray-900 font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900 font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email Verified</p>
              <p className={`font-medium ${user?.emailVerified ? "text-green-600" : "text-red-600"}`}>
                {user?.emailVerified ? "✅ Verified" : "❌ Not Verified"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="text-gray-900 font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Sessions Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Sessions ({sessions.length}/2)
          </h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500">No active sessions.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Session {index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>📍 IP: {session.ipAddress}</p>
                    <p className="truncate">🌐 {session.userAgent}</p>
                    <p>📅 Created: {new Date(session.createdAt).toLocaleString()}</p>
                    <p>⏳ Expires: {new Date(session.expiresAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
