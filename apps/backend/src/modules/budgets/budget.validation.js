import Joi from "joi";

const budgetSchema = Joi.object({
  category: Joi.string()
    .valid('Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Others')
    .default('Others')
    .trim(), 
  currency: Joi.string()
    .valid('EUR', 'USD', 'CNY', 'AUD')
    .default('USD'),
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