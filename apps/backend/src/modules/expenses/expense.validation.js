import Joi from "joi";

export const expenseSchema = Joi.object({
    title: Joi.string().min(2).max(100).required(),
    amount: Joi.number().min(0).required(),
    currency: Joi.string().valid('EUR', 'USD', 'CNY', 'AUD').default('USD'),
    category: Joi.string().valid('Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Others').default('Others'),
    date: Joi.date(),
    notes: Joi.string().allow(""),
});