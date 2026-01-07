import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        enum: ['EUR', 'USD', 'CNY', 'AUD'],
        default: 'USD',
        required: true
    },
    amountUSD: {
        type: Number,
        required: true
    },
    source: {
        type: String,
        default: '',
        required: false
    },
    category: {
        type: String,
        required: true,
        enum: ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'],
        default: 'Other'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    notes: {
        type: String,
        default: '',
        required: false
    }
}, {
    timestamps: true
});

const Income = mongoose.model('Income', incomeSchema);

export default Income;
