#!/usr/bin/env bun

/**
 * Seed Question Bank Script
 * Populates MongoDB with AI-generated questions for Sounds Fishy game
 *
 * Usage: 
 *   # English questions
 *   bun run scripts/seed-questions.ts                           # 10 English, general, medium
 *   bun run scripts/seed-questions.ts 20                        # 20 English, general, medium
 *   bun run scripts/seed-questions.ts --count 15                # 15 English, general, medium
 *   bun run scripts/seed-questions.ts --category animals        # English, animals category
 *   bun run scripts/seed-questions.ts --difficulty hard         # English, hard difficulty
 *   bun run scripts/seed-questions.ts -c food -d easy -n 25     # 25 English, food, easy
 *
 *   # Thai questions
 *   bun run scripts/seed-questions.ts --thai                    # 10 Thai, general, medium
 *   bun run scripts/seed-questions.ts --thai --count 15         # 15 Thai, general, medium
 *   bun run scripts/seed-questions.ts --thai -c animals -d hard # Thai, animals, hard
 */

import mongoose from 'mongoose';
import { QuestionBankModel } from '../src/models/question-bank';
import { connectDB } from '../src/lib/db';
import { generateQuestions } from '../src/services/ai-question-generator';
import { aiConfig } from '../src/lib/ai-config';

interface SeedOptions {
    count: number;
    language: 'english' | 'thai';
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

async function seedAIQuestions(options: SeedOptions) {
    const { count, language, category, difficulty } = options;
    
    try {
        console.log('🌱 Connecting to MongoDB...');
        await connectDB();

        // Check if AI is configured
        if (!aiConfig.enabled) {
            console.error('❌ AI not configured. Please set GEMINI_API_KEY in .env file');
            console.log('\n📝 Example .env file:');
            console.log('   GEMINI_API_KEY=your_api_key_here');
            console.log('   GEMINI_MODEL=gemini-2.5-flash');
            process.exit(1);
        }
        console.log('✅ AI configured successfully');

        // Get current question count
        const currentCount = await QuestionBankModel.countDocuments();
        console.log(`📊 Current questions in database: ${currentCount}`);

        // Generate questions with AI
        const langText = language === 'thai' ? 'Thai' : 'English';
        const catText = category ? ` (${category})` : '';
        const diffText = difficulty ? ` [${difficulty}]` : '';
        console.log(`🤖 Generating ${count} ${langText}${catText}${diffText} questions with AI...`);
        
        const generatedQuestions = await generateQuestions(count, category, difficulty, language);

        if (generatedQuestions.length === 0) {
            console.warn('⚠️  No questions generated. Check AI configuration and API quota.');
            process.exit(0);
        }

        console.log(`✅ Generated ${generatedQuestions.length} questions`);

        // Save questions to database
        let savedCount = 0;
        let duplicateCount = 0;

        for (const q of generatedQuestions) {
            // Check for duplicates
            const existing = await QuestionBankModel.findOne({
                question: q.question
            });

            if (existing) {
                console.log('⏭️  Skipping duplicate question:', q.question.substring(0, 50));
                duplicateCount++;
                continue;
            }

            // Save new question
            await QuestionBankModel.create(q);
            console.log('💾 Saved question:', q.question.substring(0, 50));
            savedCount++;
        }

        // Summary
        console.log('\n✨ Seed complete!');
        console.log('📊 Results:');
        console.log(`   - Generated: ${generatedQuestions.length}`);
        console.log(`   - Saved: ${savedCount}`);
        console.log(`   - Duplicates skipped: ${duplicateCount}`);

        const newTotal = currentCount + savedCount;
        console.log(`📚 Total questions in database: ${newTotal}`);

        // Language breakdown
        const langCount = savedCount > 0 ? await QuestionBankModel.countDocuments({ language }) : 0;
        console.log(`\n📊 ${langText} questions in database: ${langCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding questions:', error);
        process.exit(1);
    }
}

// Parse command line arguments
function parseArgs(): SeedOptions {
    const args = process.argv.slice(2);
    
    const options: SeedOptions = {
        count: 10,
        language: 'english',
        category: undefined,
        difficulty: undefined
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--thai') {
            options.language = 'thai';
        } else if (arg === '--count' || arg === '-n') {
            const count = parseInt(args[++i] || '10', 10);
            if (!isNaN(count) && count > 0) {
                options.count = count;
            }
        } else if (arg === '--category' || arg === '-c') {
            options.category = args[++i];
        } else if (arg === '--difficulty' || arg === '-d') {
            const diff = args[++i] as 'easy' | 'medium' | 'hard';
            if (['easy', 'medium', 'hard'].includes(diff)) {
                options.difficulty = diff;
            }
        } else if (!arg.startsWith('--') && !arg.startsWith('-')) {
            // Positional argument (count)
            const count = parseInt(arg, 10);
            if (!isNaN(count) && count > 0) {
                options.count = count;
            }
        }
    }

    return options;
}

// Main execution
const options = parseArgs();

const langText = options.language === 'thai' ? 'Thai' : 'English';
const catText = options.category ? ` (${options.category})` : '';
const diffText = options.difficulty ? ` [${options.difficulty}]` : '';

console.log('🤖 Mode: AI Question Generation');
console.log(`📝 Generating ${options.count} ${langText}${catText}${diffText} questions with Gemini AI\n`);
seedAIQuestions(options);
