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

const RECORD_SYSTEM_PROMPT = `You are a financial transaction parser for the Barbie expense tracker.
The user will send you a screenshot, a photo of a receipt, and/or a free-text description.
Your job: decide whether this is a one-off EXPENSE or a recurring SUBSCRIPTION, then extract structured data.

Output STRICT JSON only, no markdown, with EXACTLY one of these shapes:

For an expense:
{
  "type": "expense",
  "title": string (2-100 chars),
  "amount": number (positive),
  "currency": ISO-4217 3-letter code, default "USD",
  "category": one of ${JSON.stringify(ALLOWED_CATEGORIES)},
  "date": ISO 8601 date string, default today,
  "notes": string (optional),
  "confidence": number 0..1
}

For a subscription:
{
  "type": "subscription",
  "name": string (2-100 chars),
  "price": number (positive),
  "currency": ISO-4217 3-letter code, default "USD",
  "frequency": one of ${JSON.stringify(ALLOWED_FREQUENCIES)},
  "category": one of ${JSON.stringify(ALLOWED_CATEGORIES)},
  "paymentMethod": string (e.g. "Visa", "PayPal", "Unknown"),
  "startDate": ISO 8601 date string, default today,
  "notes": string (optional),
  "confidence": number 0..1
}

Rules:
- Pick "subscription" only if the input clearly indicates recurring billing (monthly/annual plan, "subscription", "renewal", "auto-renew").
- Otherwise default to "expense".
- If the currency is shown as a symbol (e.g. $, ¥, £, €), infer the most likely ISO code.
- If something is missing, use sensible defaults (today's date, "USD", "Others", "Unknown").
- Never invent figures that aren't in the input. If the amount is unreadable, set confidence < 0.3 and best-guess 0.`;

export const parseRecord = async ({ text, images = [] }) => {
    const userContent = [];
    if (text) {
        userContent.push({ type: 'text', text });
    } else {
        userContent.push({ type: 'text', text: 'Parse this transaction.' });
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
