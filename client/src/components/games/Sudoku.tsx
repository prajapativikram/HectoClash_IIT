import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "../../providers/GameProvider";
import { useAuth } from "../../providers/AuthProvider";
import { apiRequest } from "@/lib/queryClient";
import { Lightbulb, Check, Undo } from "lucide-react";
import { generateSudoku, checkSudokuValid, solveSudokuForHint } from "../../utils/gameGenerators";
import GameInitializer from "./GameInitializer";
import GameController from "./GameController";

type SudokuGrid = (number | null)[][];
type OriginalGrid = boolean[][];

const Sudoku = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { difficulty, setDifficulty, gameId } = useGame();
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<SudokuGrid>([]);
  const [originalGrid, setOriginalGrid] = useState<OriginalGrid>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  const currentTime = useRef(0);

  // Generate a new Sudoku puzzle based on difficulty
  const generateNewPuzzle = useCallback(() => {
    const { puzzle, solution, filled } = generateSudoku(difficulty);
    setGrid(puzzle);
    
    // Track which cells were filled originally
    const original: OriginalGrid = Array(9).fill(null).map(() => Array(9).fill(false));
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        original[i][j] = puzzle[i][j] !== null;
      }
    }
    setOriginalGrid(original);
    
    // Set hints based on difficulty
    setHintsRemaining(
      difficulty === "easy" ? 3 :
      difficulty === "medium" ? 2 : 1
    );
    
    setIsGameComplete(false);
    setSelectedCell(null);
    setScore(0);
    currentTime.current = 0;
  }, [difficulty]);

  // Start game with selected difficulty
  const handleGameStart = () => {
    generateNewPuzzle();
    setShowDifficultySelector(false);
  };
  
  // Reset game
  const handleReset = () => {
    generateNewPuzzle();
  };

  // Select a cell
  const selectCell = (row: number, col: number) => {
    if (originalGrid[row][col]) return;
    setSelectedCell([row, col]);
  };

  // Input a number in the selected cell
  const inputNumber = (num: number) => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    if (originalGrid[row][col]) return;
    
    const newGrid = [...grid];
    newGrid[row][col] = num;
    setGrid(newGrid);
  };

  // Clear the selected cell
  const clearSelectedCell = () => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    if (originalGrid[row][col]) return;
    
    const newGrid = [...grid];
    newGrid[row][col] = null;
    setGrid(newGrid);
  };

  // Use a hint to fill in a cell
  const useHint = () => {
    if (hintsRemaining <= 0 || !selectedCell) {
      toast({
        title: "No hints remaining",
        description: "You've used all your available hints.",
        variant: "destructive"
      });
      return;
    }
    
    const [row, col] = selectedCell;
    if (originalGrid[row][col]) {
      toast({
        title: "Cannot use hint",
        description: "This cell was filled in at the start.",
        variant: "destructive"
      });
      return;
    }
    
    // Get hint for this cell
    const hintValue = solveSudokuForHint(grid, row, col);
    if (hintValue) {
      const newGrid = [...grid];
      newGrid[row][col] = hintValue;
      setGrid(newGrid);
      setHintsRemaining(prev => prev - 1);
      
      // Reduce score when using hints
      setScore(prev => Math.max(0, prev - 15));
    } else {
      toast({
        title: "Hint unavailable",
        description: "Could not determine a guaranteed value for this cell.",
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

  // Check if the puzzle is solved correctly
  const verifySolution = () => {
    // First check if the grid is complete
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (grid[i][j] === null) {
          toast({
            title: "Incomplete",
            description: "The puzzle is not complete. Fill in all cells.",
            variant: "destructive"
          });
          return false;
        }
      }
    }
    
    // Check if the solution is valid
    if (checkSudokuValid(grid)) {
      // Calculate score based on time and difficulty
      const difficultyMultiplier = 
        difficulty === "easy" ? 1 :
        difficulty === "medium" ? 2 : 3;
      
      const timeBonus = Math.max(0, 600 - currentTime.current);
      const hintPenalty = (3 - hintsRemaining) * 15;
      const newScore = (100 + (timeBonus / 10) * difficultyMultiplier) - hintPenalty;
      
      setScore(Math.floor(newScore));
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
      return true;
    } else {
      toast({
        title: "Incorrect",
        description: "The solution is not valid. Check for errors.",
        variant: "destructive"
      });
      return false;
    }
  };

  return (
    <>
      {showDifficultySelector ? (
        <GameInitializer 
          gameName="Sudoku"
          gameDescription="Fill the 9×9 grid with digits so that each column, row, and 3×3 section contains all digits from 1 to 9 without repetition."
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={handleGameStart}
        />
      ) : (
        <GameController
          gameName="Sudoku"
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          score={score}
          isGameComplete={isGameComplete}
          onReset={handleReset}
          onShowDifficultySelector={() => setShowDifficultySelector(true)}
        >
          <div className="flex flex-col items-center">
            {/* Sudoku Grid */}
            <div className="mb-6">
              <div className="grid grid-cols-9 gap-1 border-2 border-black p-1 bg-gray-200 mx-auto max-w-md">
                {grid.map((row, rowIndex) => (
                  row.map((cell, colIndex) => {
                    const borderStyles = [];
                    if (colIndex % 3 === 0) borderStyles.push("border-l-2");
                    if (colIndex === 8) borderStyles.push("border-r-2");
                    if (rowIndex % 3 === 0) borderStyles.push("border-t-2");
                    if (rowIndex === 8) borderStyles.push("border-b-2");
                    
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`w-[32px] h-[32px] md:w-[40px] md:h-[40px] flex items-center justify-center bg-white 
                          ${borderStyles.join(" ")} border-black
                          ${originalGrid[rowIndex]?.[colIndex] ? "bg-gray-100 font-bold" : ""}
                          ${selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex ? "bg-blue-100" : ""}
                          ${!originalGrid[rowIndex]?.[colIndex] && !isGameComplete ? "cursor-pointer hover:bg-blue-50" : ""}
                        `}
                        onClick={() => !isGameComplete && selectCell(rowIndex, colIndex)}
                      >
                        {cell !== null ? cell : ""}
                      </div>
                    );
                  })
                ))}
              </div>
            </div>

            {/* Number Input Buttons */}
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  className="w-10 h-10 font-mono"
                  onClick={() => !isGameComplete && inputNumber(num)}
                  disabled={isGameComplete}
                >
                  {num}
                </Button>
              ))}
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={useHint}
                disabled={isGameComplete || hintsRemaining <= 0 || !selectedCell}
              >
                <Lightbulb className="mr-1 h-4 w-4" /> Hint ({hintsRemaining})
              </Button>
              <Button
                variant="outline"
                onClick={clearSelectedCell}
                disabled={isGameComplete || !selectedCell}
              >
                <Undo className="mr-1 h-4 w-4" /> Clear Cell
              </Button>
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90"
                onClick={verifySolution}
                disabled={isGameComplete}
              >
                <Check className="mr-1 h-4 w-4" /> Check Solution
              </Button>
            </div>

            {/* Hints/AI Assistant Section */}
            <div className="border-t mt-6 pt-4 w-full">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary text-xl mr-2">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8" y2="16" />
                  <line x1="16" y1="16" x2="16" y2="16" />
                </svg>
                <h3 className="font-bold">Sudoku Tips</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm">
                  1. Each row, column, and 3×3 block must contain all numbers from 1 to 9 without repetition.<br />
                  2. Look for cells with few possibilities based on existing numbers.<br />
                  3. Use the "Hint" button when you're stuck, but it will reduce your score.
                </p>
              </div>
            </div>
          </div>
        </GameController>
      )}
    </>
  );
};

export default Sudoku;