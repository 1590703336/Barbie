import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a valid name'],
        trim: true,
        minLength: 2,
        maxLength: 50,
    },
    email: {
        type: String,
        required: [true, 'Please enter a email address'],
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
        lowercase: true,
        unique: true,

    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: 6,
    }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;

// { name: 'John Doe', email: 'johnny@email.com', password: 'password' }