import { QuestionBankModel } from '../models/question-bank';
import { logger } from '../lib/logger';

/**
 * Question Bank Service
 * Handles retrieval of random questions for game sessions
 */

/**
 * Get a random question from the database
 * Optionally filter by language and difficulty
 */
export async function getRandomQuestion(
    language: 'english' | 'thai' = 'english',
    difficulty?: 'easy' | 'medium' | 'hard'
): Promise<{
    question: string;
    correctAnswer: string;
    fakeAnswers: string[];
} | null> {
    try {
        // Build query with filters
        const query: any = { language };
        if (difficulty) {
            query.difficulty = difficulty;
        }

        // Get count of matching questions
        const count = await QuestionBankModel.countDocuments(query);
        
        if (count === 0) {
            logger.warn({ query }, 'No questions found for filters');
            // Fallback: get any question
            const fallback = await QuestionBankModel.aggregate([{ $sample: { size: 1 } }]);
            if (fallback.length > 0) {
                return {
                    question: fallback[0].question,
                    correctAnswer: fallback[0].correctAnswer,
                    fakeAnswers: fallback[0].fakeAnswers
                };
            }
            return null;
        }

        // Random skip for uniform random selection
        const skip = Math.floor(Math.random() * count);
        
        const question = await QuestionBankModel.findOne(query).skip(skip);
        
        if (!question) {
            logger.error('Failed to retrieve random question');
            return null;
        }

        logger.info({ 
            questionId: question._id, 
            language, 
            difficulty: question.difficulty 
        }, 'Retrieved random question');

        return {
            question: question.question,
            correctAnswer: question.correctAnswer,
            fakeAnswers: question.fakeAnswers
        };
    } catch (error) {
        logger.error({ error }, 'Error getting random question');
        return null;
    }
}

/**
 * Get all questions (for admin/debugging)
 */
export async function getAllQuestions(
    page: number = 1,
    limit: number = 10,
    language?: 'english' | 'thai'
) {
    try {
        const query: any = {};
        if (language) {
            query.language = language;
        }

        const questions = await QuestionBankModel.find(query)
            .select('-__v')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await QuestionBankModel.countDocuments(query);

        return {
            questions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        logger.error({ error }, 'Error getting all questions');
        return null;
    }
}
