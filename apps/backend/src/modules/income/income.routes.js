import { Router } from 'express';
import authorize from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import incomeSchema from './income.validator.js';
import * as incomeController from './income.controllers.js';

const incomeRouter = Router();

// Protect all income routes
incomeRouter.use(authorize);

// Create income
incomeRouter.post('/', validate(incomeSchema), incomeController.createIncome);

// Get incomes (with filters)
incomeRouter.get('/', incomeController.getIncomes);

// Get income summary
// Specific routes before parameterized routes to avoid conflict
incomeRouter.get('/summary', incomeController.getIncomeSummary);

// Get income by ID
incomeRouter.get('/:id', incomeController.getIncomeById);

// Update income
incomeRouter.put('/:id', validate(incomeSchema), incomeController.updateIncome);

// Delete income
incomeRouter.delete('/:id', incomeController.deleteIncome);

export default incomeRouter;
