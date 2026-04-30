import TelegramBot from 'node-telegram-bot-api';
import { BARBIE_INSTANCE_ID } from '../../config/env.js';
import * as repo from './telegramBot.repository.js';
import { decryptToken } from './crypto.js';
import { registerHandlers } from './botCommands.js';

// Map<botDocId(string), { bot, botDoc }>
const running = new Map();

const RECONCILE_INTERVAL_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 60_000;

let reconcileTimer = null;
let heartbeatTimer = null;

const log = (...args) => console.log('[telegram-bot]', ...args);

export const isRunning = (botDocId) => running.has(String(botDocId));

const startInternal = async (botDoc) => {
    const id = String(botDoc._id);
    if (running.has(id)) return running.get(id).bot;

    const token = decryptToken(botDoc.botTokenEncrypted);
    const bot = new TelegramBot(token, {
        polling: {
            interval: 1000,
            autoStart: true,
            params: { timeout: 30 },
        },
    });

    registerHandlers(bot, id);
    running.set(id, { bot, botDoc });

    await repo.update(botDoc._id, { heartbeatAt: new Date(), lastError: null });
    log(`started @${botDoc.botUsername} (${id})`);
    return bot;
};

const stopInternal = async (botDocId) => {
    const id = String(botDocId);
    const entry = running.get(id);
    if (!entry) return;
    running.delete(id);
    try {
        await entry.bot.stopPolling({ cancel: true });
        log(`stopped @${entry.botDoc.botUsername} (${id})`);
    } catch (err) {
        log(`stopPolling failed for ${id}:`, err.message);
    }
};

export const startBotByDoc = async (botDoc) => {
    if (botDoc.runningOn !== BARBIE_INSTANCE_ID) {
        log(
            `skip start: bot ${botDoc._id} is owned by '${botDoc.runningOn}', this instance is '${BARBIE_INSTANCE_ID}'`
        );
        return;
    }
    return startInternal(botDoc);
};

export const stopBotById = async (botDocId) => {
    return stopInternal(botDocId);
};

const reconcileOnce = async () => {
    if (!BARBIE_INSTANCE_ID) return;
    let desired;
    try {
        desired = await repo.findActiveByInstance(BARBIE_INSTANCE_ID);
    } catch (err) {
        log('reconcile DB query failed:', err.message);
        return;
    }
    const desiredIds = new Set(desired.map((d) => String(d._id)));

    // Stop bots that are no longer ours (unbound or claimed by another instance).
    for (const id of running.keys()) {
        if (!desiredIds.has(id)) {
            await stopInternal(id);
        }
    }

    // Start bots assigned to us that aren't running yet.
    for (const doc of desired) {
        const id = String(doc._id);
        if (!running.has(id)) {
            try {
                await startInternal(doc);
            } catch (err) {
                log(`failed to start ${id}:`, err.message);
                await repo.update(doc._id, { lastError: err.message });
            }
        }
    }
};

const heartbeatOnce = async () => {
    const ids = Array.from(running.keys());
    for (const id of ids) {
        try {
            await repo.setHeartbeat(id);
        } catch (err) {
            log(`heartbeat failed for ${id}:`, err.message);
        }
    }
};

export const bootstrap = async () => {
    if (!BARBIE_INSTANCE_ID) {
        log('BARBIE_INSTANCE_ID is not set; bot polling is disabled on this instance');
        return;
    }
    log(`bootstrapping bot manager (instance='${BARBIE_INSTANCE_ID}')`);
    await reconcileOnce();
    if (!reconcileTimer) {
        reconcileTimer = setInterval(() => {
            reconcileOnce().catch((err) => log('reconcile error:', err.message));
        }, RECONCILE_INTERVAL_MS);
        reconcileTimer.unref?.();
    }
    if (!heartbeatTimer) {
        heartbeatTimer = setInterval(() => {
            heartbeatOnce().catch((err) => log('heartbeat error:', err.message));
        }, HEARTBEAT_INTERVAL_MS);
        heartbeatTimer.unref?.();
    }
};

export const shutdown = async () => {
    if (reconcileTimer) clearInterval(reconcileTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    reconcileTimer = null;
    heartbeatTimer = null;
    const ids = Array.from(running.keys());
    await Promise.all(ids.map((id) => stopInternal(id)));
};
