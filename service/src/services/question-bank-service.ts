import QuestionBank, { IQuestionBank } from '../models/question-bank';
import { wordBankService } from './word-bank-service';
import { logger } from '../lib/logger';

/**
 * Question bank service response
 */
export interface QuestionBankResponse {
  question: string;
  correctAnswer: string;
  bluffSuggestions: string[];
  lieSuggestions: string[];
  model: string;
  usedFallback: boolean;
  category?: string;
  difficulty?: string;
}

/**
 * Question Bank Service
 * Fetches pre-generated questions from MongoDB
 * Falls back to word bank if MongoDB is empty or fails
 */
export class QuestionBankService {
  /**
   * Get random question from MongoDB
   * Falls back to word bank if database is empty
   */
  async getRandomQuestion(playerCount: number): Promise<QuestionBankResponse> {
    try {
      // Try to get question from MongoDB
      const question = await QuestionBank.getRandom();
      
      if (question) {
        logger.info({ category: question.category, difficulty: question.difficulty }, 'Question fetched from MongoDB');
        
        // Ensure we have enough bluff suggestions for the player count
        const bluffsNeeded = Math.max(2, playerCount - 1);
        const shuffledBluffs = this.shuffleArray([...question.bluffSuggestions]).slice(0, bluffsNeeded);
        
        return {
          question: question.question,
          correctAnswer: question.correctAnswer,
          bluffSuggestions: shuffledBluffs,
          lieSuggestions: question.lieSuggestions,
          model: 'question-bank',
          usedFallback: false,
          category: question.category,
          difficulty: question.difficulty,
        };
      }
      
      // MongoDB empty, fall back to word bank
      logger.warn('Question bank is empty, falling back to word bank');
      return this.getFallbackQuestion(playerCount);
      
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Question bank error');
      logger.warn('Falling back to word bank');
      return this.getFallbackQuestion(playerCount);
    }
  }

  /**
   * Get random lie suggestion for a Red Herring player
   */
  getRandomLieSuggestion(existingAnswers?: string[]): Promise<{
    lieSuggestion: string;
    usedFallback: boolean;
  }> {
    // For now, use word bank lie suggestions
    // In the future, we can store lie suggestions in MongoDB too
    return Promise.resolve(wordBankService.generateLieSuggestion());
  }

  /**
   * Get total question count in database
   */
  async getTotalCount(): Promise<number> {
    try {
      return await QuestionBank.countDocuments();
    } catch (error) {
      logger.error(`Failed to count questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 0;
    }
  }

  /**
   * Get questions by category
   */
  async getByCategory(category: string): Promise<IQuestionBank[]> {
    try {
      return await QuestionBank.find({ category }).sort({ usageCount: 1 }).limit(10);
    } catch (error) {
      logger.error(`Failed to get questions by category: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Get questions by difficulty
   */
  async getByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<IQuestionBank[]> {
    try {
      return await QuestionBank.find({ difficulty }).sort({ usageCount: 1 }).limit(10);
    } catch (error) {
      logger.error(`Failed to get questions by difficulty: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Fallback to word bank service
   */
  private getFallbackQuestion(playerCount: number): QuestionBankResponse {
    const wordBankData = wordBankService.generateRoundData(playerCount);
    const lieData = wordBankService.generateLieSuggestion();
    
    return {
      ...wordBankData,
      lieSuggestions: [lieData.lieSuggestion],
      usedFallback: true,
    };
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Export singleton instance
export const questionBankService = new QuestionBankService();
