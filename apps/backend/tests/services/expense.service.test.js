import { jest } from '@jest/globals';

// Mock currency conversion
const mockConvertToUSD = jest.fn();

jest.unstable_mockModule('../../src/modules/currency/currency.service.js', () => ({
    convertToUSD: mockConvertToUSD
}));

// Import service (after mocks)
const {
    prepareExpenseData,
    calculateTotalExpenses,
    buildMonthlyStatsPipeline
} = await import('../../src/modules/expenses/expense.service.js');

describe('Expense Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConvertToUSD.mockImplementation((amount, currency) => {
            if (currency === 'USD') return Promise.resolve(amount);
            if (currency === 'EUR') return Promise.resolve(amount * 1.1);
            if (currency === 'JPY') return Promise.resolve(amount * 0.0067); // ~150 JPY = 1 USD
            return Promise.resolve(amount);
        });
    });

    describe('prepareExpenseData', () => {
        it('should calculate amountUSD for new expense', async () => {
            const data = { amount: 100, currency: 'USD', category: 'Food' };

            const result = await prepareExpenseData(data);

            expect(mockConvertToUSD).toHaveBeenCalledWith(100, 'USD');
            expect(result.amountUSD).toBe(100);
        });

        it('should calculate amountUSD for non-USD expense', async () => {
            const data = { amount: 100, currency: 'EUR', category: 'Food' };

            const result = await prepareExpenseData(data);

            expect(mockConvertToUSD).toHaveBeenCalledWith(100, 'EUR');
            expect(result.amountUSD).toBeCloseTo(110);
        });

        it('should use existing currency when only amount is updated', async () => {
            const data = { amount: 200 };
            const currentData = { amount: 100, currency: 'EUR', amountUSD: 110 };

            const result = await prepareExpenseData(data, currentData);

            expect(mockConvertToUSD).toHaveBeenCalledWith(200, 'EUR');
            expect(result.amountUSD).toBeCloseTo(220);
        });

        it('should use existing amount when only currency is updated', async () => {
            const data = { currency: 'EUR' };
            const currentData = { amount: 100, currency: 'USD', amountUSD: 100 };

            const result = await prepareExpenseData(data, currentData);

            expect(mockConvertToUSD).toHaveBeenCalledWith(100, 'EUR');
            expect(result.amountUSD).toBeCloseTo(110);
        });

        it('should handle amount changed to 0 correctly', async () => {
            const data = { amount: 0 };
            const currentData = { amount: 500, currency: 'USD', amountUSD: 500 };

            const result = await prepareExpenseData(data, currentData);

            expect(mockConvertToUSD).toHaveBeenCalledWith(0, 'USD');
            expect(result.amountUSD).toBe(0);
            expect(result.amount).toBe(0);
        });

        it('should not calculate amountUSD when amount is undefined and no existing data', async () => {
            const data = { category: 'Entertainment' };

            const result = await prepareExpenseData(data);

            expect(mockConvertToUSD).not.toHaveBeenCalled();
            expect(result.amountUSD).toBeUndefined();
        });

        it('should handle high-value currency correctly (JPY)', async () => {
            const data = { amount: 15000, currency: 'JPY', category: 'Shopping' };

            const result = await prepareExpenseData(data);

            expect(mockConvertToUSD).toHaveBeenCalledWith(15000, 'JPY');
            expect(result.amountUSD).toBeCloseTo(100.5, 1); // 15000 * 0.0067
        });

        it('should handle negative amounts (refunds)', async () => {
            const data = { amount: -50, currency: 'USD' };

            const result = await prepareExpenseData(data);

            expect(mockConvertToUSD).toHaveBeenCalledWith(-50, 'USD');
            expect(result.amountUSD).toBe(-50);
        });
    });

    describe('calculateTotalExpenses', () => {
        it('should sum amountUSD when available', () => {
            const expenses = [
                { amount: 100, amountUSD: 100 },
                { amount: 50, amountUSD: 55 },
                { amount: 200, amountUSD: 220 }
            ];

            const total = calculateTotalExpenses(expenses);

            expect(total).toBe(375); // 100 + 55 + 220
        });

        it('should fallback to amount when amountUSD is missing', () => {
            const expenses = [
                { amount: 100 }, // No amountUSD
                { amount: 50, amountUSD: 55 },
                { amount: 200 } // No amountUSD
            ];

            const total = calculateTotalExpenses(expenses);

            expect(total).toBe(355); // 100 + 55 + 200
        });

        it('should return 0 for empty array', () => {
            const expenses = [];

            const total = calculateTotalExpenses(expenses);

            expect(total).toBe(0);
        });

        it('should handle all expenses without amountUSD (legacy data)', () => {
            const expenses = [
                { amount: 100 },
                { amount: 200 },
                { amount: 300 }
            ];

            const total = calculateTotalExpenses(expenses);

            expect(total).toBe(600);
        });

        it('should handle expenses with zero amounts', () => {
            const expenses = [
                { amount: 100, amountUSD: 100 },
                { amount: 0, amountUSD: 0 },
                { amount: 50, amountUSD: 50 }
            ];

            const total = calculateTotalExpenses(expenses);

            expect(total).toBe(150);
        });
    });

    describe('buildMonthlyStatsPipeline', () => {
        it('should build pipeline with correct date range for month', () => {
            const userId = '507f1f77bcf86cd799439011';
            const month = 5; // May
            const year = 2023;

            const pipeline = buildMonthlyStatsPipeline(userId, month, year);

            expect(pipeline).toHaveLength(2);

            const matchStage = pipeline[0].$match;
            expect(matchStage.user).toBe(userId);

            // Verify date range
            const dateFilter = matchStage.date;
            expect(dateFilter.$gte).toEqual(new Date(Date.UTC(2023, 4, 1))); // May 1
            expect(dateFilter.$lte).toEqual(new Date(Date.UTC(2023, 5, 0, 23, 59, 59, 999))); // May 31
        });

        it('should build correct $group stage', () => {
            const pipeline = buildMonthlyStatsPipeline('507f1f77bcf86cd799439011', 1, 2024);

            const groupStage = pipeline[1].$group;
            expect(groupStage._id).toBe('$category');
            expect(groupStage.totalExpensesUSD).toBeDefined();
        });

        it('should handle December correctly (month boundary)', () => {
            const pipeline = buildMonthlyStatsPipeline('507f1f77bcf86cd799439011', 12, 2023);

            const matchStage = pipeline[0].$match;
            const dateFilter = matchStage.date;

            expect(dateFilter.$gte).toEqual(new Date(Date.UTC(2023, 11, 1))); // Dec 1
            expect(dateFilter.$lte).toEqual(new Date(Date.UTC(2024, 0, 0, 23, 59, 59, 999))); // Dec 31
        });

        it('should handle January correctly', () => {
            const pipeline = buildMonthlyStatsPipeline('507f1f77bcf86cd799439011', 1, 2024);

            const matchStage = pipeline[0].$match;
            const dateFilter = matchStage.date;

            expect(dateFilter.$gte).toEqual(new Date(Date.UTC(2024, 0, 1))); // Jan 1
            expect(dateFilter.$lte).toEqual(new Date(Date.UTC(2024, 1, 0, 23, 59, 59, 999))); // Jan 31
        });
    });
});
