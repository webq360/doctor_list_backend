import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const conn = await mongoose.connect(process.env.MONGO_URI as string);
  console.log(`MongoDB connected: ${conn.connection.host}`);

  // Fix: drop non-sparse email index if it exists (causes null duplicate error for phone-only users)
  try {
    await conn.connection.collection('users').dropIndex('email_1');
    console.log('[DB] Dropped old email_1 index');
  } catch (_) {
    // Index may not exist or already sparse — ignore
  }
};
