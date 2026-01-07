import Joi from 'joi';

export const createConvertPairSchema = Joi.object({
    fromCurrency: Joi.string().pattern(/^[A-Z]{3}$/).required()
        .messages({ 'string.pattern.base': 'From currency must be a valid 3-letter code' }),
    toCurrency: Joi.string().pattern(/^[A-Z]{3}$/).required()
        .messages({ 'string.pattern.base': 'To currency must be a valid 3-letter code' }),
});

export const updateConvertPairSchema = Joi.object({
    fromCurrency: Joi.string().pattern(/^[A-Z]{3}$/).optional()
        .messages({ 'string.pattern.base': 'From currency must be a valid 3-letter code' }),
    toCurrency: Joi.string().pattern(/^[A-Z]{3}$/).optional()
        .messages({ 'string.pattern.base': 'To currency must be a valid 3-letter code' }),
}).min(1); // At least one field required for update
