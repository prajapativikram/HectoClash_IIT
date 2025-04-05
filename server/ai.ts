import OpenAI from "openai";
import { Difficulty } from "@shared/schema";

// Initialize the OpenAI or xAI client based on which API key is available
let client: OpenAI | null = null;

// Initialize the AI client
export function initAIClient() {
  try {
    // Check for xAI API key
    if (process.env.XAI_API_KEY) {
      console.log("Initializing xAI client...");
      client = new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: "https://api.x.ai/v1",
      });
    }
    // Fallback to OpenAI if no xAI key is provided
    else if (process.env.OPENAI_API_KEY) {
      console.log("Initializing OpenAI client...");
      client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.log("No AI API key provided, AI features will be disabled");
    }
  } catch (error) {
    console.error("Error initializing AI client:", error);
    client = null;
  }
}

// Function to generate a hint for a game
export async function generateHint(
  gameType: string,
  difficulty: Difficulty,
  context: Record<string, any>
): Promise<string> {
  // If no AI client is available, return a generic hint
  if (!client) {
    return getGenericHint(gameType, difficulty);
  }

  try {
    const model = process.env.XAI_API_KEY ? "grok-2-1212" : "gpt-3.5-turbo";
    
    // Prepare the prompt based on the game type and difficulty
    const prompt = prepareHintPrompt(gameType, difficulty, context);
    
    // Generate the hint using the AI model
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content || getGenericHint(gameType, difficulty);
  } catch (error) {
    console.error(`Error generating AI hint for ${gameType}:`, error);
    return getGenericHint(gameType, difficulty);
  }
}

// Helper function to prepare a prompt for the AI model
function prepareHintPrompt(
  gameType: string, 
  difficulty: Difficulty,
  context: Record<string, any>
): string {
  switch (gameType.toLowerCase()) {
    case "hectoclash": {
      const { numbers, target } = context;
      return `You are helping someone solve a number puzzle called HectoClash.
They need to use the numbers ${numbers.join(", ")} and mathematical operations (+, -, *, /, and parentheses)
to create an expression that equals ${target}. Each number must be used exactly once.
The difficulty level is ${difficulty}.
Provide ONE short, helpful hint (max 30 words) without giving away the full solution.`;
    }
    
    case "sudoku": {
      const { grid } = context;
      return `You are helping someone solve a Sudoku puzzle at ${difficulty} difficulty.
Here is the current state of their Sudoku grid:
${formatSudokuGrid(grid)}
Provide ONE short, helpful hint (max 30 words) without giving away specific cell values.
Focus on a technique they could apply based on the current grid state.`;
    }
    
    case "magicsquares": {
      const { size, grid } = context;
      return `You are helping someone solve a ${size}x${size} Magic Square puzzle at ${difficulty} difficulty.
Here is the current state of their grid:
${formatGrid(grid)}
In a magic square, every row, column, and diagonal must sum to the same number.
For a ${size}x${size} grid with numbers 1 to ${size*size}, the magic sum is ${getSum(size)}.
Provide ONE short, helpful hint (max 30 words) without giving away the full solution.`;
    }
    
    case "kenken": {
      const { size, grid, cages } = context;
      return `You are helping someone solve a ${size}x${size} KenKen puzzle at ${difficulty} difficulty.
Here is the current state of their grid:
${formatGrid(grid)}
The puzzle has these cages (groups of cells with a target value and operation):
${formatCages(cages)}
Provide ONE short, helpful hint (max 30 words) about a specific cage or row/column without giving away specific cell values.`;
    }
    
    case "numbersequences": {
      const { sequence } = context;
      return `You are helping someone solve a Number Sequence puzzle at ${difficulty} difficulty.
They need to find the next number in this sequence: ${sequence.join(", ")}, ?
Provide ONE short, helpful hint (max 30 words) that points them toward the pattern without giving away the answer.`;
    }
    
    case "cryptarithms": {
      const { equation } = context;
      return `You are helping someone solve a Cryptarithm puzzle at ${difficulty} difficulty.
In the equation ${equation}, each letter represents a unique digit (0-9).
Provide ONE short, helpful hint (max 30 words) about a constraint or strategy without giving away specific digit assignments.`;
    }
    
    default:
      return `You are helping someone solve a math puzzle at ${difficulty} difficulty.
Provide ONE short, helpful hint (max 30 words) that would guide them toward the solution without giving it away completely.`;
  }
}

// Helper function to get a generic hint when AI is not available
function getGenericHint(gameType: string, difficulty: Difficulty): string {
  switch (gameType.toLowerCase()) {
    case "hectoclash":
      if (difficulty === "easy") {
        return "Try starting with the largest number and using basic operations to reach the target.";
      } else if (difficulty === "medium") {
        return "Consider using parentheses to group operations in different ways.";
      } else {
        return "Sometimes the division operator can help get precise values that are otherwise difficult to reach.";
      }
    
    case "sudoku":
      if (difficulty === "easy") {
        return "Look for rows, columns, or 3x3 boxes where only one cell can contain a specific number.";
      } else if (difficulty === "medium") {
        return "Try the 'pencil marking' technique to track possible values for each empty cell.";
      } else {
        return "Look for 'naked pairs' - two cells in a row, column, or box that can only contain the same two values.";
      }
      
    case "magicsquares":
      return "Remember that in a magic square, every row, column, and diagonal must sum to the same 'magic' number.";
      
    case "kenken":
      return "Start with cages that have only one cell, then look for cages with operations that severely limit the possible values.";
      
    case "numbersequences":
      return "Look for common patterns: arithmetic (adding/subtracting), geometric (multiplying/dividing), squares, or alternating sequences.";
      
    case "cryptarithms":
      return "Start by focusing on the most constrained letters - often those that appear in the rightmost column or those that must be carried.";
      
    default:
      return "Break the problem into smaller parts and look for patterns or constraints that can help you narrow down the possibilities.";
  }
}

// Helper function to format a Sudoku grid as a string
function formatSudokuGrid(grid: (number | null)[][]): string {
  return grid
    .map(row => row.map(cell => cell === null ? '.' : cell).join(' '))
    .join('\n');
}

// Helper function to format a general grid as a string
function formatGrid(grid: any[][]): string {
  return grid
    .map(row => row.map(cell => cell === null ? '.' : cell).join(' '))
    .join('\n');
}

// Helper function to format KenKen cages as a string
function formatCages(cages: any[]): string {
  return cages
    .map(cage => `Cage ${cage.id}: Target ${cage.target} with ${cage.operation} operation`)
    .join('\n');
}

// Helper function to calculate the magic sum for a square of given size
function getSum(n: number): number {
  // The magic sum formula for a square with numbers 1 to n²
  return n * (n * n + 1) / 2;
}