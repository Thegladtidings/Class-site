import mongoose from "mongoose";
import { config } from "dotenv";

config();

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not set. Check the server .env file.");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "ClassDatabase"
        });
        console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

export default connectDB;