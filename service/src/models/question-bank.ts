import mongoose, { Document, Schema } from 'mongoose';

/**
 * Question Bank Document
 * Stores questions with correct and fake answers for Sounds Fishy game
 */
export interface IQuestionBank extends Document {
    question: string;
    correctAnswer: string;
    fakeAnswers: string[];
    category?: string;
    language?: 'english' | 'thai';
    difficulty?: 'easy' | 'medium' | 'hard';
    createdAt: Date;
    updatedAt: Date;
}

const QuestionBankSchema = new Schema<IQuestionBank>({
    question: { 
        type: String, 
        required: true,
        trim: true 
    },
    correctAnswer: { 
        type: String, 
        required: true,
        trim: true 
    },
    fakeAnswers: { 
        type: [String], 
        required: true,
        validate: {
            validator: (answers: string[]) => answers.length >= 3,
            message: 'At least 3 fake answers required'
        }
    },
    category: { 
        type: String, 
        default: 'general',
        trim: true 
    },
    language: { 
        type: String, 
        enum: ['english', 'thai'],
        default: 'english' 
    },
    difficulty: { 
        type: String, 
        enum: ['easy', 'medium', 'hard'],
        default: 'medium' 
    }
}, {
    timestamps: true
});

// Index for random selection with filtering
QuestionBankSchema.index({ language: 1, difficulty: 1 });

/**
 * Question Bank Model
 */
export const QuestionBankModel = mongoose.model<IQuestionBank>('QuestionBank', QuestionBankSchema);
