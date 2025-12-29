import mongoose from 'mongoose';
import { DB_URI, NODE_ENV } from "../config/env.js";

if(!DB_URI){
    throw new Error("MongoDB URI doesn't exist");
}

const connectToDatabase = async () => {
    try {
        await mongoose.connect(DB_URI);

        console.log(`MongoDB Connected in ${NODE_ENV} mode`);
    } catch (error) {
        console.error('MongoDB connection failed: ', error);

        process.exit(1);
    }
}

export default connectToDatabase;