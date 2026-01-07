import { jest } from '@jest/globals';

// Mock currency conversion
const mockConvertToUSD = jest.fn();

jest.unstable_mockModule('../../src/modules/currency/currency.service.js', () => ({
    convertToUSD: mockConvertToUSD
}));

// Import service (after mocks)
const {
    prepareIncomeData,
    buildMonthlyStatsPipeline
} = await import('../../src/modules/income/income.services.js');

describe('Income Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConvertToUSD.mockImplementation((amount, currency) => {
            if (currency === 'USD') return Promise.resolve(amount);
            if (currency === 'EUR') return Promise.resolve(amount * 1.1);
            if (currency === 'GBP') return Promise.resolve(amount * 1.25);
            return Promise.resolve(amount);
        });
    });

    describe('prepareIncomeData', () => {
        it('should parse date string to Date object', async () => {
            const incomeData = { amount: 1000, currency: 'USD', date: '2023-05-15' };

            const result = await prepareIncomeData(incomeData);

            expect(result.date).toBeInstanceOf(Date);
            expect(result.date.toISOString()).toContain('2023-05-15');
        });

        it('should calculate amountUSD for new income', async () => {
            const incomeData = { amount: 1000, currency: 'USD', category: 'Salary' };

            const result = await prepareIncomeData(incomeData);

            expect(mockConvertToUSD).toHaveBeenCalledWith(1000, 'USD');
            expect(result.amountUSD).toBe(1000);
        });

        it('should calculate amountUSD for non-USD income', async () => {
            const incomeData = { amount: 1000, currency: 'EUR', category: 'Freelance' };

            const result = await prepareIncomeData(incomeData);

            expect(mockConvertToUSD).toHaveBeenCalledWith(1000, 'EUR');
            expect(result.amountUSD).toBeCloseTo(1100);
        });

        it('should recalculate amountUSD when amount changes', async () => {
            const incomeData = { amount: 2000 };
            const existingIncome = { amount: 1000, currency: 'EUR', amountUSD: 1100 };

            const result = await prepareIncomeData(incomeData, existingIncome);

            expect(mockConvertToUSD).toHaveBeenCalledWith(2000, 'EUR');
            expect(result.amountUSD).toBeCloseTo(2200);
        });

        it('should handle amount changed to 0 correctly', async () => {
            const incomeData = { amount: 0 };
            const existingIncome = { amount: 5000, currency: 'USD', amountUSD: 5000 };

            const result = await prepareIncomeData(incomeData, existingIncome);

            expect(mockConvertToUSD).toHaveBeenCalledWith(0, 'USD');
            expect(result.amountUSD).toBe(0);
            expect(result.amount).toBe(0);
        });

        it('should default to USD when no currency specified', async () => {
            const incomeData = { amount: 500 };
            const existingIncome = {}; // No existing currency

            const result = await prepareIncomeData(incomeData, existingIncome);

            expect(mockConvertToUSD).toHaveBeenCalledWith(500, 'USD');
            expect(result.amountUSD).toBe(500);
        });

        it('should use existing amount when only currency is updated', async () => {
            const incomeData = { currency: 'GBP' };
            const existingIncome = { amount: 1000, currency: 'USD', amountUSD: 1000 };

            const result = await prepareIncomeData(incomeData, existingIncome);

            expect(mockConvertToUSD).toHaveBeenCalledWith(1000, 'GBP');
            expect(result.amountUSD).toBe(1250);
        });

        it('should not recalculate when neither amount nor currency changes', async () => {
            const incomeData = { category: 'Bonus' };
            const existingIncome = { amount: 1000, currency: 'USD', amountUSD: 1000 };

            const result = await prepareIncomeData(incomeData, existingIncome);

            expect(mockConvertToUSD).not.toHaveBeenCalled();
            expect(result.category).toBe('Bonus');
        });

        it('should handle date update with existing income', async () => {
            const incomeData = { date: '2024-01-01', amount: 2000 };
            const existingIncome = { amount: 1000, currency: 'EUR', date: new Date('2023-12-01') };

            const result = await prepareIncomeData(incomeData, existingIncome);

            expect(result.date).toBeInstanceOf(Date);
            expect(result.date.toISOString()).toContain('2024-01-01');
            expect(result.amountUSD).toBe(2200);
        });
    });

    describe('buildMonthlyStatsPipeline', () => {
        it('should build pipeline with correct UTC date boundaries', () => {
            const userId = '507f1f77bcf86cd799439011';
            const month = 5; // May
            const year = 2023;

            const pipeline = buildMonthlyStatsPipeline(userId, month, year);

            expect(pipeline).toHaveLength(2);

            const matchStage = pipeline[0].$match;
            const dateFilter = matchStage.date;

            // Start of May
            expect(dateFilter.$gte).toEqual(new Date(Date.UTC(2023, 4, 1)));
            // Start of June (exclusive)
            expect(dateFilter.$lt).toEqual(new Date(Date.UTC(2023, 5, 1)));
        });

        it('should use ObjectId for user in pipeline', () => {
            const pipeline = buildMonthlyStatsPipeline('507f1f77bcf86cd799439011', 6, 2023);

            const matchStage = pipeline[0].$match;
            expect(matchStage.user).toBeDefined();
        });

        it('should build correct $group stage for income summary', () => {
            const pipeline = buildMonthlyStatsPipeline('507f1f77bcf86cd799439011', 1, 2024);

            const groupStage = pipeline[1].$group;
            expect(groupStage._id).toBe('$category');
            expect(groupStage.totalAmount).toEqual({ $sum: '$amountUSD' });
            expect(groupStage.count).toEqual({ $sum: 1 });
        });

        it('should handle December to January boundary', () => {
            const pipeline = buildMonthlyStatsPipeline('507f1f77bcf86cd799439011', 12, 2023);

            const matchStage = pipeline[0].$match;
            const dateFilter = matchStage.date;

            expect(dateFilter.$gte).toEqual(new Date(Date.UTC(2023, 11, 1))); // Dec 1, 2023
            expect(dateFilter.$lt).toEqual(new Date(Date.UTC(2024, 0, 1))); // Jan 1, 2024
        });

        it('should handle leap year February correctly', () => {
            const pipeline = buildMonthlyStatsPipeline('507f1f77bcf86cd799439011', 2, 2024); // 2024 is a leap year

            const matchStage = pipeline[0].$match;
            const dateFilter = matchStage.date;

            expect(dateFilter.$gte).toEqual(new Date(Date.UTC(2024, 1, 1))); // Feb 1
            expect(dateFilter.$lt).toEqual(new Date(Date.UTC(2024, 2, 1))); // Mar 1
        });
    });
});
