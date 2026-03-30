import OpenAI from 'openai';
import { logger } from '../lib/logger';
import { aiConfig } from '../lib/ai-config';
import { IFakeAnswer } from '../models/question-bank';

/**
 * AI Question Generator Service
 * Uses OpenAI-compatible API to generate trivia questions with fake answers and lie hints
 * Supports: Gemini, OpenAI, and other OpenAI-compatible providers
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
 * Generate multiple questions in batch (single API call)
 */
export async function generateQuestions(
    count: number,
    category?: string,
    difficulty?: 'easy' | 'medium' | 'hard',
    language?: 'english' | 'thai'
): Promise<GeneratedQuestion[]> {
    if (!aiConfig.enabled) {
        logger.warn('AI not configured - cannot generate questions');
        return [];
    }

    try {
        const openai = new OpenAI({
            apiKey: aiConfig.apiKey,
            baseURL: aiConfig.baseURL
        });

        logger.info({ count, category, difficulty, language }, 'Generating batch of questions with AI');

        const prompt = buildBatchPrompt(count, category, difficulty, language);

        const completion = await openai.chat.completions.create({
            model: aiConfig.model,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
        });

        const text = completion.choices[0]?.message?.content || '';
        console.log(JSON.stringify(text))
        logger.info({ count }, 'Batch generation complete');

        return parseBatchAIResponse(text, category, difficulty, language);
    } catch (error) {
        logger.error({ error }, 'Failed to generate questions with AI');
        return [];
    }
}

/**
 * Build batch prompt for generating multiple questions at once
 */
function buildBatchPrompt(
    count: number,
    category?: string,
    difficulty?: string,
    language: 'english' | 'thai' = 'english'
): string {
    if (language === 'thai') {
        // Thai prompt - completely in Thai
        const categoryText = category ? ` ในหมวด${category}` : '';
        const difficultyText = difficulty ? ` ระดับ${difficulty}` : '';

        return `สร้างคำถามตอบคำถามจำนวน ${count} คำถาม พร้อมคำตอบปลอม 8 คำตอบและคำใบ้ในรูปแบบ JSON ที่แน่นอนดังนี้:

{
  "questions": [
    {
      "question": "คำถามที่น่าสนใจของคุณที่นี่",
      "correctAnswer": "คำตอบที่ถูกต้องตามความเป็นจริง",
      "fakeAnswers": [
        {"answer": "คำตอบปลอม 1", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 1"},
        {"answer": "คำตอบปลอม 2", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 2"},
        {"answer": "คำตอบปลอม 3", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 3"},
        {"answer": "คำตอบปลอม 4", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 4"},
        {"answer": "คำตอบปลอม 5", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 5"},
        {"answer": "คำตอบปลอม 6", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 6"},
        {"answer": "คำตอบปลอม 7", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 7"},
        {"answer": "คำตอบปลอม 8", "hint": "คำใบ้ที่ฟังดูน่าเชื่อถือสำหรับคำตอบปลอม 8"}
      ]
    }
  ]
}

ข้อกำหนด:
- สร้างคำถามจำนวน ${count} คำถามที่แตกต่างกัน
- แต่ละคำถามต้องมีคำตอบปลอม 8 คำตอบ (สำหรับผู้เล่น 8 คน)
- แต่ละคำตอบปลอมต้องมีคำใบ้ที่ฟังดูเป็นจริงแต่ไม่เปิดเผยว่าคำตอบนั้นปลอม
- คำใบ้ควรเป็นข้อความที่ถูกต้องตามความเป็นจริงที่ช่วยให้ผู้เล่นเล่าเรื่องได้โน้มน้าวใจ
- คำถามต้องน่าสนใจและดึงดูด
- ข้อความทั้งหมดต้องเป็นภาษาไทย

ตัวอย่าง:
{
  "questions": [
    {
      "question": "สัตว์ชนิดใดที่ไม่เคยดื่มน้ำ?",
      "correctAnswer": "จิงโจ้",
      "fakeAnswers": [
        {"answer": "อูฐ", "hint": "พวกมันเก็บไขมันไว้ในหนอกเพื่อพลังงาน"},
        {"answer": "ช้าง", "hint": "พวกมันใช้งวงดื่มน้ำได้ถึง 50 แกลลอนต่อวัน"},
        {"answer": "งู", "hint": "พวกมันกลืนเหยื่อทั้งตัวโดยไม่เคี้ยว"},
        {"answer": "ปลา", "hint": "พวกมันหายใจใต้น้ำด้วยเหงือก"},
        {"answer": "นก", "hint": "พวกมันมีปีกสำหรับบิน"},
        {"answer": "เสือ", "hint": "พวกมันเป็นสัตว์กินเนื้อ"},
        {"answer": "ม้า", "hint": "พวกมันวิ่งได้เร็วมาก"},
        {"answer": "ลิง", "hint": "พวกมันชอบกินกล้วย"}
      ]
    }
  ]
}

สร้างคำถามใหม่${categoryText}${difficultyText} จำนวน ${count} คำถาม:`;
    }

    // English prompt
    const categoryText = category ? ` in the category of ${category}` : '';
    const difficultyText = difficulty ? ` at ${difficulty} difficulty` : '';

    return `Generate ${count} trivia questions${categoryText}${difficultyText} with the following exact JSON format:

{
  "questions": [
    {
      "question": "Your interesting question here",
      "correctAnswer": "The factual correct answer",
      "fakeAnswers": [
        {"answer": "Fake answer 1", "hint": "A plausible-sounding hint for fake answer 1"},
        {"answer": "Fake answer 2", "hint": "A plausible-sounding hint for fake answer 2"},
        {"answer": "Fake answer 3", "hint": "A plausible-sounding hint for fake answer 3"},
        {"answer": "Fake answer 4", "hint": "A plausible-sounding hint for fake answer 4"},
        {"answer": "Fake answer 5", "hint": "A plausible-sounding hint for fake answer 5"},
        {"answer": "Fake answer 6", "hint": "A plausible-sounding hint for fake answer 6"},
        {"answer": "Fake answer 7", "hint": "A plausible-sounding hint for fake answer 7"},
        {"answer": "Fake answer 8", "hint": "A plausible-sounding hint for fake answer 8"}
      ]
    }
  ]
}

Requirements:
- Generate exactly ${count} unique questions
- Each question must have exactly 8 fake answers (to support 8 players)
- Each fake answer must have a hint that sounds truthful but doesn't give away the deception
- Hints should be factually correct statements that help players tell convincing stories
- Questions should be interesting and engaging
- All text must be in English

Example:
{
  "questions": [
    {
      "question": "What animal never drinks water?",
      "correctAnswer": "Kangaroo",
      "fakeAnswers": [
        {"answer": "Camel", "hint": "They store fat in their humps for energy"},
        {"answer": "Elephant", "hint": "They use their trunk to drink up to 50 gallons a day"},
        {"answer": "Snake", "hint": "They swallow their prey whole without chewing"},
        {"answer": "Fish", "hint": "They breathe underwater using gills"},
        {"answer": "Bird", "hint": "They have wings for flying"},
        {"answer": "Tiger", "hint": "They are carnivorous animals"},
        {"answer": "Horse", "hint": "They can run very fast"},
        {"answer": "Monkey", "hint": "They like to eat bananas"}
      ]
    }
  ]
}

Generate ${count} new questions${categoryText}${difficultyText} now:`;
}

/**
 * Parse batch AI response and validate structure
 */
function parseBatchAIResponse(
    text: string,
    category?: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    language: 'english' | 'thai' = 'english'
): GeneratedQuestion[] {
    try {
        logger.info({ textLength: text.length }, 'Parsing AI response');

        // Remove markdown code blocks with various formats
        let cleanText = text
            .replace(/```json\s*/g, '')      // Remove ```json
            .replace(/```\s*/g, '')           // Remove ```
            .replace(/```\s*$/g, '')          // Remove trailing ```
            .trim();

        // Try to extract JSON object from the response
        let jsonMatch = cleanText.match(/\{[\s\S]*\}/);

        // If no match, try to find JSON array
        if (!jsonMatch) {
            jsonMatch = cleanText.match(/\[[\s\S]*\]/);
        }

        if (!jsonMatch) {
            logger.warn({ 
                textPreview: cleanText.substring(0, 300),
                textLength: cleanText.length 
            }, 'No JSON found in AI response');
            return [];
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Handle both { questions: [...] } and direct [...] formats
        let questionsData = parsed;
        if (parsed.questions && Array.isArray(parsed.questions)) {
            questionsData = parsed.questions;
        } else if (!Array.isArray(parsed)) {
            logger.warn({ parsed }, 'Response is neither object with questions array nor array');
            return [];
        }

        // Validate questions array
        if (!Array.isArray(questionsData)) {
            logger.warn({ questionsData }, 'Missing questions array in AI response');
            return [];
        }

        const questions: GeneratedQuestion[] = [];

        for (const q of questionsData) {
            // Validate required fields
            if (!q.question || !q.correctAnswer || !q.fakeAnswers) {
                logger.warn({ q }, 'Missing required fields in question');
                continue;
            }

            // Validate fake answers structure (must have 8)
            const fakeAnswers: IFakeAnswer[] = q.fakeAnswers.map((fa: any) => ({
                answer: String(fa.answer || fa),
                hint: String(fa.hint || fa.answer || fa)
            }));

            if (fakeAnswers.length < 8) {
                logger.warn({ 
                    question: q.question.substring(0, 50),
                    fakeAnswersCount: fakeAnswers.length 
                }, 'Not enough fake answers (need 8)');
                continue;
            }

            questions.push({
                question: String(q.question),
                correctAnswer: String(q.correctAnswer),
                fakeAnswers,
                category: category || 'general',
                difficulty,
                language
            });
        }

        logger.info({ generated: questions.length }, 'Successfully parsed batch questions');
        return questions;
    } catch (error) {
        logger.error({ error, text: text.substring(0, 500) }, 'Failed to parse batch AI response');
        return [];
    }
}

/**
 * Parse AI response and validate structure (single question - deprecated)
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
