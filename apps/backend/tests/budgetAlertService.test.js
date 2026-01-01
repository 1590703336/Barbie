import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock the models
const mockBudgetFindOne = jest.fn();
const mockExpenseAggregate = jest.fn();
const mockBudgetSave = jest.fn();

// Mock Mongoose types
const mockObjectId = jest.fn((id) => id);
mongoose.Types.ObjectId = mockObjectId;

jest.unstable_mockModule('../src/modules/budgets/budget.model.js', () => ({
    default: {
        findOne: mockBudgetFindOne,
    }
}));

jest.unstable_mockModule('../src/modules/expenses/expense.model.js', () => ({
    default: {
        aggregate: mockExpenseAggregate,
    }
}));

// Import the service under test (must be after mocks)
const { checkBudgetAlerts } = await import('../src/modules/budgets/budgetAlertService.js');

describe('checkBudgetAlerts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test Logic:
    // 1. We start with a budget of 100 USD with an 80% threshold.
    // 2. We mock the Expenses module to say that 85 USD has been spent.
    // 3. The service should calculate 85/100 = 85%.
    // 4. Since 85% >= 80%, it should trigger an alert.
    // 5. It should also SAVE the budget document with the new 'alertsTriggered' state.
    it('should calculate usage based on amountUSD and trigger alerts', async () => {
        console.log('\n--- TEST: Calculate Usage & Trigger Alerts ---');

        const userId = 'user123';
        const category = 'Food';
        const month = 5;
        const year = 2023;
        console.log(`Input: User=${userId}, Category=${category}, Month=${month}, Year=${year}`);

        // Mock Budget: 100 USD budget, 80% threshold
        const mockBudget = {
            user: userId,
            category,
            month,
            year,
            limit: 100,
            amountUSD: 100, // Budget is 100 USD
            thresholds: [80],
            alertsTriggered: new Map(),
            save: mockBudgetSave,
            isModified: jest.fn(() => true)
        };
        mockBudget.alertsTriggered.set('80', false);
        console.log('Mock Setup (Budget): Limit=100 USD, Thresholds=[80]');

        mockBudgetFindOne.mockResolvedValue(mockBudget);

        // Mock Expenses: Total 85 USD spent
        const mockExpenses = [{ totalAmount: 85 }];
        console.log('Mock Setup (Expenses Aggregate): Total Spent=85 USD');

        mockExpenseAggregate.mockResolvedValue(mockExpenses);

        const result = await checkBudgetAlerts({
            userId,
            category,
            month,
            year
        });

        // Verify Budget was looked up correctly
        expect(mockBudgetFindOne).toHaveBeenCalledWith(expect.objectContaining({
            user: expect.anything(),
            category,
            month,
            year
        }));

        // Verify Aggregation used amountUSD
        const aggregateCall = mockExpenseAggregate.mock.calls[0][0];
        expect(aggregateCall[1].$group.totalAmount.$sum).toBe('$amountUSD');

        // Verify Alert Triggered (85 > 80)
        expect(mockBudgetSave).toHaveBeenCalled();
        expect(mockBudget.alertsTriggered.get('80')).toBe(true);
        expect(result.alerts).toHaveLength(1);

        console.log('Actual Output (Alerts):', JSON.stringify(result.alerts, null, 2));

        expect(result.alerts[0]).toEqual({
            category: 'Food',
            threshold: 80,
            usage: 85 // 85%
        });
        console.log('--- TEST PASSED ---\n');
    });

    // Test Logic:
    // 1. Legacy budgets might not have `amountUSD` field.
    // 2. We mock a budget with `limit`=200 but missing `amountUSD`.
    // 3. We mock Expenses = 110.
    // 4. Service should fallback to `limit`: 110 / 200 = 55%.
    // 5. Threshold is 50%, so 55% > 50% => Alert triggers.
    it('should fallback to limit if amountUSD is missing in budget', async () => {
        console.log('\n--- TEST: Fallback to Limit (Legacy Support) ---');

        const userId = 'user123';
        const category = 'Food';
        const month = 5;
        const year = 2023;
        console.log(`Input: User=${userId}, Category=${category}`);

        // Mock Budget: 200 unit limit (legacy), no amountUSD
        const mockBudget = {
            user: userId,
            category,
            month,
            year,
            limit: 200,
            // amountUSD missing
            thresholds: [50],
            alertsTriggered: new Map(),
            save: mockBudgetSave,
            isModified: jest.fn(() => true)
        };
        mockBudget.alertsTriggered.set('50', false);
        console.log('Mock Setup (Budget): Limit=200, amountUSD=undefined');

        mockBudgetFindOne.mockResolvedValue(mockBudget);

        // Mock Expenses: 110 USD spent (assuming limit is treated as USD equivalent here for fallback)
        const mockExpenses = [{ totalAmount: 110 }];
        console.log('Mock Setup (Expenses Aggregate): Total Spent=110');

        mockExpenseAggregate.mockResolvedValue(mockExpenses);

        const result = await checkBudgetAlerts({
            userId,
            category,
            month,
            year
        });

        // 110 / 200 = 55%
        console.log('Actual Output (Alerts):', JSON.stringify(result.alerts, null, 2));

        expect(mockBudgetSave).toHaveBeenCalled();
        expect(result.alerts).toHaveLength(1);
        expect(result.alerts[0].usage).toBe(55);
        console.log('--- TEST PASSED ---\n');
    });

    // Test Logic:
    // 1. Budget 100, Threshold 80%.
    // 2. Spent 50.
    // 3. Usage = 50%.
    // 4. 50% < 80%, so NO alert should be triggered and NO save should perform.
    it('should not trigger alert if below threshold', async () => {
        console.log('\n--- TEST: No Alert Below Threshold ---');

        const userId = 'user123';
        const category = 'Food';
        const month = 5;
        const year = 2023;

        const mockBudget = {
            user: userId,
            category,
            month,
            year,
            amountUSD: 100,
            thresholds: [80],
            alertsTriggered: new Map(),
            save: mockBudgetSave,
            isModified: jest.fn(() => false)
        };
        mockBudget.alertsTriggered.set('80', false);
        console.log('Mock Setup (Budget): Limit=100, Threshold=80%');

        mockBudgetFindOne.mockResolvedValue(mockBudget);

        // 50 USD spent
        const mockExpenses = [{ totalAmount: 50 }];
        console.log('Mock Setup (Expenses Aggregate): Total Spent=50');

        mockExpenseAggregate.mockResolvedValue(mockExpenses);

        const result = await checkBudgetAlerts({
            userId,
            category,
            month,
            year
        });

        console.log('Actual Output (Alerts):', JSON.stringify(result.alerts, null, 2));

        expect(mockBudgetSave).not.toHaveBeenCalled();
        expect(result.alerts).toHaveLength(0);
        console.log('--- TEST PASSED ---\n');
    });
});
