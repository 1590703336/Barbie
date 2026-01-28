import * as passwordResetService from './passwordReset.service.js';

/**
 * POST /auth/forgot-password
 * Request a password reset email
 */
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        await passwordResetService.requestPasswordReset(email);

        // Always return the same message to prevent email enumeration
        res.status(200).json({
            success: true,
            message: 'If this email is registered, a password reset link will be sent.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /auth/reset-password
 * Reset password using token
 */
export const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        await passwordResetService.resetPassword(token, password);

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now log in with your new password.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /auth/verify-reset-token/:token
 * Verify if a reset token is valid (for frontend validation before showing form)
 */
export const verifyResetToken = async (req, res, next) => {
    try {
        const { token } = req.params;

        const userId = await passwordResetService.verifyToken(token);

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Token is valid.',
        });
    } catch (error) {
        next(error);
    }
};
