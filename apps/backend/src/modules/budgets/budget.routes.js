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
budgetRouter.get('/', budgetController.getBudgetsController); // get all budgets for a specific month and year for a user

budgetRouter.post('/', validate(budgetSchema), budgetController.createBudgetController); // create a new budget

budgetRouter.put('/:id', validate(budgetSchema), budgetController.updateBudgetController); // update a budget

budgetRouter.delete('/:id', budgetController.deleteBudgetController); // delete a budget

// summary route
budgetRouter.get('/summary/categories', budgetController.getBudgetCategoriesSummaryController); // get all budget categories for a specific month and year for a user
budgetRouter.get('/summary/spending-summary', budgetController.getBudgetStatisticsController); // get a full spending summary comparing budgets and expenses


export default budgetRouter;