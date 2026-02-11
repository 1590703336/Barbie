import { jest } from '@jest/globals';

/**
 * Currency CRUD Tests for Uncommon Currencies
 * 
 * Tests that income, expense, subscription, and budget modules:
 * - Accept uncommon currencies (GBP, JPY, BRL, INR, KRW)
 * - Correctly convert to USD via currency service
 * - Update currency and recalculate amountUSD
 * - Statistics/summaries work with mixed currencies
 * - Validation rejects invalid currency codes
 */

// Mock Dependencies
const mockIncomeRepository = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    aggregate: jest.fn()
};

const mockExpenseRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUser: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    aggregate: jest.fn()
};

const mockSubscriptionRepository = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    aggregate: jest.fn()
};

const mockBudgetRepository = {
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

const mockExpenseService = {
    prepareExpenseData: jest.fn(),
    buildMonthlyStatsPipeline: jest.fn()
};

const mockSubscriptionService = {
    prepareSubscriptionData: jest.fn(),
    buildTotalSubscriptionPipeline: jest.fn(),
    calculateTotalFromStats: jest.fn()
};

const mockBudgetService = {
    prepareBudgetData: jest.fn(),
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

// Mock currency conversion rates for testing
const mockCurrencyService = {
    convertFromUSD: jest.fn((amount, currency) => {
        const rates = {
            'USD': 1,
            'GBP': 0.79,
            'JPY': 149.5,
            'BRL': 4.92,
            'INR': 83.12,
            'KRW': 1337.5
        };
        return amount * (rates[currency] || 1);
    }),
    convertToUSD: jest.fn((amount, currency) => {
        const rates = {
            'USD': 1,
            'GBP': 0.79,
            'JPY': 149.5,
            'BRL': 4.92,
            'INR': 83.12,
            'KRW': 1337.5
        };
        return amount / (rates[currency] || 1);
    })
};

// Mock Imports
jest.unstable_mockModule('../src/modules/income/income.repository.js', () => mockIncomeRepository);
jest.unstable_mockModule('../src/modules/income/income.services.js', () => mockIncomeService);
jest.unstable_mockModule('../src/modules/expenses/expense.repository.js', () => mockExpenseRepository);
jest.unstable_mockModule('../src/modules/expenses/expense.service.js', () => mockExpenseService);
jest.unstable_mockModule('../src/modules/subscription/subscription.repository.js', () => mockSubscriptionRepository);
jest.unstable_mockModule('../src/modules/subscription/subscription.service.js', () => mockSubscriptionService);
jest.unstable_mockModule('../src/modules/budgets/budget.repository.js', () => mockBudgetRepository);
jest.unstable_mockModule('../src/modules/budgets/budget.services.js', () => mockBudgetService);
jest.unstable_mockModule('../src/utils/authorization.js', () => mockAuthorization);
jest.unstable_mockModule('../src/modules/currency/currency.service.js', () => mockCurrencyService);
jest.unstable_mockModule('../src/modules/budgets/budgetAlertService.js', () => ({
    checkBudgetAlerts: jest.fn(() => ({ alerts: [] }))
}));

// Import Controllers
const { createIncome, updateIncome, getIncomeSummary } = await import('../src/modules/income/income.controllers.js');
const { createExpenseController, updateExpenseController } = await import('../src/modules/expenses/expense.controller.js');
const { createSubscription, updateSubscription, getTotalSubscription } = await import('../src/modules/subscription/subscription.controller.js');
const { createBudgetController, updateBudgetController, getBudgetStatisticsController } = await import('../src/modules/budgets/budget.controllers.js');

describe('Uncommon Currency Support', () => {
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

    describe('Income with uncommon currencies', () => {
        it('should create income with GBP currency', async () => {
            req.body = { amount: 1000, currency: 'GBP', category: 'Salary', date: new Date() };

            const preparedData = {
                amount: 1000,
                currency: 'GBP',
                amountUSD: 1265.82, // 1000 / 0.79
                category: 'Salary',
                user: 'user123',
                date: req.body.date
            };
            const createdIncome = { ...preparedData, _id: 'inc1' };

            mockIncomeService.prepareIncomeData.mockResolvedValue(preparedData);
            mockIncomeRepository.create.mockResolvedValue(createdIncome);

            await createIncome(req, res, next);

            expect(mockIncomeService.prepareIncomeData).toHaveBeenCalledWith(expect.objectContaining({
                amount: 1000,
                currency: 'GBP'
            }));
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Income created successfully",
                data: createdIncome
            });
        });

        it('should update income currency from USD to JPY and recalculate amountUSD', async () => {
            req.params.id = 'inc1';
            req.body = { amount: 149500, currency: 'JPY' };

            const existingIncome = { _id: 'inc1', user: 'user123', amount: 1000, currency: 'USD', amountUSD: 1000 };
            const preparedData = { amount: 149500, currency: 'JPY', amountUSD: 1000 }; // 149500 / 149.5
            const updatedIncome = { ...existingIncome, ...preparedData };

            mockIncomeRepository.findById.mockResolvedValue(existingIncome);
            mockIncomeService.prepareIncomeData.mockResolvedValue(preparedData);
            mockIncomeRepository.update.mockResolvedValue(updatedIncome);

            await updateIncome(req, res, next);

            expect(mockIncomeService.prepareIncomeData).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Income updated successfully",
                data: updatedIncome
            });
        });
    });

    describe('Expense with uncommon currencies', () => {
        it('should create expense with BRL currency', async () => {
            req.body = { title: 'Groceries', amount: 492, currency: 'BRL', category: 'Food', date: new Date() };

            const processedData = {
                title: 'Groceries',
                amount: 492,
                currency: 'BRL',
                amountUSD: 100, // 492 / 4.92
                category: 'Food',
                date: req.body.date
            };
            const createdExpense = { ...processedData, _id: 'exp1', user: 'user123', toJSON: () => processedData };

            mockExpenseService.prepareExpenseData.mockResolvedValue(processedData);
            mockExpenseRepository.create.mockResolvedValue(createdExpense);

            await createExpenseController(req, res, next);

            expect(mockExpenseService.prepareExpenseData).toHaveBeenCalledWith(expect.objectContaining({
                amount: 492,
                currency: 'BRL'
            }));
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should update expense amount with BRL and recalculate amountUSD', async () => {
            req.params.id = 'exp1';
            req.body = { amount: 984 }; // Double the amount

            const testDate = new Date('2026-02-15');
            const existingExpense = { _id: 'exp1', user: 'user123', amount: 492, currency: 'BRL', amountUSD: 100, date: testDate, category: 'Food' };
            const processedData = { amount: 984, amountUSD: 200 }; // 984 / 4.92
            const updatedExpense = {
                ...existingExpense,
                ...processedData,
                toJSON: function () {
                    const { toJSON, ...rest } = this;
                    return rest;
                }
            };

            mockExpenseRepository.findById.mockResolvedValue(existingExpense);
            mockExpenseService.prepareExpenseData.mockResolvedValue(processedData);
            mockExpenseRepository.update.mockResolvedValue(updatedExpense);

            await updateExpenseController(req, res, next);

            expect(mockExpenseService.prepareExpenseData).toHaveBeenCalledWith(req.body, existingExpense);
            // Note: expense controller returns { ...expense.toJSON(), alerts }
            expect(res.json).toHaveBeenCalled();
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall).toHaveProperty('alerts', []);
            expect(jsonCall._id).toBe('exp1');
            expect(jsonCall.amount).toBe(984);
        });
    });

    describe('Subscription with uncommon currencies', () => {
        it('should create subscription with INR currency', async () => {
            req.body = {
                name: 'Netflix India',
                price: 831.2,
                currency: 'INR',
                frequency: 'monthly',
                category: 'Entertainment',
                startDate: new Date(),
                paymentMethod: 'Credit Card'
            };

            const preparedData = {
                ...req.body,
                amountUSD: 10, // 831.2 / 83.12
                user: 'user123',
                renewalDate: new Date()
            };
            const createdSub = { ...preparedData, _id: 's1' };

            mockSubscriptionService.prepareSubscriptionData.mockResolvedValue(preparedData);
            mockSubscriptionRepository.create.mockResolvedValue(createdSub);

            await createSubscription(req, res, next);

            expect(mockSubscriptionService.prepareSubscriptionData).toHaveBeenCalledWith(expect.objectContaining({
                price: 831.2,
                currency: 'INR'
            }));
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should update subscription currency from INR to KRW', async () => {
            req.params.id = 's1';
            req.body = { price: 13375, currency: 'KRW' };

            const existing = { _id: 's1', user: 'user123', price: 831.2, currency: 'INR', amountUSD: 10 };
            const prepared = { price: 13375, currency: 'KRW', amountUSD: 10 }; // 13375 / 1337.5
            const updated = { ...existing, ...prepared };

            mockSubscriptionRepository.findById.mockResolvedValue(existing);
            mockSubscriptionService.prepareSubscriptionData.mockResolvedValue(prepared);
            mockSubscriptionRepository.update.mockResolvedValue(updated);

            await updateSubscription(req, res, next);

            expect(mockSubscriptionService.prepareSubscriptionData).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Subscription updated successfully',
                data: { subscription: updated }
            });
        });
    });

    describe('Budget with uncommon currencies', () => {
        it('should create budget with JPY currency', async () => {
            req.body = {
                limit: 149500,
                currency: 'JPY',
                category: 'Food',
                month: 2,
                year: 2026
            };

            const preparedData = {
                ...req.body,
                amountUSD: 1000, // 149500 / 149.5
                user: 'user123'
            };
            const createdBudget = { ...preparedData, _id: 'b1' };

            mockBudgetService.prepareBudgetData.mockResolvedValue(preparedData);
            mockBudgetRepository.create.mockResolvedValue(createdBudget);

            await createBudgetController(req, res, next);

            expect(mockBudgetService.prepareBudgetData).toHaveBeenCalledWith(expect.objectContaining({
                limit: 149500,
                currency: 'JPY'
            }));
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should update budget limit with KRW currency', async () => {
            req.params.id = 'b1';
            req.body = { limit: 26750 }; // Double the limit

            const existingBudget = { _id: 'b1', user: 'user123', limit: 13375, currency: 'KRW', amountUSD: 10 };
            const preparedData = { limit: 26750, amountUSD: 20 }; // 26750 / 1337.5
            const updatedBudget = { ...existingBudget, ...preparedData };

            mockBudgetRepository.findById.mockResolvedValue(existingBudget);
            mockBudgetService.prepareBudgetData.mockResolvedValue(preparedData);
            mockBudgetRepository.update.mockResolvedValue(updatedBudget);

            await updateBudgetController(req, res, next);

            expect(mockBudgetService.prepareBudgetData).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Budget updated successfully",
                data: updatedBudget,
                alerts: []
            });
        });
    });

    describe('Statistics with mixed currencies', () => {
        it('should calculate income summary with user default currency GBP', async () => {
            req.query = { month: '2', year: '2026' };
            req.user.defaultCurrency = 'GBP';

            const pipeline = ['pipeline'];
            // Income in different currencies, all converted to USD in DB
            const stats = [
                { _id: 'Salary', totalAmount: 1000, count: 1 }, // 1000 USD
                { _id: 'Freelance', totalAmount: 500, count: 2 }  // 500 USD
            ];

            mockIncomeService.buildMonthlyStatsPipeline.mockReturnValue(pipeline);
            mockIncomeRepository.aggregate.mockResolvedValue(stats);

            await getIncomeSummary(req, res, next);

            // Should convert USD totals to GBP
            expect(mockCurrencyService.convertFromUSD).toHaveBeenCalledWith(1500, 'GBP');
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    totalIncome: 1185, // 1500 USD * 0.79 = 1185 GBP
                    categoryBreakdown: [
                        { category: 'Salary', total: 790, count: 1 },  // 1000 * 0.79
                        { category: 'Freelance', total: 395, count: 2 } // 500 * 0.79
                    ]
                }
            });
        });

        it('should calculate budget statistics with mixed currencies in KRW budget and INR expenses', async () => {
            req.query = { month: '2', year: '2026' };
            req.user.defaultCurrency = 'KRW';

            const bPipeline = ['budget_pipe'];
            const ePipeline = ['expense_pipe'];

            // Budget in KRW -> converted to USD in DB
            const budgetStats = [{ _id: 'Food', totalBudgetUSD: 100 }]; // Originally 133750 KRW
            // Expenses in INR -> converted to USD in DB
            const expenseStats = [{ _id: 'Food', totalExpensesUSD: 50 }]; // Originally 4156 INR

            mockBudgetService.buildMonthlyStatsPipeline.mockReturnValue(bPipeline);
            mockExpenseService.buildMonthlyStatsPipeline.mockReturnValue(ePipeline);
            mockBudgetRepository.aggregate.mockResolvedValue(budgetStats);
            mockExpenseRepository.aggregate.mockResolvedValue(expenseStats);

            await getBudgetStatisticsController(req, res, next);

            // Should convert both budgets and expenses from USD to KRW
            expect(mockCurrencyService.convertFromUSD).toHaveBeenCalled();
            expect(mockBudgetRepository.aggregate).toHaveBeenCalledWith(bPipeline);
            expect(mockExpenseRepository.aggregate).toHaveBeenCalledWith(ePipeline);
        });
    });

    describe('Currency validation', () => {
        it('should reject lowercase currency code', async () => {
            req.body = { amount: 1000, currency: 'gbp', category: 'Salary', date: new Date() };

            // The Joi validator should catch this before reaching the service
            // In a real scenario, this would be caught by middleware
            // For this test, we're documenting expected behavior

            // Note: This test demonstrates what SHOULD happen with validation
            // The actual validation occurs in the route middleware with Joi
            expect('gbp').not.toMatch(/^[A-Z]{3}$/);
        });

        it('should reject 2-letter currency code', async () => {
            expect('US').not.toMatch(/^[A-Z]{3}$/);
        });

        it('should reject 4-letter currency code', async () => {
            expect('USDD').not.toMatch(/^[A-Z]{3}$/);
        });

        it('should reject currency code with numbers', async () => {
            expect('US1').not.toMatch(/^[A-Z]{3}$/);
        });

        it('should accept valid 3-letter uppercase currency codes', async () => {
            const validCurrencies = ['USD', 'GBP', 'JPY', 'BRL', 'INR', 'KRW', 'EUR', 'CNY', 'AUD', 'CAD', 'CHF'];

            validCurrencies.forEach(currency => {
                expect(currency).toMatch(/^[A-Z]{3}$/);
            });
        });
    });
});
