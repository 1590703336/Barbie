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
expenseRouter.use(authorize); // protect all expense routes with authorization middleware

expenseRouter.post("/", validate(expenseSchema), createExpenseController); // create a new expense

expenseRouter.get("/", getExpensesController); 

expenseRouter.get("/:id", getExpensesController);

expenseRouter.put("/:id", validate(expenseSchema), updateExpenseController); // update a single expense by id

expenseRouter.delete("/:id", deleteExpenseController); // delete a single expense by id


export default expenseRouter;