import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "../../providers/GameProvider";
import { useAuth } from "../../providers/AuthProvider";
import { apiRequest } from "@/lib/queryClient";
import { Lightbulb, Check, Trash2 } from "lucide-react";
import { useTimer } from "../../utils/timerUtils";
import { generateHectocPuzzle } from "../../utils/gameGenerators";
import AIAssistant from "../ai/AIAssistant";

interface Operation {
  symbol: string;
  display: string;
}

interface HectoPuzzle {
  numbers: number[];
  target: number;
}

const operations: Operation[] = [
  { symbol: "+", display: "+" },
  { symbol: "-", display: "-" },
  { symbol: "*", display: "×" },
  { symbol: "/", display: "÷" },
  { symbol: "(", display: "(" },
  { symbol: ")", display: ")" }
];

const HectoClash = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { difficulty, gameId } = useGame();
  const [score, setScore] = useState(0);
  const [puzzle, setPuzzle] = useState<HectoPuzzle>({ numbers: [], target: 100 });
  const [expression, setExpression] = useState("");
  const [usedNumberIndexes, setUsedNumberIndexes] = useState<number[]>([]);
  const [hint, setHint] = useState("");
  const { time, startTimer, stopTimer, formatTime } = useTimer();
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Generate a new puzzle based on difficulty
  const generateNewPuzzle = useCallback(() => {
    const newPuzzle = generateHectocPuzzle(difficulty);
    setPuzzle(newPuzzle);
    setExpression("");
    setUsedNumberIndexes([]);
    setHint("");
    startTimer();
    setIsGameComplete(false);
  }, [difficulty, startTimer]);

  // Initialize game
  useEffect(() => {
    // Only generate a new puzzle once on component mount
    generateNewPuzzle();
    
    return () => {
      stopTimer();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add number to expression
  const addNumber = (number: number, index: number) => {
    if (usedNumberIndexes.includes(index)) {
      return;
    }
    
    setExpression(prev => prev + number);
    setUsedNumberIndexes(prev => [...prev, index]);
  };

  // Add operation to expression
  const addOperation = (op: Operation) => {
    setExpression(prev => prev + op.symbol);
  };

  // Clear expression
  const clearExpression = () => {
    setExpression("");
    setUsedNumberIndexes([]);
  };

  // Show quick hint
  const showHint = () => {
    // Different hints based on difficulty
    const hints = {
      easy: [
        `Try starting with the largest number (${Math.max(...puzzle.numbers)}).`,
        "Addition and subtraction are easier to work with than multiplication and division.",
        `Look for pairs of numbers that might get you close to ${puzzle.target}.`
      ],
      medium: [
        "Use parentheses to control the order of operations.",
        "Sometimes combining the largest and smallest numbers is helpful.",
        "Try working backward from the target number."
      ],
      difficult: [
        "Think about decimal results when using division.",
        "Multiple solutions may exist - try different combinations.",
        "Consider unusual operation orders that might yield the target."
      ]
    };
    
    // Select a random hint from the appropriate difficulty level
    const hintArray = hints[difficulty as keyof typeof hints];
    const randomHint = hintArray[Math.floor(Math.random() * hintArray.length)];
    setHint(randomHint);
    
    // Reduce score if hint is used (just a small penalty for quick hints)
    setScore(prev => Math.max(0, prev - 5));
  };

  // Evaluate expression
  const evaluateExpression = () => {
    if (usedNumberIndexes.length !== puzzle.numbers.length) {
      toast({
        title: "Use all numbers",
        description: "You must use all numbers in the puzzle.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Safe evaluation using Function constructor
      const result = Function(`"use strict"; return (${expression})`)();
      
      if (result === puzzle.target) {
        // Calculate score based on time and difficulty
        const difficultyMultiplier = 
          difficulty === "easy" ? 1 :
          difficulty === "medium" ? 2 : 3;
        
        const timeBonus = Math.max(0, 120 - time);
        const newScore = 50 + (timeBonus * difficultyMultiplier);
        
        setScore(prev => prev + newScore);
        stopTimer();
        setIsGameComplete(true);
        
        toast({
          title: "Correct!",
          description: `You've found the solution and earned ${newScore} points!`,
          variant: "default"
        });
        
        // Submit score if user is logged in
        if (user && gameId) {
          submitScore(newScore);
        }
      } else {
        toast({
          title: "Incorrect",
          description: `Your expression equals ${result}, not ${puzzle.target}.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Invalid Expression",
        description: "The expression could not be evaluated. Check for syntax errors.",
        variant: "destructive"
      });
    }
  };

  // Submit score to the server
  const submitScore = async (gameScore: number) => {
    if (!user || !gameId) return;
    
    try {
      await apiRequest("/api/results", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          gameId: gameId,
          score: gameScore,
          difficulty: difficulty
        })
      });
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        {/* Game Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">HectoClash</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="font-mono text-lg">{formatTime(time)}</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 mr-2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="font-mono text-lg">{score}</span>
            </div>
            <Badge variant="outline">
              <span className="text-sm font-medium">
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </span>
            </Badge>
          </div>
        </div>

        {/* Game Container */}
        <div className="mb-8">
          <div className="flex flex-col items-center mb-6">
            <p className="text-sm mb-2">Target:</p>
            <div className="bg-[#14213d] text-white text-2xl font-bold font-mono w-20 h-20 rounded-full flex items-center justify-center">
              {puzzle.target}
            </div>
          </div>

          <div className="flex justify-center mb-6 gap-2 flex-wrap">
            {puzzle.numbers.map((number, index) => (
              <Button
                key={index}
                variant="default"
                className={`w-12 h-12 rounded-md font-mono text-xl ${
                  usedNumberIndexes.includes(index) ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => addNumber(number, index)}
                disabled={usedNumberIndexes.includes(index) || isGameComplete}
              >
                {number}
              </Button>
            ))}
          </div>

          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {operations.map((op, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-10 h-10 rounded flex items-center justify-center text-xl font-mono"
                onClick={() => addOperation(op)}
                disabled={isGameComplete}
              >
                {op.display}
              </Button>
            ))}
          </div>

          <div className="bg-gray-100 p-4 rounded-md mb-6 min-h-[60px]">
            <div className="font-mono text-xl text-center break-all">
              {expression || "Enter your expression..."}
            </div>
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={showHint}
              disabled={isGameComplete}
            >
              <Lightbulb className="mr-1 h-4 w-4" /> Quick Hint
            </Button>
            <Button
              variant="destructive"
              onClick={clearExpression}
              disabled={isGameComplete}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Clear
            </Button>
            <Button
              variant="default"
              className="bg-primary hover:bg-primary/90"
              onClick={evaluateExpression}
              disabled={isGameComplete}
            >
              <Check className="mr-1 h-4 w-4" /> Submit
            </Button>
            {isGameComplete && (
              <Button
                variant="default"
                onClick={generateNewPuzzle}
              >
                Next Puzzle
              </Button>
            )}
          </div>
        </div>

        {/* New AI Assistant Component */}
        <div className="mt-8">
          <AIAssistant 
            gameName="HectoClash"
            difficulty={difficulty}
            onRequestHint={() => {
              // Advanced hint generation based on game state
              const advancedHints = {
                easy: [
                  `Try using ${Math.max(...puzzle.numbers)} as your starting point, then build from there.`,
                  `Look at these numbers carefully: ${puzzle.numbers.join(', ')}. Can you find two that add up or multiply to get closer to ${puzzle.target}?`,
                  `For a target of ${puzzle.target}, you can think about which operations might get you close quickly.`,
                  `Have you tried adding ${puzzle.numbers[0]} and ${puzzle.numbers[1]}, then combining with the other numbers?`,
                  `One approach is to try simple operations first, like ${puzzle.numbers[0]} + ${puzzle.numbers[1]} = ${puzzle.numbers[0] + puzzle.numbers[1]}. How might you continue from there?`
                ],
                medium: [
                  `Remember PEMDAS! Parentheses first, then exponents, multiplication/division, and addition/subtraction.`,
                  `What happens if you try (${puzzle.numbers[0]} ${operations[0].symbol} ${puzzle.numbers[1]}) ${operations[1].symbol} ${puzzle.numbers[2]}?`,
                  `Your current expression is "${expression}". Consider what operation could help reach ${puzzle.target}.`,
                  `To reach ${puzzle.target}, you might need to use parentheses creatively to control the order of calculations.`,
                  `One strategy is to find a way to get a value close to ${puzzle.target}, then make small adjustments with +/- operations.`
                ],
                difficult: [
                  `Complex puzzles sometimes require creative solutions. Have you considered using division to get a precise value?`,
                  `Think of ${puzzle.target} as the result of multiple steps. What intermediate values might be helpful?`,
                  `For difficult targets like ${puzzle.target}, considering working backward. What operations would yield this number?`,
                  `You've used ${usedNumberIndexes.length} of ${puzzle.numbers.length} numbers so far. Think about how to incorporate the remaining ones.`,
                  `Sometimes the solution involves creating a larger value first, then reducing it precisely to reach ${puzzle.target}.`
                ]
              };
              
              // Context-aware hints based on user's current progress
              let contextHints = [];
              
              // If user has started building an expression
              if (expression) {
                contextHints.push(`You've started with "${expression}". Consider what operations might help you reach ${puzzle.target} from here.`);
                
                // If they've used most numbers but not all
                if (usedNumberIndexes.length > 0 && usedNumberIndexes.length < puzzle.numbers.length) {
                  const remainingNumbers = puzzle.numbers.filter((_, index) => !usedNumberIndexes.includes(index));
                  contextHints.push(`You still need to use these numbers: ${remainingNumbers.join(', ')}.`);
                }
                
                // If they've used parentheses already
                if (expression.includes('(')) {
                  contextHints.push(`You're using parentheses well. Remember they control the order of operations.`);
                }
              } else {
                contextHints.push(`Think about which number would be a good starting point for reaching ${puzzle.target}.`);
              }
              
              // Select the appropriate hint pool based on difficulty and context
              let hintPool;
              
              if (contextHints.length > 0 && Math.random() > 0.5) {
                // 50% chance to use a context-specific hint if available
                hintPool = contextHints;
              } else {
                // Otherwise use difficulty-based hints
                hintPool = advancedHints[difficulty as keyof typeof advancedHints];
              }
              
              // Select a random hint from the chosen pool
              const newHint = hintPool[Math.floor(Math.random() * hintPool.length)];
              
              // Save the hint and apply a small score penalty
              setHint(newHint);
              setScore(prev => Math.max(0, prev - 5));
              
              return newHint;
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default HectoClash;
