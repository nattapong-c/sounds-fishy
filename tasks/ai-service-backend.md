# AI Service Implementation Plan

## Overview
**Feature:** OpenAI-Compatible LLM Integration for Question & Answer Generation  
**Goal:** Implement a configurable AI service that generates game questions, correct answers, and bluff suggestions using any OpenAI-compatible API.

### Configuration Requirements
The AI service must support environment-based configuration:
- `AI_API_KEY` - API key for authentication
- `AI_MODEL` - Model name (e.g., `gpt-3.5-turbo`, `gpt-4`, `claude-3`, custom models)
- `AI_BASE_URL` - Base URL for the API endpoint (for OpenRouter, Together, local LLMs, etc.)

---

## Database Schema Updates

### GameRoom Model Enhancement
```typescript
// service/src/models/GameRoom.ts

export interface IAIConfig {
  question: string;
  correctAnswer: string;
  bluffSuggestions: string[];
  generatedAt: Date;
  model: string;
}

export interface IGameRoom extends Document {
  // ... existing fields
  aiConfig?: IAIConfig;  // Add this field
}

// Update schema
const GameRoomSchema = new Schema<IGameRoom>({
  // ... existing fields
  aiConfig: {
    question: String,
    correctAnswer: String,
    bluffSuggestions: [String],
    generatedAt: Date,
    model: String
  }
}, { timestamps: true });
```

---

## AI Service Implementation

### Configuration Types
```typescript
// service/src/types/ai.ts

export interface AIConfig {
  apiKey: string;
  model: string;
  baseURL: string;
}

export interface GenerationRequest {
  category?: string;        // Optional: e.g., "animals", "food", "objects"
  difficulty?: 'easy' | 'medium' | 'hard';
  playerCount: number;
}

export interface GenerationResponse {
  question: string;
  correctAnswer: string;
  bluffSuggestions: string[];
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### AI Service Class
```typescript
// service/src/services/ai-service.ts

import { AIConfig, GenerationRequest, GenerationResponse } from '../types/ai';

export class AIService {
  private config: AIConfig;

  constructor(config?: Partial<AIConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.AI_API_KEY || '',
      model: config?.model || process.env.AI_MODEL || 'gpt-3.5-turbo',
      baseURL: config?.baseURL || process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('AI_API_KEY is required');
    }
  }

  /**
   * Generate question and answers for a new round
   */
  async generateRoundData(request: GenerationRequest): Promise<GenerationResponse> {
    const prompt = this.buildPrompt(request);

    const response = await this.callLLM(prompt);
    const parsed = this.parseResponse(response);

    return {
      ...parsed,
      model: this.config.model,
    };
  }

  /**
   * Generate additional lie suggestions for a Red Herring player
   */
  async generateLieSuggestion(
    question: string,
    correctAnswer: string,
    existingAnswers: string[]
  ): Promise<string> {
    const prompt = `
Game: Sounds Fishy
Question: "${question}"
Correct Answer: "${correctAnswer}"
Existing Answers: ${JSON.stringify(existingAnswers)}

Generate ONE more believable bluff answer that:
- Fits the question category
- Is different from existing answers
- Sounds plausible but is NOT the correct answer
- Is concise (1-3 words)

Bluff answer: `;

    const response = await this.callLLM(prompt);
    return response.trim();
  }

  /**
   * Regenerate question and answers with different category/focus
   */
  async regenerateWithCategory(
    category: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    playerCount: number
  ): Promise<GenerationResponse> {
    return this.generateRoundData({ category, difficulty, playerCount });
  }

  private buildPrompt(request: GenerationRequest): string {
    const categoryText = request.category 
      ? `Category: ${request.category}` 
      : 'Category: General (common everyday things)';
    
    const difficultyText = request.difficulty || 'medium';
    const bluffCount = Math.min(request.playerCount - 2, 5); // Max 5 bluffs

    return `
You are generating content for a party game called "Sounds Fishy".

Game Rules:
- 1 player (Guesser) knows the QUESTION but not the answer
- 1 player (Big Fish) knows the CORRECT ANSWER
- Other players (Red Herrings) must bluff with fake answers

${categoryText}
Difficulty: ${difficultyText}
Number of bluff answers needed: ${bluffCount}

Generate a JSON response with this exact structure:
{
  "question": "A clear, simple question that players will answer verbally",
  "correctAnswer": "The true answer (1-3 words, common knowledge)",
  "bluffSuggestions": [
    "Believable fake answer 1",
    "Believable fake answer 2",
    "Believable fake answer 3"
  ]
}

Requirements:
1. Question must be clear and easy to read aloud
2. Correct answer must be common knowledge (not obscure)
3. Bluff answers must be believable but clearly wrong
4. All answers should be 1-3 words max
5. Avoid sensitive, offensive, or overly niche topics

Generate the JSON now:`;
  }

  private async callLLM(prompt: string): Promise<string> {
    const url = `${this.config.baseURL}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates content for party games. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8, // Higher temperature for creativity
        max_tokens: 500,
        response_format: { type: 'json_object' }, // Force JSON output
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseResponse(content: string): Omit<GenerationResponse, 'model'> {
    try {
      const parsed = JSON.parse(content);
      
      return {
        question: parsed.question,
        correctAnswer: parsed.correctAnswer,
        bluffSuggestions: parsed.bluffSuggestions || [],
        usage: {
          promptTokens: 0, // Can be extracted from API response
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }
}
```

---

## API Endpoints

### POST /api/rooms/:roomCode/generate-round
**Description:** Generate new question and answers for a round  
**Request:**
```typescript
{
  category?: string;        // Optional category filter
  difficulty?: 'easy' | 'medium' | 'hard';
  regenerate?: boolean;     // If true, regenerate even if exists
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    question: string;
    correctAnswer: string;
    bluffSuggestions: string[];
    model: string;
  };
}
```

**Controller:**
```typescript
// service/src/controllers/ai-controller.ts

import { Elysia, t } from 'elysia';
import { AIService } from '../services/ai-service';
import { GameRoom } from '../models/game-room';

export const ai_controller = new Elysia('/api')
  .post(
    '/rooms/:roomCode/generate-round',
    async ({ params, body, set }) => {
      const { roomCode } = params;
      const { category, difficulty, regenerate } = body;

      try {
        const room = await GameRoom.findOne({ roomCode });
        if (!room) {
          set.status = 404;
          return { success: false, error: 'Room not found' };
        }

        // Check if already generated (prevent regeneration unless requested)
        if (room.aiConfig && !regenerate) {
          return {
            success: true,
            data: {
              question: room.aiConfig.question,
              correctAnswer: room.aiConfig.correctAnswer,
              bluffSuggestions: room.aiConfig.bluffSuggestions,
              model: room.aiConfig.model,
            },
          };
        }

        // Generate new content
        const aiService = new AIService();
        const generated = await aiService.generateRoundData({
          category,
          difficulty,
          playerCount: room.players.length,
        });

        // Save to MongoDB
        room.aiConfig = {
          question: generated.question,
          correctAnswer: generated.correctAnswer,
          bluffSuggestions: generated.bluffSuggestions,
          generatedAt: new Date(),
          model: generated.model,
        };
        await room.save();

        return { success: true, data: generated };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: error.message
        };
      }
    },
    {
      body: t.Object({
        category: t.Optional(t.String()),
        difficulty: t.Optional(
          t.Union([t.Literal('easy'), t.Literal('medium'), t.Literal('hard')])
        ),
        regenerate: t.Optional(t.Boolean()),
      }),
    }
  );
```

### POST /api/rooms/:roomCode/generate-lie
**Description:** Generate additional lie suggestion for a Red Herring  
**Request:**
```typescript
{
  playerId: string;
  existingAnswers: string[];
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    lieSuggestion: string;
  };
}
```

---

## Socket.io Events

### Client → Server

#### `generate_round`
```typescript
{
  roomCode: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}
```
**Action:** Trigger AI generation for new round, save to MongoDB, broadcast to room

### Server → Client

#### `round_generated`
```typescript
{
  roomCode: string;
  question: string;
  model: string;
}
```

#### `generation_error`
```typescript
{
  code: 'AI_UNAVAILABLE' | 'INVALID_RESPONSE' | 'CONFIG_ERROR';
  message: string;
  fallbackAvailable: boolean; // True if fallback word bank exists
}
```

---

## Environment Configuration

### .env.example
```bash
# AI Configuration (OpenAI-compatible)
AI_API_KEY=sk-your-api-key-here
AI_MODEL=gpt-3.5-turbo
AI_BASE_URL=https://api.openai.com/v1

# Alternative: OpenRouter
# AI_API_KEY=your-openrouter-key
# AI_MODEL=meta-llama/llama-3-70b-instruct
# AI_BASE_URL=https://openrouter.ai/api/v1

# Alternative: Together AI
# AI_API_KEY=your-together-key
# AI_MODEL=meta-llama/Llama-3-70b-chat-hf
# AI_BASE_URL=https://api.together.xyz/v1

# Alternative: Local Ollama
# AI_API_KEY=ollama
# AI_MODEL=llama3
# AI_BASE_URL=http://localhost:11434/v1
```

### Configuration Validation Middleware
```typescript
// service/src/lib/ai-config.ts

import { CustomAppError } from './errors';

export function validateAIConfig(): void {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  const baseURL = process.env.AI_BASE_URL;

  if (!apiKey) {
    throw new CustomAppError(
      'AI_API_KEY environment variable is required',
      500,
      'AI_CONFIG_ERROR'
    );
  }

  // Optional: Test connection on startup
  if (process.env.NODE_ENV === 'production') {
    testAIConnection(apiKey, baseURL);
  }
}

async function testAIConnection(apiKey: string, baseURL: string): Promise<void> {
  try {
    const response = await fetch(`${baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.warn('AI connection test failed, but continuing:', response.status);
    }
  } catch (error) {
    console.warn('AI connection test error:', error.message);
  }
}
```

---

## Fallback Word Bank

If AI is unavailable, use a fallback word bank:

```typescript
// service/src/services/WordBankService.ts

export class WordBankService {
  private wordBank = [
    { question: "What is a common pet?", answer: "Dog", bluffs: ["Cat", "Fish", "Bird"] },
    { question: "What is a popular fruit?", answer: "Apple", bluffs: ["Banana", "Orange", "Grape"] },
    { question: "What do you use to write?", answer: "Pen", bluffs: ["Pencil", "Marker", "Chalk"] },
    { question: "What is a common vehicle?", answer: "Car", bluffs: ["Bus", "Train", "Bike"] },
    { question: "What is a popular sport?", answer: "Soccer", bluffs: ["Basketball", "Tennis", "Golf"] },
    { question: "What is a common breakfast food?", answer: "Eggs", bluffs: ["Toast", "Cereal", "Pancakes"] },
    { question: "What is a popular ice cream flavor?", answer: "Vanilla", bluffs: ["Chocolate", "Strawberry", "Mint"] },
    { question: "What is a common tool?", answer: "Hammer", bluffs: ["Screwdriver", "Wrench", "Pliers"] },
    { question: "What is a popular pizza topping?", answer: "Pepperoni", bluffs: ["Mushroom", "Sausage", "Onion"] },
    { question: "What is a common beverage?", answer: "Coffee", bluffs: ["Tea", "Juice", "Soda"] },
  ];

  getRandomWord(): { question: string; answer: string; bluffs: string[] } {
    const randomIndex = Math.floor(Math.random() * this.wordBank.length);
    return this.wordBank[randomIndex];
  }
}
```

---

## Testing Plan

### Unit Tests

#### AIService Tests
```typescript
// service/src/__tests__/unit/ai-service.test.ts

import { describe, test, expect, beforeEach } from 'bun:test';
import { AIService } from '../../services/ai-service';

describe('AIService', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.AI_API_KEY = 'test-key';
    process.env.AI_MODEL = 'gpt-3.5-turbo';
    process.env.AI_BASE_URL = 'https://api.openai.com/v1';
  });

  test('should initialize with environment variables', () => {
    const service = new AIService();
    expect(service).toBeDefined();
  });

  test('should throw error if API key is missing', () => {
    delete process.env.AI_API_KEY;
    expect(() => new AIService()).toThrow('AI_API_KEY is required');
  });

  test('should override env vars with config parameter', () => {
    const service = new AIService({
      apiKey: 'custom-key',
      model: 'gpt-4',
      baseURL: 'https://custom.api.com/v1',
    });
    // Service should use custom config
  });
});
```

### Integration Tests

#### AI Endpoint Tests
```typescript
// service/src/__tests__/integration/ai-endpoint.test.ts

import { describe, test, expect } from 'bun:test';
import request from 'supertest';
import { app } from '../../index';

describe('AI Endpoints', () => {
  test('POST /api/rooms/:roomCode/generate-round should generate content', async () => {
    // Create room first
    const createRes = await request(app)
      .post('/api/rooms')
      .send({ hostName: 'TestHost' });

    const roomCode = createRes.body.data.roomCode;

    // Generate round data
    const response = await request(app)
      .post(`/api/rooms/${roomCode}/generate-round`)
      .send({ difficulty: 'easy' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.question).toBeDefined();
    expect(response.body.data.correctAnswer).toBeDefined();
    expect(response.body.data.bluffSuggestions.length).toBeGreaterThan(0);
  });
});
```

### Mock Tests (No API Calls)
```typescript
// service/src/__tests__/unit/ai-service-mock.test.ts

import { describe, test, expect, mock } from 'bun:test';

describe('AIService with mocked fetch', () => {
  test('should parse AI response correctly', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            question: "What is a common pet?",
            correctAnswer: "Dog",
            bluffSuggestions: ["Cat", "Fish", "Bird"]
          })
        }
      }]
    };

    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));

    const service = new AIService();
    const result = await service.generateRoundData({ playerCount: 4 });

    expect(result.question).toBe("What is a common pet?");
    expect(result.correctAnswer).toBe("Dog");
    expect(result.bluffSuggestions).toEqual(["Cat", "Fish", "Bird"]);
  });
});
```

---

## Acceptance Criteria

- [ ] AI service supports configurable API key, model, and base URL
- [ ] Environment variables: `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`
- [ ] Works with OpenAI, OpenRouter, Together AI, and local Ollama
- [ ] Generates question, correct answer, and bluff suggestions
- [ ] Response is validated and parsed correctly
- [ ] Generated content saved to MongoDB in GameRoom.aiConfig
- [ ] Fallback word bank available if AI is unavailable
- [ ] Error handling for API failures with clear error messages
- [ ] Unit tests for AI service logic
- [ ] Integration tests for API endpoints
- [ ] Mock tests for response parsing
- [ ] Documentation for configuration in README

---

## Dependencies

```json
{
  "dependencies": {
    "elysia": "^1.0.0",
    "mongoose": "^8.0.0"
  },
  "devDependencies": {
    "bun-types": "^1.0.0",
    "supertest": "^6.3.0"
  }
}
```

---

## File Structure

```
service/
├── src/
│   ├── controllers/
│   │   └── ai-controller.ts
│   ├── services/
│   │   ├── ai-service.ts
│   │   └── word-bank-service.ts
│   ├── types/
│   │   └── ai.ts
│   ├── lib/
│   │   └── ai-config.ts
│   └── __tests__/
│       ├── unit/
│       │   ├── ai-service.test.ts
│       │   └── ai-service-mock.test.ts
│       └── integration/
│           └── ai-endpoint.test.ts
└── .env.example
```

---

## Usage Examples

### OpenAI (Default)
```bash
AI_API_KEY=sk-...
AI_MODEL=gpt-3.5-turbo
AI_BASE_URL=https://api.openai.com/v1
```

### OpenRouter (Multiple Models)
```bash
AI_API_KEY=your-openrouter-key
AI_MODEL=meta-llama/llama-3-70b-instruct
AI_BASE_URL=https://openrouter.ai/api/v1
```

### Together AI
```bash
AI_API_KEY=your-together-key
AI_MODEL=meta-llama/Llama-3-70b-chat-hf
AI_BASE_URL=https://api.together.xyz/v1
```

### Local Ollama
```bash
AI_API_KEY=ollama
AI_MODEL=llama3
AI_BASE_URL=http://localhost:11434/v1
```

### Azure OpenAI
```bash
AI_API_KEY=your-azure-key
AI_MODEL=gpt-35-turbo
AI_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/gpt-35-turbo
```
