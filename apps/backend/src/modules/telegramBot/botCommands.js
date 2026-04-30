import bcrypt from 'bcryptjs';
import * as userRepository from '../user/user.repository.js';
import * as expenseRepository from '../expenses/expense.repository.js';
import * as expenseService from '../expenses/expense.service.js';
import * as subscriptionRepository from '../subscription/subscription.repository.js';
import * as subscriptionService from '../subscription/subscription.service.js';
import * as budgetRepository from '../budgets/budget.repository.js';
import * as repo from './telegramBot.repository.js';
import * as ai from './aiClient.js';

const PENDING_ADD_TTL_MS = 5 * 60 * 1000;

const HELP_TEXT = `*Barbie bot commands*

/login <email> <password> — link this chat to your Barbie account
/add — next message (text and/or photo) is parsed by AI and added as expense or subscription
/check — generate a finance report from your recent data
/unbind — disconnect this chat from your Barbie account
/help — show this message`;

const safeReply = async (bot, chatId, text, opts = {}) => {
    try {
        await bot.sendMessage(chatId, text, opts);
    } catch (err) {
        console.error('[telegram-bot] sendMessage failed:', err.message);
    }
};

const findChatUser = async (botDocId, chatId) => {
    const fresh = await repo.findById(botDocId);
    if (!fresh) return { botDoc: null, user: null };
    const binding = fresh.chatBindings.find((b) => b.chatId === chatId);
    if (!binding) return { botDoc: fresh, user: null };
    const user = await userRepository.findById(fresh.user);
    return { botDoc: fresh, user };
};

const requireLogin = async (bot, botDocId, chatId) => {
    const { botDoc, user } = await findChatUser(botDocId, chatId);
    if (!user) {
        await safeReply(
            bot,
            chatId,
            'You are not logged in on this chat. Use:\n/login <email> <password>'
        );
        return null;
    }
    return { botDoc, user };
};

const tryDelete = async (bot, chatId, messageId) => {
    try {
        await bot.deleteMessage(chatId, messageId);
    } catch {
        // Bot may not have admin rights to delete user messages — ignore.
    }
};

// Telegram's CDN often serves photos with content-type=application/octet-stream,
// which OpenAI-compatible APIs reject. Sniff the format from the bytes instead.
const detectImageMime = (buf) => {
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
    if (
        buf.length >= 12 &&
        buf.slice(0, 4).toString('ascii') === 'RIFF' &&
        buf.slice(8, 12).toString('ascii') === 'WEBP'
    ) return 'image/webp';
    return 'image/jpeg';
};

const downloadAsDataUrl = async (bot, fileId) => {
    const link = await bot.getFileLink(fileId);
    const res = await fetch(link);
    if (!res.ok) throw new Error(`Failed to download Telegram file: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) {
        throw new Error('Image is too large (>5MB)');
    }
    const contentType = detectImageMime(buf);
    return `data:${contentType};base64,${buf.toString('base64')}`;
};

// ────────────────────────────────────────────────────────────────────────────
// /start, /help

const handleStart = async (bot, msg) => {
    await safeReply(
        bot,
        msg.chat.id,
        `Welcome to Barbie!\n\n${HELP_TEXT}`,
        { parse_mode: 'Markdown' }
    );
};

const handleHelp = async (bot, msg) => {
    await safeReply(bot, msg.chat.id, HELP_TEXT, { parse_mode: 'Markdown' });
};

// ────────────────────────────────────────────────────────────────────────────
// /login <email> <password>

const handleLogin = async (bot, botDocId, msg, args) => {
    const chatId = msg.chat.id;
    // Always try to delete the user's plaintext-credentials message.
    await tryDelete(bot, chatId, msg.message_id);

    const parts = (args || '').trim().split(/\s+/);
    if (parts.length < 2) {
        await safeReply(bot, chatId, 'Usage: /login <email> <password>');
        return;
    }
    const [email, ...rest] = parts;
    const password = rest.join(' ');

    const user = await userRepository.findOne({ email: email.toLowerCase() });
    if (!user) {
        await safeReply(bot, chatId, 'Login failed: invalid credentials.');
        return;
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
        await safeReply(bot, chatId, 'Login failed: invalid credentials.');
        return;
    }

    const botDoc = await repo.findById(botDocId);
    if (!botDoc) return;
    if (botDoc.user.toString() !== user._id.toString()) {
        await safeReply(
            bot,
            chatId,
            'This bot is bound to a different Barbie account. Log in with that account, or unbind the bot in your Profile.'
        );
        return;
    }

    await repo.pushChatBinding(botDocId, chatId);
    await safeReply(
        bot,
        chatId,
        `Logged in as *${user.name || user.email}*. This chat will stay logged in until you /unbind.`,
        { parse_mode: 'Markdown' }
    );
};

// ────────────────────────────────────────────────────────────────────────────
// /unbind

const handleUnbind = async (bot, botDocId, msg) => {
    const chatId = msg.chat.id;
    const botDoc = await repo.findById(botDocId);
    if (!botDoc) return;
    const isBound = botDoc.chatBindings.some((b) => b.chatId === chatId);
    if (!isBound) {
        await safeReply(bot, chatId, 'This chat is not currently linked to a Barbie account.');
        return;
    }
    await repo.pullChatBinding(botDocId, chatId);
    await safeReply(bot, chatId, 'This chat has been unlinked from your Barbie account.');
};

// ────────────────────────────────────────────────────────────────────────────
// /add — flag pendingAdd, then the next message is parsed by AI

const handleAddCommand = async (bot, botDocId, msg) => {
    const chatId = msg.chat.id;
    const session = await requireLogin(bot, botDocId, chatId);
    if (!session) return;

    await repo.setPendingAdd(botDocId, chatId, PENDING_ADD_TTL_MS);
    await safeReply(
        bot,
        chatId,
        '✏️ Send the next message with a photo (receipt/screenshot) and/or a text description. I will identify it as expense or subscription and add it to your account.\n\nThe prompt expires in 5 minutes.'
    );
};

const sanitizeExpense = (parsed) => {
    const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Others'];
    const data = {
        title: typeof parsed.title === 'string' ? parsed.title.slice(0, 100) : null,
        amount: typeof parsed.amount === 'number' ? parsed.amount : NaN,
        currency: /^[A-Z]{3}$/.test(parsed.currency || '') ? parsed.currency : 'USD',
        category: ALLOWED_CATEGORIES.includes(parsed.category) ? parsed.category : 'Others',
        date: parsed.date ? new Date(parsed.date) : new Date(),
        notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    };
    if (!data.title || data.title.length < 2) throw new Error('Missing title');
    if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error('Invalid amount');
    if (Number.isNaN(data.date.getTime())) data.date = new Date();
    return data;
};

const sanitizeSubscription = (parsed) => {
    const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Others'];
    const ALLOWED_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];
    const data = {
        name: typeof parsed.name === 'string' ? parsed.name.slice(0, 100) : null,
        price: typeof parsed.price === 'number' ? parsed.price : NaN,
        currency: /^[A-Z]{3}$/.test(parsed.currency || '') ? parsed.currency : 'USD',
        frequency: ALLOWED_FREQUENCIES.includes(parsed.frequency) ? parsed.frequency : 'monthly',
        category: ALLOWED_CATEGORIES.includes(parsed.category) ? parsed.category : 'Others',
        paymentMethod: typeof parsed.paymentMethod === 'string' && parsed.paymentMethod.trim()
            ? parsed.paymentMethod.trim()
            : 'Unknown',
        startDate: parsed.startDate ? new Date(parsed.startDate) : new Date(),
        notes: typeof parsed.notes === 'string' ? parsed.notes : '',
        status: 'active',
    };
    if (!data.name || data.name.length < 2) throw new Error('Missing name');
    if (!Number.isFinite(data.price) || data.price <= 0) throw new Error('Invalid price');
    if (Number.isNaN(data.startDate.getTime())) data.startDate = new Date();
    return data;
};

const formatMoney = (amount, currency) => `${amount.toFixed(2)} ${currency}`;

const handleAddPayload = async (bot, botDocId, msg) => {
    const chatId = msg.chat.id;
    const session = await requireLogin(bot, botDocId, chatId);
    if (!session) return;
    const { user } = session;

    const text = msg.text || msg.caption || '';
    const images = [];
    if (Array.isArray(msg.photo) && msg.photo.length > 0) {
        // Telegram sends multiple sizes; the largest is last.
        const largest = msg.photo[msg.photo.length - 1];
        try {
            images.push(await downloadAsDataUrl(bot, largest.file_id));
        } catch (err) {
            await safeReply(bot, chatId, `Could not download image: ${err.message}`);
            await repo.clearPendingAdd(botDocId);
            return;
        }
    }

    if (!text && images.length === 0) {
        await safeReply(bot, chatId, 'Send a photo, a text description, or both. Try /add again.');
        await repo.clearPendingAdd(botDocId);
        return;
    }

    await safeReply(bot, chatId, '🔍 Identifying with AI…');

    let parsed;
    try {
        parsed = await ai.parseRecord({ text, images });
    } catch (err) {
        console.error('[telegram-bot] AI parse failed:', err);
        await safeReply(bot, chatId, `AI parsing failed: ${err.message}`);
        await repo.clearPendingAdd(botDocId);
        return;
    }

    try {
        if (parsed.type === 'subscription') {
            const data = sanitizeSubscription(parsed);
            const prepared = await subscriptionService.prepareSubscriptionData({ ...data, user: user._id });
            const created = await subscriptionRepository.create(prepared);
            await safeReply(
                bot,
                chatId,
                [
                    '✅ *Subscription added*',
                    `*${created.name}* — ${formatMoney(created.price, created.currency)} / ${created.frequency}`,
                    `Category: ${created.category}`,
                    `Payment: ${created.paymentMethod}`,
                    `Start: ${new Date(created.startDate).toISOString().slice(0, 10)}`,
                    created.renewalDate
                        ? `Next renewal: ${new Date(created.renewalDate).toISOString().slice(0, 10)}`
                        : null,
                    typeof parsed.confidence === 'number'
                        ? `_AI confidence: ${(parsed.confidence * 100).toFixed(0)}%_`
                        : null,
                ]
                    .filter(Boolean)
                    .join('\n'),
                { parse_mode: 'Markdown' }
            );
        } else {
            // Default to expense
            const data = sanitizeExpense(parsed);
            const prepared = await expenseService.prepareExpenseData({ ...data, user: user._id });
            const created = await expenseRepository.create(prepared);
            await safeReply(
                bot,
                chatId,
                [
                    '✅ *Expense added*',
                    `*${created.title}* — ${formatMoney(created.amount, created.currency)}`,
                    `Category: ${created.category}`,
                    `Date: ${new Date(created.date).toISOString().slice(0, 10)}`,
                    typeof parsed.confidence === 'number'
                        ? `_AI confidence: ${(parsed.confidence * 100).toFixed(0)}%_`
                        : null,
                ]
                    .filter(Boolean)
                    .join('\n'),
                { parse_mode: 'Markdown' }
            );
        }
    } catch (err) {
        console.error('[telegram-bot] add failed:', err);
        await safeReply(
            bot,
            chatId,
            `Could not save record: ${err.message}\n\nRaw AI output:\n\`\`\`\n${JSON.stringify(parsed, null, 2)}\n\`\`\``,
            { parse_mode: 'Markdown' }
        );
    } finally {
        await repo.clearPendingAdd(botDocId);
    }
};

// ────────────────────────────────────────────────────────────────────────────
// /check — generate AI report

const handleCheck = async (bot, botDocId, msg) => {
    const chatId = msg.chat.id;
    const session = await requireLogin(bot, botDocId, chatId);
    if (!session) return;
    const { user } = session;

    await safeReply(bot, chatId, '📊 Generating report…');

    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();

    const sinceDate = new Date(now);
    sinceDate.setUTCDate(sinceDate.getUTCDate() - 30);

    try {
        const [recentExpenses, subscriptions, budgets] = await Promise.all([
            expenseRepository.find({ user: user._id, date: { $gte: sinceDate } }),
            subscriptionRepository.find({ user: user._id, status: 'active' }),
            budgetRepository.find({ user: user._id, month, year }),
        ]);

        const payload = {
            currency: user.defaultCurrency || 'USD',
            window: {
                expenseSinceDate: sinceDate.toISOString().slice(0, 10),
                budgetMonth: `${year}-${String(month).padStart(2, '0')}`,
            },
            recentExpenses: recentExpenses.map((e) => ({
                title: e.title,
                amount: e.amount,
                amountUSD: e.amountUSD,
                currency: e.currency,
                category: e.category,
                date: e.date,
            })),
            subscriptions: subscriptions.map((s) => ({
                name: s.name,
                price: s.price,
                amountUSD: s.amountUSD,
                currency: s.currency,
                frequency: s.frequency,
                category: s.category,
                renewalDate: s.renewalDate,
            })),
            budgets: budgets.map((b) => ({
                category: b.category,
                limit: b.limit,
                amountUSD: b.amountUSD,
                currency: b.currency,
                month: b.month,
                year: b.year,
            })),
        };

        const report = await ai.generateReport(payload);
        await safeReply(bot, chatId, report, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('[telegram-bot] check failed:', err);
        await safeReply(bot, chatId, `Could not generate report: ${err.message}`);
    }
};

// ────────────────────────────────────────────────────────────────────────────
// Wire all handlers onto a bot instance.

export const registerHandlers = (bot, botDocId) => {
    const wrap = (fn) => async (...args) => {
        try {
            await fn(...args);
        } catch (err) {
            console.error('[telegram-bot] handler error:', err);
        }
    };

    bot.onText(/^\/start(?:@\w+)?\b/, wrap((msg) => handleStart(bot, msg)));
    bot.onText(/^\/help(?:@\w+)?\b/, wrap((msg) => handleHelp(bot, msg)));
    bot.onText(/^\/login(?:@\w+)?\s*(.*)$/i, wrap((msg, match) => handleLogin(bot, botDocId, msg, match[1])));
    bot.onText(/^\/unbind(?:@\w+)?\b/, wrap((msg) => handleUnbind(bot, botDocId, msg)));
    bot.onText(/^\/add(?:@\w+)?\b/, wrap((msg) => handleAddCommand(bot, botDocId, msg)));
    bot.onText(/^\/check(?:@\w+)?\b/, wrap((msg) => handleCheck(bot, botDocId, msg)));

    // Catch-all: messages that aren't slash commands. If pendingAdd is set
    // for this chat, treat the message as the /add payload.
    bot.on('message', wrap(async (msg) => {
        if (!msg || !msg.chat) return;
        const text = msg.text || '';
        if (text.startsWith('/')) return; // commands handled above

        const fresh = await repo.findById(botDocId);
        if (!fresh?.pendingAdd) return;
        if (fresh.pendingAdd.chatId !== msg.chat.id) return;
        if (new Date(fresh.pendingAdd.expiresAt) < new Date()) {
            await repo.clearPendingAdd(botDocId);
            return;
        }
        await handleAddPayload(bot, botDocId, msg);
    }));

    bot.on('polling_error', (err) => {
        console.error(`[telegram-bot] polling_error (${botDocId}):`, err.message);
    });
};
