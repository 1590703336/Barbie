import mongoose from 'mongoose';

const chatBindingSchema = new mongoose.Schema(
    {
        chatId: { type: Number, required: true },
        boundAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const pendingAddSchema = new mongoose.Schema(
    {
        chatId: { type: Number, required: true },
        expiresAt: { type: Date, required: true },
    },
    { _id: false }
);

const telegramBotSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        // AES-256-GCM encrypted bot token, format: iv:authTag:ciphertext (all hex)
        botTokenEncrypted: {
            type: String,
            required: true,
        },
        botUsername: {
            type: String,
            required: true,
        },
        botId: {
            type: Number,
            required: true,
        },
        chatBindings: {
            type: [chatBindingSchema],
            default: [],
        },
        pendingAdd: {
            type: pendingAddSchema,
            default: null,
        },
        status: {
            type: String,
            enum: ['active', 'disabled'],
            default: 'active',
            index: true,
        },
        // Stable per-deployment identifier of the instance currently polling this bot.
        // Only the instance whose BARBIE_INSTANCE_ID matches will start a bot client.
        runningOn: {
            type: String,
            default: null,
            index: true,
        },
        claimedAt: {
            type: Date,
            default: null,
        },
        heartbeatAt: {
            type: Date,
            default: null,
        },
        lastError: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

telegramBotSchema.index({ 'chatBindings.chatId': 1 });

telegramBotSchema.set('toJSON', {
    virtuals: true,
    transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.botTokenEncrypted;
    },
});

const TelegramBotConfig = mongoose.model('TelegramBotConfig', telegramBotSchema);
export default TelegramBotConfig;
