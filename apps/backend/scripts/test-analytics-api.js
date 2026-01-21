/**
 * Analytics API Test Script
 * 
 * Creates comprehensive test data and verifies analytics API responses.
 * Run with: node scripts/test-analytics-api.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.development.local') });

// Import models
import User from '../src/modules/user/user.model.js';
import Expense from '../src/modules/expenses/expense.model.js';
import Income from '../src/modules/income/income.model.js';
import Budget from '../src/modules/budgets/budget.model.js';

// Test user credentials
const TEST_USER = {
    name: 'Analytics Test User',
    email: 'analytics-test@example.com',
    password: 'TestPassword123!'
};

// Test data configuration - diverse dates and amounts
const TEST_EXPENSES = [
    // 2025 Q4
    { title: 'October Rent', amount: 1500, category: 'Rent', date: '2025-10-01', currency: 'USD' },
    { title: 'October Groceries', amount: 450, category: 'Food', date: '2025-10-15', currency: 'USD' },
    { title: 'October Gas', amount: 80, category: 'Transport', date: '2025-10-20', currency: 'USD' },
    { title: 'November Rent', amount: 1500, category: 'Rent', date: '2025-11-01', currency: 'USD' },
    { title: 'November Dining', amount: 320, category: 'Food', date: '2025-11-10', currency: 'USD' },
    { title: 'November Utility', amount: 150, category: 'Utilities', date: '2025-11-15', currency: 'USD' },
    { title: 'November Entertainment', amount: 200, category: 'Entertainment', date: '2025-11-22', currency: 'USD' },
    { title: 'December Rent', amount: 1500, category: 'Rent', date: '2025-12-01', currency: 'USD' },
    { title: 'December Groceries', amount: 380, category: 'Food', date: '2025-12-10', currency: 'USD' },
    { title: 'December Gift', amount: 500, category: 'Others', date: '2025-12-20', currency: 'USD' },
    { title: 'December Party', amount: 250, category: 'Entertainment', date: '2025-12-25', currency: 'USD' },

    // 2026 Q1
    { title: 'January Rent', amount: 1550, category: 'Rent', date: '2026-01-01', currency: 'USD' },
    { title: 'January Groceries', amount: 420, category: 'Food', date: '2026-01-10', currency: 'USD' },
    { title: 'January Gym', amount: 50, category: 'Health', date: '2026-01-05', currency: 'USD' },
    { title: 'January Transport', amount: 120, category: 'Transport', date: '2026-01-15', currency: 'USD' },
];

const TEST_INCOME = [
    // 2025 Q4
    { title: 'October Salary', amount: 5000, category: 'Salary', date: '2025-10-01', currency: 'USD' },
    { title: 'October Freelance', amount: 800, category: 'Freelance', date: '2025-10-20', currency: 'USD' },
    { title: 'November Salary', amount: 5000, category: 'Salary', date: '2025-11-01', currency: 'USD' },
    { title: 'November Bonus', amount: 1500, category: 'Investment', date: '2025-11-15', currency: 'USD' },
    { title: 'December Salary', amount: 5000, category: 'Salary', date: '2025-12-01', currency: 'USD' },
    { title: 'December Year-end Bonus', amount: 3000, category: 'Gift', date: '2025-12-20', currency: 'USD' },

    // 2026 Q1
    { title: 'January Salary', amount: 5200, category: 'Salary', date: '2026-01-01', currency: 'USD' },
    { title: 'January Side Project', amount: 600, category: 'Freelance', date: '2026-01-10', currency: 'USD' },
];

const TEST_BUDGETS = [
    // January 2026 budgets
    { category: 'Food', limit: 600, month: 1, year: 2026 },
    { category: 'Transport', limit: 200, month: 1, year: 2026 },
    { category: 'Entertainment', limit: 300, month: 1, year: 2026 },
    { category: 'Utilities', limit: 200, month: 1, year: 2026 },
    { category: 'Rent', limit: 1600, month: 1, year: 2026 },
    { category: 'Health', limit: 100, month: 1, year: 2026 },

    // December 2025 budgets
    { category: 'Food', limit: 500, month: 12, year: 2025 },
    { category: 'Entertainment', limit: 400, month: 12, year: 2025 },
    { category: 'Others', limit: 600, month: 12, year: 2025 },
    { category: 'Rent', limit: 1500, month: 12, year: 2025 },
];

// Expected calculations (pre-calculated for verification)
const EXPECTED_RESULTS = {
    // Monthly trend for last 6 months (Aug 2025 - Jan 2026)
    monthlyTrend: {
        '2025-10': { income: 5800, expense: 2030, savings: 3770 },
        '2025-11': { income: 6500, expense: 2170, savings: 4330 },
        '2025-12': { income: 8000, expense: 2630, savings: 5370 },
        '2026-01': { income: 5800, expense: 2140, savings: 3660 },
    },

    // Category breakdown for January 2026
    categoryBreakdownJan2026: {
        'Rent': 1550,
        'Food': 420,
        'Transport': 120,
        'Health': 50,
    },

    // Budget usage for January 2026
    budgetUsageJan2026: {
        'Food': { budget: 600, spent: 420, usage: 70 },
        'Transport': { budget: 200, spent: 120, usage: 60 },
        'Rent': { budget: 1600, spent: 1550, usage: 96.875 },
        'Health': { budget: 100, spent: 50, usage: 50 },
        'Entertainment': { budget: 300, spent: 0, usage: 0 },
        'Utilities': { budget: 200, spent: 0, usage: 0 },
    },
};

async function connectDB() {
    const mongoUri = process.env.DB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
        throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
}

async function createTestUser() {
    // Check if test user exists
    let user = await User.findOne({ email: TEST_USER.email });
    if (user) {
        console.log('📌 Test user already exists:', user._id);
        return user;
    }

    // Create new test user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(TEST_USER.password, 10);

    user = await User.create({
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: hashedPassword,
        defaultCurrency: 'USD'
    });

    console.log('✅ Created test user:', user._id);
    return user;
}

async function clearTestData(userId) {
    await Expense.deleteMany({ user: userId });
    await Income.deleteMany({ user: userId });
    await Budget.deleteMany({ user: userId });
    console.log('🧹 Cleared existing test data');
}

async function createTestExpenses(userId) {
    const expenses = TEST_EXPENSES.map(exp => ({
        ...exp,
        user: userId,
        date: new Date(exp.date + 'T12:00:00.000Z'),
        amountUSD: exp.amount // Assuming USD for simplicity
    }));

    await Expense.insertMany(expenses);
    console.log(`✅ Created ${expenses.length} test expenses`);
}

async function createTestIncome(userId) {
    const income = TEST_INCOME.map(inc => ({
        ...inc,
        user: userId,
        date: new Date(inc.date + 'T12:00:00.000Z'),
        amountUSD: inc.amount
    }));

    await Income.insertMany(income);
    console.log(`✅ Created ${income.length} test income records`);
}

async function createTestBudgets(userId) {
    const budgets = TEST_BUDGETS.map(bud => ({
        ...bud,
        user: userId,
        amountUSD: bud.limit
    }));

    await Budget.insertMany(budgets);
    console.log(`✅ Created ${budgets.length} test budgets`);
}

async function verifyTrendAPI(userId) {
    console.log('\n📊 Verifying Trend API...');

    // Import analytics service
    const analyticsService = await import('../src/modules/analytics/analytics.services.js');
    const expenseRepo = await import('../src/modules/expenses/expense.repository.js');
    const incomeRepo = await import('../src/modules/income/income.repository.js');

    // Test monthly granularity, 6 months
    const { startDate, endDate } = analyticsService.buildDateRange('monthly', 6);

    const expensePipeline = analyticsService.buildTrendExpensePipeline(userId, startDate, endDate, 'monthly');
    const incomePipeline = analyticsService.buildTrendIncomePipeline(userId, startDate, endDate, 'monthly');

    const [expenseStats, incomeStats] = await Promise.all([
        expenseRepo.aggregate(expensePipeline),
        incomeRepo.aggregate(incomePipeline)
    ]);

    const series = analyticsService.mergeTrendData(expenseStats, incomeStats);

    console.log('Monthly Trend Results:');
    series.forEach(item => {
        const expected = EXPECTED_RESULTS.monthlyTrend[item.date];
        const status = expected ?
            (Math.abs(item.expense - expected.expense) < 0.01 ? '✅' : '❌') : '⚠️ (no expected)';
        console.log(`  ${item.date}: Income=${item.income}, Expense=${item.expense}, Savings=${item.savings} ${status}`);
    });

    // Test weekly granularity
    const weeklyRange = analyticsService.buildDateRange('weekly', 12);
    const weeklyExpensePipeline = analyticsService.buildTrendExpensePipeline(
        userId, weeklyRange.startDate, weeklyRange.endDate, 'weekly'
    );
    const weeklyStats = await expenseRepo.aggregate(weeklyExpensePipeline);

    console.log('\nWeekly Trend Results:');
    weeklyStats.forEach(item => {
        console.log(`  ${item._id}: Expense=${item.totalExpenseUSD}`);
    });
}

async function verifyCategoryBreakdownAPI(userId) {
    console.log('\n📊 Verifying Category Breakdown API...');

    const analyticsService = await import('../src/modules/analytics/analytics.services.js');
    const expenseRepo = await import('../src/modules/expenses/expense.repository.js');

    // Test January 2026
    const { startDate, endDate } = analyticsService.buildMonthDateRange(1, 2026);
    const pipeline = analyticsService.buildCategoryBreakdownPipeline(userId, startDate, endDate);
    const stats = await expenseRepo.aggregate(pipeline);

    console.log('Category Breakdown (Jan 2026):');
    stats.forEach(item => {
        const expected = EXPECTED_RESULTS.categoryBreakdownJan2026[item._id];
        const status = expected ?
            (Math.abs(item.totalUSD - expected) < 0.01 ? '✅' : '❌') : '⚠️';
        console.log(`  ${item._id}: $${item.totalUSD} ${status}`);
    });
}

async function verifyBudgetUsageAPI(userId) {
    console.log('\n📊 Verifying Budget Usage API...');

    const analyticsService = await import('../src/modules/analytics/analytics.services.js');
    const expenseRepo = await import('../src/modules/expenses/expense.repository.js');
    const budgetRepo = await import('../src/modules/budgets/budget.repository.js');

    // Get budgets for January 2026
    const budgets = await budgetRepo.find({ user: userId, month: 1, year: 2026 });

    // Get expenses for January 2026
    const { startDate, endDate } = analyticsService.buildMonthDateRange(1, 2026);
    const expensePipeline = analyticsService.buildCategoryBreakdownPipeline(userId, startDate, endDate);
    const expenseStats = await expenseRepo.aggregate(expensePipeline);

    const expenseMap = new Map(expenseStats.map(e => [e._id, e.totalUSD]));

    console.log('Budget Usage (Jan 2026):');
    budgets.forEach(budget => {
        const spent = expenseMap.get(budget.category) || 0;
        const usage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
        const expected = EXPECTED_RESULTS.budgetUsageJan2026[budget.category];
        const status = expected ?
            (Math.abs(usage - expected.usage) < 0.1 ? '✅' : '❌') : '⚠️';
        console.log(`  ${budget.category}: Budget=$${budget.limit}, Spent=$${spent}, Usage=${usage.toFixed(1)}% ${status}`);
    });
}

async function main() {
    try {
        await connectDB();

        const user = await createTestUser();
        await clearTestData(user._id);

        // Create test data
        await createTestExpenses(user._id);
        await createTestIncome(user._id);
        await createTestBudgets(user._id);

        // Verify APIs
        await verifyTrendAPI(user._id);
        await verifyCategoryBreakdownAPI(user._id);
        await verifyBudgetUsageAPI(user._id);

        console.log('\n✅ Test data created and APIs verified!');
        console.log(`📧 Test user email: ${TEST_USER.email}`);
        console.log(`🔑 Test user password: ${TEST_USER.password}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

main();
