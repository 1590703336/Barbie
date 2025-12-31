import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.development.local' });

async function verifyBudgetAlerts(userId, expenseDetails) {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subscription-tracker');
        console.log('Connected to MongoDB');

        // --- 1. Verify Date Logic (Legacy Check from previous task) ---
        const { dateStr } = expenseDetails;
        const date = new Date(dateStr);

        console.log('\n--- VERIFYING DATE LOGIC ---');
        console.log('Expense Date (UTC):', date.toISOString());

        // UTC Check
        const utcMonth = date.getUTCMonth() + 1;
        const utcYear = date.getUTCFullYear();
        const startUTC = new Date(Date.UTC(utcYear, utcMonth - 1, 1));
        const endUTC = new Date(Date.UTC(utcYear, utcMonth, 0, 23, 59, 59, 999));

        console.log(`UTC Month: ${utcMonth}, UTC Year: ${utcYear}`);
        console.log('Range Match:', date >= startUTC && date <= endUTC);


        // --- 2. Verify Aggregation Services (New Check) ---
        console.log('\n--- VERIFYING AGGREGATION SERVICES ---');

        const { getMonthlyBudgetStats } = await import('../src/modules/budgets/budget.services.js');
        const { getMonthlyExpenseStats } = await import('../src/modules/expenses/expense.service.js');

        // Use the month/year from expense to verify statistics
        console.log(`Fetching stats for User ${userId}, Month ${utcMonth}, Year ${utcYear}...`);

        const budgetStats = await getMonthlyBudgetStats(userId, utcMonth, utcYear, { id: 'admin', role: 'admin' });
        console.log('Budget Stats:', JSON.stringify(budgetStats, null, 2));

        const expenseStats = await getMonthlyExpenseStats(userId, utcMonth, utcYear, { id: 'admin', role: 'admin' });
        console.log('Expense Stats:', JSON.stringify(expenseStats, null, 2));

        if (expenseStats.length > 0) {
            console.log('SUCCESS: Aggregation returned data.');
        } else {
            console.log('WARNING: No expense stats found. This might be correct if no data exists, or a bug if data is expected.');
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// User to provide these values:
const USER_ID_TO_TEST = '6954625134956c5fa5e18c84';
// EDGE CASE: 1st of month, early morning UTC
const EXPENSE_TO_TEST = {
    category: 'Transport',
    dateStr: '2025-12-01T05:00:00.000Z',
    amount: 20,
    amountUSD: 23.5
};

verifyBudgetAlerts(USER_ID_TO_TEST, EXPENSE_TO_TEST);
