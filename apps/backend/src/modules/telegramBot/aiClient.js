import OpenAI from 'openai';
import { SUB2API_BASE_URL, SUB2API_KEY, SUB2API_MODEL } from '../../config/env.js';

let client = null;

const getClient = () => {
    if (!SUB2API_KEY || !SUB2API_BASE_URL) {
        throw new Error('sub2api is not configured (SUB2API_KEY / SUB2API_BASE_URL)');
    }
    if (!client) {
        client = new OpenAI({ apiKey: SUB2API_KEY, baseURL: SUB2API_BASE_URL });
    }
    return client;
};

const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Others'];
const ALLOWED_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

const RECORD_SYSTEM_PROMPT = `You are a financial-record parser for the Barbie expense tracker.
The user sends a free-text description and/or a photo (receipt, screenshot, etc.).
You also receive CONTEXT — the user's existing expenses and active subscriptions
each with an "id". Decide which of SIX actions to take, then output STRICT JSON only.

Actions:
  create_expense          — record a brand-new one-off expense
  create_subscription     — record a brand-new recurring subscription
  update_expense          — modify a field on an EXISTING expense in CONTEXT.expenses
  update_subscription     — modify a field on an EXISTING subscription in CONTEXT.subscriptions
  delete_expense          — delete an EXISTING expense in CONTEXT.expenses
  delete_subscription     — delete an EXISTING subscription in CONTEXT.subscriptions

Output a single JSON object with this exact shape:
{
  "action": "create" | "update" | "delete",
  "type":   "expense" | "subscription",
  "targetId": string | null,
  "fields": object | null,
  "confidence": number 0..1
}

Field rules:
- For "create": targetId MUST be null. fields MUST include all required attributes
  for the type:
    expense:      { "title": string(2-100), "amount": positive number, "currency": ISO-4217,
                    "category": ${JSON.stringify(ALLOWED_CATEGORIES)},
                    "date": ISO 8601, "notes": string? }
    subscription: { "name": string(2-100), "price": positive number, "currency": ISO-4217,
                    "frequency": ${JSON.stringify(ALLOWED_FREQUENCIES)},
                    "category": ${JSON.stringify(ALLOWED_CATEGORIES)},
                    "paymentMethod": string, "startDate": ISO 8601, "notes": string? }
- For "update": targetId MUST be one of the ids in the matching CONTEXT array.
  fields contains ONLY the attributes the user wants to change (omit unchanged ones).
- For "delete": targetId MUST be one of the ids in the matching CONTEXT array.
  fields MUST be null.
- NEVER invent an id that does not appear in CONTEXT.
- Match the target by name/title/amount/date/category as best you can. If multiple
  records are equally plausible, prefer the most recent.
- Default to "create" only when the user is clearly recording something new and no
  existing record matches their description.
- If the currency is shown as a symbol (e.g. $, ¥, £, €), infer the most likely ISO code.
- Never invent figures that aren't in the input. If the amount is unreadable, set
  confidence < 0.3 and best-guess 0.

Examples of trigger phrases:
  "delete the netflix sub"        -> delete_subscription, targetId of Netflix
  "change yesterday's lunch to 15" -> update_expense, fields={amount: 15}
  "i bought coffee for 5"          -> create_expense, fields={...}`;

export const parseRecord = async ({ text, images = [], context = null }) => {
    const userContent = [];

    const intro = text ? text : 'Parse this transaction.';
    if (context) {
        userContent.push({
            type: 'text',
            text:
                `User input: ${intro}\n\n` +
                `CONTEXT (existing records you may target for update/delete):\n` +
                `${JSON.stringify(context, null, 2)}`,
        });
    } else {
        userContent.push({ type: 'text', text: intro });
    }

    for (const img of images) {
        userContent.push({
            type: 'image_url',
            image_url: { url: img },
        });
    }

    const completion = await getClient().chat.completions.create({
        model: SUB2API_MODEL || 'gpt-5.5',
        messages: [
            { role: 'system', content: RECORD_SYSTEM_PROMPT },
            { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error('AI returned empty response');
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error(`AI returned non-JSON response: ${raw.slice(0, 200)}`);
    }
    return parsed;
};

const REPORT_SYSTEM_PROMPT = `You are a friendly personal-finance assistant.
Given the user's recent expenses, active subscriptions, and current budgets (all JSON),
write a concise readable report in Chinese (Markdown).

Structure:
- 简要总结(1-2 sentences)
- 支出亮点(top categories with amounts, recent date range)
- 订阅情况(count, monthly cost estimate, upcoming renewals if any)
- 预算状态(any category over/near limit)
- 建议(1-2 short, actionable tips)

Keep the entire output under ~400 Chinese characters. Bold key numbers with **. Do not invent data not present in the input.`;

export const generateReport = async (payload) => {
    const completion = await getClient().chat.completions.create({
        model: SUB2API_MODEL || 'gpt-5.5',
        messages: [
            { role: 'system', content: REPORT_SYSTEM_PROMPT },
            {
                role: 'user',
                content: `Here is the JSON for my finances:\n\n${JSON.stringify(payload, null, 2)}`,
            },
        ],
        temperature: 0.4,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error('AI returned empty report');
    return raw.trim();
};
