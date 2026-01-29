import { jest } from '@jest/globals';
import crypto from 'crypto';

// ==========================================
// 1. Define Mocks & Variables
// ==========================================

const mockUserRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
};

const mockEmailConfig = {
    default: {
        sendMail: jest.fn(),
    }
};

const mockUpstash = {
    default: {
        setex: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
    }
};

const mockBcrypt = {
    genSalt: jest.fn(),
    hash: jest.fn(),
};

// ==========================================
// 2. Setup ESM Mocks 
// ==========================================

// Mock dependencies for Service
jest.unstable_mockModule('../src/modules/user/user.repository.js', () => mockUserRepo);
jest.unstable_mockModule('../src/config/email.js', () => mockEmailConfig);
jest.unstable_mockModule('../src/config/upstash.js', () => mockUpstash);
jest.unstable_mockModule('bcryptjs', () => ({
    default: mockBcrypt,
    ...mockBcrypt
}));
// Mock env to control variables
jest.unstable_mockModule('../src/config/env.js', () => ({
    EMAIL_FROM: 'noreply@test.com',
    FRONTEND_URL: 'http://localhost:3000',
    PASSWORD_RESET_TOKEN_EXPIRY: 900,
    NODE_ENV: 'test'
}));

// ==========================================
// 3. Import Modules (Dynamic Imports)
// ==========================================

// Import modules UNDER TEST after mocking
const passwordResetService = await import('../src/modules/auth/passwordReset.service.js');
const passwordResetController = await import('../src/modules/auth/passwordReset.controller.js');
const passwordResetValidation = await import('../src/modules/auth/passwordReset.validation.js');

// ==========================================
// 4. Test Suites
// ==========================================

describe('Password Reset Feature', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // SERVICE LAYER
    // --------------------------------------------------------------------------
    describe('Service Layer', () => {

        describe('generateResetToken', () => {
            it('should generate a 64-character hex token', () => {
                const token = passwordResetService.generateResetToken();
                expect(token).toBeDefined();
                expect(typeof token).toBe('string');
                expect(token).toHaveLength(64); // 32 bytes * 2 hex chars
            });
        });

        describe('storeToken', () => {
            it('should store token in Redis when available', async () => {
                const token = 'test-token';
                const userId = 'user-123';
                await passwordResetService.storeToken(token, userId);

                expect(mockUpstash.default.setex).toHaveBeenCalledWith(
                    `password_reset:${token}`,
                    900,
                    'user-123'
                );
            });
        });

        describe('verifyToken', () => {
            it('should return userId for valid token', async () => {
                mockUpstash.default.get.mockResolvedValue('user-123');
                const userId = await passwordResetService.verifyToken('valid-token');
                expect(userId).toBe('user-123');
            });

            it('should return null for invalid/expired token', async () => {
                mockUpstash.default.get.mockResolvedValue(null);
                const userId = await passwordResetService.verifyToken('invalid-token');
                expect(userId).toBeNull();
            });
        });

        describe('deleteToken', () => {
            it('should delete token from storage', async () => {
                await passwordResetService.deleteToken('test-token');
                expect(mockUpstash.default.del).toHaveBeenCalledWith('password_reset:test-token');
            });
        });

        describe('sendResetEmail', () => {
            it('should send email with correct reset URL', async () => {
                mockEmailConfig.default.sendMail.mockResolvedValue({ response: '200 OK', messageId: '123' });

                const result = await passwordResetService.sendResetEmail('test@example.com', 'token-123');

                expect(result.success).toBe(true);
                expect(mockEmailConfig.default.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                    to: 'test@example.com',
                    subject: 'Password Reset Request - Subscription Tracker',
                    html: expect.stringContaining('http://localhost:3000/reset-password?token=token-123')
                }));
            });

            it('should return success:false on email failure', async () => {
                mockEmailConfig.default.sendMail.mockRejectedValue(new Error('SMTP Error'));

                const result = await passwordResetService.sendResetEmail('fail@example.com', 'token-123');

                expect(result.success).toBe(false);
                expect(result.error).toBe('SMTP Error');
            });
        });

        describe('requestPasswordReset', () => {
            it('should generate token and send email for existing user', async () => {
                const mockUser = { _id: 'user-123', email: 'exist@example.com' };
                mockUserRepo.findOne.mockResolvedValue(mockUser);
                mockEmailConfig.default.sendMail.mockResolvedValue({ response: 'OK' });

                // Spy on internal methods would be tricky with ESM, checking side effects instead
                const result = await passwordResetService.requestPasswordReset('exist@example.com');

                expect(result.success).toBe(true);
                expect(mockUserRepo.findOne).toHaveBeenCalledWith({ email: 'exist@example.com' });
                expect(mockUpstash.default.setex).toHaveBeenCalled(); // Token stored
                expect(mockEmailConfig.default.sendMail).toHaveBeenCalled(); // Email sent
            });

            it('should do nothing but return success if user does not exist (Security)', async () => {
                mockUserRepo.findOne.mockResolvedValue(null);

                const result = await passwordResetService.requestPasswordReset('nonexistent@example.com');

                expect(result.success).toBe(true);
                expect(mockUserRepo.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
                expect(mockUpstash.default.setex).not.toHaveBeenCalled();
                expect(mockEmailConfig.default.sendMail).not.toHaveBeenCalled();
            });
        });

        describe('resetPassword', () => {
            it('should hash password, update user, and delete token', async () => {
                // Setup
                mockUpstash.default.get.mockResolvedValue('user-123'); // Token valid
                mockBcrypt.genSalt.mockResolvedValue('salt');
                mockBcrypt.hash.mockResolvedValue('hashed-password');

                const result = await passwordResetService.resetPassword('valid-token', 'new-password');

                expect(result.success).toBe(true);
                expect(mockBcrypt.hash).toHaveBeenCalledWith('new-password', 'salt');
                expect(mockUserRepo.update).toHaveBeenCalledWith('user-123', { password: 'hashed-password' });
                expect(mockUpstash.default.del).toHaveBeenCalledWith('password_reset:valid-token');
            });

            it('should throw error for invalid token', async () => {
                mockUpstash.default.get.mockResolvedValue(null); // Token invalid

                await expect(passwordResetService.resetPassword('invalid-token', 'new-pass'))
                    .rejects.toThrow('Invalid or expired reset token');

                expect(mockUserRepo.update).not.toHaveBeenCalled();
            });
        });
    });

    // --------------------------------------------------------------------------
    // CONTROLLER LAYER
    // --------------------------------------------------------------------------
    describe('Controller Layer', () => {
        let req, res, next;

        beforeEach(() => {
            req = { body: {}, params: {} };
            res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            next = jest.fn();
        });

        describe('forgotPassword', () => {
            // Need to mock service methods for controller tests
            // Since we imported the *real* service earlier, we can't easily mock *only* for controller
            // However, we can mock the *dependencies* of the service to make the service behave as expected
            // OR checks that the controller calls the service correctly if we mocked the service module itself.

            // Re-mocking the service module for controller tests isn't possible in same file with ESM dynamic imports easily
            // So we will verify the controller's behavior integrates with the service logic we tested above.

            it('should return 200 with generic message', async () => {
                req.body.email = 'test@example.com';
                mockUserRepo.findOne.mockResolvedValue(null); // User doesn't exist case

                await passwordResetController.forgotPassword(req, res, next);

                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('If this email is registered')
                }));
            });

            it('should pass errors to next()', async () => {
                req.body.email = 'test@example.com';
                mockUserRepo.findOne.mockRejectedValue(new Error('DB Error'));

                await passwordResetController.forgotPassword(req, res, next);

                expect(next).toHaveBeenCalledWith(expect.any(Error));
            });
        });

        describe('resetPassword', () => {
            it('should return 200 on success', async () => {
                req.body = { token: 'valid-token', password: 'new-pass' };
                // Setup service dependencies to succeed
                mockUpstash.default.get.mockResolvedValue('user-123');
                mockBcrypt.hash.mockResolvedValue('hash');
                mockUserRepo.update.mockResolvedValue(true);

                await passwordResetController.resetPassword(req, res, next);

                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('Password has been reset successfully')
                }));
            });
        });

        describe('verifyResetToken', () => {
            it('should return 200 valid message for valid token', async () => {
                req.params.token = 'valid-token';
                mockUpstash.default.get.mockResolvedValue('user-123');

                await passwordResetController.verifyResetToken(req, res, next);

                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Token is valid.' });
            });

            it('should return 400 for invalid token', async () => {
                req.params.token = 'invalid-token';
                mockUpstash.default.get.mockResolvedValue(null);

                await passwordResetController.verifyResetToken(req, res, next);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid or expired reset token.' });
            });
        });
    });

    // --------------------------------------------------------------------------
    // VALIDATION SCHEMAS
    // --------------------------------------------------------------------------
    describe('Validation Schemas', () => {
        const { forgotPasswordSchema, resetPasswordSchema } = passwordResetValidation;

        describe('forgotPasswordSchema', () => {
            it('should pass for valid email', () => {
                const { error } = forgotPasswordSchema.validate({ email: 'test@example.com' });
                expect(error).toBeUndefined();
            });

            it('should fail for invalid email', () => {
                const { error } = forgotPasswordSchema.validate({ email: 'not-an-email' });
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('not a valid email address');
            });
        });

        describe('resetPasswordSchema', () => {
            it('should pass for valid data', () => {
                const { error } = resetPasswordSchema.validate({
                    token: 'abc-123',
                    password: 'password123',
                    confirmPassword: 'password123'
                });
                expect(error).toBeUndefined();
            });

            it('should fail when passwords do not match', () => {
                const { error } = resetPasswordSchema.validate({
                    token: 'abc-123',
                    password: 'password123',
                    confirmPassword: 'mismatch'
                });
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('Passwords do not match');
            });

            it('should fail for short password', () => {
                const { error } = resetPasswordSchema.validate({
                    token: 'abc-123',
                    password: '123',
                    confirmPassword: '123'
                });
                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('at least 6 characters');
            });
        });
    });
});
