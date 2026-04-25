import Joi from "joi";

export const expenseSchema = Joi.object({
    title: Joi.string().min(2).max(100).required(),
    amount: Joi.number().min(0).required(),
    currency: Joi.string().pattern(/^[A-Z]{3}$/).default('USD').messages({
        'string.pattern.base': 'Currency must be a valid 3-letter currency code (e.g. USD, GBP, JPY)'
    }),
    category: Joi.string().valid('Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Others').default('Others'),
    date: Joi.date(),
    notes: Joi.string().allow(""),
});