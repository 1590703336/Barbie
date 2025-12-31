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

    it('should calculate usage based on amountUSD and trigger alerts', async () => {
        const userId = 'user123';
        const category = 'Food';
        const month = 5;
        const year = 2023;

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
            save: mockBudgetSave
        };
        mockBudget.alertsTriggered.set('80', false);

        mockBudgetFindOne.mockResolvedValue(mockBudget);

        // Mock Expenses: Total 85 USD spent
        const mockExpenses = [{ totalAmount: 85 }];
        mockExpenseAggregate.mockResolvedValue(mockExpenses);

        const result = await checkBudgetAlerts({
            userId,
            category,
            month,
            year
        });

        // Verify Budget was looked up correctly
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
        expect(result.alerts[0]).toEqual({
            category: 'Food',
            threshold: 80,
            usage: 85 // 85%
        });
    });

    it('should fallback to limit if amountUSD is missing in budget', async () => {
        const userId = 'user123';
        const category = 'Food';
        const month = 5;
        const year = 2023;

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
            save: mockBudgetSave
        };
        mockBudget.alertsTriggered.set('50', false);

        mockBudgetFindOne.mockResolvedValue(mockBudget);

        // Mock Expenses: 110 USD spent (assuming limit is treated as USD equivalent here for fallback)
        const mockExpenses = [{ totalAmount: 110 }];
        mockExpenseAggregate.mockResolvedValue(mockExpenses);

        const result = await checkBudgetAlerts({
            userId,
            category,
            month,
            year
        });

        // 110 / 200 = 55%
        expect(mockBudgetSave).toHaveBeenCalled();
        expect(result.alerts).toHaveLength(1);
        expect(result.alerts[0].usage).toBe(55);
    });

    it('should not trigger alert if below threshold', async () => {
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
            save: mockBudgetSave
        };
        mockBudget.alertsTriggered.set('80', false);

        mockBudgetFindOne.mockResolvedValue(mockBudget);

        // 50 USD spent
        const mockExpenses = [{ totalAmount: 50 }];
        mockExpenseAggregate.mockResolvedValue(mockExpenses);

        const result = await checkBudgetAlerts({
            userId,
            category,
            month,
            year
        });

        expect(mockBudgetSave).not.toHaveBeenCalled();
        expect(result.alerts).toHaveLength(0);
    });
});
