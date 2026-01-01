import { jest } from '@jest/globals';

// Mock Dependencies
const mockExpenseRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUser: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn()
};

const mockExpenseService = {
    prepareExpenseData: jest.fn()
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
jest.unstable_mockModule('../src/modules/expenses/expense.repository.js', () => mockExpenseRepository);
jest.unstable_mockModule('../src/modules/expenses/expense.service.js', () => mockExpenseService);
jest.unstable_mockModule('../src/utils/authorization.js', () => mockAuthorization);
jest.unstable_mockModule('../src/modules/budgets/budgetAlertService.js', () => ({
    checkBudgetAlerts: jest.fn(() => ({ alerts: [] }))
}));

// Import Controller (after mocks)
const {
    createExpenseController,
    getExpensesController,
    updateExpenseController,
    deleteExpenseController
} = await import('../src/modules/expenses/expense.controller.js');

describe('Expense Controller (Refactored)', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            user: { _id: 'user123', role: 'user' },
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

    describe('createExpenseController', () => {
        // Test Logic:
        // 1. Setup Input: Define `req.body` with expense details.
        // 2. Setup Mocks:
        //    - Mock Service to return processed data (with amountUSD).
        //    - Mock Repository to return the created expense object.
        // 3. Execution: Call the controller.
        // 4. Verification: Check if Service and Repository were called with correct arguments and if `res.status(201)` and `res.json()` were called.
        it('should orchestrate service and repository calls', async () => {
            console.log('\n--- TEST: createExpenseController ---');

            const expenseData = { amount: 100, currency: 'USD', category: 'Food' };
            req.body = expenseData;
            console.log('Input (req.body):', JSON.stringify(expenseData, null, 2));

            const processedData = { ...expenseData, amountUSD: 100 };
            const createdExpense = { ...processedData, _id: 'exp1', toJSON: () => processedData, date: new Date() };

            console.log('Mock Setup (Service prepareExpenseData) returns:', JSON.stringify(processedData, null, 2));
            mockExpenseService.prepareExpenseData.mockResolvedValue(processedData);

            console.log('Mock Setup (Repository create) returns:', JSON.stringify(createdExpense, null, 2));
            mockExpenseRepository.create.mockResolvedValue(createdExpense);

            await createExpenseController(req, res, next);

            // Verify Flow
            expect(mockExpenseService.prepareExpenseData).toHaveBeenCalledWith(expect.objectContaining(expenseData));
            expect(mockExpenseRepository.create).toHaveBeenCalledWith(processedData);

            console.log('Expected Output (res.json):', JSON.stringify({ ...processedData, alerts: [] }, null, 2));

            // Capture actual output from mock calls
            const actualStatus = res.status.mock.calls[0][0];
            const actualJson = res.json.mock.calls[0][0];
            console.log('Actual Output (res.status):', actualStatus);
            console.log('Actual Output (res.json):', JSON.stringify(actualJson, null, 2));

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalled();
            console.log('--- TEST PASSED ---\n');
        });
    });

    describe('getExpensesController', () => {
        // Test Logic:
        // 1. Setup Input: Define `req.user` and optional query filters.
        // 2. Setup Mocks:
        //    - Mock Repository to return a list of expenses.
        // 3. Execution: Call the controller.
        // 4. Verification: Ensure `findByUser` is called with the correct user ID and `res.json` receives the list.
        it('should use repository to find expenses by user', async () => {
            console.log('\n--- TEST: getExpensesController ---');

            const userId = 'user123';
            console.log('Input (req.user):', JSON.stringify({ _id: userId }, null, 2));

            const expenses = [{ id: 1 }, { id: 2 }];
            console.log('Mock Setup (Repository findByUser) returns:', JSON.stringify(expenses, null, 2));

            mockExpenseRepository.findByUser.mockResolvedValue(expenses);

            await getExpensesController(req, res, next);

            expect(mockAuthorization.assertSameUserOrAdmin).toHaveBeenCalled();
            expect(mockExpenseRepository.findByUser).toHaveBeenCalledWith('user123', expect.any(Object));

            console.log('Expected Output (res.json):', JSON.stringify(expenses, null, 2));
            const actualJson = res.json.mock.calls[0][0];
            console.log('Actual Output (res.json):', JSON.stringify(actualJson, null, 2));

            expect(res.json).toHaveBeenCalledWith(expenses);
            console.log('--- TEST PASSED ---\n');
        });
    });

    describe('updateExpenseController', () => {
        // Test Logic:
        // 1. Setup Input: `req.params.id` and `req.body` with updates.
        // 2. Setup Mocks:
        //    - Mock `findById` to return existing expense (needed for ownership check).
        //    - Mock Service to process update data (re-calculate USD if needed).
        //    - Mock Repository `update` to return the new object.
        // 3. Execution: Call the controller.
        // 4. Verification: assertOwnerOrAdmin check, then update call, then `res.json`.
        it('should update expense after verifying ownership', async () => {
            console.log('\n--- TEST: updateExpenseController ---');

            req.params.id = 'exp1';
            req.body = { amount: 200 };
            console.log('Input (req.params.id):', req.params.id);
            console.log('Input (req.body):', JSON.stringify(req.body, null, 2));

            const existingExpense = { _id: 'exp1', user: 'user123', amount: 100 };
            console.log('Mock Setup (Repository findById) returns:', JSON.stringify(existingExpense, null, 2));

            const processedData = { amount: 200, amountUSD: 200 };
            console.log('Mock Setup (Service prepareExpenseData) returns:', JSON.stringify(processedData, null, 2));

            const updatedExpense = { ...existingExpense, ...processedData };
            console.log('Mock Setup (Repository update) returns:', JSON.stringify(updatedExpense, null, 2));

            mockExpenseRepository.findById.mockResolvedValue(existingExpense);
            mockExpenseService.prepareExpenseData.mockResolvedValue(processedData);
            mockExpenseRepository.update.mockResolvedValue(updatedExpense);

            await updateExpenseController(req, res, next);

            expect(mockExpenseRepository.findById).toHaveBeenCalledWith('exp1');
            expect(mockAuthorization.assertOwnerOrAdmin).toHaveBeenCalledWith('user123', expect.any(Object), expect.any(String));
            expect(mockExpenseService.prepareExpenseData).toHaveBeenCalledWith(req.body, existingExpense);
            expect(mockExpenseRepository.update).toHaveBeenCalledWith('exp1', processedData);

            console.log('Expected Output (res.json):', JSON.stringify(updatedExpense, null, 2));
            const actualJson = res.json.mock.calls[0][0];
            console.log('Actual Output (res.json):', JSON.stringify(actualJson, null, 2));

            expect(res.json).toHaveBeenCalledWith(updatedExpense);
            console.log('--- TEST PASSED ---\n');
        });

        it('should handle update failure (Expense not found)', async () => {
            console.log('\n--- TEST: updateExpenseController (Not Found) ---');
            req.params.id = 'nonexistent';

            mockExpenseRepository.findById.mockResolvedValue(null);

            await updateExpenseController(req, res, next);

            expect(mockExpenseRepository.findById).toHaveBeenCalledWith('nonexistent');
            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Expense not found');
            expect(error.statusCode).toBe(404);
            console.log('--- TEST PASSED ---\n');
        });
    });

    describe('deleteExpenseController', () => {
        // Test Logic:
        // 1. Setup Input: `req.params.id`.
        // 2. Setup Mocks:
        //    - Mock `findById` (for ownership check).
        //    - Mock `deleteById` to return success.
        // 3. Execution: Call the controller.
        // 4. Verification: assertOwnerOrAdmin check, then delete call, finally `res.status(204)`.
        it('should delete expense after verifying ownership', async () => {
            console.log('\n--- TEST: deleteExpenseController ---');

            req.params.id = 'exp1';
            console.log('Input (req.params.id):', req.params.id);

            const existingExpense = { _id: 'exp1', user: 'user123' };
            console.log('Mock Setup (Repository findById) returns:', JSON.stringify(existingExpense, null, 2));

            mockExpenseRepository.findById.mockResolvedValue(existingExpense);
            mockExpenseRepository.deleteById.mockResolvedValue(true);

            await deleteExpenseController(req, res, next);

            expect(mockExpenseRepository.findById).toHaveBeenCalledWith('exp1');
            expect(mockAuthorization.assertOwnerOrAdmin).toHaveBeenCalledWith('user123', expect.any(Object), expect.any(String));
            expect(mockExpenseRepository.deleteById).toHaveBeenCalledWith('exp1');

            console.log('Expected Output: res.status(204)');
            const actualStatus = res.status.mock.calls[0][0];
            console.log('Actual Output (res.status):', actualStatus);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
            console.log('--- TEST PASSED ---\n');
        });

        it('should handle delete failure (Expense not found)', async () => {
            console.log('\n--- TEST: deleteExpenseController (Not Found) ---');
            req.params.id = 'nonexistent';

            mockExpenseRepository.findById.mockResolvedValue(null);

            await deleteExpenseController(req, res, next);

            expect(mockExpenseRepository.findById).toHaveBeenCalledWith('nonexistent');
            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Expense not found');
            expect(error.statusCode).toBe(404);
            console.log('--- TEST PASSED ---\n');
        });
    });
});
