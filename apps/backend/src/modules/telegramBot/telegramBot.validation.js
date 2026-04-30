import Joi from 'joi';

// Telegram bot tokens look like: 123456789:AA<35-char-base64ish>
export const bindBotSchema = Joi.object({
    botToken: Joi.string()
        .pattern(/^\d{5,15}:[A-Za-z0-9_-]{30,}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid Telegram bot token format',
        }),
});
