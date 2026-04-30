import bcrypt from 'bcryptjs';
import { BARBIE_INSTANCE_ID } from '../../config/env.js';
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
/add — your next message (text and/or photo) is parsed by AI; it can *add*, *update*, or *delete* an expense or subscription
/check — generate a finance report from your recent data
/unbind — disconnect this chat from your Barbie account
/help — show this message

_Examples for /add:_
• "i bought coffee for $5" → adds an expense
• "change yesterday's lunch to $15" → updates the matching expense
• "delete my netflix subscription" → deletes the matching subscription`;

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
    const instance = BARBIE_INSTANCE_ID || 'unknown';
    const deploymentNote = `_This bot is bound to the *${instance}* Barbie deployment and only the ${instance} backend polls it._

_To move it to a different deployment (e.g. main ↔ preview): open the Profile page on the *${instance}* site, click *Unbind* (this deletes the binding), then click *Bind* on the other site with the same bot token. The /unbind command only logs out this chat — it does not change the deployment ownership._`;
    await safeReply(
        bot,
        msg.chat.id,
        `Welcome to Barbie!\n\n${HELP_TEXT}\n\n${deploymentNote}`,
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
        '✏️ Send the next message with a photo (receipt/screenshot) and/or a text description.\n' +
            'I will use AI to detect whether you want to *add*, *update*, or *delete* an expense or subscription, ' +
            'and apply it to your account.\n\nThe prompt expires in 5 minutes.',
        { parse_mode: 'Markdown' }
    );
};

const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Others'];
const ALLOWED_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

// Full sanitize for "create" — every required attribute must be present.
const sanitizeExpenseFull = (fields) => {
    const data = {
        title: typeof fields.title === 'string' ? fields.title.slice(0, 100) : null,
        amount: typeof fields.amount === 'number' ? fields.amount : NaN,
        currency: /^[A-Z]{3}$/.test(fields.currency || '') ? fields.currency : 'USD',
        category: ALLOWED_CATEGORIES.includes(fields.category) ? fields.category : 'Others',
        date: fields.date ? new Date(fields.date) : new Date(),
        notes: typeof fields.notes === 'string' ? fields.notes : '',
    };
    if (!data.title || data.title.length < 2) throw new Error('Missing title');
    if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error('Invalid amount');
    if (Number.isNaN(data.date.getTime())) data.date = new Date();
    return data;
};

const sanitizeSubscriptionFull = (fields) => {
    const data = {
        name: typeof fields.name === 'string' ? fields.name.slice(0, 100) : null,
        price: typeof fields.price === 'number' ? fields.price : NaN,
        currency: /^[A-Z]{3}$/.test(fields.currency || '') ? fields.currency : 'USD',
        frequency: ALLOWED_FREQUENCIES.includes(fields.frequency) ? fields.frequency : 'monthly',
        category: ALLOWED_CATEGORIES.includes(fields.category) ? fields.category : 'Others',
        paymentMethod: typeof fields.paymentMethod === 'string' && fields.paymentMethod.trim()
            ? fields.paymentMethod.trim()
            : 'Unknown',
        startDate: fields.startDate ? new Date(fields.startDate) : new Date(),
        notes: typeof fields.notes === 'string' ? fields.notes : '',
        status: 'active',
    };
    if (!data.name || data.name.length < 2) throw new Error('Missing name');
    if (!Number.isFinite(data.price) || data.price <= 0) throw new Error('Invalid price');
    if (Number.isNaN(data.startDate.getTime())) data.startDate = new Date();
    return data;
};

// Partial sanitize for "update" — only validates fields the AI actually included.
const sanitizeExpensePartial = (fields) => {
    const out = {};
    if (!fields || typeof fields !== 'object') return out;
    if (typeof fields.title === 'string' && fields.title.trim().length >= 2) {
        out.title = fields.title.slice(0, 100);
    }
    if (typeof fields.amount === 'number' && Number.isFinite(fields.amount) && fields.amount > 0) {
        out.amount = fields.amount;
    }
    if (typeof fields.currency === 'string' && /^[A-Z]{3}$/.test(fields.currency)) {
        out.currency = fields.currency;
    }
    if (typeof fields.category === 'string' && ALLOWED_CATEGORIES.includes(fields.category)) {
        out.category = fields.category;
    }
    if (fields.date !== undefined && fields.date !== null) {
        const d = new Date(fields.date);
        if (!Number.isNaN(d.getTime())) out.date = d;
    }
    if (typeof fields.notes === 'string') out.notes = fields.notes;
    return out;
};

const sanitizeSubscriptionPartial = (fields) => {
    const out = {};
    if (!fields || typeof fields !== 'object') return out;
    if (typeof fields.name === 'string' && fields.name.trim().length >= 2) {
        out.name = fields.name.slice(0, 100);
    }
    if (typeof fields.price === 'number' && Number.isFinite(fields.price) && fields.price > 0) {
        out.price = fields.price;
    }
    if (typeof fields.currency === 'string' && /^[A-Z]{3}$/.test(fields.currency)) {
        out.currency = fields.currency;
    }
    if (typeof fields.frequency === 'string' && ALLOWED_FREQUENCIES.includes(fields.frequency)) {
        out.frequency = fields.frequency;
    }
    if (typeof fields.category === 'string' && ALLOWED_CATEGORIES.includes(fields.category)) {
        out.category = fields.category;
    }
    if (typeof fields.paymentMethod === 'string' && fields.paymentMethod.trim()) {
        out.paymentMethod = fields.paymentMethod.trim();
    }
    if (fields.startDate !== undefined && fields.startDate !== null) {
        const d = new Date(fields.startDate);
        if (!Number.isNaN(d.getTime())) out.startDate = d;
    }
    if (typeof fields.notes === 'string') out.notes = fields.notes;
    if (typeof fields.status === 'string' && ['active', 'cancelled', 'expired'].includes(fields.status)) {
        out.status = fields.status;
    }
    return out;
};

const formatMoney = (amount, currency) => `${amount.toFixed(2)} ${currency}`;
const fmtDate = (d) => new Date(d).toISOString().slice(0, 10);
const confLine = (parsed) =>
    typeof parsed.confidence === 'number'
        ? `_AI confidence: ${(parsed.confidence * 100).toFixed(0)}%_`
        : null;

const expenseSummary = (e) =>
    [
        `*${e.title}* — ${formatMoney(e.amount, e.currency)}`,
        `Category: ${e.category}`,
        `Date: ${fmtDate(e.date)}`,
    ].join('\n');

const subscriptionSummary = (s) =>
    [
        `*${s.name}* — ${formatMoney(s.price, s.currency)} / ${s.frequency}`,
        `Category: ${s.category}`,
        `Payment: ${s.paymentMethod}`,
        `Start: ${fmtDate(s.startDate)}`,
        s.renewalDate ? `Next renewal: ${fmtDate(s.renewalDate)}` : null,
    ].filter(Boolean).join('\n');

// Build the CONTEXT object the AI uses to identify update/delete targets.
// Limit to keep prompt size bounded.
const CONTEXT_EXPENSE_DAYS = 60;
const CONTEXT_EXPENSE_LIMIT = 50;

const buildContext = async (userId) => {
    const sinceDate = new Date();
    sinceDate.setUTCDate(sinceDate.getUTCDate() - CONTEXT_EXPENSE_DAYS);

    const [expenses, subscriptions] = await Promise.all([
        expenseRepository.find({ user: userId, date: { $gte: sinceDate } }),
        subscriptionRepository.find({ user: userId, status: 'active' }),
    ]);

    const expenseList = expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, CONTEXT_EXPENSE_LIMIT)
        .map((e) => ({
            id: e._id.toString(),
            title: e.title,
            amount: e.amount,
            currency: e.currency,
            category: e.category,
            date: fmtDate(e.date),
        }));

    const subList = subscriptions.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        price: s.price,
        currency: s.currency,
        frequency: s.frequency,
        category: s.category,
        startDate: fmtDate(s.startDate),
    }));

    return { expenses: expenseList, subscriptions: subList };
};

// Resolve & enforce ownership for an update/delete target id. Throws otherwise.
const findOwnedRecord = async (type, id, userId) => {
    const repository = type === 'expense' ? expenseRepository : subscriptionRepository;
    const doc = await repository.findById(id);
    if (!doc) throw new Error(`${type} not found`);
    if (doc.user.toString() !== userId.toString()) {
        throw new Error('You do not own that record');
    }
    return doc;
};

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

    const context = await buildContext(user._id);

    let parsed;
    try {
        parsed = await ai.parseRecord({ text, images, context });
    } catch (err) {
        console.error('[telegram-bot] AI parse failed:', err);
        await safeReply(bot, chatId, `AI parsing failed: ${err.message}`);
        await repo.clearPendingAdd(botDocId);
        return;
    }

    try {
        const action = parsed.action || (parsed.type ? 'create' : null);
        const type = parsed.type;
        if (!['create', 'update', 'delete'].includes(action)) {
            throw new Error(`Unknown action: ${action}`);
        }
        if (!['expense', 'subscription'].includes(type)) {
            throw new Error(`Unknown type: ${type}`);
        }

        // For update/delete, verify targetId is among the records we showed the AI.
        if (action === 'update' || action === 'delete') {
            const allowedIds = new Set(
                (type === 'expense' ? context.expenses : context.subscriptions).map((r) => r.id)
            );
            if (!parsed.targetId || !allowedIds.has(parsed.targetId)) {
                throw new Error(
                    `AI referenced an unknown ${type} id "${parsed.targetId || ''}" — refusing to ${action}.`
                );
            }
        }

        if (action === 'create' && type === 'expense') {
            const data = sanitizeExpenseFull(parsed.fields || parsed);
            const prepared = await expenseService.prepareExpenseData({ ...data, user: user._id });
            const created = await expenseRepository.create(prepared);
            await safeReply(
                bot,
                chatId,
                ['✅ *Expense added*', expenseSummary(created), confLine(parsed)]
                    .filter(Boolean)
                    .join('\n'),
                { parse_mode: 'Markdown' }
            );
        } else if (action === 'create' && type === 'subscription') {
            const data = sanitizeSubscriptionFull(parsed.fields || parsed);
            const prepared = await subscriptionService.prepareSubscriptionData({
                ...data,
                user: user._id,
            });
            const created = await subscriptionRepository.create(prepared);
            await safeReply(
                bot,
                chatId,
                ['✅ *Subscription added*', subscriptionSummary(created), confLine(parsed)]
                    .filter(Boolean)
                    .join('\n'),
                { parse_mode: 'Markdown' }
            );
        } else if (action === 'update' && type === 'expense') {
            const existing = await findOwnedRecord('expense', parsed.targetId, user._id);
            const partial = sanitizeExpensePartial(parsed.fields);
            if (Object.keys(partial).length === 0) {
                throw new Error('AI did not specify any fields to change');
            }
            const prepared = await expenseService.prepareExpenseData(partial, existing);
            const updated = await expenseRepository.update(existing._id, prepared);
            await safeReply(
                bot,
                chatId,
                [
                    '🔧 *Expense updated*',
                    expenseSummary(updated),
                    `_Changed: ${Object.keys(partial).join(', ')}_`,
                    confLine(parsed),
                ]
                    .filter(Boolean)
                    .join('\n'),
                { parse_mode: 'Markdown' }
            );
        } else if (action === 'update' && type === 'subscription') {
            const existing = await findOwnedRecord('subscription', parsed.targetId, user._id);
            const partial = sanitizeSubscriptionPartial(parsed.fields);
            if (Object.keys(partial).length === 0) {
                throw new Error('AI did not specify any fields to change');
            }
            const prepared = await subscriptionService.prepareSubscriptionData(partial, existing);
            const updated = await subscriptionRepository.update(existing._id, prepared);
            await safeReply(
                bot,
                chatId,
                [
                    '🔧 *Subscription updated*',
                    subscriptionSummary(updated),
                    `_Changed: ${Object.keys(partial).join(', ')}_`,
                    confLine(parsed),
                ]
                    .filter(Boolean)
                    .join('\n'),
                { parse_mode: 'Markdown' }
            );
        } else if (action === 'delete' && type === 'expense') {
            const existing = await findOwnedRecord('expense', parsed.targetId, user._id);
            await expenseRepository.deleteById(existing._id);
            await safeReply(
                bot,
                chatId,
                [
                    '🗑 *Expense deleted*',
                    expenseSummary(existing),
                    confLine(parsed),
                ]
                    .filter(Boolean)
                    .join('\n'),
                { parse_mode: 'Markdown' }
            );
        } else if (action === 'delete' && type === 'subscription') {
            const existing = await findOwnedRecord('subscription', parsed.targetId, user._id);
            await subscriptionRepository.deleteById(existing._id);
            await safeReply(
                bot,
                chatId,
                [
                    '🗑 *Subscription deleted*',
                    subscriptionSummary(existing),
                    confLine(parsed),
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
            `Could not apply record: ${err.message}\n\nRaw AI output:\n\`\`\`\n${JSON.stringify(parsed, null, 2)}\n\`\`\``,
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
