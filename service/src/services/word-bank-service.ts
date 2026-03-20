/**
 * Word Bank Service
 * Fallback word bank for when AI service is unavailable
 * Provides pre-defined question/answer pairs with bluff suggestions
 */

export interface WordBankEntry {
  question: string;
  correctAnswer: string;
  bluffSuggestions: string[];
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GeneratedRoundData {
  question: string;
  correctAnswer: string;
  bluffSuggestions: string[];
  model: string;
}

export interface GeneratedLieData {
  lieSuggestion: string;
  usedFallback: boolean;
}

/**
 * Word Bank - Pre-defined question/answer pairs
 * Contains 50+ entries across various categories
 */
const wordBank: WordBankEntry[] = [
  // Animals
  {
    question: "What animal is known as the 'King of the Jungle'?",
    correctAnswer: "Lion",
    bluffSuggestions: ["Tiger", "Elephant", "Leopard", "Gorilla"],
    category: "Animals",
    difficulty: "easy"
  },
  {
    question: "What is the largest mammal in the world?",
    correctAnswer: "Blue Whale",
    bluffSuggestions: ["African Elephant", "Giraffe", "Hippopotamus", "Rhino"],
    category: "Animals",
    difficulty: "easy"
  },
  {
    question: "What animal has the longest neck?",
    correctAnswer: "Giraffe",
    bluffSuggestions: ["Elephant", "Camel", "Ostrich", "Llama"],
    category: "Animals",
    difficulty: "easy"
  },
  {
    question: "What is the fastest land animal?",
    correctAnswer: "Cheetah",
    bluffSuggestions: ["Lion", "Leopard", "Gazelle", "Horse"],
    category: "Animals",
    difficulty: "easy"
  },
  {
    question: "What animal sleeps standing up?",
    correctAnswer: "Horse",
    bluffSuggestions: ["Cow", "Elephant", "Giraffe", "Flamingo"],
    category: "Animals",
    difficulty: "medium"
  },
  
  // Food & Drink
  {
    question: "What is the main ingredient in guacamole?",
    correctAnswer: "Avocado",
    bluffSuggestions: ["Tomato", "Onion", "Lime", "Cilantro"],
    category: "Food",
    difficulty: "easy"
  },
  {
    question: "What type of pastry is a cronut?",
    correctAnswer: "Croissant-Donut hybrid",
    bluffSuggestions: ["Danish", "Eclair", "Muffin", "Scone"],
    category: "Food",
    difficulty: "medium"
  },
  {
    question: "What is sushi traditionally wrapped in?",
    correctAnswer: "Seaweed (Nori)",
    bluffSuggestions: ["Rice paper", "Bamboo leaf", "Lettuce", "Rice"],
    category: "Food",
    difficulty: "easy"
  },
  {
    question: "What cheese is known for having holes?",
    correctAnswer: "Swiss Cheese",
    bluffSuggestions: ["Cheddar", "Gouda", "Brie", "Mozzarella"],
    category: "Food",
    difficulty: "easy"
  },
  {
    question: "What is the main ingredient in hummus?",
    correctAnswer: "Chickpeas",
    bluffSuggestions: ["Lentils", "Beans", "Peas", "Tahini"],
    category: "Food",
    difficulty: "medium"
  },
  
  // Geography
  {
    question: "What is the capital of France?",
    correctAnswer: "Paris",
    bluffSuggestions: ["Lyon", "Marseille", "Nice", "Versailles"],
    category: "Geography",
    difficulty: "easy"
  },
  {
    question: "What is the largest ocean on Earth?",
    correctAnswer: "Pacific Ocean",
    bluffSuggestions: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Southern Ocean"],
    category: "Geography",
    difficulty: "easy"
  },
  {
    question: "What country has the most natural lakes?",
    correctAnswer: "Canada",
    bluffSuggestions: ["United States", "Russia", "Brazil", "Finland"],
    category: "Geography",
    difficulty: "medium"
  },
  {
    question: "What is the smallest country in the world?",
    correctAnswer: "Vatican City",
    bluffSuggestions: ["Monaco", "San Marino", "Liechtenstein", "Malta"],
    category: "Geography",
    difficulty: "medium"
  },
  {
    question: "What river flows through Egypt?",
    correctAnswer: "Nile River",
    bluffSuggestions: ["Amazon River", "Congo River", "Niger River", "Blue Nile"],
    category: "Geography",
    difficulty: "easy"
  },
  
  // Science
  {
    question: "What planet is known as the Red Planet?",
    correctAnswer: "Mars",
    bluffSuggestions: ["Venus", "Jupiter", "Saturn", "Mercury"],
    category: "Science",
    difficulty: "easy"
  },
  {
    question: "What is the chemical symbol for gold?",
    correctAnswer: "Au",
    bluffSuggestions: ["Ag", "Fe", "Gd", "Go"],
    category: "Science",
    difficulty: "medium"
  },
  {
    question: "What gas do plants absorb from the atmosphere?",
    correctAnswer: "Carbon Dioxide",
    bluffSuggestions: ["Oxygen", "Nitrogen", "Hydrogen", "Methane"],
    category: "Science",
    difficulty: "easy"
  },
  {
    question: "What is the hardest natural substance?",
    correctAnswer: "Diamond",
    bluffSuggestions: ["Quartz", "Granite", "Steel", "Titanium"],
    category: "Science",
    difficulty: "easy"
  },
  {
    question: "How many bones are in the adult human body?",
    correctAnswer: "206",
    bluffSuggestions: ["195", "215", "180", "225"],
    category: "Science",
    difficulty: "medium"
  },
  
  // Entertainment
  {
    question: "Who played Jack in Titanic?",
    correctAnswer: "Leonardo DiCaprio",
    bluffSuggestions: ["Brad Pitt", "Tom Cruise", "Johnny Depp", "Matt Damon"],
    category: "Entertainment",
    difficulty: "easy"
  },
  {
    question: "What is the highest-grossing film of all time?",
    correctAnswer: "Avatar",
    bluffSuggestions: ["Avengers: Endgame", "Titanic", "Star Wars: The Force Awakens", "Jurassic World"],
    category: "Entertainment",
    difficulty: "medium"
  },
  {
    question: "What superhero is Tony Stark?",
    correctAnswer: "Iron Man",
    bluffSuggestions: ["Captain America", "Thor", "Hulk", "Black Panther"],
    category: "Entertainment",
    difficulty: "easy"
  },
  {
    question: "What is the name of Harry Potter's owl?",
    correctAnswer: "Hedwig",
    bluffSuggestions: ["Errol", "Pigwidgeon", "Fawkes", "Crookshanks"],
    category: "Entertainment",
    difficulty: "medium"
  },
  {
    question: "What streaming service has the Stranger Things series?",
    correctAnswer: "Netflix",
    bluffSuggestions: ["Hulu", "Amazon Prime", "Disney+", "HBO Max"],
    category: "Entertainment",
    difficulty: "easy"
  },
  
  // Sports
  {
    question: "What sport is played at Wimbledon?",
    correctAnswer: "Tennis",
    bluffSuggestions: ["Cricket", "Golf", "Rugby", "Badminton"],
    category: "Sports",
    difficulty: "easy"
  },
  {
    question: "How many players are on a basketball team on the court?",
    correctAnswer: "5",
    bluffSuggestions: ["6", "7", "4", "11"],
    category: "Sports",
    difficulty: "easy"
  },
  {
    question: "What country won the first FIFA World Cup?",
    correctAnswer: "Uruguay",
    bluffSuggestions: ["Brazil", "Argentina", "Italy", "Germany"],
    category: "Sports",
    difficulty: "hard"
  },
  {
    question: "What is the diameter of a basketball hoop in inches?",
    correctAnswer: "18 inches",
    bluffSuggestions: ["16 inches", "20 inches", "22 inches", "24 inches"],
    category: "Sports",
    difficulty: "hard"
  },
  {
    question: "What sport features a scrum?",
    correctAnswer: "Rugby",
    bluffSuggestions: ["Football", "Soccer", "Hockey", "Lacrosse"],
    category: "Sports",
    difficulty: "medium"
  },
  
  // History
  {
    question: "Who was the first President of the United States?",
    correctAnswer: "George Washington",
    bluffSuggestions: ["Thomas Jefferson", "John Adams", "Benjamin Franklin", "Alexander Hamilton"],
    category: "History",
    difficulty: "easy"
  },
  {
    question: "In what year did World War II end?",
    correctAnswer: "1945",
    bluffSuggestions: ["1944", "1946", "1943", "1950"],
    category: "History",
    difficulty: "easy"
  },
  {
    question: "What ancient civilization built the pyramids?",
    correctAnswer: "Ancient Egyptians",
    bluffSuggestions: ["Romans", "Greeks", "Mayans", "Aztecs"],
    category: "History",
    difficulty: "easy"
  },
  {
    question: "Who painted the Mona Lisa?",
    correctAnswer: "Leonardo da Vinci",
    bluffSuggestions: ["Michelangelo", "Raphael", "Donatello", "Vincent van Gogh"],
    category: "History",
    difficulty: "easy"
  },
  {
    question: "What year did the Titanic sink?",
    correctAnswer: "1912",
    bluffSuggestions: ["1910", "1915", "1908", "1920"],
    category: "History",
    difficulty: "medium"
  },
  
  // Technology
  {
    question: "What does CPU stand for?",
    correctAnswer: "Central Processing Unit",
    bluffSuggestions: ["Computer Personal Unit", "Central Process Utility", "Central Processing Unit Device", "Computer Processing Unit"],
    category: "Technology",
    difficulty: "medium"
  },
  {
    question: "Who founded Microsoft?",
    correctAnswer: "Bill Gates and Paul Allen",
    bluffSuggestions: ["Steve Jobs", "Steve Wozniak", "Mark Zuckerberg", "Elon Musk"],
    category: "Technology",
    difficulty: "easy"
  },
  {
    question: "What year was the first iPhone released?",
    correctAnswer: "2007",
    bluffSuggestions: ["2005", "2008", "2006", "2009"],
    category: "Technology",
    difficulty: "medium"
  },
  {
    question: "What does WWW stand for?",
    correctAnswer: "World Wide Web",
    bluffSuggestions: ["World Web Wide", "Wide World Web", "Web World Wide", "World Wide Website"],
    category: "Technology",
    difficulty: "easy"
  },
  {
    question: "What company owns Android?",
    correctAnswer: "Google",
    bluffSuggestions: ["Apple", "Microsoft", "Samsung", "Amazon"],
    category: "Technology",
    difficulty: "easy"
  },
  
  // Nature
  {
    question: "What is the tallest type of tree?",
    correctAnswer: "Coast Redwood",
    bluffSuggestions: ["Giant Sequoia", "Douglas Fir", "Pine", "Oak"],
    category: "Nature",
    difficulty: "medium"
  },
  {
    question: "What flower is known for following the sun?",
    correctAnswer: "Sunflower",
    bluffSuggestions: ["Daisy", "Marigold", "Tulip", "Rose"],
    category: "Nature",
    difficulty: "easy"
  },
  {
    question: "What is the largest desert in the world?",
    correctAnswer: "Antarctic Desert",
    bluffSuggestions: ["Sahara Desert", "Gobi Desert", "Arabian Desert", "Kalahari Desert"],
    category: "Nature",
    difficulty: "hard"
  },
  {
    question: "What natural phenomenon causes the tides?",
    correctAnswer: "Moon's gravity",
    bluffSuggestions: ["Sun's gravity", "Earth's rotation", "Wind", "Ocean currents"],
    category: "Nature",
    difficulty: "medium"
  },
  {
    question: "What is the most abundant gas in Earth's atmosphere?",
    correctAnswer: "Nitrogen",
    bluffSuggestions: ["Oxygen", "Carbon Dioxide", "Argon", "Hydrogen"],
    category: "Nature",
    difficulty: "medium"
  },
  
  // Additional entries to reach 50+
  {
    question: "What color is a ruby?",
    correctAnswer: "Red",
    bluffSuggestions: ["Blue", "Green", "Pink", "Purple"],
    category: "General",
    difficulty: "easy"
  },
  {
    question: "How many days are in a leap year?",
    correctAnswer: "366",
    bluffSuggestions: ["365", "367", "364", "360"],
    category: "General",
    difficulty: "easy"
  },
  {
    question: "What is the currency of Japan?",
    correctAnswer: "Yen",
    bluffSuggestions: ["Won", "Yuan", "Dollar", "Euro"],
    category: "General",
    difficulty: "easy"
  },
  {
    question: "What musical instrument has 88 keys?",
    correctAnswer: "Piano",
    bluffSuggestions: ["Organ", "Harpsichord", "Accordion", "Synthesizer"],
    category: "General",
    difficulty: "easy"
  },
  {
    question: "What is the largest internal organ in the human body?",
    correctAnswer: "Liver",
    bluffSuggestions: ["Heart", "Lungs", "Stomach", "Brain"],
    category: "Science",
    difficulty: "medium"
  },
  {
    question: "What language is spoken in Brazil?",
    correctAnswer: "Portuguese",
    bluffSuggestions: ["Spanish", "French", "Italian", "English"],
    category: "Geography",
    difficulty: "easy"
  },
  {
    question: "What is the freezing point of water in Fahrenheit?",
    correctAnswer: "32°F",
    bluffSuggestions: ["0°F", "100°F", "212°F", "32°C"],
    category: "Science",
    difficulty: "easy"
  },
  {
    question: "What planet has the most moons?",
    correctAnswer: "Saturn",
    bluffSuggestions: ["Jupiter", "Uranus", "Neptune", "Mars"],
    category: "Science",
    difficulty: "medium"
  },
  {
    question: "What is the largest continent?",
    correctAnswer: "Asia",
    bluffSuggestions: ["Africa", "North America", "Europe", "Antarctica"],
    category: "Geography",
    difficulty: "easy"
  },
  {
    question: "What bird is a symbol of peace?",
    correctAnswer: "Dove",
    bluffSuggestions: ["Eagle", "Swan", "Pigeon", "Owl"],
    category: "Nature",
    difficulty: "easy"
  }
];

/**
 * Common lie suggestions that can work across multiple questions
 */
const genericLieSuggestions: string[] = [
  "I remember reading about this recently",
  "My friend who's an expert told me",
  "I learned this in school",
  "I saw it on a documentary",
  "It was in a podcast I listened to",
  "My teacher mentioned this",
  "I read it in a book",
  "I saw it on the news",
  "A family member told me",
  "I learned it from experience"
];

/**
 * Word Bank Service Class
 */
export class WordBankService {
  /**
   * Get a random question from the word bank
   * Optionally filter by category or difficulty
   */
  getRandomQuestion(category?: string, difficulty?: 'easy' | 'medium' | 'hard'): WordBankEntry {
    let filtered = wordBank;
    
    if (category) {
      filtered = filtered.filter(entry => entry.category === category);
    }
    
    if (difficulty) {
      filtered = filtered.filter(entry => entry.difficulty === difficulty);
    }
    
    // If no matches after filtering, use full word bank
    if (filtered.length === 0) {
      filtered = wordBank;
    }
    
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }

  /**
   * Generate round data (question + answer + bluffs)
   * Compatible with AI service return type
   */
  generateRoundData(playerCount: number): GeneratedRoundData {
    const entry = this.getRandomQuestion();
    
    // Ensure we have enough bluff suggestions
    const bluffsNeeded = Math.min(playerCount - 1, entry.bluffSuggestions.length);
    const shuffledBluffs = this.shuffleArray([...entry.bluffSuggestions]).slice(0, bluffsNeeded);
    
    return {
      question: entry.question,
      correctAnswer: entry.correctAnswer,
      bluffSuggestions: shuffledBluffs,
      model: 'word-bank'
    };
  }

  /**
   * Generate a lie suggestion for a Red Herring player
   * Can use question context if provided
   */
  generateLieSuggestion(question?: string, existingAnswers?: string[]): GeneratedLieData {
    // If we have existing answers, try to generate something different
    if (existingAnswers && existingAnswers.length > 0) {
      // Return a generic lie that doesn't conflict
      const availableLies = genericLieSuggestions.filter(
        lie => !existingAnswers.includes(lie)
      );
      
      if (availableLies.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableLies.length);
        return {
          lieSuggestion: availableLies[randomIndex],
          usedFallback: true
        };
      }
    }
    
    // Return random generic lie
    const randomIndex = Math.floor(Math.random() * genericLieSuggestions.length);
    return {
      lieSuggestion: genericLieSuggestions[randomIndex],
      usedFallback: true
    };
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    const categories = new Set(wordBank.map(entry => entry.category).filter(Boolean));
    return Array.from(categories).sort();
  }

  /**
   * Get question count by difficulty
   */
  getDifficultyBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const entry of wordBank) {
      const diff = entry.difficulty || 'unknown';
      breakdown[diff] = (breakdown[diff] || 0) + 1;
    }
    
    return breakdown;
  }

  /**
   * Get total word bank size
   */
  getTotalCount(): number {
    return wordBank.length;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Export singleton instance
export const wordBankService = new WordBankService();
