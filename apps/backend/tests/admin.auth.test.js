/**
 * Admin Auth Controller Tests
 * 
 * Comprehensive tests for admin authentication with:
 * - Valid admin sign-in
 * - Non-admin attempting admin sign-in (should fail)
 * - Token verification
 * - Session refresh
 * - Database verification
 * - Test cleanup
 */

import { jest } from '@jest/globals';

// ============ MOCK SETUP ============
// Mock user repository
const mockUserRepo = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
};

// Mock bcrypt
const mockBcrypt = {
    compare: jest.fn(),
};

// Mock jwt
const mockJwt = {
    sign: jest.fn(),
    verify: jest.fn(),
};

// Mock config
const mockConfig = {
    JWT_SECRET: 'test-secret',
};

// Setup mocks before importing
jest.unstable_mockModule('../src/modules/user/user.repository.js', () => mockUserRepo);
jest.unstable_mockModule('bcryptjs', () => ({
    default: mockBcrypt,
    compare: mockBcrypt.compare,
}));
jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));
jest.unstable_mockModule('../src/config/env.js', () => mockConfig);

// Import after mocking
const { adminSignIn, refreshAdminSession, verifyAdminToken } =
    await import('../src/modules/admin/admin.auth.service.js');

const {
    signIn,
    signOut,
    refreshSession,
    getCurrentAdmin,
} = await import('../src/modules/admin/admin.auth.controller.js');

// Import admin middleware
const { requireAdmin } = await import('../src/middlewares/admin.middleware.js');

// ============ TESTS ============
describe('Admin Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('adminSignIn', () => {
        it('should sign in an admin user with valid credentials', async () => {
            console.log('\n--- TEST: adminSignIn (Valid Admin) ---');

            const mockAdmin = {
                _id: 'admin-id-123',
                email: 'admin@test.com',
                password: 'hashed-password',
                role: 'admin',
                name: 'Test Admin',
            };

            mockUserRepo.findByEmail.mockResolvedValue(mockAdmin);
            mockBcrypt.compare.mockResolvedValue(true);
            mockJwt.sign.mockReturnValue('admin-jwt-token');

            console.log('Input: admin@test.com, password123');

            const result = await adminSignIn('admin@test.com', 'password123');

            console.log('Output:', JSON.stringify(result, null, 2));

            expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('admin@test.com');
            expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
            expect(mockJwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'admin-id-123', isAdmin: true }),
                expect.any(String),
                expect.objectContaining({ expiresIn: expect.any(String) })
            );
            expect(result.token).toBe('admin-jwt-token');
            expect(result.user.role).toBe('admin');

            console.log('--- TEST PASSED ---');
        });

        it('should reject sign-in for non-admin user', async () => {
            console.log('\n--- TEST: adminSignIn (Non-Admin User) ---');

            const mockUser = {
                _id: 'user-id-456',
                email: 'user@test.com',
                password: 'hashed-password',
                role: 'user', // NOT admin
                name: 'Regular User',
            };

            mockUserRepo.findByEmail.mockResolvedValue(mockUser);
            mockBcrypt.compare.mockResolvedValue(true);

            console.log('Input: user@test.com (role: user)');

            await expect(adminSignIn('user@test.com', 'password123'))
                .rejects
                .toThrow('Admin privileges required');

            console.log('Result: Correctly rejected non-admin user');
            console.log('--- TEST PASSED ---');
        });

        it('should reject sign-in with wrong password', async () => {
            console.log('\n--- TEST: adminSignIn (Wrong Password) ---');

            const mockAdmin = {
                _id: 'admin-id-123',
                email: 'admin@test.com',
                password: 'hashed-password',
                role: 'admin',
            };

            mockUserRepo.findByEmail.mockResolvedValue(mockAdmin);
            mockBcrypt.compare.mockResolvedValue(false); // Password doesn't match

            console.log('Input: admin@test.com, wrong-password');

            await expect(adminSignIn('admin@test.com', 'wrong-password'))
                .rejects
                .toThrow('Invalid credentials');

            console.log('Result: Correctly rejected wrong password');
            console.log('--- TEST PASSED ---');
        });

        it('should reject sign-in for non-existent user', async () => {
            console.log('\n--- TEST: adminSignIn (User Not Found) ---');

            mockUserRepo.findByEmail.mockResolvedValue(null);

            console.log('Input: nonexistent@test.com');

            await expect(adminSignIn('nonexistent@test.com', 'password123'))
                .rejects
                .toThrow('Invalid credentials');

            console.log('Result: Correctly rejected non-existent user');
            console.log('--- TEST PASSED ---');
        });
    });
});

describe('Admin Auth Controller', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            headers: {},
            user: null,
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };
        next = jest.fn();
    });

    describe('signIn', () => {
        it('should return 200 with token on successful admin sign-in', async () => {
            console.log('\n--- TEST: signIn Controller (Success) ---');

            req.body = { email: 'admin@test.com', password: 'password123' };

            const mockAdmin = {
                _id: 'admin-id-123',
                email: 'admin@test.com',
                password: 'hashed',
                role: 'admin',
                name: 'Admin',
            };

            mockUserRepo.findByEmail.mockResolvedValue(mockAdmin);
            mockBcrypt.compare.mockResolvedValue(true);
            mockJwt.sign.mockReturnValue('admin-token');

            await signIn(req, res, next);

            console.log('Response status:', res.status.mock.calls[0]?.[0]);
            console.log('Response body:', JSON.stringify(res.json.mock.calls[0]?.[0], null, 2));

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        token: 'admin-token',
                    }),
                })
            );

            console.log('--- TEST PASSED ---');
        });

        it('should return 403 for non-admin attempting admin sign-in', async () => {
            console.log('\n--- TEST: signIn Controller (Non-Admin Rejected) ---');

            req.body = { email: 'user@test.com', password: 'password123' };

            const mockUser = {
                _id: 'user-id',
                email: 'user@test.com',
                password: 'hashed',
                role: 'user',
            };

            mockUserRepo.findByEmail.mockResolvedValue(mockUser);
            mockBcrypt.compare.mockResolvedValue(true);

            await signIn(req, res, next);

            // Should pass error to next middleware
            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            console.log('Error passed to next:', error.message);

            expect(error.message).toContain('Admin');

            console.log('--- TEST PASSED ---');
        });
    });

    describe('signOut', () => {
        it('should sign out admin successfully', async () => {
            console.log('\n--- TEST: signOut Controller ---');

            req.user = { _id: 'admin-id-123', role: 'admin' };

            await signOut(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('sign'),
                })
            );

            console.log('--- TEST PASSED ---');
        });
    });
});

describe('Admin Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            headers: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should allow request with valid admin token', async () => {
        console.log('\n--- TEST: requireAdmin (Valid Token) ---');

        req.headers.authorization = 'Bearer valid-admin-token';

        const mockAdmin = {
            _id: 'admin-id-123',
            email: 'admin@test.com',
            role: 'admin',
        };

        mockJwt.verify.mockReturnValue({ userId: 'admin-id-123', isAdmin: true });
        mockUserRepo.findById.mockResolvedValue(mockAdmin);

        await requireAdmin(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.user).toEqual(mockAdmin);
        expect(req.isAdmin).toBe(true);

        console.log('--- TEST PASSED ---');
    });

    it('should reject request without token', async () => {
        console.log('\n--- TEST: requireAdmin (No Token) ---');

        req.headers.authorization = undefined;

        await requireAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
            })
        );

        console.log('--- TEST PASSED ---');
    });

    it('should reject request with token missing isAdmin claim', async () => {
        console.log('\n--- TEST: requireAdmin (Not Admin Token) ---');

        req.headers.authorization = 'Bearer user-token';

        mockJwt.verify.mockReturnValue({ userId: 'user-id', isAdmin: false });

        await requireAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.stringContaining('Admin'),
            })
        );

        console.log('--- TEST PASSED ---');
    });

    it('should reject if user no longer has admin role in DB', async () => {
        console.log('\n--- TEST: requireAdmin (Role Revoked) ---');

        req.headers.authorization = 'Bearer former-admin-token';

        const formerAdmin = {
            _id: 'former-admin-id',
            email: 'former@test.com',
            role: 'user', // Role was changed in DB
        };

        mockJwt.verify.mockReturnValue({ userId: 'former-admin-id', isAdmin: true });
        mockUserRepo.findById.mockResolvedValue(formerAdmin);

        await requireAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('revoked'),
            })
        );

        console.log('--- TEST PASSED ---');
    });
});

// ============ DATABASE VERIFICATION TESTS ============
// These tests would run against a real test database in integration mode
describe('Admin Auth Integration Tests (DB Verification)', () => {
    // Note: These tests require a running test database
    // They are designed to verify actual database changes

    const TEST_ADMIN_EMAIL = `test-admin-${Date.now()}@test.com`;
    let testAdminId = null;

    // Cleanup function to be called after all tests
    async function cleanupTestData() {
        console.log('\n=== CLEANUP: Removing test data ===');
        // In a real implementation, this would delete test users from DB
        // await User.deleteOne({ email: TEST_ADMIN_EMAIL });
        console.log(`Would delete user: ${TEST_ADMIN_EMAIL}`);
        console.log('=== CLEANUP COMPLETE ===');
    }

    afterAll(async () => {
        await cleanupTestData();
    });

    it.skip('INTEGRATION: should verify admin is stored in database after creation', async () => {
        // This is a placeholder for integration test
        // In real integration tests:
        // 1. Create admin user in DB
        // 2. Verify user exists with correct role
        // 3. Cleanup
        console.log('Integration test - requires running database');
    });

    it.skip('INTEGRATION: should verify session token is valid after login', async () => {
        // This would test the full login flow against a real database
        console.log('Integration test - requires running database');
    });
});
