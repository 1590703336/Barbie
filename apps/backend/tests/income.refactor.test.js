import { jest } from '@jest/globals';

// Mock Dependencies
const mockIncomeRepository = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    aggregate: jest.fn()
};

const mockIncomeService = {
    prepareIncomeData: jest.fn(),
    buildMonthlyStatsPipeline: jest.fn()
};

const mockAuthorization = {
    assertOwnerOrAdmin: jest.fn(),
    assertSameUserOrAdmin: jest.fn(),
    buildError: jest.fn((msg, code) => {
        const err = new Error(msg);
        err.statusCode = code;
        return err;
    })
};

const mockCurrencyService = {
    convertFromUSD: jest.fn((amount, currency) => {
        // Mock conversion rates for testing
        if (currency === 'USD') return amount;
        if (currency === 'CNY') return amount * 7.2; // 1 USD = 7.2 CNY
        if (currency === 'EUR') return amount * 0.92; // 1 USD = 0.92 EUR
        return amount;
    }),
    convertToUSD: jest.fn((amount) => amount)
};

// Mock Imports
jest.unstable_mockModule('../src/modules/income/income.repository.js', () => mockIncomeRepository);
jest.unstable_mockModule('../src/modules/income/income.services.js', () => mockIncomeService);
jest.unstable_mockModule('../src/utils/authorization.js', () => mockAuthorization);
jest.unstable_mockModule('../src/modules/currency/currency.service.js', () => mockCurrencyService);

// Import Controller
const {
    createIncome,
    getIncomes,
    getIncomeById,
    updateIncome,
    deleteIncome,
    getIncomeSummary
} = await import('../src/modules/income/income.controllers.js');

describe('Income Controller', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            user: { _id: 'user123', role: 'user', defaultCurrency: 'USD' },
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
        next = jest.fn();
    });

    describe('createIncome', () => {
        it('should create an income with currency', async () => {
            req.body = { amount: 1000, currency: 'EUR', category: 'Salary' };
            const preparedData = {
                amount: 1000,
                currency: 'EUR',
                amountUSD: 1100, // Mocked conversion
                category: 'Salary',
                user: 'user123',
                date: new Date()
            };
            const createdIncome = { ...preparedData, _id: 'inc1' };

            mockIncomeService.prepareIncomeData.mockResolvedValue(preparedData);
            mockIncomeRepository.create.mockResolvedValue(createdIncome);

            await createIncome(req, res, next);

            expect(mockIncomeService.prepareIncomeData).toHaveBeenCalledWith(expect.objectContaining({ amount: 1000, currency: 'EUR', user: 'user123' }));
            expect(mockIncomeRepository.create).toHaveBeenCalledWith(preparedData);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: "Income created successfully", data: createdIncome });
        });
    });

    describe('getIncomes', () => {
        it('should get incomes with filters', async () => {
            req.query = { month: '5', year: '2023' };
            const incomes = [{ amount: 1000, currency: 'USD' }];

            mockIncomeRepository.find.mockResolvedValue(incomes);

            await getIncomes(req, res, next);

            expect(mockAuthorization.assertSameUserOrAdmin).toHaveBeenCalled();
            expect(mockIncomeRepository.find).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ success: true, data: incomes });
        });
    });

    describe('getIncomeById', () => {
        it('should get income by ID', async () => {
            req.params.id = 'inc1';
            const income = { _id: 'inc1', user: 'user123' };

            mockIncomeRepository.findById.mockResolvedValue(income);

            await getIncomeById(req, res, next);

            expect(mockIncomeRepository.findById).toHaveBeenCalledWith('inc1');
            expect(mockAuthorization.assertOwnerOrAdmin).toHaveBeenCalledWith('user123', expect.any(Object), 'view this income');
            expect(res.json).toHaveBeenCalledWith({ success: true, data: income });
        });

        it('should handle not found', async () => {
            req.params.id = 'inc1';
            mockIncomeRepository.findById.mockResolvedValue(null);

            await getIncomeById(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Income not found', statusCode: 404 }));
        });
    });

    describe('updateIncome', () => {
        it('should update income amount and recalculate USD', async () => {
            req.params.id = 'inc1';
            req.body = { amount: 2000, currency: 'EUR' };

            const existingIncome = { _id: 'inc1', user: 'user123', amount: 1000, currency: 'USD' };
            const preparedData = { amount: 2000, currency: 'EUR', amountUSD: 2200 };
            const updatedIncome = { ...existingIncome, ...preparedData };

            mockIncomeRepository.findById.mockResolvedValue(existingIncome);
            mockIncomeService.prepareIncomeData.mockResolvedValue(preparedData);
            mockIncomeRepository.update.mockResolvedValue(updatedIncome);

            await updateIncome(req, res, next);

            expect(mockAuthorization.assertOwnerOrAdmin).toHaveBeenCalled();
            expect(mockIncomeService.prepareIncomeData).toHaveBeenCalled();
            expect(mockIncomeRepository.update).toHaveBeenCalledWith('inc1', preparedData);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: "Income updated successfully", data: updatedIncome });
        });

        it('should handle update failure (Income not found)', async () => {
            req.params.id = 'nonexistent';
            req.body = { amount: 2000 };

            mockIncomeRepository.findById.mockResolvedValue(null);

            await updateIncome(req, res, next);

            expect(mockIncomeRepository.findById).toHaveBeenCalledWith('nonexistent');
            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Income not found');
            expect(error.statusCode).toBe(404);
        });
    });

    describe('deleteIncome', () => {
        it('should delete income', async () => {
            req.params.id = 'inc1';
            const existingIncome = { _id: 'inc1', user: 'user123' };

            mockIncomeRepository.findById.mockResolvedValue(existingIncome);

            await deleteIncome(req, res, next);

            expect(mockAuthorization.assertOwnerOrAdmin).toHaveBeenCalled();
            expect(mockIncomeRepository.deleteById).toHaveBeenCalledWith('inc1');
            expect(res.status).toHaveBeenCalledWith(204);
        });

        it('should handle delete failure (Income not found)', async () => {
            req.params.id = 'nonexistent';

            mockIncomeRepository.findById.mockResolvedValue(null);

            await deleteIncome(req, res, next);

            expect(mockIncomeRepository.findById).toHaveBeenCalledWith('nonexistent');
            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Income not found');
            expect(error.statusCode).toBe(404);
        });
    });

    describe('getIncomeSummary', () => {
        it('should return income summary in USD when user default currency is USD', async () => {
            req.query = { month: '5', year: '2023' };
            req.user.defaultCurrency = 'USD';

            const pipeline = ['pipeline'];
            const stats = [
                { _id: 'Salary', totalAmount: 5500, count: 1 },
                { _id: 'Freelance', totalAmount: 1000, count: 1 }
            ];

            mockIncomeService.buildMonthlyStatsPipeline.mockReturnValue(pipeline);
            mockIncomeRepository.aggregate.mockResolvedValue(stats);

            await getIncomeSummary(req, res, next);

            expect(mockIncomeService.buildMonthlyStatsPipeline).toHaveBeenCalled();
            expect(mockIncomeRepository.aggregate).toHaveBeenCalledWith(pipeline);
            expect(mockCurrencyService.convertFromUSD).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    totalIncome: 6500, // USD -> USD = same
                    categoryBreakdown: [
                        { category: 'Salary', total: 5500, count: 1 },
                        { category: 'Freelance', total: 1000, count: 1 }
                    ]
                }
            });
        });

        it('should convert income summary to user currency (CNY)', async () => {
            req.query = { month: '5', year: '2023' };
            req.user.defaultCurrency = 'CNY';

            const pipeline = ['pipeline'];
            const stats = [
                { _id: 'Salary', totalAmount: 1000, count: 1 } // 1000 USD from aggregation
            ];

            mockIncomeService.buildMonthlyStatsPipeline.mockReturnValue(pipeline);
            mockIncomeRepository.aggregate.mockResolvedValue(stats);

            await getIncomeSummary(req, res, next);

            expect(mockCurrencyService.convertFromUSD).toHaveBeenCalledWith(1000, 'CNY');
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    totalIncome: 7200, // 1000 USD * 7.2 = 7200 CNY
                    categoryBreakdown: [
                        { category: 'Salary', total: 7200, count: 1 }
                    ]
                }
            });
        });

        it('should convert income summary to user currency (EUR)', async () => {
            req.query = { month: '5', year: '2023' };
            req.user.defaultCurrency = 'EUR';

            const pipeline = ['pipeline'];
            const stats = [
                { _id: 'Salary', totalAmount: 100, count: 1 }
            ];

            mockIncomeService.buildMonthlyStatsPipeline.mockReturnValue(pipeline);
            mockIncomeRepository.aggregate.mockResolvedValue(stats);

            await getIncomeSummary(req, res, next);

            expect(mockCurrencyService.convertFromUSD).toHaveBeenCalledWith(100, 'EUR');
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    totalIncome: 92, // 100 USD * 0.92 = 92 EUR
                    categoryBreakdown: [
                        { category: 'Salary', total: 92, count: 1 }
                    ]
                }
            });
        });

        it('should handle missing month/year parameters', async () => {
            req.query = {}; // No month or year

            await getIncomeSummary(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Month and year are required" });
        });

        it('should default to USD when user has no defaultCurrency', async () => {
            req.query = { month: '5', year: '2023' };
            req.user.defaultCurrency = undefined;

            const pipeline = ['pipeline'];
            const stats = [
                { _id: 'Salary', totalAmount: 1000, count: 1 }
            ];

            mockIncomeService.buildMonthlyStatsPipeline.mockReturnValue(pipeline);
            mockIncomeRepository.aggregate.mockResolvedValue(stats);

            await getIncomeSummary(req, res, next);

            expect(mockCurrencyService.convertFromUSD).toHaveBeenCalledWith(1000, 'USD');
        });
    });
});
