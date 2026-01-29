import Joi from 'joi';

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
        .messages({
            'string.email': 'This is not a valid email address; we cannot send a reset notification.',
            'any.required': 'Email is required.',
        }),
});

export const resetPasswordSchema = Joi.object({
    token: Joi.string().required()
        .messages({
            'any.required': 'Reset token is required.',
        }),
    password: Joi.string().min(6).required()
        .messages({
            'string.min': 'Password must be at least 6 characters.',
            'any.required': 'New password is required.',
        }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
        .messages({
            'any.only': 'Passwords do not match.',
            'any.required': 'Password confirmation is required.',
        }),
});
