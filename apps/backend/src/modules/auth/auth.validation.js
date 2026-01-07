import Joi from 'joi';

export const signUpSchema = Joi.object({
  name: Joi.string().min(2).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  defaultCurrency: Joi.string().pattern(/^[A-Z]{3}$/).optional(),
});

export const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
