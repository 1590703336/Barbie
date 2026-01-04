import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'subscription name is required'],
        trim: true,
        minlength: 3,
        maxlength: 100,
    },
    price: {
        type: Number,
        required: [true, 'subscription price is required'],
        min: [0, 'subscription price must be greater than 0'],
    },
    amountUSD: {
        type: Number,
        required: false, // Optional for backward compatibility
    },
    currency: {
        type: String,
        enum: ['EUR', 'USD', 'CNY', 'AUD'],
        default: 'USD',
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    category: {
        type: String,
        enum: [
            'Food',
            'Transport',
            'Entertainment',
            'Utilities',
            'Rent',
            'Health',
            'Others',
        ],
        default: 'Others',
        required: true,
    },
    paymentMethod: {
        type: String,
        required: [true, 'subscription methods is required'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active',
    },
    startDate: {
        type: Date,
        required: [true, 'subscription startDate is required'],
        validate: {
            validator: (value) => value <= new Date(),
            message: 'start data must be in the past',
        }
    },
    renewalDate: {
        type: Date,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    }
}, { timestamps: true });



const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;