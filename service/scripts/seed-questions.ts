#!/usr/bin/env bun

/**
 * Seed Question Bank Script
 * Populates MongoDB with initial questions for Sounds Fishy game
 * 
 * Usage: bun run scripts/seed-questions.ts
 */

import mongoose from 'mongoose';
import { QuestionBankModel } from '../src/models/question-bank';
import { connectDB } from '../src/lib/db';

const questions = [
    // Kitchen & Food
    {
        question: "What's something you might find in a kitchen?",
        correctAnswer: "A spatula",
        fakeAnswers: ["A toaster oven", "A cutting board", "A blender", "A whisk"],
        category: "kitchen",
        language: "english",
        difficulty: "easy"
    },
    {
        question: "What's a popular breakfast food?",
        correctAnswer: "Pancakes",
        fakeAnswers: ["Cereal", "Toast", "Oatmeal", "Eggs"],
        category: "food",
        language: "english",
        difficulty: "easy"
    },
    {
        question: "What's something you use to clean your teeth?",
        correctAnswer: "A toothbrush",
        fakeAnswers: ["Dental floss", "Mouthwash", "Toothpaste", "Water pick"],
        category: "hygiene",
        language: "english",
        difficulty: "easy"
    },
    
    // Animals
    {
        question: "What's an animal that lives in the ocean?",
        correctAnswer: "A dolphin",
        fakeAnswers: ["A shark", "A whale", "A seal", "A jellyfish"],
        category: "animals",
        language: "english",
        difficulty: "easy"
    },
    {
        question: "What's an animal that can fly?",
        correctAnswer: "An eagle",
        fakeAnswers: ["A bat", "A pigeon", "A parrot", "An owl"],
        category: "animals",
        language: "english",
        difficulty: "easy"
    },
    {
        question: "What's a farm animal?",
        correctAnswer: "A cow",
        fakeAnswers: ["A pig", "A sheep", "A chicken", "A horse"],
        category: "animals",
        language: "english",
        difficulty: "easy"
    },
    
    // Jobs & Professions
    {
        question: "What's a job where you help sick people?",
        correctAnswer: "A doctor",
        fakeAnswers: ["A nurse", "A pharmacist", "A therapist", "A paramedic"],
        category: "jobs",
        language: "english",
        difficulty: "easy"
    },
    {
        question: "What's a job where you cook food?",
        correctAnswer: "A chef",
        fakeAnswers: ["A cook", "A baker", "A line cook", "A sous chef"],
        category: "jobs",
        language: "english",
        difficulty: "easy"
    },
    {
        question: "What's a job where you teach students?",
        correctAnswer: "A teacher",
        fakeAnswers: ["A professor", "A tutor", "An instructor", "A principal"],
        category: "jobs",
        language: "english",
        difficulty: "easy"
    },
    
    // Objects & Places
    {
        question: "What's something you bring to the beach?",
        correctAnswer: "A towel",
        fakeAnswers: ["Sunscreen", "A swimsuit", "A beach umbrella", "Flip flops"],
        category: "places",
        language: "english",
        difficulty: "medium"
    },
    {
        question: "What's something you find in a classroom?",
        correctAnswer: "A whiteboard",
        fakeAnswers: ["Desks", "Chairs", "A projector", "A clock"],
        category: "places",
        language: "english",
        difficulty: "easy"
    },
    {
        question: "What's something you wear in winter?",
        correctAnswer: "A coat",
        fakeAnswers: ["A scarf", "Gloves", "A hat", "Boots"],
        category: "clothing",
        language: "english",
        difficulty: "easy"
    },
    
    // Activities & Hobbies
    {
        question: "What's a sport played with a ball?",
        correctAnswer: "Soccer",
        fakeAnswers: ["Basketball", "Tennis", "Volleyball", "Baseball"],
        category: "sports",
        language: "english",
        difficulty: "easy"
    },
    {
        question: "What's a musical instrument with strings?",
        correctAnswer: "A guitar",
        fakeAnswers: ["A violin", "A cello", "A harp", "A ukulele"],
        category: "music",
        language: "english",
        difficulty: "medium"
    },
    {
        question: "What's something you do at a concert?",
        correctAnswer: "Listen to music",
        fakeAnswers: ["Dance", "Sing along", "Clap", "Take photos"],
        category: "activities",
        language: "english",
        difficulty: "medium"
    },
    
    // Technology
    {
        question: "What's something you use to browse the internet?",
        correctAnswer: "A web browser",
        fakeAnswers: ["A computer", "A smartphone", "A tablet", "WiFi"],
        category: "technology",
        language: "english",
        difficulty: "medium"
    },
    {
        question: "What's a social media platform?",
        correctAnswer: "Instagram",
        fakeAnswers: ["Facebook", "Twitter", "TikTok", "LinkedIn"],
        category: "technology",
        language: "english",
        difficulty: "easy"
    },
    
    // Harder Questions
    {
        question: "What's a famous landmark in Paris?",
        correctAnswer: "The Eiffel Tower",
        fakeAnswers: ["The Louvre", "Notre-Dame", "The Arc de Triomphe", "Versailles"],
        category: "travel",
        language: "english",
        difficulty: "medium"
    },
    {
        question: "What's a type of pasta?",
        correctAnswer: "Penne",
        fakeAnswers: ["Fettuccine", "Rigatoni", "Linguine", "Farfalle"],
        category: "food",
        language: "english",
        difficulty: "medium"
    },
    {
        question: "What's a primary color?",
        correctAnswer: "Blue",
        fakeAnswers: ["Red", "Yellow", "Green", "Purple"],
        category: "general",
        language: "english",
        difficulty: "easy"
    },
    
    // Thai Questions (for future localization)
    {
        question: "อะไรคือสิ่งที่คุณพบในครัว?",
        correctAnswer: "กระทะ",
        fakeAnswers: ["หม้อ", "มีด", "ช้อน", "จาน"],
        category: "kitchen",
        language: "thai",
        difficulty: "easy"
    },
    {
        question: "สัตว์อะไรอาศัยอยู่ในทะเล?",
        correctAnswer: "ปลาโลมา",
        fakeAnswers: ["ปลาฉลาม", "ปลาวาฬ", "แมงกะพรุน", "ปลาหมึก"],
        category: "animals",
        language: "thai",
        difficulty: "easy"
    }
];

async function seedQuestions() {
    try {
        console.log('🌱 Connecting to MongoDB...');
        await connectDB();
        
        console.log('📝 Clearing existing questions...');
        await QuestionBankModel.deleteMany({});
        
        console.log('📝 Inserting questions...');
        const inserted = await QuestionBankModel.insertMany(questions);
        
        console.log(`✅ Successfully seeded ${inserted.length} questions!`);
        console.log('\n📊 Breakdown:');
        console.log(`   English: ${inserted.filter(q => q.language === 'english').length}`);
        console.log(`   Thai: ${inserted.filter(q => q.language === 'thai').length}`);
        console.log(`   Easy: ${inserted.filter(q => q.difficulty === 'easy').length}`);
        console.log(`   Medium: ${inserted.filter(q => q.difficulty === 'medium').length}`);
        console.log(`   Hard: ${inserted.filter(q => q.difficulty === 'hard').length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding questions:', error);
        process.exit(1);
    }
}

seedQuestions();
