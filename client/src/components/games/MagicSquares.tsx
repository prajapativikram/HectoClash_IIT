import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "../../providers/GameProvider";
import { useAuth } from "../../providers/AuthProvider";
import { apiPost } from "@/lib/queryClient";
import { Lightbulb, Check, RefreshCw } from "lucide-react";
import GameController from "./GameController";
import { generateMagicSquare } from "../../utils/gameGenerators";
import DifficultySelector from "../difficulty/DifficultySelector";

type MagicSquareGrid = (number | null)[][];

const MagicSquares = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { difficulty, setDifficulty, gameId } = useGame();
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<MagicSquareGrid>([]);
  const [targetSum, setTargetSum] = useState(0);
  const [size, setSize] = useState(3);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [usedNumbers, setUsedNumbers] = useState<number[]>([]);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);

  // Initialize new puzzle
  const initializePuzzle = () => {
    // Determine size based on difficulty
    const puzzleSize = 
      difficulty === "easy" ? 3 :
      difficulty === "medium" ? 4 : 5;
    
    setSize(puzzleSize);
    
    const { puzzle, targetSum, availableNumbers } = generateMagicSquare(puzzleSize, difficulty);
    setGrid(puzzle);
    setTargetSum(targetSum);
    setAvailableNumbers(availableNumbers);
    setUsedNumbers([]);
    
    // Set hints based on difficulty
    setHintsRemaining(
      difficulty === "easy" ? 3 :
      difficulty === "medium" ? 2 : 1
    );
    
    setIsGameComplete(false);
    setSelectedCell(null);
  };
  
  // Initialize puzzle when component mounts or difficulty changes
  useEffect(() => {
    initializePuzzle();
  }, [difficulty]);

  // Select a cell
  const selectCell = (row: number, col: number) => {
    // Skip if cell already has a value
    if (grid[row][col] !== null) return;
    setSelectedCell([row, col]);
  };

  // Place a number in the selected cell
  const placeNumber = (num: number) => {
    if (!selectedCell) return;
    if (usedNumbers.includes(num)) {
      toast({
        title: "Number already used",
        description: "Each number can only be used once.",
        variant: "destructive"
      });
      return;
    }
    
    const [row, col] = selectedCell;
    const newGrid = [...grid];
    newGrid[row][col] = num;
    setGrid(newGrid);
    
    // Update used numbers
    setUsedNumbers([...usedNumbers, num]);
    setSelectedCell(null);
  };

  // Reset the grid
  const resetGrid = () => {
    // Create an empty grid
    const emptyGrid: MagicSquareGrid = Array(size).fill(null).map(() => 
      Array(size).fill(null)
    );
    setGrid(emptyGrid);
    setUsedNumbers([]);
    setSelectedCell(null);
  };

  // Use a hint
  const useHint = () => {
    if (hintsRemaining <= 0) {
      toast({
        title: "No hints remaining",
        description: "You've used all your available hints.",
        variant: "destructive"
      });
      return;
    }
    
    // Find an empty cell with the most promising position
    let bestCell: [number, number] | null = null;
    let bestScore = -1;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (grid[i][j] === null) {
          // Count filled cells in this row and column
          let rowCount = 0;
          let colCount = 0;
          
          for (let k = 0; k < size; k++) {
            if (grid[i][k] !== null) rowCount++;
            if (grid[k][j] !== null) colCount++;
          }
          
          const cellScore = rowCount + colCount;
          if (cellScore > bestScore) {
            bestScore = cellScore;
            bestCell = [i, j];
          }
        }
      }
    }
    
    if (!bestCell) {
      toast({
        title: "No empty cells",
        description: "All cells are already filled.",
        variant: "destructive"
      });
      return;
    }
    
    // Find a suitable number for this cell
    const [row, col] = bestCell;
    
    // Get the first available number that's not used
    const availableNum = availableNumbers.find(num => !usedNumbers.includes(num));
    
    if (availableNum) {
      const newGrid = [...grid];
      newGrid[row][col] = availableNum;
      setGrid(newGrid);
      setUsedNumbers([...usedNumbers, availableNum]);
      setHintsRemaining(prev => prev - 1);
      
      // Reduce score when using hints
      setScore(prev => Math.max(0, prev - 15));
      
      toast({
        title: "Hint used",
        description: `Placed ${availableNum} at position (${row+1},${col+1}).`,
        variant: "default"
      });
    }
  };

  // Check if the magic square is valid
  const checkSolution = (currentTime: number) => {
    // Check if all cells are filled
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (grid[i][j] === null) {
          toast({
            title: "Incomplete",
            description: "The puzzle is not complete. Fill in all cells.",
            variant: "destructive"
          });
          return;
        }
      }
    }
    
    // Check rows
    for (let i = 0; i < size; i++) {
      let rowSum = 0;
      for (let j = 0; j < size; j++) {
        rowSum += grid[i][j]!;
      }
      if (rowSum !== targetSum) {
        toast({
          title: "Incorrect",
          description: `Row ${i+1} sum is ${rowSum}, not ${targetSum}.`,
          variant: "destructive"
        });
        return;
      }
    }
    
    // Check columns
    for (let j = 0; j < size; j++) {
      let colSum = 0;
      for (let i = 0; i < size; i++) {
        colSum += grid[i][j]!;
      }
      if (colSum !== targetSum) {
        toast({
          title: "Incorrect",
          description: `Column ${j+1} sum is ${colSum}, not ${targetSum}.`,
          variant: "destructive"
        });
        return;
      }
    }
    
    // Check main diagonal
    let diagSum = 0;
    for (let i = 0; i < size; i++) {
      diagSum += grid[i][i]!;
    }
    if (diagSum !== targetSum) {
      toast({
        title: "Incorrect",
        description: `Main diagonal sum is ${diagSum}, not ${targetSum}.`,
        variant: "destructive"
      });
      return;
    }
    
    // Check other diagonal
    let otherDiagSum = 0;
    for (let i = 0; i < size; i++) {
      otherDiagSum += grid[i][size-1-i]!;
    }
    if (otherDiagSum !== targetSum) {
      toast({
        title: "Incorrect",
        description: `Other diagonal sum is ${otherDiagSum}, not ${targetSum}.`,
        variant: "destructive"
      });
      return;
    }
    
    // Calculate score based on time and difficulty
    const difficultyMultiplier = 
      difficulty === "easy" ? 1 :
      difficulty === "medium" ? 2 : 3;
    
    const timeBonus = Math.max(0, 600 - currentTime);
    const hintPenalty = (3 - hintsRemaining) * 15;
    const newScore = (100 + (timeBonus / 10) * difficultyMultiplier) - hintPenalty;
    
    setScore(prev => prev + Math.floor(newScore));
    setIsGameComplete(true);
    
    toast({
      title: "Correct!",
      description: `You've solved the puzzle and earned ${Math.floor(newScore)} points!`,
      variant: "default"
    });
    
    // Submit score if user is logged in
    if (user && gameId) {
      submitScore(Math.floor(newScore));
    }
    
    return true; // Indicate completion for GameController
  };

  // Submit score to the server
  const submitScore = async (gameScore: number) => {
    if (!user || !gameId) return;
    
    try {
      await apiPost("/api/results", {
        userId: user.id,
        gameId: gameId,
        score: gameScore,
        difficulty: difficulty
      });
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  };

  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty: string) => {
    setDifficulty(newDifficulty as "easy" | "medium" | "difficult");
    setShowDifficultySelector(false);
  };

  // Show difficulty selector
  const showSelector = () => {
    setShowDifficultySelector(true);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-white rounded-lg shadow-md">
      {showDifficultySelector ? (
        <DifficultySelector 
          onSelect={handleDifficultyChange}
          currentDifficulty={difficulty}
        />
      ) : (
        <GameController
          gameName="Magic Squares"
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          score={score}
          isGameComplete={isGameComplete}
          onReset={initializePuzzle}
          onShowDifficultySelector={showSelector}
        >
          <div className="mb-6">
            <div className="text-center mb-4">
              <p className="text-lg font-semibold">Target Sum: <span className="text-primary">{targetSum}</span></p>
              <p className="text-sm text-gray-600">
                Place numbers so that each row, column, and diagonal adds up to the target sum.
              </p>
            </div>

            {/* Magic Square Grid */}
            <div className="mb-6 flex justify-center">
              <div 
                className="grid gap-1 border-2 border-black p-1 bg-gray-200"
                style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
              >
                {grid.map((row, rowIndex) => (
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-[40px] h-[40px] md:w-[50px] md:h-[50px] flex items-center justify-center bg-white 
                        border border-gray-300
                        ${cell !== null ? "font-bold" : ""}
                        ${selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex ? "bg-blue-100" : ""}
                        ${cell === null && !isGameComplete ? "cursor-pointer hover:bg-blue-50" : ""}
                      `}
                      onClick={() => !isGameComplete && selectCell(rowIndex, colIndex)}
                    >
                      {cell !== null ? cell : ""}
                    </div>
                  ))
                ))}
              </div>
            </div>

            {/* Available Numbers */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2 text-center">Available Numbers</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {availableNumbers.map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    size="sm"
                    className={`w-10 h-10 font-mono ${usedNumbers.includes(num) ? "opacity-50 line-through" : ""}`}
                    onClick={() => !isGameComplete && !usedNumbers.includes(num) && placeNumber(num)}
                    disabled={isGameComplete || usedNumbers.includes(num) || !selectedCell}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={useHint}
                disabled={isGameComplete || hintsRemaining <= 0}
              >
                <Lightbulb className="mr-1 h-4 w-4" /> Hint ({hintsRemaining})
              </Button>
              <Button
                variant="outline"
                onClick={resetGrid}
                disabled={isGameComplete}
              >
                <RefreshCw className="mr-1 h-4 w-4" /> Reset
              </Button>
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90"
                onClick={() => checkSolution(0)} // We'll get the actual time from the GameController in a real implementation
                disabled={isGameComplete}
              >
                <Check className="mr-1 h-4 w-4" /> Check Solution
              </Button>
            </div>

            {/* Hints/Tips Section */}
            <div className="border-t mt-6 pt-4">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary text-xl mr-2">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8" y2="16" />
                  <line x1="16" y1="16" x2="16" y2="16" />
                </svg>
                <h3 className="font-bold">Magic Square Tips</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm">
                  1. The sum of each row, column, and diagonal must equal the target sum.<br />
                  2. Start by placing numbers in the corners or center to establish a pattern.<br />
                  3. Think about how each number placement affects multiple rows and columns.
                </p>
              </div>
            </div>
          </div>
        </GameController>
      )}
    </div>
  );
};

export default MagicSquares;