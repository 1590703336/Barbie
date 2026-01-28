/**
 * Admin Auth Validation
 * 
 * Joi schemas for admin authentication endpoints.
 */

import Joi from 'joi';

/**
 * Schema for admin sign-in request.
 */
export const adminSignInSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is required'
        })
});
