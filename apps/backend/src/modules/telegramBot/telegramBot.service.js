import TelegramBot from 'node-telegram-bot-api';
import { BARBIE_INSTANCE_ID } from '../../config/env.js';
import { buildError } from '../../utils/authorization.js';
import * as repo from './telegramBot.repository.js';
import { encryptToken } from './crypto.js';
import * as botManager from './botManager.js';

const ensureInstanceId = () => {
    if (!BARBIE_INSTANCE_ID) {
        throw buildError(
            'Server misconfigured: BARBIE_INSTANCE_ID is not set',
            500
        );
    }
};

// Validate a Telegram bot token by calling getMe; returns { id, username }.
const validateBotToken = async (botToken) => {
    const probe = new TelegramBot(botToken, { polling: false });
    try {
        const me = await probe.getMe();
        if (!me?.username || !me?.id) {
            throw buildError('Telegram bot did not return a valid identity', 400);
        }
        return { id: me.id, username: me.username };
    } catch (err) {
        if (err.statusCode || err.code === 'ETELEGRAM') {
            throw buildError(
                `Telegram rejected the bot token: ${err.message || 'unknown error'}`,
                400
            );
        }
        throw err;
    }
};

export const getBindingForUser = async (userId) => {
    const doc = await repo.findByUser(userId);
    if (!doc) return null;
    return {
        id: doc._id,
        botUsername: doc.botUsername,
        botId: doc.botId,
        status: doc.status,
        runningOn: doc.runningOn,
        ownedByThisInstance: doc.runningOn === BARBIE_INSTANCE_ID,
        chatBindingsCount: doc.chatBindings.length,
        heartbeatAt: doc.heartbeatAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
};

export const bindBot = async (userId, botToken) => {
    ensureInstanceId();

    const existing = await repo.findByUser(userId);
    if (existing) {
        throw buildError(
            'You already have a Telegram bot bound. Unbind it first.',
            400
        );
    }

    const identity = await validateBotToken(botToken);

    // Defensive: a Telegram bot token may only run a single getUpdates poller at a
    // time. If somebody else (or an old record) already owns this bot id, reject.
    const conflict = await repo.findActive().then((docs) =>
        docs.find((d) => d.botId === identity.id)
    );
    if (conflict) {
        throw buildError(
            'This bot is already bound to another Barbie account. Unbind it there first.',
            409
        );
    }

    const created = await repo.create({
        user: userId,
        botTokenEncrypted: encryptToken(botToken),
        botUsername: identity.username,
        botId: identity.id,
        status: 'active',
        runningOn: BARBIE_INSTANCE_ID,
        claimedAt: new Date(),
    });

    try {
        await botManager.startBotByDoc(created);
    } catch (err) {
        // If polling fails to start, mark the record disabled so we don't
        // leave the user with a broken record.
        await repo.update(created._id, {
            status: 'disabled',
            lastError: err.message,
        });
        throw buildError(
            `Failed to start polling for bot @${identity.username}: ${err.message}`,
            500
        );
    }

    return getBindingForUser(userId);
};

export const unbindBot = async (userId) => {
    const doc = await repo.findByUser(userId);
    if (!doc) {
        throw buildError('No Telegram bot is currently bound', 404);
    }

    // If we're the owning instance, stop polling now. Otherwise, the owning
    // instance's reconcile loop will pick up the disabled status and stop.
    if (doc.runningOn === BARBIE_INSTANCE_ID) {
        await botManager.stopBotById(doc._id.toString());
    }

    await repo.deleteById(doc._id);
    return { success: true };
};
