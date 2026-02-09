import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock currency conversion
const mockConvertToUSD = jest.fn();
jest.unstable_mockModule('../../src/modules/currency/currency.service.js', () => ({
    convertToUSD: mockConvertToUSD
}));

// Import service functions after mocks
const {
    findLastNonEmptyMonth,
    validateImportBudgets,
    executeBudgetImport
} = await import('../../src/modules/budgets/budget.services.js');

describe('Budget Import Service', () => {
    const userId = new mongoose.Types.ObjectId();
    const targetMonth = 6;
    const targetYear = 2024;

    beforeEach(() => {
        jest.clearAllMocks();
        mockConvertToUSD.mockImplementation((amount, currency) => {
            if (currency === 'USD') return Promise.resolve(amount);
            if (currency === 'EUR') return Promise.resolve(amount * 1.1);
            return Promise.resolve(amount);
        });
    });

    describe('findLastNonEmptyMonth', () => {
        let mockRepository;

        beforeEach(() => {
            mockRepository = {
                find: jest.fn()
            };
        });

        it('should find the most recent month with budgets within last 12 months', async () => {
            // Function searches backwards from target month
            // Starting from June (target), it checks May, April, March, Feb, Jan, Dec...
            mockRepository.find
                .mockResolvedValueOnce([]) // May
                .mockResolvedValueOnce([]) // April
                .mockResolvedValueOnce([]) // March
                .mockResolvedValueOnce([]) // February
                .mockResolvedValueOnce([]) // January
                .mockResolvedValueOnce([ // December 2023 - found!
                    { category: 'Food', limit: 500 },
                    { category: 'Transport', limit: 200 }
                ]);

            const result = await findLastNonEmptyMonth(mockRepository, userId, targetMonth, targetYear);

            expect(result).toEqual({
                month: 12,
                year: 2023,
                budgets: expect.arrayContaining([
                    expect.objectContaining({ category: 'Food' }),
                    expect.objectContaining({ category: 'Transport' })
                ])
            });
        });

        it('should return null when no budgets exist in last 12 months', async () => {
            mockRepository.find.mockResolvedValue([]);

            const result = await findLastNonEmptyMonth(mockRepository, userId, targetMonth, targetYear);

            expect(result).toBeNull();
            expect(mockRepository.find).toHaveBeenCalledTimes(12);
        });

        it('should handle year boundaries correctly', async () => {
            mockRepository.find
                .mockResolvedValueOnce([{ category: 'Food', limit: 100 }]); // December 2023

            const result = await findLastNonEmptyMonth(mockRepository, userId, 1, 2024);

            expect(result).toEqual({
                month: 12,
                year: 2023,
                budgets: expect.any(Array)
            });
        });

        it('should search backwards month by month', async () => {
            mockRepository.find.mockResolvedValue([]);

            await findLastNonEmptyMonth(mockRepository, userId, 6, 2024);

            // Should search May, April, March, etc (backwards from June)
            const calls = mockRepository.find.mock.calls;
            expect(calls[0][0]).toMatchObject({ month: 5, year: 2024 });
            expect(calls[1][0]).toMatchObject({ month: 4, year: 2024 });
            expect(calls[2][0]).toMatchObject({ month: 3, year: 2024 });
        });
    });

    describe('validateImportBudgets', () => {
        it('should return null for valid budget data', () => {
            const budgets = [
                { category: 'Food', limit: 500, currency: 'USD' },
                { category: 'Transport', limit: 200, currency: 'USD' }
            ];

            const result = validateImportBudgets(budgets, 6, 2024);

            expect(result).toBeNull(); // null means no errors
        });

        it('should return errors for empty budget array', () => {
            const result = validateImportBudgets([], 6, 2024);

            expect(result).toContain('Budgets array must not be empty');
        });

        it('should return errors for invalid category', () => {
            const budgets = [
                { category: 'InvalidCategory', limit: 500, currency: 'USD' }
            ];

            const result = validateImportBudgets(budgets, 6, 2024);

            expect(result).toEqual(expect.arrayContaining([
                expect.stringContaining('Invalid category')
            ]));
        });

        it('should return errors for missing or negative limit', () => {
            const budgets = [
                { category: 'Food', limit: -100, currency: 'USD' },
                { category: 'Transport', currency: 'USD' }
            ];

            const result = validateImportBudgets(budgets, 6, 2024);

            expect(result.length).toBeGreaterThan(0);
            expect(result.some(e => e.includes('Invalid limit'))).toBe(true);
        });

        it('should return errors for missing currency', () => {
            const budgets = [
                { category: 'Food', limit: 500 }
            ];

            const result = validateImportBudgets(budgets, 6, 2024);

            expect(result).toEqual(expect.arrayContaining([
                expect.stringContaining('Missing currency')
            ]));
        });

        it('should return errors for invalid target month', () => {
            const budgets = [{ category: 'Food', limit: 500, currency: 'USD' }];

            const result1 = validateImportBudgets(budgets, 0, 2024);
            const result2 = validateImportBudgets(budgets, 13, 2024);

            expect(result1).toContain('Invalid target month');
            expect(result2).toContain('Invalid target month');
        });

        it('should return errors for invalid target year', () => {
            const budgets = [{ category: 'Food', limit: 500, currency: 'USD' }];

            const result = validateImportBudgets(budgets, 6, 1999);

            expect(result).toContain('Invalid target year');
        });
    });

    describe('executeBudgetImport', () => {
        let mockRepository;

        beforeEach(() => {
            mockRepository = {
                find: jest.fn(),
                create: jest.fn(),
                deleteById: jest.fn()
            };
        });

        it('should create new budgets with merge strategy (no conflicts)', async () => {
            mockRepository.find.mockResolvedValue([]); // No existing budgets
            mockRepository.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

            const budgets = [
                { category: 'Food', limit: 500, currency: 'USD' },
                { category: 'Transport', limit: 200, currency: 'USD' }
            ];

            const result = await executeBudgetImport(
                mockRepository,
                userId,
                budgets,
                targetMonth,
                targetYear,
                'merge'
            );

            expect(result).toHaveLength(2);
            expect(mockRepository.create).toHaveBeenCalledTimes(2);
            expect(mockRepository.deleteById).not.toHaveBeenCalled();
        });

        it('should skip existing categories with merge strategy', async () => {
            // Mock existing budgets
            mockRepository.find.mockResolvedValue([
                { category: 'Food', limit: 400, currency: 'USD' }
            ]);
            mockRepository.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

            const budgets = [
                { category: 'Food', limit: 500, currency: 'USD' }, // Should skip
                { category: 'Transport', limit: 200, currency: 'USD' } // Should create
            ];

            const result = await executeBudgetImport(
                mockRepository,
                userId,
                budgets,
                targetMonth,
                targetYear,
                'merge'
            );

            expect(result).toHaveLength(1); // Only Transport created
            expect(mockRepository.create).toHaveBeenCalledTimes(1);
            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ category: 'Transport' })
            );
        });

        it('should delete existing budgets and create new ones with replace strategy', async () => {
            const existingBudget1 = { _id: new mongoose.Types.ObjectId(), category: 'Food' };
            const existingBudget2 = { _id: new mongoose.Types.ObjectId(), category: 'Rent' };

            mockRepository.find.mockResolvedValue([existingBudget1, existingBudget2]);
            mockRepository.deleteById.mockResolvedValue({ deletedCount: 1 });
            mockRepository.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

            const budgets = [
                { category: 'Food', limit: 600, currency: 'USD' },
                { category: 'Transport', limit: 300, currency: 'USD' }
            ];

            const result = await executeBudgetImport(
                mockRepository,
                userId,
                budgets,
                targetMonth,
                targetYear,
                'replace'
            );

            expect(mockRepository.deleteById).toHaveBeenCalledTimes(2);
            expect(mockRepository.deleteById).toHaveBeenCalledWith(existingBudget1._id);
            expect(mockRepository.deleteById).toHaveBeenCalledWith(existingBudget2._id);
            expect(mockRepository.create).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(2);
        });

        it('should handle currency conversion correctly', async () => {
            mockRepository.find.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

            const budgets = [
                { category: 'Food', limit: 100, currency: 'EUR' }
            ];

            await executeBudgetImport(
                mockRepository,
                userId,
                budgets,
                targetMonth,
                targetYear,
                'merge'
            );

            expect(mockConvertToUSD).toHaveBeenCalledWith(100, 'EUR');

            // Check that amountUSD is close to 110 (accounting for floating point precision)
            const createCall = mockRepository.create.mock.calls[0][0];
            expect(createCall.currency).toBe('EUR');
            expect(createCall.limit).toBe(100);
            expect(createCall.amountUSD).toBeCloseTo(110, 5); // 100 * 1.1
        });

        it('should preserve thresholds if provided', async () => {
            mockRepository.find.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

            const budgets = [
                { category: 'Food', limit: 500, currency: 'USD', thresholds: [50, 75, 90] }
            ];

            await executeBudgetImport(
                mockRepository,
                userId,
                budgets,
                targetMonth,
                targetYear,
                'merge'
            );

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    thresholds: [50, 75, 90]
                })
            );
        });

        it('should use default thresholds if not provided', async () => {
            mockRepository.find.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

            const budgets = [
                { category: 'Food', limit: 500, currency: 'USD' } // No thresholds
            ];

            await executeBudgetImport(
                mockRepository,
                userId,
                budgets,
                targetMonth,
                targetYear,
                'merge'
            );

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    thresholds: [80, 100]
                })
            );
        });

        it('should set correct month, year, and user for created budgets', async () => {
            mockRepository.find.mockResolvedValue([]);
            mockRepository.create.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

            const budgets = [
                { category: 'Food', limit: 500, currency: 'USD' }
            ];

            await executeBudgetImport(
                mockRepository,
                userId,
                budgets,
                targetMonth,
                targetYear,
                'merge'
            );

            expect(mockRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: userId,
                    month: targetMonth,
                    year: targetYear
                })
            );
        });
    });
});
