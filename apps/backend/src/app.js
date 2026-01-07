import express from "express";
import userRouter from "./modules/user/user.routes.js";
import expenseRouter from "./modules/expenses/expense.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import subscriptionRouter from "./modules/subscription/subscription.routes.js";
import budgetRouter from "./modules/budgets/budget.routes.js";
import currencyRouter from "./modules/currency/currency.routes.js";
import incomeRouter from "./modules/income/income.routes.js";
import convertPairRouter from "./modules/convertPair/convertPair.routes.js";
import errorMiddlewares from "./middlewares/error.middlewares.js";
import cookieParser from "cookie-parser";
import arcjetMiddleware from "./middlewares/arcjet.middleware.js";

// creating express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser())
app.use(arcjetMiddleware);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);
app.use('/api/v1/expenses', expenseRouter);
app.use('/api/v1/budgets', budgetRouter);
app.use('/api/v1/currencies', currencyRouter);
app.use('/api/v1/income', incomeRouter);
app.use('/api/v1/convert-pairs', convertPairRouter);

app.use(errorMiddlewares);

app.get('/', (req, res) => {
    res.send('Welcome to the app!');
});


export default app;
