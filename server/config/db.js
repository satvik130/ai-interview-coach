import mongoose from 'mongoose';

/**
 * Connects to MongoDB using Mongoose.
 * Uses MONGO_URI from environment variables, with a fallback to local MongoDB.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_interview_coach';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.log('[MongoDB] Running without active database connection. Ensure MongoDB is running for data persistence.');
  }
};

export default connectDB;
