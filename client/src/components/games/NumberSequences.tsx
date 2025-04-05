import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "../../providers/GameProvider";
import { useAuth } from "../../providers/AuthProvider";
import { apiRequest } from "@/lib/queryClient";
import { Lightbulb, Check, RefreshCw, ArrowRight } from "lucide-react";
import { generateNumberSequence } from "../../utils/gameGenerators";
import GameInitializer from "./GameInitializer";
import GameController from "./GameController";
import AIAssistant from "../ai/AIAssistant";

interface NumberSequence {
  sequence: number[];
  nextNumber: number;
  rule: string; // Description of the pattern
  difficulty: string;
}

const NumberSequences = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { difficulty, setDifficulty, gameId } = useGame();
  const [score, setScore] = useState(0);
  const [sequence, setSequence] = useState<NumberSequence | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [maxHints, setMaxHints] = useState(3);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const [showRule, setShowRule] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  const [hint, setHint] = useState<string>("");

  // Generate a new sequence puzzle based on difficulty
  const generateNewPuzzle = useCallback(() => {
    const newSequence = generateNumberSequence(difficulty);
    setSequence(newSequence);
    
    // Set max hints based on difficulty
    setMaxHints(
      difficulty === "easy" ? 3 :
      difficulty === "medium" ? 2 : 1
    );
    
    // Reset states
    setUserAnswer("");
    setHintsUsed(0);
    setIsCorrect(false);
    setIsIncorrect(false);
    setShowRule(false);
    setScore(0);
    setHint("");
  }, [difficulty]);

  // Handle game start
  const handleGameStart = () => {
    generateNewPuzzle();
    setShowDifficultySelector(false);
  };

  // Handle reset
  const handleReset = () => {
    generateNewPuzzle();
  };

  // Handle user input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and negative sign
    const value = e.target.value.replace(/[^0-9-]/g, "");
    setUserAnswer(value);
    setIsIncorrect(false);
  };

  // Use a hint
  const useHint = () => {
    if (hintsUsed >= maxHints) {
      toast({
        title: "No hints remaining",
        description: "You've used all your available hints.",
        variant: "destructive"
      });
      return;
    }
    
    // Provide hints based on how many have been used
    if (hintsUsed === 0) {
      // First hint: Describe general pattern type
      const patternType = sequence?.rule.split(":")[0] || "Look for a pattern";
      toast({
        title: "Hint 1",
        description: patternType,
        variant: "default"
      });
      setHint(patternType);
    } else if (hintsUsed === 1) {
      // Second hint: Give a more specific clue
      const specificClue = sequence?.rule.split(":")[1] || "Analyze the changes between consecutive numbers";
      toast({
        title: "Hint 2",
        description: specificClue,
        variant: "default"
      });
      setHint(specificClue);
    } else {
      // Final hint: Show the pattern rule
      setShowRule(true);
      toast({
        title: "Final Hint",
        description: "The pattern rule has been revealed.",
        variant: "default"
      });
      setHint(sequence?.rule || "");
    }
    
    // Increment hints used and reduce potential score
    setHintsUsed(prev => prev + 1);
    setScore(prev => Math.max(0, prev - 10));
  };

  // Check the user's answer
  const checkAnswer = () => {
    if (!sequence) return;
    
    const parsedAnswer = parseInt(userAnswer, 10);
    
    if (isNaN(parsedAnswer)) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid number.",
        variant: "destructive"
      });
      return;
    }
    
    if (parsedAnswer === sequence.nextNumber) {
      // Correct answer
      // Calculate score based on difficulty and hints used
      const difficultyMultiplier = 
        difficulty === "easy" ? 1 :
        difficulty === "medium" ? 2 : 3;
      
      const baseScore = 50 * difficultyMultiplier;
      const hintPenalty = hintsUsed * 10;
      const newScore = baseScore - hintPenalty;
      
      setScore(prev => prev + Math.floor(newScore));
      setIsCorrect(true);
      setShowRule(true);
      // Make sure we indicate to the controller that the game is complete
      
      toast({
        title: "Correct!",
        description: `You've found the next number and earned ${Math.floor(newScore)} points!`,
        variant: "default"
      });
      
      // Submit score if user is logged in
      if (user && gameId) {
        submitScore(Math.floor(newScore));
      }
    } else {
      // Incorrect answer
      setIsIncorrect(true);
      
      toast({
        title: "Incorrect",
        description: "That's not the right number. Try again!",
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

  // Game content with Number Sequence and controls
  const gameContent = (
    <>
      <div className="mb-8">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Find the Next Number</h3>
          <p className="text-sm text-gray-600 mb-4">
            Identify the pattern in the sequence and determine what number comes next.
          </p>
          
          {/* Sequence Display */}
          <div className="flex items-center justify-center flex-wrap gap-2 p-4 bg-gray-100 rounded-md mb-6">
            {sequence?.sequence.map((num, index) => (
              <div 
                key={index} 
                className="min-w-[50px] h-12 flex items-center justify-center bg-white border border-gray-300 rounded-md font-mono text-lg shadow-sm"
              >
                {num}
              </div>
            ))}
            <div className="flex items-center justify-center w-5">
              <ArrowRight className="text-primary" />
            </div>
            <div 
              className={`min-w-[50px] h-12 flex items-center justify-center border rounded-md font-mono text-lg 
                ${isCorrect ? "bg-green-100 border-green-300" : isIncorrect ? "bg-red-100 border-red-300" : "bg-white border-gray-300"}
              `}
            >
              {isCorrect ? sequence?.nextNumber : "?"}
            </div>
          </div>
          
          {/* User Input */}
          {!isCorrect && (
            <div className="flex justify-center mb-4">
              <div className="w-40">
                <Input
                  type="text"
                  value={userAnswer}
                  onChange={handleInputChange}
                  placeholder="Enter number"
                  className={`text-center font-mono text-lg ${isIncorrect ? "border-red-300" : ""}`}
                />
              </div>
            </div>
          )}
          
          {/* Pattern Rule (shown when solved or after final hint) */}
          {showRule && sequence && (
            <div className="p-3 bg-blue-50 text-blue-800 rounded-md mb-4">
              <p className="text-sm font-medium">Pattern: {sequence.rule}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-2 flex-wrap">
            {!isCorrect && (
              <>
                <Button
                  variant="outline"
                  onClick={useHint}
                  disabled={hintsUsed >= maxHints}
                >
                  <Lightbulb className="mr-1 h-4 w-4" /> Hint ({maxHints - hintsUsed})
                </Button>
                <Button
                  variant="default"
                  className="bg-primary hover:bg-primary/90"
                  onClick={checkAnswer}
                  disabled={!userAnswer}
                >
                  <Check className="mr-1 h-4 w-4" /> Check Answer
                </Button>
              </>
            )}
            {isCorrect && (
              <Button
                variant="default"
                onClick={generateNewPuzzle}
              >
                <RefreshCw className="mr-1 h-4 w-4" /> Next Sequence
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="mt-4 mb-6">
        <AIAssistant 
          gameName="Number Sequences"
          difficulty={difficulty}
          onRequestHint={() => {
            if (hintsUsed >= maxHints) {
              const noHintsMessage = "You've used all your available hints. Try reviewing the common sequence patterns below.";
              setHint(noHintsMessage);
              return noHintsMessage;
            }

            let newHint = "";
            // Provide hints based on how many have been used
            if (hintsUsed === 0) {
              // First hint: Describe general pattern type
              newHint = sequence?.rule.split(":")[0] || "Look for a pattern";
            } else if (hintsUsed === 1) {
              // Second hint: Give a more specific clue
              newHint = sequence?.rule.split(":")[1] || "Analyze the changes between consecutive numbers";
            } else {
              // Final hint: Show the pattern rule
              setShowRule(true);
              newHint = sequence?.rule || "";
            }
            
            // Increment hints used and reduce potential score
            setHintsUsed(prev => prev + 1);
            setScore(prev => Math.max(0, prev - 10));
            
            setHint(newHint);
            return newHint;
          }}
          isPremium={false}
          hintsRemaining={maxHints - hintsUsed}
        />
      </div>

      {/* Pattern Types Information */}
      <div className="border-t pt-4">
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary text-xl mr-2">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
          </svg>
          <h3 className="font-bold">Common Sequence Patterns</h3>
        </div>
        <div className="bg-gray-50 p-4 rounded-md text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-medium">Arithmetic:</span> Add or subtract a constant (e.g., 2, 4, 6, 8, ...)</li>
            <li><span className="font-medium">Geometric:</span> Multiply or divide by a constant (e.g., 2, 4, 8, 16, ...)</li>
            <li><span className="font-medium">Fibonacci-like:</span> Each number is the sum of the previous two (e.g., 1, 1, 2, 3, 5, ...)</li>
            <li><span className="font-medium">Square/Cube Numbers:</span> Sequence of squares or cubes (e.g., 1, 4, 9, 16, ...)</li>
            <li><span className="font-medium">Alternating Patterns:</span> Different rules for odd and even positions</li>
          </ul>
        </div>
      </div>
    </>
  );

  return (
    <>
      {showDifficultySelector ? (
        <GameInitializer 
          gameName="Number Sequences"
          gameDescription="Identify patterns in number sequences and determine what number comes next. Exercise your logical thinking and pattern recognition skills."
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={handleGameStart}
        />
      ) : (
        <GameController
          gameName="Number Sequences"
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          score={score}
          isGameComplete={isCorrect}
          onReset={handleReset}
          onShowDifficultySelector={() => setShowDifficultySelector(true)}
          countdownMode={false}
        >
          {gameContent}
        </GameController>
      )}
    </>
  );
};

export default NumberSequences;