import mongoose from 'mongoose';

const convertPairSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    fromCurrency: {
        type: String,
        required: [true, 'From currency is required'],
        match: [/^[A-Z]{3}$/, 'Please enter a valid 3-letter currency code'],
    },
    toCurrency: {
        type: String,
        required: [true, 'To currency is required'],
        match: [/^[A-Z]{3}$/, 'Please enter a valid 3-letter currency code'],
    }
}, { timestamps: true });

const ConvertPair = mongoose.model('ConvertPair', convertPairSchema);
export default ConvertPair;
