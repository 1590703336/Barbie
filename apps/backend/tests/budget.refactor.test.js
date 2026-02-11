import { jest } from '@jest/globals';

// Mock Dependencies
const mockBudgetRepository = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    aggregate: jest.fn()
};

const mockBudgetService = {
    prepareBudgetData: jest.fn(),
    buildMonthlyStatsPipeline: jest.fn()
};

const mockExpenseRepository = {
    aggregate: jest.fn()
};

const mockExpenseService = {
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

// Mock Imports
jest.unstable_mockModule('../src/modules/budgets/budget.repository.js', () => mockBudgetRepository);
jest.unstable_mockModule('../src/modules/budgets/budget.services.js', () => mockBudgetService);
jest.unstable_mockModule('../src/modules/expenses/expense.repository.js', () => mockExpenseRepository);
jest.unstable_mockModule('../src/modules/expenses/expense.service.js', () => mockExpenseService);
jest.unstable_mockModule('../src/utils/authorization.js', () => mockAuthorization);
jest.unstable_mockModule('../src/modules/currency/currency.service.js', () => ({
    convertFromUSD: jest.fn((amount) => amount), // Identity for testing
    convertToUSD: jest.fn((amount) => amount)
}));
jest.unstable_mockModule('../src/modules/budgets/budgetAlertService.js', () => ({
    checkBudgetAlerts: jest.fn(() => ({ alerts: [] }))
}));

// Import Controller
const {
    getBudgetsController,
    createBudgetController,
    updateBudgetController,
    deleteBudgetController,
    getBudgetStatisticsController,
    getBudgetCategoriesSummaryController
} = await import('../src/modules/budgets/budget.controllers.js');

describe('Budget Controller (Refactored)', () => {
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

    describe('getBudgetsController', () => {
        it('should get budgets by user and date', async () => {
            console.log('\n--- TEST: getBudgetsController ---');
            req.query = { month: '5', year: '2023' };
            console.log(`Input (req.query):`, JSON.stringify(req.query, null, 2));

            const budgets = [{ category: 'Food', limit: 100 }];
            mockBudgetRepository.find.mockResolvedValue(budgets);
            console.log(`Mock Setup (Repository find):`, JSON.stringify(budgets, null, 2));

            await getBudgetsController(req, res, next);

            console.log(`Expected Output (res.json):`, JSON.stringify({ success: true, data: budgets }, null, 2));
            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockAuthorization.assertSameUserOrAdmin).toHaveBeenCalled();
            expect(mockBudgetRepository.find).toHaveBeenCalledWith({ user: 'user123', month: 5, year: 2023 });
            expect(res.json).toHaveBeenCalledWith({ success: true, data: budgets });
            console.log('--- TEST PASSED ---');
        });
    });

    describe('createBudgetController', () => {
        it('should create a budget orchestration', async () => {
            console.log('\n--- TEST: createBudgetController ---');
            req.body = { limit: 100, category: 'Food', currency: 'USD' };
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const preparedData = { limit: 100, category: 'Food', currency: 'USD', amountUSD: 100, user: 'user123' };
            const createdBudget = { ...preparedData, _id: 'b1' };

            mockBudgetService.prepareBudgetData.mockResolvedValue(preparedData);
            console.log(`Mock Setup (Service prepareBudgetData):`, JSON.stringify(preparedData, null, 2));

            mockBudgetRepository.create.mockResolvedValue(createdBudget);
            console.log(`Mock Setup (Repository create):`, JSON.stringify(createdBudget, null, 2));

            await createBudgetController(req, res, next);

            console.log(`Expected Output (res.json):`, JSON.stringify({ success: true, message: "Budget created successfully", data: createdBudget }, null, 2));
            console.log(`Actual Output (res.status):`, res.status.mock.calls[0][0]);
            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockBudgetService.prepareBudgetData).toHaveBeenCalledWith(expect.objectContaining({ limit: 100, user: 'user123' }));
            expect(mockBudgetRepository.create).toHaveBeenCalledWith(preparedData);
            expect(res.status).toHaveBeenCalledWith(201);
            console.log('--- TEST PASSED ---');
        });

        it('should create a non-USD budget correctly', async () => {
            console.log('\n--- TEST: createBudgetController (Non-USD) ---');
            req.body = { limit: 100, category: 'Food', currency: 'EUR' };
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const preparedData = { limit: 100, category: 'Food', currency: 'EUR', amountUSD: 110, user: 'user123' }; // Assume 1.1 rate
            const createdBudget = { ...preparedData, _id: 'b2' };

            mockBudgetService.prepareBudgetData.mockResolvedValue(preparedData);
            console.log(`Mock Setup (Service prepareBudgetData):`, JSON.stringify(preparedData, null, 2));

            mockBudgetRepository.create.mockResolvedValue(createdBudget);
            console.log(`Mock Setup (Repository create):`, JSON.stringify(createdBudget, null, 2));

            await createBudgetController(req, res, next);

            console.log(`Expected Output (res.json):`, JSON.stringify({ success: true, message: "Budget created successfully", data: createdBudget }, null, 2));
            console.log(`Actual Output (res.status):`, res.status.mock.calls[0][0]);
            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockBudgetService.prepareBudgetData).toHaveBeenCalledWith(expect.objectContaining({ limit: 100, currency: 'EUR', user: 'user123' }));
            expect(mockBudgetRepository.create).toHaveBeenCalledWith(preparedData);
            expect(res.status).toHaveBeenCalledWith(201);
            console.log('--- TEST PASSED ---');
        });
    });

    describe('updateBudgetController', () => {
        it('should update a budget', async () => {
            console.log('\n--- TEST: updateBudgetController ---');
            req.params.id = 'b1';
            req.body = { limit: 200 };
            console.log(`Input (req.params):`, JSON.stringify(req.params, null, 2));
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const existingBudget = { _id: 'b1', user: 'user123', limit: 100 };
            const preparedData = { limit: 200, amountUSD: 200 };
            const updatedBudget = { ...existingBudget, ...preparedData };

            mockBudgetRepository.findById.mockResolvedValue(existingBudget);
            console.log(`Mock Setup (Repository findById):`, JSON.stringify(existingBudget, null, 2));

            mockBudgetService.prepareBudgetData.mockResolvedValue(preparedData);
            console.log(`Mock Setup (Service prepareBudgetData):`, JSON.stringify(preparedData, null, 2));

            mockBudgetRepository.update.mockResolvedValue(updatedBudget);
            console.log(`Mock Setup (Repository update):`, JSON.stringify(updatedBudget, null, 2));

            await updateBudgetController(req, res, next);

            console.log(`Expected Output (res.json):`, JSON.stringify({ success: true, message: "Budget updated successfully", data: updatedBudget }, null, 2));
            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockAuthorization.assertOwnerOrAdmin).toHaveBeenCalled();
            expect(mockBudgetRepository.update).toHaveBeenCalledWith('b1', preparedData);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Budget updated successfully",
                data: updatedBudget,
                alerts: []
            });
        });

        it('should handle update failure (Budget not found)', async () => {
            console.log('\n--- TEST: updateBudgetController (Not Found) ---');
            req.params.id = 'nonexistent';
            req.body = { limit: 200 };

            mockBudgetRepository.findById.mockResolvedValue(null);

            await updateBudgetController(req, res, next);

            expect(mockBudgetRepository.findById).toHaveBeenCalledWith('nonexistent');
            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Budget not found');
            expect(error.statusCode).toBe(404);
            console.log('--- TEST PASSED ---');
        });
    });

    describe('deleteBudgetController', () => {
        it('should delete a budget', async () => {
            console.log('\n--- TEST: deleteBudgetController ---');
            req.params.id = 'b1';
            console.log(`Input (req.params):`, JSON.stringify(req.params, null, 2));

            const existingBudget = { _id: 'b1', user: 'user123' };
            mockBudgetRepository.findById.mockResolvedValue(existingBudget);
            console.log(`Mock Setup (Repository findById):`, JSON.stringify(existingBudget, null, 2));

            await deleteBudgetController(req, res, next);

            console.log('Expected Output: res.status(204)');
            console.log(`Actual Output (res.status):`, res.status.mock.calls[0][0]);

            expect(mockAuthorization.assertOwnerOrAdmin).toHaveBeenCalled();
            expect(mockBudgetRepository.deleteById).toHaveBeenCalledWith('b1');
            expect(res.status).toHaveBeenCalledWith(204);
            console.log('--- TEST PASSED ---');
        });

        it('should handle delete failure (Budget not found)', async () => {
            console.log('\n--- TEST: deleteBudgetController (Not Found) ---');
            req.params.id = 'nonexistent';

            mockBudgetRepository.findById.mockResolvedValue(null);

            await deleteBudgetController(req, res, next);

            expect(mockBudgetRepository.findById).toHaveBeenCalledWith('nonexistent');
            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Budget not found');
            expect(error.statusCode).toBe(404);
            console.log('--- TEST PASSED ---');
        });
    });

    describe('getBudgetStatisticsController', () => {
        it('should aggregate budgets and expenses', async () => {
            console.log('\n--- TEST: getBudgetStatisticsController ---');
            req.query = { month: '5', year: '2023' };
            console.log(`Input (req.query):`, JSON.stringify(req.query, null, 2));

            // Mock Pipelines
            const bPipeline = ['budget_pipe'];
            const ePipeline = ['expense_pipe'];
            mockBudgetService.buildMonthlyStatsPipeline.mockReturnValue(bPipeline);
            mockExpenseService.buildMonthlyStatsPipeline.mockReturnValue(ePipeline);

            // Mock Aggregation Results
            const budgetStats = [{ _id: 'Food', totalBudgetUSD: 200 }];
            const expenseStats = [{ _id: 'Food', totalExpensesUSD: 50 }];

            mockBudgetRepository.aggregate.mockResolvedValue(budgetStats);
            console.log(`Mock Setup (Repo budget stats):`, JSON.stringify(budgetStats, null, 2));

            mockExpenseRepository.aggregate.mockResolvedValue(expenseStats);
            console.log(`Mock Setup (Repo expense stats):`, JSON.stringify(expenseStats, null, 2));

            await getBudgetStatisticsController(req, res, next);

            console.log('Actual Output (res.json):', JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockBudgetRepository.aggregate).toHaveBeenCalledWith(bPipeline);
            expect(mockExpenseRepository.aggregate).toHaveBeenCalledWith(ePipeline);
            console.log('--- TEST PASSED ---');
        });
    });

    describe('getBudgetCategoriesSummaryController', () => {
        it('should return categories', async () => {
            console.log('\n--- TEST: getBudgetCategoriesSummaryController ---');
            req.query = { month: '5', year: '2023' };
            console.log(`Input (req.query):`, JSON.stringify(req.query, null, 2));

            const budgets = [{ category: 'Food' }, { category: 'Rent' }];
            mockBudgetRepository.find.mockResolvedValue(budgets);
            console.log(`Mock Setup (Repo find):`, JSON.stringify(budgets, null, 2));

            await getBudgetCategoriesSummaryController(req, res, next);

            const expected = { success: true, data: ['Food', 'Rent'] };
            console.log(`Expected Output:`, JSON.stringify(expected, null, 2));
            console.log(`Actual Output:`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(res.json).toHaveBeenCalledWith(expected);
            console.log('--- TEST PASSED ---');
        });
    });
});
