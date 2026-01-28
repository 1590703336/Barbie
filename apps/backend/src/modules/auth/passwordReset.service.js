import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import redis from '../../config/upstash.js';
import transporter from '../../config/email.js';

import * as userRepository from '../user/user.repository.js';
import { EMAIL_FROM, FRONTEND_URL, PASSWORD_RESET_TOKEN_EXPIRY, NODE_ENV } from '../../config/env.js';

const TOKEN_EXPIRY = parseInt(PASSWORD_RESET_TOKEN_EXPIRY) || 900; // 15 minutes default
const TOKEN_PREFIX = 'password_reset:';

// In-memory fallback for development without Upstash
const memoryStore = new Map();

/**
 * Generate a secure reset token
 */
export const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Store token in Upstash Redis (or memory in dev)
 */
export const storeToken = async (token, userId) => {
    const key = `${TOKEN_PREFIX}${token}`;

    if (redis) {
        await redis.setex(key, TOKEN_EXPIRY, userId.toString());
    } else {
        // Dev fallback: in-memory with manual expiry
        memoryStore.set(key, { userId: userId.toString(), expiry: Date.now() + TOKEN_EXPIRY * 1000 });
        if (NODE_ENV === 'development') {
            console.log(`[DEV] Password reset token stored: ${token} (expires in ${TOKEN_EXPIRY}s)`);
        }
    }
};

/**
 * Verify and retrieve userId from token
 */
export const verifyToken = async (token) => {
    const key = `${TOKEN_PREFIX}${token}`;

    if (redis) {
        return await redis.get(key);
    } else {
        // Dev fallback
        const data = memoryStore.get(key);
        if (!data) return null;
        if (Date.now() > data.expiry) {
            memoryStore.delete(key);
            return null;
        }
        return data.userId;
    }
};

/**
 * Delete token after use
 */
export const deleteToken = async (token) => {
    const key = `${TOKEN_PREFIX}${token}`;

    if (redis) {
        await redis.del(key);
    } else {
        memoryStore.delete(key);
    }
};

/**
 * Send password reset email
 */
export const sendResetEmail = async (email, token) => {
    const baseUrl = FRONTEND_URL || 'http://localhost:4173';
    console.log(`[DEBUG_EMAIL] FRONTEND_URL from env: ${FRONTEND_URL}`);
    console.log(`[DEBUG_EMAIL] Using baseUrl: ${baseUrl}`);
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const mailOptions = {
        from: EMAIL_FROM || 'noreply@subscriptiontracker.com',
        to: email,
        subject: 'Password Reset Request - Subscription Tracker',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Password Reset Request</h2>
        <p>You requested to reset your password for your Subscription Tracker account.</p>
        <p>Click the button below to reset your password. This link will expire in ${TOKEN_EXPIRY / 60} minutes.</p>
        <a href="${resetUrl}" 
           style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this, please ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          This is an automated message from Subscription Tracker.
        </p>
      </div>
    `,
        text: `
      Password Reset Request
      
      You requested to reset your password for your Subscription Tracker account.
      
      Click the link below to reset your password (expires in ${TOKEN_EXPIRY / 60} minutes):
      ${resetUrl}
      
      If you didn't request this, please ignore this email.
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);

        console.log(`[EMAIL_SUCCESS] Sent to ${email}. Response: ${info.response}`);

        if (NODE_ENV === 'development') {
            console.log('[DEV] Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EMAIL_FAILURE] Failed to send to ${email}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email) => {
    // Check if user exists (don't reveal result to caller)
    const user = await userRepository.findOne({ email: email.toLowerCase() });

    if (user) {
        const token = generateResetToken();
        await storeToken(token, user._id);
        const emailResult = await sendResetEmail(email, token);

        if (!emailResult.success && NODE_ENV !== 'development') {
            // Log email delivery failure in production
            console.error(`[PASSWORD_RESET] Email delivery failed for ${email}`);
        }
    } else {
        // Log for monitoring but don't expose
        console.log(`[PASSWORD_RESET] Reset requested for non-existent email: ${email}`);
    }

    // Always return success to prevent email enumeration
    return { success: true };
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, newPassword) => {
    const userId = await verifyToken(token);

    if (!userId) {
        const error = new Error('Invalid or expired reset token. Please request a new password reset.');
        error.statusCode = 400;
        throw error;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await userRepository.update(userId, { password: hashedPassword });

    // Delete used token
    await deleteToken(token);

    return { success: true };
};
