import { jest } from '@jest/globals';

// Mock currency conversion
const mockConvertToUSD = jest.fn();

jest.unstable_mockModule('../../src/modules/currency/currency.service.js', () => ({
    convertToUSD: mockConvertToUSD
}));

// Import service (after mocks)
const {
    prepareBudgetData,
    buildMonthlyStatsPipeline
} = await import('../../src/modules/budgets/budget.services.js');

describe('Budget Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: 1:1 conversion for USD
        mockConvertToUSD.mockImplementation((amount, currency) => {
            if (currency === 'USD') return Promise.resolve(amount);
            if (currency === 'EUR') return Promise.resolve(amount * 1.1); // Mock rate
            if (currency === 'GBP') return Promise.resolve(amount * 1.25);
            return Promise.resolve(amount);
        });
    });

    describe('prepareBudgetData', () => {
        it('should calculate amountUSD for new budget with USD currency', async () => {
            const budgetData = { limit: 100, currency: 'USD', category: 'Food' };

            const result = await prepareBudgetData(budgetData);

            expect(mockConvertToUSD).toHaveBeenCalledWith(100, 'USD');
            expect(result.amountUSD).toBe(100);
            expect(result.limit).toBe(100);
            expect(result.currency).toBe('USD');
        });

        it('should calculate amountUSD for new budget with non-USD currency', async () => {
            const budgetData = { limit: 100, currency: 'EUR', category: 'Food' };

            const result = await prepareBudgetData(budgetData);

            expect(mockConvertToUSD).toHaveBeenCalledWith(100, 'EUR');
            expect(result.amountUSD).toBeCloseTo(110); // 100 * 1.1
        });

        it('should recalculate amountUSD when limit is updated', async () => {
            const budgetData = { limit: 200 };
            const existingBudget = { limit: 100, currency: 'USD', amountUSD: 100 };

            const result = await prepareBudgetData(budgetData, existingBudget);

            expect(mockConvertToUSD).toHaveBeenCalledWith(200, 'USD');
            expect(result.amountUSD).toBe(200);
        });

        it('should recalculate amountUSD when currency is updated', async () => {
            const budgetData = { currency: 'EUR' };
            const existingBudget = { limit: 100, currency: 'USD', amountUSD: 100 };

            const result = await prepareBudgetData(budgetData, existingBudget);

            expect(mockConvertToUSD).toHaveBeenCalledWith(100, 'EUR');
            expect(result.amountUSD).toBeCloseTo(110);
        });

        it('should handle amount changed to 0 correctly', async () => {
            const budgetData = { limit: 0 };
            const existingBudget = { limit: 500, currency: 'USD', amountUSD: 500 };

            const result = await prepareBudgetData(budgetData, existingBudget);

            expect(mockConvertToUSD).toHaveBeenCalledWith(0, 'USD');
            expect(result.amountUSD).toBe(0);
            expect(result.limit).toBe(0);
        });

        it('should not recalculate when neither limit nor currency changes', async () => {
            const budgetData = { category: 'NewCategory' };
            const existingBudget = { limit: 100, currency: 'USD', amountUSD: 100 };

            const result = await prepareBudgetData(budgetData, existingBudget);

            expect(mockConvertToUSD).not.toHaveBeenCalled();
            expect(result.amountUSD).toBeUndefined();
            expect(result.category).toBe('NewCategory');
        });

        it('should handle missing existingBudget gracefully', async () => {
            const budgetData = { limit: 50, currency: 'GBP' };

            const result = await prepareBudgetData(budgetData);

            expect(mockConvertToUSD).toHaveBeenCalledWith(50, 'GBP');
            expect(result.amountUSD).toBe(62.5); // 50 * 1.25
        });
    });

    describe('buildMonthlyStatsPipeline', () => {
        it('should build correct pipeline with userId, month, year', () => {
            const userId = '507f1f77bcf86cd799439011';
            const month = 5;
            const year = 2023;

            const pipeline = buildMonthlyStatsPipeline(userId, month, year);

            expect(pipeline).toHaveLength(2);

            // Verify $match stage
            const matchStage = pipeline[0].$match;
            expect(matchStage.month).toBe(5);
            expect(matchStage.year).toBe(2023);

            // Verify $group stage
            const groupStage = pipeline[1].$group;
            expect(groupStage._id).toBe('$category');
            expect(groupStage.totalBudgetUSD).toBeDefined();
        });

        it('should use ObjectId for user in $match stage', () => {
            const userId = '507f1f77bcf86cd799439011';
            const month = 12;
            const year = 2024;

            const pipeline = buildMonthlyStatsPipeline(userId, month, year);

            const matchStage = pipeline[0].$match;
            expect(matchStage.user).toBeDefined();
        });
    });
});
