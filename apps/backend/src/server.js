import app from "./app.js";
import { PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import * as botManager from "./modules/telegramBot/botManager.js";

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${ PORT }`);

    await connectToDatabase();

    // Boot Telegram bot polling for any bot owned by this instance.
    botManager.bootstrap().catch((err) => {
        console.error('[telegram-bot] bootstrap failed:', err);
    });
});

const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down telegram bots…`);
    try {
        await botManager.shutdown();
    } catch (err) {
        console.error('[telegram-bot] shutdown error:', err);
    }
    process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));