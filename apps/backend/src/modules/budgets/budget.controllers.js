import * as budgetService from './budget.services.js';

// controller to get budgets for specific month and year and user
export const getBudgetsController = async (req, res, next) => {
    try {
      const month = parseInt(req.query.month, 10);
      const year = parseInt(req.query.year, 10);
  
      if (!month || !year) {
        return res.status(400).json({ message: "Month and year are required" });
      }
  
      const budgets = await budgetService.getBudgetsByUserAndDate(req.user._id, month, year);
      res.json(budgets);

    } catch (err) {
      next(err);
    }
  };
  

// controller to update budget by ID
export const updateBudgetController = async (req, res, next) => {
    try {
        const updatedBudget = await budgetService.updateBudget(req.params.id, req.body);
        res.json(updatedBudget);

    } catch (err) {
        next(err);
    }
}

// controller to delete budget by ID
export const deleteBudgetController = async (req, res, next) => {
    try {
        await budgetService.deleteBudget(req.params.id);
        res.status(204).send();

    } catch (err) {
        next(err);
    }
}

// controller to create a new budget
export const createBudgetController = async (req, res, next) => {
    try {
        const budget = await budgetService.createBudget({ ...req.body, user: req.user._id });
        res.status(201).json(budget);
        
    } catch (err) {
        next(err);
    }
}