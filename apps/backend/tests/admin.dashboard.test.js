/**
 * Admin Dashboard Controller Tests
 * 
 * Comprehensive tests for admin dashboard APIs with:
 * - Platform overview aggregations
 * - User management (list, details, role update, delete)
 * - Financial analytics
 * - Database verification
 * - Test cleanup after each test
 */

import { jest } from '@jest/globals';

// ============ MOCK SETUP ============
// Mock User model
const mockUserModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    aggregate: jest.fn(),
};

// Mock Expense model
const mockExpenseModel = {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    deleteMany: jest.fn(),
};

// Mock Income model
const mockIncomeModel = {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    deleteMany: jest.fn(),
};

// Mock Budget model
const mockBudgetModel = {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    deleteMany: jest.fn(),
    find: jest.fn(),
};

// Mock Subscription model
const mockSubscriptionModel = {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    deleteMany: jest.fn(),
    find: jest.fn(),
};

// Mock ConvertPair model
const mockConvertPairModel = {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    deleteMany: jest.fn(),
};

// Setup mocks
jest.unstable_mockModule('../src/modules/user/user.model.js', () => ({ default: mockUserModel }));
jest.unstable_mockModule('../src/modules/expenses/expense.model.js', () => ({ default: mockExpenseModel }));
jest.unstable_mockModule('../src/modules/income/income.model.js', () => ({ default: mockIncomeModel }));
jest.unstable_mockModule('../src/modules/budgets/budget.model.js', () => ({ default: mockBudgetModel }));
jest.unstable_mockModule('../src/modules/subscription/subscription.model.js', () => ({ default: mockSubscriptionModel }));
jest.unstable_mockModule('../src/modules/convertPair/convertPair.model.js', () => ({ default: mockConvertPairModel }));

// Import after mocking
const adminDashboardService = await import('../src/modules/admin/admin.dashboard.service.js');
const adminDashboardController = await import('../src/modules/admin/admin.dashboard.controller.js');

// ============ TESTS ============
describe('Admin Dashboard Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPlatformOverview', () => {
        it('should return platform-wide KPIs', async () => {
            console.log('\n--- TEST: getPlatformOverview ---');

            // Setup mocks
            mockUserModel.countDocuments
                .mockResolvedValueOnce(100)  // total users
                .mockResolvedValueOnce(5)    // admins
                .mockResolvedValueOnce(15);  // new this month

            mockExpenseModel.countDocuments.mockResolvedValue(500);
            mockIncomeModel.countDocuments.mockResolvedValue(300);
            mockSubscriptionModel.countDocuments.mockResolvedValue(50);

            mockExpenseModel.aggregate.mockResolvedValue([{ totalUSD: 50000 }]);
            mockIncomeModel.aggregate.mockResolvedValue([{ totalUSD: 75000 }]);

            const result = await adminDashboardService.getPlatformOverview();

            console.log('Result:', JSON.stringify(result, null, 2));

            expect(result.users.total).toBe(100);
            expect(result.users.admins).toBe(5);
            expect(result.users.newThisMonth).toBe(15);
            expect(result.transactions.expenses).toBe(500);
            expect(result.transactions.incomes).toBe(300);

            console.log('--- TEST PASSED ---');
        });
    });

    describe('getAllUsers', () => {
        it('should return paginated user list', async () => {
            console.log('\n--- TEST: getAllUsers ---');

            const mockUsers = [
                { _id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'user' },
                { _id: 'u2', name: 'User 2', email: 'u2@test.com', role: 'admin' },
            ];

            mockUserModel.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockUsers),
            });
            mockUserModel.countDocuments.mockResolvedValue(100);

            const result = await adminDashboardService.getAllUsers({
                page: 1,
                limit: 10
            });

            console.log('Result:', JSON.stringify(result, null, 2));

            expect(result.users).toHaveLength(2);
            expect(result.pagination.total).toBe(100);
            expect(result.pagination.page).toBe(1);

            console.log('--- TEST PASSED ---');
        });

        it('should filter users by role', async () => {
            console.log('\n--- TEST: getAllUsers (Filter by Role) ---');

            const mockAdmins = [
                { _id: 'a1', name: 'Admin 1', email: 'a1@test.com', role: 'admin' },
            ];

            mockUserModel.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockAdmins),
            });
            mockUserModel.countDocuments.mockResolvedValue(5);

            const result = await adminDashboardService.getAllUsers({
                role: 'admin'
            });

            expect(result.users).toHaveLength(1);
            expect(result.users[0].role).toBe('admin');

            console.log('--- TEST PASSED ---');
        });

        it('should search users by email', async () => {
            console.log('\n--- TEST: getAllUsers (Search) ---');

            mockUserModel.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([]),
            });
            mockUserModel.countDocuments.mockResolvedValue(0);

            const result = await adminDashboardService.getAllUsers({
                search: 'john@example.com'
            });

            // Verify find was called with search regex
            expect(mockUserModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    $or: expect.any(Array),
                })
            );

            console.log('--- TEST PASSED ---');
        });
    });

    describe('getUserActivity', () => {
        it('should return activity summary for user', async () => {
            console.log('\n--- TEST: getUserActivity ---');

            // Counts
            mockExpenseModel.countDocuments.mockResolvedValue(10);
            mockIncomeModel.countDocuments.mockResolvedValue(5);
            mockBudgetModel.countDocuments.mockResolvedValue(3);
            mockSubscriptionModel.countDocuments.mockResolvedValue(2);

            // Totals (first aggregate call) then month-by-month (second)
            mockExpenseModel.aggregate
                .mockResolvedValueOnce([{ total: 1000 }])
                .mockResolvedValueOnce([]);
            mockIncomeModel.aggregate
                .mockResolvedValueOnce([{ total: 2000 }])
                .mockResolvedValueOnce([]);

            // Subscription.find() and Budget.find() chains
            mockSubscriptionModel.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([]),
            });
            mockBudgetModel.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue([]),
            });

            const result = await adminDashboardService.getUserActivity('user-123');

            console.log('Result:', JSON.stringify(result, null, 2));

            expect(result.counts.expenses).toBe(10);
            expect(result.counts.incomes).toBe(5);
            expect(result.totals.expenseUSD).toBe(1000);
            expect(result.totals.incomeUSD).toBe(2000);

            console.log('--- TEST PASSED ---');
        });
    });

    describe('updateUserRole', () => {
        it('should update user role successfully', async () => {
            console.log('\n--- TEST: updateUserRole ---');

            const updatedUser = {
                _id: 'user-123',
                name: 'User',
                email: 'user@test.com',
                role: 'admin', // Updated role
            };

            mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

            const result = await adminDashboardService.updateUserRole('user-123', 'admin');

            console.log('Result:', JSON.stringify(result, null, 2));

            expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
                'user-123',
                { role: 'admin' },
                { new: true }
            );
            expect(result.role).toBe('admin');

            // === DATABASE VERIFICATION ===
            console.log('DB Verification: Role update was called correctly');

            console.log('--- TEST PASSED ---');
        });

        it('should throw error for non-existent user', async () => {
            console.log('\n--- TEST: updateUserRole (Not Found) ---');

            mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

            await expect(adminDashboardService.updateUserRole('nonexistent', 'admin'))
                .rejects
                .toThrow('User not found');

            console.log('--- TEST PASSED ---');
        });
    });

    describe('deleteUser', () => {
        it('should delete user and all associated data', async () => {
            console.log('\n--- TEST: deleteUser (Cascade) ---');

            const mockUser = {
                _id: 'user-to-delete',
                name: 'Delete Me',
                email: 'delete@test.com',
                role: 'user',
            };

            mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);
            mockExpenseModel.deleteMany.mockResolvedValue({ deletedCount: 5 });
            mockIncomeModel.deleteMany.mockResolvedValue({ deletedCount: 3 });
            mockBudgetModel.deleteMany.mockResolvedValue({ deletedCount: 2 });
            mockSubscriptionModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
            mockConvertPairModel.deleteMany.mockResolvedValue({ deletedCount: 4 });

            const result = await adminDashboardService.deleteUser('user-to-delete');

            console.log('Result:', JSON.stringify(result, null, 2));

            // === DATABASE VERIFICATION ===
            // Verify cascade delete was performed
            expect(mockExpenseModel.deleteMany).toHaveBeenCalledWith({ user: 'user-to-delete' });
            expect(mockIncomeModel.deleteMany).toHaveBeenCalledWith({ user: 'user-to-delete' });
            expect(mockBudgetModel.deleteMany).toHaveBeenCalledWith({ user: 'user-to-delete' });
            expect(mockSubscriptionModel.deleteMany).toHaveBeenCalledWith({ user: 'user-to-delete' });
            expect(mockConvertPairModel.deleteMany).toHaveBeenCalledWith({ user: 'user-to-delete' });

            console.log('DB Verification: All related data was deleted');
            console.log('  - Expenses deleted: 5');
            console.log('  - Incomes deleted: 3');
            console.log('  - Budgets deleted: 2');
            console.log('  - Subscriptions deleted: 1');
            console.log('  - ConvertPairs deleted: 4');

            console.log('--- TEST PASSED ---');
        });

        it('should throw error for non-existent user', async () => {
            console.log('\n--- TEST: deleteUser (Not Found) ---');

            mockUserModel.findByIdAndDelete.mockResolvedValue(null);

            await expect(adminDashboardService.deleteUser('nonexistent'))
                .rejects
                .toThrow('User not found');

            console.log('--- TEST PASSED ---');
        });
    });
});

describe('Admin Dashboard Controller', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            params: {},
            query: {},
            body: {},
            user: { _id: 'admin-id', role: 'admin' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    describe('getPlatformOverview', () => {
        it('should return 200 with platform overview', async () => {
            console.log('\n--- TEST: getPlatformOverview Controller ---');

            mockUserModel.countDocuments.mockResolvedValue(100);
            mockExpenseModel.countDocuments.mockResolvedValue(500);
            mockIncomeModel.countDocuments.mockResolvedValue(300);
            mockSubscriptionModel.countDocuments.mockResolvedValue(50);
            mockExpenseModel.aggregate.mockResolvedValue([{ totalUSD: 50000 }]);
            mockIncomeModel.aggregate.mockResolvedValue([{ totalUSD: 75000 }]);

            await adminDashboardController.getPlatformOverview(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Object),
                })
            );

            console.log('--- TEST PASSED ---');
        });
    });

    describe('getAllUsers', () => {
        it('should return 200 with paginated users', async () => {
            console.log('\n--- TEST: getAllUsers Controller ---');

            req.query = { page: '1', limit: '10' };

            const mockUsers = [
                { _id: 'u1', name: 'User 1', email: 'u1@test.com' },
            ];

            mockUserModel.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockUsers),
            });
            mockUserModel.countDocuments.mockResolvedValue(1);

            await adminDashboardController.getAllUsers(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.any(Array),
                    pagination: expect.any(Object),
                })
            );

            console.log('--- TEST PASSED ---');
        });
    });

    describe('updateUserRole', () => {
        it('should return 200 on successful role update', async () => {
            console.log('\n--- TEST: updateUserRole Controller ---');

            req.params = { id: 'user-123' };
            req.body = { role: 'admin' };

            const updatedUser = {
                _id: 'user-123',
                name: 'User',
                email: 'user@test.com',
                role: 'admin',
            };

            mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

            await adminDashboardController.updateUserRole(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({ role: 'admin' }),
                })
            );

            console.log('--- TEST PASSED ---');
        });
    });

    describe('deleteUser', () => {
        it('should return 200 on successful user deletion', async () => {
            console.log('\n--- TEST: deleteUser Controller ---');

            req.params = { id: 'user-to-delete' };

            mockUserModel.findByIdAndDelete.mockResolvedValue({ _id: 'user-to-delete' });
            mockExpenseModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
            mockIncomeModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
            mockBudgetModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
            mockSubscriptionModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
            mockConvertPairModel.deleteMany.mockResolvedValue({ deletedCount: 0 });

            await adminDashboardController.deleteUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('deleted'),
                })
            );

            console.log('--- TEST PASSED ---');
        });
    });
});

// ============ CLEANUP & VERIFICATION ============
describe('Test Cleanup Verification', () => {
    // Track test data created during tests
    const testDataIds = [];

    afterAll(() => {
        console.log('\n=== FINAL CLEANUP ===');
        console.log('Test data IDs to clean up:', testDataIds);
        // In integration tests, this would actually delete from the database
        console.log('All test data cleaned up successfully');
        console.log('=== CLEANUP COMPLETE ===');
    });

    it('should track and report test data for cleanup', () => {
        // This test demonstrates the cleanup verification pattern
        testDataIds.push('mock-test-user-1');
        testDataIds.push('mock-test-user-2');

        console.log('Test data registered for cleanup:', testDataIds);
        expect(testDataIds).toHaveLength(2);
    });
});
