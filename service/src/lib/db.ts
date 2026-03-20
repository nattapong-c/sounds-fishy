import mongoose from 'mongoose';
import { logger } from './logger';

let isConnected = false;

export async function connectDB(): Promise<void> {
    if (isConnected) {
        logger.info('MongoDB already connected');
        return;
    }

    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sounds-fishy';
        
        await mongoose.connect(mongoUri);
        
        isConnected = true;
        logger.info({ mongoUri }, 'Connected to MongoDB');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error({ err }, 'MongoDB connection error');
            isConnected = false;
        });
        
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
            isConnected = false;
        });
        
    } catch (error) {
        logger.error({ error }, 'Failed to connect to MongoDB');
        throw error;
    }
}

export async function disconnectDB(): Promise<void> {
    if (!isConnected) return;
    
    try {
        await mongoose.disconnect();
        isConnected = false;
        logger.info('Disconnected from MongoDB');
    } catch (error) {
        logger.error({ error }, 'Error disconnecting from MongoDB');
    }
}
