import nodemailer from "nodemailer";
import { config } from "../config/config.js";
import { logger } from "../utils/logger.js";

const transporter = nodemailer.createTransport({
  host: config.emailHost,
  port: config.emailPort,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.emailUser,
    pass: config.emailPass,
  },
});

export const sendWelcomeEmail = async (email, username, verifyCode) => {
  const domain = `http://localhost:${config.port}`;
  const verificationUrl = `${domain}/api/v1/auth/verify-email/${verifyCode}`;
  
  const info = await transporter.sendMail({
    from: `"VidTube Support" <${config.emailUser}>`,
    to: email,
    subject: "Welcome to VidTube!",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Welcome to VidTube, ${username}!</h2>
      <p style="color: #555;">We are excited to have you on board.</p>
      <p style="color: #555;">Please verify your email address to get started.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #ff0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
      </div>
      <p style="color: #777; font-size: 0.9em;">If you did not create an account, please ignore this email.</p>
    </div>
  `,
  })
  logger.info("Message sent: %s", info.messageId);
  return info;
}

export const sendForgotPasswordResetEmail = async (email, username, resetToken) => {
    const domain = `http://localhost:${config.port}`;
    const resetUrl = `${domain}/api/v1/auth/reset-password/${resetToken}`;
    const info = await transporter.sendMail({
      from: `"VidTube Support" <${config.emailUser}>`,
      to: email,
      subject: "Reset your password",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Reset your password, ${username}!</h2>
        <p style="color: #555;">You are receiving this email because you (or someone else) requested a password reset for your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #ff0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #777; font-size: 0.9em;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
    });
  logger.info("Message sent: %s", info.messageId);
    return info;
}


