import { logger } from './logger';

/**
 * AI Configuration
 * Validates and provides access to AI service configuration
 */

export interface AIConfig {
    geminiApiKey: string;
    geminiModel: string;
    enabled: boolean;
}

/**
 * Load and validate AI configuration from environment variables
 */
export function loadAIConfig(): AIConfig {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const enabled = !!geminiApiKey;

    if (!enabled) {
        logger.warn('GEMINI_API_KEY not set - AI question generation disabled');
    }

    return {
        geminiApiKey: geminiApiKey || '',
        geminiModel,
        enabled
    };
}

// Export singleton config
export const aiConfig = loadAIConfig();
