import mongoose from 'mongoose';
import { logger } from './logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sounds-fishy';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error(`MongoDB connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.error('\n⚠️  MongoDB is not running or not installed.');
    logger.error('\nTo fix this, choose one option:');
    logger.error('  1. Install MongoDB locally:');
    logger.error('     brew install mongodb-community');
    logger.error('     brew services start mongodb-community\n');
    logger.error('  2. Use MongoDB Atlas (free cloud):');
    logger.error('     - Go to https://www.mongodb.com/cloud/atlas');
    logger.error('     - Create free cluster');
    logger.error('     - Set MONGODB_URI in .env file\n');
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error(`Error disconnecting MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

export function getDB() {
  return mongoose.connection;
}
