/**
 * Question Bank Seed Script
 * 
 * Usage: bun run scripts/seed-questions.ts
 * 
 * This script seeds the MongoDB database with pre-generated questions.
 * Currently includes mockup data for testing.
 * 
 * Future: Replace mockup data with AI-generated questions using a separate script.
 */

import mongoose from 'mongoose';
import QuestionBank from '../src/models/question-bank';
import { logger } from '../src/lib/logger';

// Mockup data for testing (5-10 sample questions)
const mockupQuestions = [
  {
    question: "What is the largest mammal in the world?",
    correctAnswer: "Blue Whale",
    bluffSuggestions: ["African Elephant", "Giraffe", "Hippopotamus", "Rhino"],
    lieSuggestions: [
      "I remember seeing this in a nature documentary",
      "My biology teacher taught me this"
    ],
    category: "Animals",
    difficulty: "easy" as const,
  },
  {
    question: "What is the capital of France?",
    correctAnswer: "Paris",
    bluffSuggestions: ["Lyon", "Marseille", "Nice", "Versailles"],
    lieSuggestions: [
      "I learned this in French class",
      "I've been there on vacation"
    ],
    category: "Geography",
    difficulty: "easy" as const,
  },
  {
    question: "What planet is known as the Red Planet?",
    correctAnswer: "Mars",
    bluffSuggestions: ["Venus", "Jupiter", "Saturn", "Mercury"],
    lieSuggestions: [
      "I read about this in a science magazine",
      "My astronomer friend told me"
    ],
    category: "Science",
    difficulty: "easy" as const,
  },
  {
    question: "Who painted the Mona Lisa?",
    correctAnswer: "Leonardo da Vinci",
    bluffSuggestions: ["Michelangelo", "Raphael", "Donatello", "Vincent van Gogh"],
    lieSuggestions: [
      "I saw this in an art history book",
      "I visited the Louvre and saw it"
    ],
    category: "Art",
    difficulty: "medium" as const,
  },
  {
    question: "What is the chemical symbol for gold?",
    correctAnswer: "Au",
    bluffSuggestions: ["Ag", "Fe", "Gd", "Go"],
    lieSuggestions: [
      "I remember this from chemistry class",
      "My chemist uncle told me this"
    ],
    category: "Science",
    difficulty: "medium" as const,
  },
  {
    question: "What is the tallest mountain in the world?",
    correctAnswer: "Mount Everest",
    bluffSuggestions: ["K2", "Kangchenjunga", "Makalu", "Lhotse"],
    lieSuggestions: [
      "I saw a documentary about mountain climbing",
      "My geography teacher taught me this"
    ],
    category: "Geography",
    difficulty: "easy" as const,
  },
  {
    question: "What is the fastest land animal?",
    correctAnswer: "Cheetah",
    bluffSuggestions: ["Lion", "Leopard", "Gazelle", "Horse"],
    lieSuggestions: [
      "I watched this on Animal Planet",
      "I learned this at the zoo"
    ],
    category: "Animals",
    difficulty: "easy" as const,
  },
  {
    question: "In what year did World War II end?",
    correctAnswer: "1945",
    bluffSuggestions: ["1944", "1946", "1943", "1950"],
    lieSuggestions: [
      "My grandfather told me about this",
      "I read about it in a history book"
    ],
    category: "History",
    difficulty: "medium" as const,
  },
  {
    question: "What is the largest ocean on Earth?",
    correctAnswer: "Pacific Ocean",
    bluffSuggestions: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Southern Ocean"],
    lieSuggestions: [
      "I learned this in geography class",
      "I saw it on a world map"
    ],
    category: "Geography",
    difficulty: "easy" as const,
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    correctAnswer: "William Shakespeare",
    bluffSuggestions: ["Charles Dickens", "Jane Austen", "Mark Twain", "Oscar Wilde"],
    lieSuggestions: [
      "I studied this in English literature",
      "I saw the play in theater class"
    ],
    category: "Literature",
    difficulty: "medium" as const,
  },
];

async function seedQuestions() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sounds-fishy';
    
    logger.info(`🔌 Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB connected');

    // Check for duplicates and insert
    let insertedCount = 0;
    let skippedCount = 0;

    for (const questionData of mockupQuestions) {
      // Check if question already exists
      const existing = await QuestionBank.findOne({
        question: questionData.question
      });

      if (existing) {
        logger.info(`⏭️  Skipped (duplicate): "${questionData.question}"`);
        skippedCount++;
        continue;
      }

      // Insert new question
      const question = await QuestionBank.create(questionData);
      logger.info(`✅ Inserted: "${question.question}" (${question.category}, ${question.difficulty})`);
      insertedCount++;
    }

    // Summary
    logger.info('\n📊 Seed Summary:');
    logger.info(`   Inserted: ${insertedCount} questions`);
    logger.info(`   Skipped: ${skippedCount} duplicates`);
    logger.info(`   Total in database: ${await QuestionBank.countDocuments()}`);

    // Disconnect
    await mongoose.disconnect();
    logger.info('\n👋 Disconnected from MongoDB');

  } catch (error) {
    logger.error(`❌ Seed error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Run the seed script
seedQuestions();
