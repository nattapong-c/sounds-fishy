import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../lib/logger';
import { aiConfig } from '../lib/ai-config';
import { IFakeAnswer } from '../models/question-bank';

/**
 * AI Question Generator Service
 * Uses Gemini 2.5 Flash to generate trivia questions with fake answers and lie hints
 */

export interface GeneratedQuestion {
    question: string;
    correctAnswer: string;
    fakeAnswers: IFakeAnswer[];
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    language: 'english' | 'thai';
}

/**
 * Generate a single question using AI
 */
export async function generateQuestion(
    category?: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    language: 'english' | 'thai' = 'english'
): Promise<GeneratedQuestion | null> {
    if (!aiConfig.enabled) {
        logger.warn('AI not configured - cannot generate question');
        return null;
    }

    try {
        const genAI = new GoogleGenerativeAI(aiConfig.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: aiConfig.geminiModel });

        const prompt = buildPrompt(category, difficulty, language);

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        logger.info({ category, difficulty, language }, 'Generated question with AI');

        return parseAIResponse(text, category, difficulty, language);
    } catch (error) {
        logger.error({ error }, 'Failed to generate question with AI');
        return null;
    }
}

/**
 * Generate multiple questions in batch
 */
export async function generateQuestions(
    count: number,
    category?: string,
    difficulty?: 'easy' | 'medium' | 'hard',
    language?: 'english' | 'thai'
): Promise<GeneratedQuestion[]> {
    const questions: GeneratedQuestion[] = [];

    logger.info({ count, category, difficulty, language }, 'Generating batch of questions with AI');

    for (let i = 0; i < count; i++) {
        logger.info({ progress: `${i + 1}/${count}` }, 'Generating question');

        const question = await generateQuestion(category, difficulty, language);
        if (question) {
            questions.push(question);
        }

        // Rate limiting: wait 1 second between requests
        if (i < count - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    logger.info({ generated: questions.length, requested: count }, 'Batch generation complete');

    return questions;
}

/**
 * Build prompt for AI question generation
 */
function buildPrompt(
    category?: string,
    difficulty?: string,
    language: 'english' | 'thai' = 'english'
): string {
    const isThai = language === 'thai';
    const categoryText = category ? (isThai ? ` ในหมวด${category}` : ` in the category of ${category}`) : '';
    const difficultyText = difficulty ? (isThai ? ` ระดับ${difficulty}` : ` at ${difficulty} difficulty`) : '';
    const langName = isThai ? 'ภาษาไทย' : 'English';

    if (isThai) {
        return `สร้างคำถามตอบคำถามพร้อมคำตอบปลอมและคำใบ้ในรูปแบบ JSON ที่แน่นอนดังนี้:

{
  "question": "คำถามที่น่าสนใจของคุณที่นี่",
  "correctAnswer": "คำตอบที่ถูกต้องตามความเป็นจริง",
  "fakeAnswers": [
    {"answer": "คำตอบปลอม 1", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 1"},
    {"answer": "คำตอบปลอม 2", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 2"},
    {"answer": "คำตอบปลอม 3", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 3"}
  ]
}

ข้อกำหนด:
- คำถามต้องน่าสนใจและดึงดูด
- มีคำตอบปลอม 3-5 คำตอบ
- แต่ละคำตอบปลอมต้องมีคำใบ้ที่ฟังดูเป็นจริงแต่ไม่เปิดเผยว่าคำตอบนั้นปลอม
- คำใบ้ควรเป็นข้อความที่ถูกต้องตามความเป็นจริงที่ช่วยให้ผู้เล่นเล่าเรื่องได้โน้มน้าวใจ
- ข้อความทั้งหมดต้องเป็น${langName}

ตัวอย่าง:
{
  "question": "สัตว์ชนิดใดที่ไม่เคยดื่มน้ำ?",
  "correctAnswer": "จิงโจ้",
  "fakeAnswers": [
    {"answer": "อูฐ", "hint": "พวกมันเก็บไขมันไว้ในหนอกเพื่อพลังงาน"},
    {"answer": "ช้าง", "hint": "พวกมันใช้งวงดื่มน้ำได้ถึง 50 แกลลอนต่อวัน"},
    {"answer": "งู", "hint": "พวกมันกลืนเหยื่อทั้งตัวโดยไม่เคี้ยว"}
  ]
}

สร้างคำถามใหม่${categoryText}${difficultyText} จำนวน 1 คำถาม:`;
    }

    return `Generate a trivia question${categoryText}${difficultyText} with the following exact JSON format:

{
  "question": "Your interesting question here",
  "correctAnswer": "The factual correct answer",
  "fakeAnswers": [
    {"answer": "Fake answer 1", "hint": "A plausible-sounding hint for fake answer 1"},
    {"answer": "Fake answer 2", "hint": "A plausible-sounding hint for fake answer 2"},
    {"answer": "Fake answer 3", "hint": "A plausible-sounding hint for fake answer 3"}
  ]
}

Requirements:
- Question should be interesting and engaging
- Provide exactly 3-5 fake answers
- Each fake answer must have a hint that sounds truthful but doesn't give away the deception
- Hints should be factually correct statements that help players tell convincing stories
- All text should be in ${langName}

Example:
{
  "question": "What animal never drinks water?",
  "correctAnswer": "Kangaroo",
  "fakeAnswers": [
    {"answer": "Camel", "hint": "They store fat in their humps for energy"},
    {"answer": "Elephant", "hint": "They use their trunk to drink up to 50 gallons a day"},
    {"answer": "Snake", "hint": "They swallow their prey whole without chewing"}
  ]
}

Generate one new question now:`;
}

/**
 * Parse AI response and validate structure
 */
function parseAIResponse(
    text: string,
    category?: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    language: 'english' | 'thai' = 'english'
): GeneratedQuestion | null {
    try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            logger.warn({ text }, 'No JSON found in AI response');
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (!parsed.question || !parsed.correctAnswer || !parsed.fakeAnswers) {
            logger.warn({ parsed }, 'Missing required fields in AI response');
            return null;
        }

        // Validate fake answers structure
        const fakeAnswers: IFakeAnswer[] = parsed.fakeAnswers.map((fa: any) => ({
            answer: String(fa.answer || fa),
            hint: String(fa.hint || fa.answer || fa)
        }));

        if (fakeAnswers.length < 3) {
            logger.warn({ fakeAnswers }, 'Not enough fake answers');
            return null;
        }

        return {
            question: String(parsed.question),
            correctAnswer: String(parsed.correctAnswer),
            fakeAnswers,
            category: category || 'general',
            difficulty,
            language
        };
    } catch (error) {
        logger.error({ error, text }, 'Failed to parse AI response');
        return null;
    }
}
