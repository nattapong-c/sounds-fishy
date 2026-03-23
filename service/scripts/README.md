# Question Bank Seed Script

AI-powered question generation for Sounds Fishy game using Google Gemini 2.5 Flash.

## Overview

This script uses AI to automatically generate trivia questions with:
- ✅ Question text
- ✅ Correct answer
- ✅ 3-5 fake answers
- ✅ Lie hints for each fake answer
- ✅ Category and difficulty classification
- ✅ Language support (English & Thai)

## Prerequisites

1. **MongoDB** - Must be running and accessible
2. **Gemini API Key** - Required for AI generation

### Setup

1. Create `.env` file in the `service` directory:
```bash
# service/.env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
MONGO_URI=mongodb://localhost:27017/sounds-fishy
```

2. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

3. Install dependencies:
```bash
cd service
bun install
```

## Usage

### Basic Usage

```bash
# Generate 10 English questions (default)
bun run scripts/seed-questions.ts

# Generate 20 English questions
bun run scripts/seed-questions.ts 20
```

### With Options

```bash
# Generate 15 questions in specific category
bun run scripts/seed-questions.ts --count 15 --category animals

# Generate 10 hard difficulty questions
bun run scripts/seed-questions.ts --difficulty hard

# Generate 25 easy food questions
bun run scripts/seed-questions.ts -c food -d easy -n 25
```

### Thai Language Support

```bash
# Generate 10 Thai questions
bun run scripts/seed-questions.ts --thai

# Generate 15 Thai animal questions
bun run scripts/seed-questions.ts --thai --count 15 --category animals

# Generate 20 Thai easy questions
bun run scripts/seed-questions.ts --thai -d easy -n 20
```

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--count <number>` | `-n` | Number of questions to generate | 10 |
| `--category <name>` | `-c` | Question category (e.g., animals, food, sports) | general |
| `--difficulty <level>` | `-d` | Difficulty level: easy, medium, hard | medium |
| `--thai` | - | Generate questions in Thai language | English |

## Examples

### English Questions

```bash
# 10 general knowledge, medium difficulty
bun run scripts/seed-questions.ts

# 20 animal questions, easy difficulty
bun run scripts/seed-questions.ts -c animals -d easy -n 20

# 15 food questions, hard difficulty
bun run scripts/seed-questions.ts --category food --difficulty hard --count 15
```

### Thai Questions

```bash
# 10 Thai general knowledge, medium difficulty
bun run scripts/seed-questions.ts --thai

# 20 Thai animal questions, easy difficulty
bun run scripts/seed-questions.ts --thai -c animals -d easy -n 20

# 15 Thai sports questions, hard difficulty
bun run scripts/seed-questions.ts --thai --category sports --difficulty hard --count 15
```

## Output

The script will display:
- ✅ Connection status
- ✅ Current question count in database
- ✅ Generation progress
- ✅ Saved questions count
- ✅ Skipped duplicates count
- ✅ Total questions in database
- ✅ Language breakdown

### Example Output

```
🌱 Connecting to MongoDB...
✅ AI configured successfully
📊 Current questions in database: 50
🤖 Generating 10 English (animals) [easy] questions with AI...
✅ Generated 10 questions
💾 Saved question: What animal has a trunk?
💾 Saved question: What animal says "moo"?
⏭️  Skipping duplicate question: What animal has a long neck?
💾 Saved question: What animal hops?

✨ Seed complete!
📊 Results:
   - Generated: 10
   - Saved: 9
   - Duplicates skipped: 1
📚 Total questions in database: 59

📊 English questions in database: 59
```

## Question Format

Each generated question includes:

```json
{
  "question": "What animal never drinks water?",
  "correctAnswer": "Kangaroo",
  "fakeAnswers": [
    {
      "answer": "Camel",
      "hint": "They store fat in their humps for energy"
    },
    {
      "answer": "Elephant",
      "hint": "They use their trunk to drink up to 50 gallons a day"
    },
    {
      "answer": "Snake",
      "hint": "They swallow their prey whole without chewing"
    }
  ],
  "category": "animals",
  "difficulty": "medium",
  "language": "english"
}
```

## Features

### Duplicate Prevention
- Automatically checks for existing questions
- Skips duplicates to avoid redundancy
- Safe to run multiple times

### Rate Limiting
- 1 second delay between API calls
- Prevents API quota exhaustion
- Ensures reliable generation

### Language Support
- **English**: Full support with optimized prompts
- **Thai**: Native Thai prompts and examples
- Automatic language detection in output

## Troubleshooting

### "AI not configured" Error

**Problem:** Missing or invalid API key

**Solution:**
1. Check `.env` file exists in `service` directory
2. Verify `GEMINI_API_KEY` is set correctly
3. Restart the script

### "No questions generated" Warning

**Possible causes:**
- API quota exceeded
- Invalid API key
- Network connection issue

**Solutions:**
1. Check Gemini API quota in Google AI Studio
2. Verify API key is valid
3. Check internet connection
4. Try again later

### Database Connection Error

**Problem:** Cannot connect to MongoDB

**Solution:**
1. Ensure MongoDB is running: `mongod`
2. Check `MONGO_URI` in `.env` file
3. Verify database is accessible

## Best Practices

1. **Start Small**: Generate 5-10 questions first to test
2. **Review Generated Questions**: AI may produce occasional errors
3. **Use Categories**: Organize questions for better gameplay
4. **Mix Difficulties**: Include easy, medium, and hard questions
5. **Run Incrementally**: Add questions in batches, not all at once

## Database Management

### View Questions

```bash
# Using MongoDB shell
mongosh sounds-fishy
db.questionbanks.find().limit(10)
```

### Count Questions by Language

```bash
mongosh sounds-fishy
db.questionbanks.aggregate([
  { $group: { _id: "$language", count: { $sum: 1 } } }
])
```

### Clear All Questions

⚠️ **Warning:** This will delete all questions!

```bash
mongosh sounds-fishy
db.questionbanks.deleteMany({})
```

## API Reference

### Gemini Model

- **Model**: `gemini-2.5-flash`
- **Provider**: Google Generative AI
- **Rate Limit**: 60 requests per minute (free tier)

### Question Generation

The AI uses specialized prompts to generate:
- Engaging questions
- Plausible fake answers
- Truthful-sounding hints
- Category-appropriate content

## Support

For issues or questions:
1. Check this README
2. Review error messages
3. Check Gemini API documentation
4. Verify MongoDB connection

---

**Last Updated:** March 23, 2026  
**Version:** 2.0 (with category and difficulty support)
