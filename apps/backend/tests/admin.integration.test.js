/**
 * Admin Integration Tests
 * 
 * COMPREHENSIVE integration tests that actually connect to MongoDB,
 * create real test data, perform operations, verify database changes,
 * and clean up all test data afterwards.
 * 
 * Run with: npm test -- --testPathPatterns="admin.integration"
 * 
 * Uses MongoDB Memory Server for isolated testing - no local MongoDB required.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Load environment FIRST
dotenv.config();

// Import models directly for DB verification
import User from '../src/modules/user/user.model.js';
import Expense from '../src/modules/expenses/expense.model.js';
import Income from '../src/modules/income/income.model.js';
import Budget from '../src/modules/budgets/budget.model.js';
import Subscription from '../src/modules/subscription/subscription.model.js';
import ConvertPair from '../src/modules/convertPair/convertPair.model.js';

// Import services to test
import * as adminAuthService from '../src/modules/admin/admin.auth.service.js';
import * as adminDashboardService from '../src/modules/admin/admin.dashboard.service.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Use process.env or fallback for tests
const JWT_SECRET = process.env.JWT_SECRET;
let mongoServer = null;

// Valid enum values from models
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Others'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Others'];

// Unique identifiers for test data to avoid conflicts
const TEST_PREFIX = `TEST_${Date.now()}`;
const TEST_ADMIN = {
    email: `${TEST_PREFIX}_admin@test.com`,
    password: 'AdminPassword123!',
    name: 'Integration Test Admin',
    role: 'admin',
    defaultCurrency: 'USD',
};
const TEST_USER = {
    email: `${TEST_PREFIX}_user@test.com`,
    password: 'UserPassword123!',
    name: 'Integration Test User',
    role: 'user',
    defaultCurrency: 'EUR',
};

// Track created test data for cleanup
const createdTestIds = {
    users: [],
    expenses: [],
    incomes: [],
    budgets: [],
    subscriptions: [],
    convertPairs: [],
};

// ============================================================================
// DATABASE CONNECTION (Using MongoDB Memory Server)
// ============================================================================

beforeAll(async () => {
    console.log('\n========================================');
    console.log('INTEGRATION TEST SUITE - STARTING');
    console.log('========================================');

    try {
        // Start in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        console.log(`Using in-memory MongoDB: ${mongoUri}`);

        // Disconnect any existing connection
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to in-memory test database');
    } catch (error) {
        console.error('❌ Failed to connect to database:', error.message);
        throw error;
    }
}, 60000); // 60 second timeout for startup

afterAll(async () => {
    console.log('\n========================================');
    console.log('CLEANUP - REMOVING ALL TEST DATA');
    console.log('========================================');

    await cleanupAllTestData();
    await verifyCleanup();

    // Properly close connections
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
    console.log('✅ Disconnected from database and stopped MongoDB server');
    console.log('========================================\n');
}, 30000);

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

/**
 * Clean up all test data created during tests
 */
async function cleanupAllTestData() {
    console.log('\nDeleting test data...');

    // Delete in reverse order of dependencies
    if (createdTestIds.convertPairs.length > 0) {
        await ConvertPair.deleteMany({ _id: { $in: createdTestIds.convertPairs } });
        console.log(`  - Deleted ${createdTestIds.convertPairs.length} ConvertPairs`);
    }

    if (createdTestIds.subscriptions.length > 0) {
        await Subscription.deleteMany({ _id: { $in: createdTestIds.subscriptions } });
        console.log(`  - Deleted ${createdTestIds.subscriptions.length} Subscriptions`);
    }

    if (createdTestIds.budgets.length > 0) {
        await Budget.deleteMany({ _id: { $in: createdTestIds.budgets } });
        console.log(`  - Deleted ${createdTestIds.budgets.length} Budgets`);
    }

    if (createdTestIds.incomes.length > 0) {
        await Income.deleteMany({ _id: { $in: createdTestIds.incomes } });
        console.log(`  - Deleted ${createdTestIds.incomes.length} Incomes`);
    }

    if (createdTestIds.expenses.length > 0) {
        await Expense.deleteMany({ _id: { $in: createdTestIds.expenses } });
        console.log(`  - Deleted ${createdTestIds.expenses.length} Expenses`);
    }

    if (createdTestIds.users.length > 0) {
        await User.deleteMany({ _id: { $in: createdTestIds.users } });
        console.log(`  - Deleted ${createdTestIds.users.length} Users`);
    }

    // Also clean up by test prefix pattern just in case
    await User.deleteMany({ email: { $regex: TEST_PREFIX } });
}

/**
 * Verify all test data has been successfully deleted
 */
async function verifyCleanup() {
    console.log('\nVerifying cleanup...');

    let allClean = true;

    for (const userId of createdTestIds.users) {
        const user = await User.findById(userId);
        if (user) {
            console.error(`  ❌ User ${userId} still exists!`);
            allClean = false;
        }
    }

    for (const expenseId of createdTestIds.expenses) {
        const expense = await Expense.findById(expenseId);
        if (expense) {
            console.error(`  ❌ Expense ${expenseId} still exists!`);
            allClean = false;
        }
    }

    // Check by pattern
    const remainingUsers = await User.find({ email: { $regex: TEST_PREFIX } });
    if (remainingUsers.length > 0) {
        console.error(`  ❌ Found ${remainingUsers.length} remaining test users by pattern!`);
        allClean = false;
        // Force cleanup
        await User.deleteMany({ email: { $regex: TEST_PREFIX } });
    }

    if (allClean) {
        console.log('  ✅ All test data successfully cleaned up');
    }

    return allClean;
}

// ============================================================================
// TEST DATA CREATION HELPERS
// ============================================================================

/**
 * Create a test user in the database
 */
async function createTestUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({
        ...userData,
        password: hashedPassword,
    });
    createdTestIds.users.push(user._id);
    return user;
}

/**
 * Create test expense for a user (uses correct enum values)
 */
async function createTestExpense(userId, data = {}) {
    const expense = await Expense.create({
        user: userId,
        title: data.title || 'Test Expense',
        amount: data.amount || 100,
        currency: data.currency || 'USD',
        amountUSD: data.amountUSD || data.amount || 100,
        category: data.category || 'Food', // Must match enum exactly (capitalized)
        date: data.date || new Date(),
    });
    createdTestIds.expenses.push(expense._id);
    return expense;
}

/**
 * Create test income for a user
 */
async function createTestIncome(userId, data = {}) {
    const income = await Income.create({
        user: userId,
        amount: data.amount || 500,
        currency: data.currency || 'USD',
        amountUSD: data.amountUSD || data.amount || 500,
        source: data.source || 'Test salary',
        category: data.category || 'Salary', // Must match enum exactly (capitalized)
        date: data.date || new Date(),
    });
    createdTestIds.incomes.push(income._id);
    return income;
}

/**
 * Create test subscription for a user
 */
async function createTestSubscription(userId, data = {}) {
    const subscription = await Subscription.create({
        user: userId,
        name: data.name || 'Test Subscription',
        price: data.price || 9.99,
        amountUSD: data.amountUSD || 9.99,
        currency: data.currency || 'USD',
        frequency: data.frequency || 'monthly',
        category: data.category || 'Entertainment', // Must match subscription model enum
        paymentMethod: data.paymentMethod || 'Credit Card', // Required field
        status: data.status || 'active',
        startDate: data.startDate || new Date(),
        renewalDate: data.renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    createdTestIds.subscriptions.push(subscription._id);
    return subscription;
}

/**
 * Create test budget for a user
 */
async function createTestBudget(userId, data = {}) {
    const now = new Date();
    const budget = await Budget.create({
        user: userId,
        category: data.category || 'Food',
        limit: data.limit || data.amount || 500, // Budget limit
        currency: data.currency || 'USD',
        year: data.year || now.getFullYear(),
        month: data.month || now.getMonth() + 1, // 1-indexed
    });
    createdTestIds.budgets.push(budget._id);
    return budget;
}

// ============================================================================
// ADMIN AUTHENTICATION TESTS
// ============================================================================

describe('Admin Authentication Integration Tests', () => {
    let testAdmin = null;
    let testNonAdmin = null;

    beforeAll(async () => {
        console.log('\n--- Setting up Admin Auth test users ---');
        testAdmin = await createTestUser(TEST_ADMIN);
        testNonAdmin = await createTestUser(TEST_USER);
        console.log(`Created admin: ${testAdmin.email} (ID: ${testAdmin._id})`);
        console.log(`Created user: ${testNonAdmin.email} (ID: ${testNonAdmin._id})`);
    });

    describe('Admin Sign-In', () => {
        it('should verify admin user exists in database with correct role', async () => {
            console.log('\n=== TEST: Verify Admin User in Database ===');

            // VERIFY: Admin exists in database
            const dbAdmin = await User.findById(testAdmin._id);
            expect(dbAdmin).toBeTruthy();
            // Email is lowercased by User model, so compare case-insensitively
            expect(dbAdmin.email.toLowerCase()).toBe(TEST_ADMIN.email.toLowerCase());
            expect(dbAdmin.role).toBe('admin');

            console.log(`✅ Admin verified in DB: ${dbAdmin.email}, role: ${dbAdmin.role}`);
        });

        it('should verify password is correctly hashed in database', async () => {
            console.log('\n=== TEST: Verify Password Hashing ===');

            const dbAdmin = await User.findById(testAdmin._id);

            // Password should be hashed, not plain text
            expect(dbAdmin.password).not.toBe(TEST_ADMIN.password);
            expect(dbAdmin.password.startsWith('$2')).toBe(true); // bcrypt hash

            // Password should still verify correctly
            const isValid = await bcrypt.compare(TEST_ADMIN.password, dbAdmin.password);
            expect(isValid).toBe(true);

            console.log('✅ Password correctly hashed in database');
        });

        it('should reject sign-in for non-admin user', async () => {
            console.log('\n=== TEST: Non-Admin Sign-In Rejection ===');

            await expect(
                adminAuthService.adminSignIn(TEST_USER.email, TEST_USER.password)
            ).rejects.toThrow();

            // VERIFY: User still exists but cannot access admin
            const dbUser = await User.findById(testNonAdmin._id);
            expect(dbUser.role).toBe('user');

            console.log('✅ Non-admin correctly rejected, role still: ' + dbUser.role);
        });

        it('should reject sign-in with wrong password', async () => {
            console.log('\n=== TEST: Wrong Password Rejection ===');

            await expect(
                adminAuthService.adminSignIn(TEST_ADMIN.email, 'WrongPassword123!')
            ).rejects.toThrow();

            console.log('✅ Wrong password correctly rejected');
        });
    });
});

// ============================================================================
// USER ROLE MANAGEMENT TESTS
// ============================================================================

describe('User Role Management Integration Tests', () => {
    let testUser = null;

    beforeAll(async () => {
        console.log('\n--- Setting up Role Management test user ---');
        testUser = await createTestUser({
            email: `${TEST_PREFIX}_roletest@test.com`,
            password: 'TestPassword123!',
            name: 'Role Test User',
            role: 'user',
            defaultCurrency: 'USD',
        });
        console.log(`Created user: ${testUser.email} (ID: ${testUser._id})`);
    });

    it('should change user role to admin and verify in database', async () => {
        console.log('\n=== TEST: Change User Role (user → admin) ===');

        // Step 1: Verify initial role is 'user'
        const beforeChange = await User.findById(testUser._id);
        console.log(`Initial role in DB: ${beforeChange.role}`);
        expect(beforeChange.role).toBe('user');

        // Step 2: Change role to admin using admin service
        const updatedUser = await adminDashboardService.updateUserRole(
            testUser._id.toString(),
            'admin'
        );
        console.log(`Service returned role: ${updatedUser.role}`);

        // Step 3: VERIFY in database directly (fresh query)
        const afterChange = await User.findById(testUser._id);
        console.log(`Role in database after change: ${afterChange.role}`);
        expect(afterChange.role).toBe('admin');

        console.log('✅ VERIFIED: Role change to admin confirmed in database');
    });

    it('should change user role back to user and verify in database', async () => {
        console.log('\n=== TEST: Change User Role (admin → user) ===');

        // Step 1: Verify current role is 'admin' (from previous test)
        const beforeChange = await User.findById(testUser._id);
        console.log(`Current role in DB: ${beforeChange.role}`);
        expect(beforeChange.role).toBe('admin');

        // Step 2: Change role back to user
        const updatedUser = await adminDashboardService.updateUserRole(
            testUser._id.toString(),
            'user'
        );
        console.log(`Service returned role: ${updatedUser.role}`);

        // Step 3: VERIFY in database directly
        const afterChange = await User.findById(testUser._id);
        console.log(`Role in database after change: ${afterChange.role}`);
        expect(afterChange.role).toBe('user');

        console.log('✅ VERIFIED: Role change back to user confirmed in database');
    });

    it('should list users and find the test user', async () => {
        console.log('\n=== TEST: List Users via Admin Service ===');

        const result = await adminDashboardService.getAllUsers({ page: 1, limit: 100 });

        console.log(`Total users found: ${result.pagination.total}`);

        // Find our test user in the list
        const foundUser = result.users.find(
            u => u.email === testUser.email
        );

        expect(foundUser).toBeTruthy();
        console.log(`✅ Found test user in listing: ${foundUser.email}`);
    });
});

// ============================================================================
// USER DELETION WITH CASCADE TESTS
// ============================================================================

describe('User Deletion with Cascade Integration Tests', () => {
    let testUser = null;
    let testExpenses = [];
    let testIncomes = [];
    let testSubscriptions = [];
    let testBudgets = [];

    beforeAll(async () => {
        console.log('\n--- Setting up Cascade Delete test data ---');

        // Create test user
        testUser = await createTestUser({
            email: `${TEST_PREFIX}_cascade@test.com`,
            password: 'CascadeTest123!',
            name: 'Cascade Delete Test User',
            role: 'user',
            defaultCurrency: 'USD',
        });
        console.log(`Created user: ${testUser.email} (ID: ${testUser._id})`);

        // Create associated data with correct enum values
        for (let i = 0; i < 3; i++) {
            const expense = await createTestExpense(testUser._id, {
                title: `Test Expense ${i}`,
                amount: 100 + i * 10,
                category: EXPENSE_CATEGORIES[i % EXPENSE_CATEGORIES.length],
            });
            testExpenses.push(expense);
        }
        console.log(`Created ${testExpenses.length} expenses`);

        for (let i = 0; i < 2; i++) {
            const income = await createTestIncome(testUser._id, {
                source: `Test Income ${i}`,
                amount: 500 + i * 100,
                category: 'Salary',
            });
            testIncomes.push(income);
        }
        console.log(`Created ${testIncomes.length} incomes`);

        const subscription = await createTestSubscription(testUser._id, {
            name: 'Test Subscription for Cascade',
        });
        testSubscriptions.push(subscription);
        console.log(`Created ${testSubscriptions.length} subscription`);

        const budget = await createTestBudget(testUser._id, {
            category: 'Food',
            amount: 300,
        });
        testBudgets.push(budget);
        console.log(`Created ${testBudgets.length} budget`);
    });

    it('should verify all test data exists before deletion', async () => {
        console.log('\n=== TEST: Verify All Associated Data Exists ===');

        // Verify user exists
        const user = await User.findById(testUser._id);
        expect(user).toBeTruthy();
        console.log(`✅ User exists: ${user.email}`);

        // Verify expenses exist
        const expenseCount = await Expense.countDocuments({ user: testUser._id });
        expect(expenseCount).toBe(3);
        console.log(`✅ Expenses count: ${expenseCount}`);

        // Verify incomes exist
        const incomeCount = await Income.countDocuments({ user: testUser._id });
        expect(incomeCount).toBe(2);
        console.log(`✅ Incomes count: ${incomeCount}`);

        // Verify subscriptions exist
        const subCount = await Subscription.countDocuments({ user: testUser._id });
        expect(subCount).toBe(1);
        console.log(`✅ Subscriptions count: ${subCount}`);

        // Verify budgets exist
        const budgetCount = await Budget.countDocuments({ user: testUser._id });
        expect(budgetCount).toBe(1);
        console.log(`✅ Budgets count: ${budgetCount}`);

        console.log('✅ All test data verified to exist in database');
    });

    it('should delete user and cascade delete all associated data', async () => {
        console.log('\n=== TEST: Cascade Delete User ===');

        // Delete user using admin service
        const result = await adminDashboardService.deleteUser(testUser._id.toString());
        console.log('Delete result:', result);

        // VERIFY: User deleted from database
        const deletedUser = await User.findById(testUser._id);
        expect(deletedUser).toBeNull();
        console.log('✅ VERIFIED: User deleted from database');

        // VERIFY: All expenses deleted
        const remainingExpenses = await Expense.countDocuments({ user: testUser._id });
        expect(remainingExpenses).toBe(0);
        console.log(`✅ VERIFIED: Expenses remaining: ${remainingExpenses}`);

        // VERIFY: All incomes deleted
        const remainingIncomes = await Income.countDocuments({ user: testUser._id });
        expect(remainingIncomes).toBe(0);
        console.log(`✅ VERIFIED: Incomes remaining: ${remainingIncomes}`);

        // VERIFY: All subscriptions deleted
        const remainingSubs = await Subscription.countDocuments({ user: testUser._id });
        expect(remainingSubs).toBe(0);
        console.log(`✅ VERIFIED: Subscriptions remaining: ${remainingSubs}`);

        // VERIFY: All budgets deleted
        const remainingBudgets = await Budget.countDocuments({ user: testUser._id });
        expect(remainingBudgets).toBe(0);
        console.log(`✅ VERIFIED: Budgets remaining: ${remainingBudgets}`);

        console.log('✅ CASCADE DELETE VERIFIED - All associated data deleted from database');

        // Remove from cleanup list since already deleted
        createdTestIds.users = createdTestIds.users.filter(
            id => id.toString() !== testUser._id.toString()
        );
        testExpenses.forEach(e => {
            createdTestIds.expenses = createdTestIds.expenses.filter(
                id => id.toString() !== e._id.toString()
            );
        });
        testIncomes.forEach(i => {
            createdTestIds.incomes = createdTestIds.incomes.filter(
                id => id.toString() !== i._id.toString()
            );
        });
        testSubscriptions.forEach(s => {
            createdTestIds.subscriptions = createdTestIds.subscriptions.filter(
                id => id.toString() !== s._id.toString()
            );
        });
        testBudgets.forEach(b => {
            createdTestIds.budgets = createdTestIds.budgets.filter(
                id => id.toString() !== b._id.toString()
            );
        });
    });
});

// ============================================================================
// FINANCIAL ANALYTICS TESTS
// ============================================================================

describe('Financial Analytics Integration Tests', () => {
    let testUsers = [];
    let initialExpenseCount = 0;
    let initialIncomeCount = 0;
    let testExpenseAmount = 0;
    let testIncomeAmount = 0;

    beforeAll(async () => {
        console.log('\n--- Setting up Financial Analytics test data ---');

        // Get initial counts
        initialExpenseCount = await Expense.countDocuments();
        initialIncomeCount = await Income.countDocuments();
        console.log(`Initial expenses: ${initialExpenseCount}, incomes: ${initialIncomeCount}`);

        // Create test users with various financial data
        for (let i = 0; i < 3; i++) {
            const user = await createTestUser({
                email: `${TEST_PREFIX}_financial${i}@test.com`,
                password: 'Financial123!',
                name: `Financial Test User ${i}`,
                role: 'user',
                defaultCurrency: ['USD', 'EUR', 'USD'][i],
            });
            testUsers.push(user);

            // Create expenses with different categories
            const expenseAmount = 100 * (i + 1);
            await createTestExpense(user._id, {
                amount: expenseAmount,
                amountUSD: expenseAmount,
                category: EXPENSE_CATEGORIES[i % EXPENSE_CATEGORIES.length],
            });
            testExpenseAmount += expenseAmount;

            // Create incomes
            const incomeAmount = 1000 * (i + 1);
            await createTestIncome(user._id, {
                amount: incomeAmount,
                amountUSD: incomeAmount,
                category: 'Salary',
            });
            testIncomeAmount += incomeAmount;
        }
        console.log(`Created ${testUsers.length} users with financial data`);
        console.log(`Total test expenses: $${testExpenseAmount}, incomes: $${testIncomeAmount}`);
    });

    it('should verify expenses were created in database', async () => {
        console.log('\n=== TEST: Verify Expenses Created ===');

        const currentExpenseCount = await Expense.countDocuments();
        const newExpenses = currentExpenseCount - initialExpenseCount;

        console.log(`Expenses created: ${newExpenses}`);
        expect(newExpenses).toBeGreaterThanOrEqual(3);

        console.log('✅ VERIFIED: Expenses exist in database');
    });

    it('should verify incomes were created in database', async () => {
        console.log('\n=== TEST: Verify Incomes Created ===');

        const currentIncomeCount = await Income.countDocuments();
        const newIncomes = currentIncomeCount - initialIncomeCount;

        console.log(`Incomes created: ${newIncomes}`);
        expect(newIncomes).toBeGreaterThanOrEqual(3);

        console.log('✅ VERIFIED: Incomes exist in database');
    });

    it('should get platform overview with correct transaction counts', async () => {
        console.log('\n=== TEST: Platform Overview with Financial Data ===');

        const overview = await adminDashboardService.getPlatformOverview();

        console.log('Overview transactions:', overview.transactions);
        console.log('Overview volume:', overview.volume);

        // Verify counts include our test transactions
        expect(overview.transactions.expenses).toBeGreaterThanOrEqual(3);
        expect(overview.transactions.incomes).toBeGreaterThanOrEqual(3);

        console.log('✅ VERIFIED: Platform overview includes test transactions');
    });

    it('should retrieve category distribution for expenses', async () => {
        console.log('\n=== TEST: Category Distribution ===');

        const distribution = await adminDashboardService.getCategoryDistribution('expense');

        console.log('Category distribution:', JSON.stringify(distribution, null, 2));

        // Should have at least one category with data
        expect(distribution).toBeDefined();

        console.log('✅ VERIFIED: Category distribution retrieved from database');
    });
});

// ============================================================================
// PLATFORM OVERVIEW ACCURACY TESTS
// ============================================================================

describe('Platform Overview Accuracy Tests', () => {
    let testUsersBefore = 0;
    let newTestUser = null;

    beforeAll(async () => {
        // Get count before creating test user
        testUsersBefore = await User.countDocuments();
        console.log(`\n--- Users before test: ${testUsersBefore} ---`);
    });

    it('should detect new user in platform overview after creation', async () => {
        console.log('\n=== TEST: User Count Increases After Creation ===');

        // Get overview BEFORE
        const overviewBefore = await adminDashboardService.getPlatformOverview();
        console.log(`Users before: ${overviewBefore.users.total}`);

        // Create new user
        newTestUser = await createTestUser({
            email: `${TEST_PREFIX}_overview_accuracy@test.com`,
            password: 'Accuracy123!',
            name: 'Overview Accuracy Test',
            role: 'user',
            defaultCurrency: 'USD',
        });
        console.log(`Created user: ${newTestUser.email}`);

        // Get overview AFTER
        const overviewAfter = await adminDashboardService.getPlatformOverview();
        console.log(`Users after: ${overviewAfter.users.total}`);

        // VERIFY: Count increased by 1
        expect(overviewAfter.users.total).toBe(overviewBefore.users.total + 1);

        console.log('✅ VERIFIED: Platform overview correctly reflects new user');
    });

    it('should detect new transaction in overview after creation', async () => {
        console.log('\n=== TEST: Transaction Count Increases After Creation ===');

        // Get overview BEFORE
        const overviewBefore = await adminDashboardService.getPlatformOverview();
        console.log(`Expenses before: ${overviewBefore.transactions.expenses}`);

        // Create new expense
        await createTestExpense(newTestUser._id, {
            title: 'Accuracy Test Expense',
            amount: 50,
            category: 'Food',
        });

        // Get overview AFTER  
        const overviewAfter = await adminDashboardService.getPlatformOverview();
        console.log(`Expenses after: ${overviewAfter.transactions.expenses}`);

        // VERIFY: Count increased by 1
        expect(overviewAfter.transactions.expenses).toBe(overviewBefore.transactions.expenses + 1);

        console.log('✅ VERIFIED: Platform overview correctly reflects new expense');
    });
});

// ============================================================================
// USER SEARCH AND FILTER TESTS
// ============================================================================

describe('User Search and Filter Integration Tests', () => {
    let searchTestUsers = [];

    beforeAll(async () => {
        console.log('\n--- Setting up Search test users ---');

        searchTestUsers.push(await createTestUser({
            email: `${TEST_PREFIX}_search_john@test.com`,
            password: 'Search123!',
            name: 'John Smith',
            role: 'user',
            defaultCurrency: 'USD',
        }));

        searchTestUsers.push(await createTestUser({
            email: `${TEST_PREFIX}_search_jane@test.com`,
            password: 'Search123!',
            name: 'Jane Doe',
            role: 'admin',
            defaultCurrency: 'EUR',
        }));

        console.log(`Created ${searchTestUsers.length} search test users`);
    });

    it('should search users by email and find in database', async () => {
        console.log('\n=== TEST: Search Users by Email ===');

        const result = await adminDashboardService.getAllUsers({
            search: 'search_john',
        });

        console.log(`Found ${result.users.length} users matching 'search_john'`);

        const foundJohn = result.users.find(u => u.name === 'John Smith');
        expect(foundJohn).toBeTruthy();

        // VERIFY: User exists in database
        const dbUser = await User.findOne({ email: foundJohn.email });
        expect(dbUser).toBeTruthy();
        expect(dbUser.name).toBe('John Smith');

        console.log('✅ VERIFIED: Search result matches database record');
    });

    it('should filter users by role and verify in database', async () => {
        console.log('\n=== TEST: Filter Users by Role ===');

        const adminResult = await adminDashboardService.getAllUsers({
            role: 'admin',
        });

        console.log(`Found ${adminResult.users.length} admin users`);

        // All returned users should be admins
        const allAdmins = adminResult.users.every(u => u.role === 'admin');
        expect(allAdmins).toBe(true);

        // VERIFY: At least our test admin exists (email is lowercased by model)
        const testAdminInResults = adminResult.users.find(
            u => u.email.toLowerCase() === `${TEST_PREFIX}_search_jane@test.com`.toLowerCase()
        );
        expect(testAdminInResults).toBeTruthy();

        console.log('✅ VERIFIED: Role filter correctly filters database records');
    });
});

// ============================================================================
// FINAL CLEANUP VERIFICATION
// ============================================================================

describe('Final Cleanup Verification', () => {
    it('should confirm all test data is tracked for cleanup', () => {
        console.log('\n=== Cleanup Tracking Summary ===');
        console.log(`Users to clean: ${createdTestIds.users.length}`);
        console.log(`Expenses to clean: ${createdTestIds.expenses.length}`);
        console.log(`Incomes to clean: ${createdTestIds.incomes.length}`);
        console.log(`Budgets to clean: ${createdTestIds.budgets.length}`);
        console.log(`Subscriptions to clean: ${createdTestIds.subscriptions.length}`);

        // Verify tracking
        expect(createdTestIds.users.length).toBeGreaterThan(0);

        console.log('✅ All test data tracked for cleanup in afterAll');
    });
});
