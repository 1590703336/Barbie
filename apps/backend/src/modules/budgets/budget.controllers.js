import * as budgetService from './budget.services.js';
import * as expenseService from '../expenses/expense.service.js';

// controller to get budgets for specific month and year and user
export const getBudgetsController = async (req, res, next) => {
    try {
      const month = parseInt(req.query.month, 10);
      const year = parseInt(req.query.year, 10);
  
      if (!month || !year) {
        return res.status(400).json({ message: "Month and year are required" });
      }
  
      const budgets = await budgetService.getBudgetsByUserAndDate(req.user._id, month, year);
      res.json({ success: true, data: budgets});

    } catch (err) {
      next(err);
    }
  };
  

// controller to update budget by ID
export const updateBudgetController = async (req, res, next) => {
    try {
        const updatedBudget = await budgetService.updateBudget(req.params.id, req.body);
        res.json({ success: true, message: "Budget updated successfully", data: updatedBudget});

    } catch (err) {
        next(err);
    }
}

// controller to delete budget by ID
export const deleteBudgetController = async (req, res, next) => {
    try {
        await budgetService.deleteBudget(req.params.id);
        res.status(204).send({
            success: true,
            message: "Budget deleted successfully"
          });

    } catch (err) {
        next(err);
    }
}

// controller to create a new budget
export const createBudgetController = async (req, res, next) => {
    try {
        const budget = await budgetService.createBudget({ ...req.body, user: req.user._id });
        res.status(201).json({ success: true, message: "Budget created successfully", data: budget});
        
    } catch (err) {
        next(err);
    }
}

export const getBudgetCategoriesSummaryController = async (req, res, next) => {
    try {
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);
  
        if (!month || !year) {
        return res.status(400).json({ message: "Month and year are required" });
        }

        const categories = await budgetService.getBudgetCategoriesByUserAndDate(req.user._id, month, year);
        res.status(200).json({ success: true, data: categories});

    } catch (err) {
        next(err);
    }
}

// controller to get summary of budgets and expenses
export const getBudgetSummaryController = async (req, res, next) => {
    try {
        // extract the month and year from query parameters
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);

        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        // calculate total budget and total expenses
        const totalBudget = await budgetService.getTotalBudgetByUserAndDate(req.user._id, month, year);
        const totalExpenses = await expenseService.getTotalExpensesByUserAndDate(req.user._id, month, year);

        // getting all categories with budgets for the user in the specified month and year
        const categories = await budgetService.getBudgetCategoriesByUserAndDate(req.user._id, month, year);

        // filter to check if category exists in expenses
        const categoriesWithExpenses = categories.filter(category => {
            return expenseService.hasExpenseCategory(req.user._id, category);
        });

        // prepare category-wise summary
        const categoriesSummary = [];
        for (const category of categoriesWithExpenses) {
            const categoryBudget = await budgetService.getTotalBudgetByCategoryAndDate(req.user._id, category, month, year);
            const categoryExpenses = await expenseService.getTotalExpensesByCategoryAndDate(req.user._id, category, month, year);

            categoriesSummary.push({
                category,
                budget: categoryBudget,
                remainingBudget: categoryBudget - categoryExpenses,
                expenses: categoryExpenses
            });
        }

        // send the final summary response
        res.status(200).json({
            success: true,
            data: {
            totalBudget,
            totalExpenses,
            remainingBudget: totalBudget - totalExpenses,
            categoriesSummary
            }
        });

    }
    catch (err) {
        next(err);
    }
}