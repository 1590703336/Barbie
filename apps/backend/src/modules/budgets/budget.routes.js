import { Router } from 'express';
import  authorize  from '../../middlewares/auth.middleware.js';
import * as budgetController from './budget.controllers.js';
import budgetSchema from './budget.validator.js';
import validate from '../../middlewares/validate.middleware.js';

// creating router for budget module
const budgetRouter = Router();

// protecting all budget routes with authorization middleware
budgetRouter.use(authorize);

// Core Routes
budgetRouter.get('/', budgetController.getBudgetsController);

budgetRouter.post('/', validate(budgetSchema), budgetController.createBudgetController);

budgetRouter.put('/:id', validate(budgetSchema), budgetController.updateBudgetController);

budgetRouter.delete('/:id', budgetController.deleteBudgetController);

export default budgetRouter;