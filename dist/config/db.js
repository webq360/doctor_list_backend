"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    const conn = await mongoose_1.default.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    // Fix: drop non-sparse email index if it exists (causes null duplicate error for phone-only users)
    try {
        await conn.connection.collection('users').dropIndex('email_1');
        console.log('[DB] Dropped old email_1 index');
    }
    catch (_) {
        // Index may not exist or already sparse — ignore
    }
};
exports.connectDB = connectDB;
