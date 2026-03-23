import { logger } from './logger';

/**
 * AI Configuration
 * Validates and provides access to AI service configuration
 * Supports OpenAI-compatible APIs (OpenAI, Gemini, etc.)
 */

export interface AIConfig {
    apiKey: string;
    model: string;
    baseURL?: string; // For custom endpoints like Gemini
    enabled: boolean;
}

/**
 * Load and validate AI configuration from environment variables
 */
export function loadAIConfig(): AIConfig {
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    const model = process.env.AI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const baseURL = process.env.AI_BASE_URL || process.env.GEMINI_BASE_URL;

    const enabled = !!apiKey;

    if (!enabled) {
        logger.warn('AI_API_KEY not set - AI question generation disabled');
        logger.warn('Set AI_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in .env file');
    }

    return {
        apiKey: apiKey || '',
        model,
        baseURL,
        enabled
    };
}

// Export singleton config
export const aiConfig = loadAIConfig();
