import Joi from "joi";

const budgetSchema = Joi.object({
  category: Joi.string()
    .valid('Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Others')
    .default('Others')
    .trim(),
  currency: Joi.string()
    .pattern(/^[A-Z]{3}$/)
    .default('USD')
    .messages({
      'string.pattern.base': 'Currency must be a valid 3-letter currency code (e.g. USD, GBP, JPY)'
    }),
  limit: Joi.number()
    .min(0)
    .max(1000000)
    .required(),
  month: Joi.number()
    .min(1)
    .max(12)
    .required(),
  year: Joi.number()
    .min(new Date().getFullYear())
    .required(),
});

export default budgetSchema;