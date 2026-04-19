import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Login Project - Secure Authentication",
  description: "Full authentication system with JWT, session management, and email verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
