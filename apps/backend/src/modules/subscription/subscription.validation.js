import Joi from 'joi';

export const subscriptionSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().valid('EUR', 'USD', 'CNY', 'AUD').default('USD'),
  frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').required(),
  category: Joi.string().valid('sports', 'technology', 'other', 'entertainment', 'lifestyle', 'finance').required(),
  startDate: Joi.date().required(),
  paymentMethod: Joi.string().required(),
  status: Joi.string().valid('active', 'cancelled', 'expired').default('active'),
  renewalDate: Joi.date(),
  user: Joi.string().hex().length(24), // ObjectId validation
});
