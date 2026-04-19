import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Send email verification link to newly registered user
 */
export async function sendVerificationEmail(
    to: string,
    token: string
): Promise<void> {
    const verificationLink = `${APP_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: `"Login Project" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Verify Your Email Address",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Verify Your Email</h2>
        <p>Thank you for registering! Click the button below to verify your email address:</p>
        <a href="${verificationLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #2563EB; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #64748B; font-size: 14px;">
          This link expires in 24 hours. If you didn't create an account, ignore this email.
        </p>
        <p style="color: #64748B; font-size: 12px;">
          Or copy this link: ${verificationLink}
        </p>
      </div>
    `,
    });
}

/**
 * Send password reset link
 */
export async function sendPasswordResetEmail(
    to: string,
    token: string
): Promise<void> {
    const resetLink = `${APP_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"Login Project" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Reset Your Password",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Reset Your Password</h2>
        <p>You requested a password reset. Click the button below:</p>
        <a href="${resetLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #2563EB; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #64748B; font-size: 14px;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
        <p style="color: #64748B; font-size: 12px;">
          Or copy this link: ${resetLink}
        </p>
      </div>
    `,
    });
}
