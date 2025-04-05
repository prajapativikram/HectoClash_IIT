import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "../../providers/GameProvider";
import { useAuth } from "../../providers/AuthProvider";
import { apiRequest } from "@/lib/queryClient";
import { Lightbulb, Check, RefreshCw, ArrowRight, Play, Pause } from "lucide-react";
import { useTimer } from "../../utils/timerUtils";
import { generateCryptarithm } from "../../utils/gameGenerators";
import GameInitializer from "./GameInitializer";

interface Cryptarithm {
  equation: string;
  solution: Record<string, number>;
  difficulty: string;
  hint: string;
}

const Cryptarithms = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { difficulty, setDifficulty, gameId } = useGame();
  const [score, setScore] = useState(0);
  const [puzzle, setPuzzle] = useState<Cryptarithm | null>(null);
  const [userSolution, setUserSolution] = useState<Record<string, number>>({});
  const [letters, setLetters] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [maxHints, setMaxHints] = useState(3);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { time, startTimer, stopTimer, resetTimer, formatTime } = useTimer();

  // Generate a new cryptarithm puzzle based on difficulty
  const generateNewPuzzle = useCallback(() => {
    const newPuzzle = generateCryptarithm(difficulty);
    setPuzzle(newPuzzle);
    
    // Extract unique letters from the equation
    const uniqueLetters = Array.from(new Set(
      newPuzzle.equation
        .replace(/[^A-Z]/g, "") // Keep only letters
        .split("")
    )).sort();
    setLetters(uniqueLetters);
    
    // Initialize user solution with empty values
    const initialSolution: Record<string, number> = {};
    uniqueLetters.forEach(letter => {
      initialSolution[letter] = -1; // -1 means unassigned
    });
    setUserSolution(initialSolution);
    
    // Set max hints based on difficulty
    setMaxHints(
      difficulty === "easy" ? 3 :
      difficulty === "medium" ? 2 : 1
    );
    
    // Reset states
    setHintsUsed(0);
    setIsCorrect(false);
    setShowSolution(false);
    
    resetTimer();
  }, [difficulty, resetTimer]);

  // Start game with selected difficulty
  const handleGameStart = () => {
    generateNewPuzzle();
    setGameStarted(true);
    startTimer();
  };

  // Handle timer pause/resume
  const togglePause = () => {
    if (isPaused) {
      startTimer();
    } else {
      stopTimer();
    }
    setIsPaused(!isPaused);
  };

  // Update user solution for a specific letter
  const updateSolution = (letter: string, value: number) => {
    // Check if the value is already assigned to another letter
    const isValueUsed = Object.entries(userSolution).some(
      ([key, val]) => key !== letter && val === value
    );
    
    if (isValueUsed) {
      toast({
        title: "Value already used",
        description: `The digit ${value} is already assigned to another letter.`,
        variant: "destructive"
      });
      return;
    }
    
    setUserSolution(prev => ({
      ...prev,
      [letter]: value
    }));
  };

  // Use a hint to reveal a letter's value
  const useHint = () => {
    if (!puzzle) return;
    if (hintsUsed >= maxHints) {
      toast({
        title: "No hints remaining",
        description: "You've used all your available hints.",
        variant: "destructive"
      });
      return;
    }
    
    // Find an unassigned letter or one with an incorrect assignment
    const candidateLetters = letters.filter(letter => 
      userSolution[letter] === -1 || userSolution[letter] !== puzzle.solution[letter]
    );
    
    if (candidateLetters.length === 0) {
      toast({
        title: "No hints needed",
        description: "All letters seem to be correctly assigned.",
        variant: "default"
      });
      return;
    }
    
    // Choose a letter to reveal - prioritize letters in the solution if it's the first hint
    let letterToReveal: string;
    
    if (hintsUsed === 0) {
      // For first hint, focus on the first letter of a word
      const firstLetters = puzzle.equation
        .split(/[+\-=]/)
        .map(word => word.trim()[0])
        .filter(letter => /[A-Z]/.test(letter));
      
      const firstLetterCandidates = candidateLetters.filter(letter => 
        firstLetters.includes(letter)
      );
      
      letterToReveal = firstLetterCandidates.length > 0 
        ? firstLetterCandidates[0] 
        : candidateLetters[0];
    } else {
      // For subsequent hints, just pick any letter that needs help
      letterToReveal = candidateLetters[0];
    }
    
    // Reveal the value for this letter
    const correctValue = puzzle.solution[letterToReveal];
    setUserSolution(prev => ({
      ...prev,
      [letterToReveal]: correctValue
    }));
    
    toast({
      title: "Hint Used",
      description: `The letter ${letterToReveal} has the value ${correctValue}.`,
      variant: "default"
    });
    
    setHintsUsed(prev => prev + 1);
    setScore(prev => Math.max(0, prev - 15)); // Reduce potential score
  };

  // Check if the user's solution is correct
  const checkSolution = () => {
    if (!puzzle) return;
    
    // Check if all letters have been assigned
    const unassignedLetters = Object.values(userSolution).filter(val => val === -1);
    if (unassignedLetters.length > 0) {
      toast({
        title: "Incomplete Solution",
        description: "You must assign a digit to each letter.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if the solution is correct
    const isCorrectSolution = letters.every(letter => 
      userSolution[letter] === puzzle.solution[letter]
    );
    
    if (isCorrectSolution) {
      // Calculate score based on time, difficulty, and hints used
      const difficultyMultiplier = 
        difficulty === "easy" ? 1 :
        difficulty === "medium" ? 2 : 3;
      
      const timeBonus = Math.max(0, 600 - time);
      const hintPenalty = hintsUsed * 15;
      const newScore = (150 + (timeBonus / 10) * difficultyMultiplier) - hintPenalty;
      
      setScore(prev => prev + Math.floor(newScore));
      stopTimer();
      setIsCorrect(true);
      
      toast({
        title: "Correct!",
        description: `You've solved the cryptarithm and earned ${Math.floor(newScore)} points!`,
        variant: "default"
      });
      
      // Submit score if user is logged in
      if (user && gameId) {
        submitScore(Math.floor(newScore));
      }
    } else {
      toast({
        title: "Incorrect Solution",
        description: "Your solution is not correct. Check your assignments.",
        variant: "destructive"
      });
      
      // Show the solution after three incorrect attempts
      if (hintsUsed >= maxHints) {
        setShowSolution(true);
      }
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

  // Format the equation with the current solution values
  const formatEquation = (equation: string, solution: Record<string, number>): string => {
    let formatted = equation;
    for (const [letter, value] of Object.entries(solution)) {
      if (value !== -1) {
        const regex = new RegExp(letter, "g");
        formatted = formatted.replace(regex, value.toString());
      }
    }
    return formatted;
  };

  return (
    <>
      {!gameStarted ? (
        <GameInitializer 
          gameName="Cryptarithms"
          gameDescription="Replace each letter with a digit to make the equation true. Each letter represents a unique digit."
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={handleGameStart}
        />
      ) : (
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="p-6">
            {/* Game Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Cryptarithms</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="font-mono text-lg">{formatTime(time)}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-1 text-gray-500"
                    onClick={togglePause}
                    disabled={isCorrect}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
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

            {isPaused ? (
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Game Paused</h3>
                <p className="mb-4">Click the play button to resume the game.</p>
                <Button 
                  onClick={togglePause}
                  className="bg-primary"
                >
                  <Play className="mr-2 h-4 w-4" /> Resume Game
                </Button>
              </div>
            ) : (
              <>
                {/* Game Container */}
                <div className="mb-8">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">Solve the Cryptarithm</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Replace each letter with a digit (0-9) to make the equation true. Each letter represents a unique digit.
                    </p>
                    
                    {/* Equation Display */}
                    <div className="p-6 bg-gray-100 rounded-md mb-6">
                      <div className="font-mono text-2xl font-bold">
                        {puzzle ? (isCorrect || showSolution 
                          ? formatEquation(puzzle.equation, puzzle.solution)
                          : formatEquation(puzzle.equation, userSolution)
                        ) : "Loading..."}
                      </div>
                    </div>
                    
                    {/* Letter-to-Digit Mapping */}
                    {!isCorrect && !showSolution && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                        {letters.map(letter => (
                          <div key={letter} className="flex items-center space-x-2">
                            <span className="font-mono text-lg font-bold">{letter} =</span>
                            <select
                              value={userSolution[letter] === -1 ? "" : userSolution[letter]}
                              onChange={(e) => updateSolution(letter, e.target.value ? parseInt(e.target.value, 10) : -1)}
                              className="w-16 p-2 border rounded text-center font-mono"
                              disabled={isCorrect}
                            >
                              <option value="">?</option>
                              {Array.from({ length: 10 }, (_, i) => i).map(digit => (
                                <option key={digit} value={digit}>{digit}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Solution Display (when revealed) */}
                    {showSolution && !isCorrect && puzzle && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-6">
                        <h4 className="font-medium text-yellow-800 mb-2">Solution:</h4>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                          {Object.entries(puzzle.solution).map(([letter, digit]) => (
                            <div key={letter} className="font-mono">
                              {letter} = {digit}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex justify-center gap-2 flex-wrap">
                      {!isCorrect && !showSolution && (
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
                            onClick={checkSolution}
                          >
                            <Check className="mr-1 h-4 w-4" /> Check Solution
                          </Button>
                        </>
                      )}
                      {(isCorrect || showSolution) && (
                        <Button
                          variant="default"
                          onClick={() => {
                            setGameStarted(false);
                            stopTimer();
                          }}
                        >
                          <RefreshCw className="mr-1 h-4 w-4" /> New Game
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hints/Tips Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary text-xl mr-2">
                      <rect x="3" y="11" width="18" height="10" rx="2" />
                      <circle cx="12" cy="5" r="2" />
                      <path d="M12 7v4" />
                      <line x1="8" y1="16" x2="8" y2="16" />
                      <line x1="16" y1="16" x2="16" y2="16" />
                    </svg>
                    <h3 className="font-bold">Cryptarithm Tips</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md text-sm">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Start with constraints: the first digit of a number is never zero.</li>
                      <li>Look for letters that must be 1 (carry digits in addition).</li>
                      <li>The right-most column often provides strong clues due to lack of carries.</li>
                      <li>Process of elimination: try values and see what works.</li>
                      <li>Consider carry digits when working through the equation from right to left.</li>
                    </ul>
                    {puzzle && puzzle.hint && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-blue-800">
                        <span className="font-medium">Hint: </span>{puzzle.hint}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default Cryptarithms;
