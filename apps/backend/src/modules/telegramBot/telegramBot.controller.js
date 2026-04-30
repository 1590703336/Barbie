import * as service from './telegramBot.service.js';

export const getMyBinding = async (req, res, next) => {
    try {
        const binding = await service.getBindingForUser(req.user._id);
        res.json({ binding });
    } catch (err) {
        next(err);
    }
};

export const bindBot = async (req, res, next) => {
    try {
        const { botToken } = req.body;
        const binding = await service.bindBot(req.user._id, botToken);
        res.status(201).json({ binding });
    } catch (err) {
        next(err);
    }
};

export const unbindBot = async (req, res, next) => {
    try {
        await service.unbindBot(req.user._id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
