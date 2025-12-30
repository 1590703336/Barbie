import { Router } from 'express';
import authorize from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { expenseSchema } from './expense.validation.js';
import { 
    createExpenseController, 
    getExpensesController, 
    updateExpenseController, 
    deleteExpenseController 
} from './expense.controller.js';

const expenseRouter = Router();

// protecting all expense routes with authorization middleware
expenseRouter.use(authorize);

expenseRouter.post("/", validate(expenseSchema), createExpenseController);

expenseRouter.get("/", getExpensesController);

expenseRouter.get("/:id", getExpensesController); 

expenseRouter.put("/:id", validate(expenseSchema), updateExpenseController);

expenseRouter.delete("/:id", deleteExpenseController);


export default expenseRouter;