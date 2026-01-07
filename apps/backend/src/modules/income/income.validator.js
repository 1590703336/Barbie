import Joi from "joi";

const incomeSchema = Joi.object({
    amount: Joi.number()
        .min(0.01)
        .required()
        .messages({
            'number.base': 'Amount must be a number',
            'number.min': 'Amount must be greater than 0',
            'any.required': 'Amount is required'
        }),
    currency: Joi.string()
        .valid('EUR', 'USD', 'CNY', 'AUD')
        .default('USD')
        .messages({
            'any.only': 'Currency must be one of: EUR, USD, CNY, AUD'
        }),
    source: Joi.string()
        .trim()
        .allow('')
        .max(100)
        .messages({
            'string.max': 'Source must calculate to less than 100 characters'
        }),
    category: Joi.string()
        .valid('Salary', 'Freelance', 'Gift', 'Investment', 'Other')
        .required()
        .messages({
            'any.only': 'Category must be one of: Salary, Freelance, Gift, Investment, Other',
            'any.required': 'Category is required'
        }),
    date: Joi.date()
        .required()
        .messages({
            'date.base': 'Date must be a valid date',
            'any.required': 'Date is required'
        }),
    notes: Joi.string()
        .trim()
        .allow('')
        .max(500)
        .messages({
            'string.max': 'Notes cannot exceed 500 characters'
        })
});

export default incomeSchema;
