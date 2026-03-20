import mongoose, { Document, Schema } from 'mongoose';

/**
 * Question bank document interface
 * Represents a pre-generated question with answers and lie suggestions
 */
export interface IQuestionBank extends Document {
  question: string;
  correctAnswer: string;
  bluffSuggestions: string[];
  lieSuggestions: string[];
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Question Bank Schema
 * Stores pre-generated questions for the game
 * Used instead of AI generation for faster, more consistent gameplay
 */
const questionBankSchema = new Schema<IQuestionBank>({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true,
  },
  bluffSuggestions: {
    type: [String],
    required: true,
    default: [],
    validate: {
      validator: (bluffs: string[]) => bluffs.length >= 3,
      message: 'At least 3 bluff suggestions are required',
    },
  },
  lieSuggestions: {
    type: [String],
    required: true,
    default: [],
    validate: {
      validator: (lies: string[]) => lies.length >= 2,
      message: 'At least 2 lie suggestions are required',
    },
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Index for efficient random queries
questionBankSchema.index({ difficulty: 1, usageCount: 1 });
questionBankSchema.index({ category: 1, difficulty: 1 });

// Index for random selection
questionBankSchema.index({ __rand: '2dsphere' });

// Static method to get random question
questionBankSchema.statics.getRandom = async function(
  difficulty?: 'easy' | 'medium' | 'hard'
): Promise<IQuestionBank | null> {
  const query: any = {};
  
  if (difficulty) {
    query.difficulty = difficulty;
  }
  
  // Use aggregation for random selection
  const randomQuestion = await this.aggregate([
    { $match: query },
    { $sample: { size: 1 } }
  ]);
  
  if (randomQuestion.length === 0) {
    return null;
  }
  
  // Increment usage count
  const question = randomQuestion[0];
  await this.findByIdAndUpdate(question._id, {
    $inc: { usageCount: 1 }
  });
  
  return this.findById(question._id);
};

// Export model
export default mongoose.model<IQuestionBank>('QuestionBank', questionBankSchema);
