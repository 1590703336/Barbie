import TelegramBotConfig from './telegramBot.model.js';

export const findByUser = async (userId) => {
    return TelegramBotConfig.findOne({ user: userId });
};

export const findById = async (id) => {
    return TelegramBotConfig.findById(id);
};

export const findByChatId = async (chatId) => {
    return TelegramBotConfig.findOne({ 'chatBindings.chatId': chatId });
};

export const findActiveByInstance = async (instanceId) => {
    return TelegramBotConfig.find({ status: 'active', runningOn: instanceId });
};

export const findActive = async () => {
    return TelegramBotConfig.find({ status: 'active' });
};

export const create = async (data) => {
    return TelegramBotConfig.create(data);
};

export const update = async (id, updates) => {
    return TelegramBotConfig.findByIdAndUpdate(id, updates, { new: true });
};

export const updateByUser = async (userId, updates) => {
    return TelegramBotConfig.findOneAndUpdate({ user: userId }, updates, { new: true });
};

export const deleteById = async (id) => {
    return TelegramBotConfig.findByIdAndDelete(id);
};

export const pushChatBinding = async (id, chatId) => {
    return TelegramBotConfig.findByIdAndUpdate(
        id,
        {
            $pull: { chatBindings: { chatId } },
        },
        { new: true }
    ).then(() =>
        TelegramBotConfig.findByIdAndUpdate(
            id,
            {
                $push: { chatBindings: { chatId, boundAt: new Date() } },
            },
            { new: true }
        )
    );
};

export const pullChatBinding = async (id, chatId) => {
    return TelegramBotConfig.findByIdAndUpdate(
        id,
        { $pull: { chatBindings: { chatId } } },
        { new: true }
    );
};

export const setPendingAdd = async (id, chatId, ttlMs) => {
    return TelegramBotConfig.findByIdAndUpdate(
        id,
        {
            pendingAdd: {
                chatId,
                expiresAt: new Date(Date.now() + ttlMs),
            },
        },
        { new: true }
    );
};

export const clearPendingAdd = async (id) => {
    return TelegramBotConfig.findByIdAndUpdate(id, { pendingAdd: null }, { new: true });
};

export const setHeartbeat = async (id) => {
    return TelegramBotConfig.findByIdAndUpdate(id, { heartbeatAt: new Date() });
};
