import mongoose from 'mongoose';
import { logger } from './logger';

/**
 * Connect to MongoDB database
 * Uses Mongoose ODM for schema-based data modeling
 */
export async function connectDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri);

    logger.info('✅ MongoDB connected successfully');
    logger.info(`📦 Database: ${mongoose.connection.name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ MongoDB connection error: ${errorMessage}`);
    logger.error('\n⚠️  To fix this, choose one option:');
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

/**
 * Disconnect from MongoDB (for graceful shutdown)
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('🔌 MongoDB disconnected');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error disconnecting MongoDB: ${errorMessage}`);
  }
}
