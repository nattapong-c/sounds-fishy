export interface IWordEntry {
  question: string;
  answer: string;
  bluffs: string[];
}

export class WordBankService {
  private wordBank: IWordEntry[] = [
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

  getRandomWord(): IWordEntry {
    const randomIndex = Math.floor(Math.random() * this.wordBank.length);
    return this.wordBank[randomIndex];
  }

  getWordByQuestion(question: string): IWordEntry | undefined {
    return this.wordBank.find(w => w.question === question);
  }
}
