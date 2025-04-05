import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "../../providers/GameProvider";
import { useAuth } from "../../providers/AuthProvider";
import { apiRequest } from "@/lib/queryClient";
import { Lightbulb, Check, Trash2, RefreshCw } from "lucide-react";
import { generateKenKen } from "../../utils/gameGenerators";
import GameInitializer from "./GameInitializer";
import GameController, { GameControllerRef } from "./GameController";
import AIAssistant from "../ai/AIAssistant";

type KenKenCell = {
  value: number | null;
  cageId: number;
  isOriginal: boolean;
};

type KenKenCage = {
  id: number;
  cells: [number, number][]; // row, col pairs
  target: number;
  operation: "+" | "-" | "*" | "/" | "=";
};

type KenKenGrid = KenKenCell[][];

const KenKen = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { difficulty, setDifficulty, gameId } = useGame();
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<KenKenGrid>([]);
  const [cages, setCages] = useState<KenKenCage[]>([]);
  const [size, setSize] = useState(4); // Default size
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  const [hint, setHint] = useState<string>("");
  const controllerRef = useRef<GameControllerRef>(null);

  // Generate a new KenKen puzzle based on difficulty
  const generateNewPuzzle = useCallback(() => {
    // Determine size based on difficulty
    const puzzleSize = 
      difficulty === "easy" ? 4 :
      difficulty === "medium" ? 5 : 6;
    
    setSize(puzzleSize);
    
    const { grid: newGrid, cages: newCages } = generateKenKen(puzzleSize, difficulty);
    setGrid(newGrid);
    setCages(newCages);
    
    // Set hints based on difficulty
    setHintsRemaining(
      difficulty === "easy" ? 3 :
      difficulty === "medium" ? 2 : 1
    );
    
    setIsGameComplete(false);
    setSelectedCell(null);
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
    resetGrid();
  };

  // Select a cell
  const selectCell = (row: number, col: number) => {
    // Skip if cell is original/locked
    if (!grid.length || grid[row][col].isOriginal) return;
    setSelectedCell([row, col]);
  };

  // Place a number in the selected cell
  const placeNumber = (num: number) => {
    if (!selectedCell || !grid.length) return;
    
    const [row, col] = selectedCell;
    const newGrid = [...grid];
    newGrid[row][col] = { ...newGrid[row][col], value: num };
    setGrid(newGrid);
  };

  // Reset the grid (keep original/clue cells)
  const resetGrid = () => {
    if (!grid.length) return;
    
    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (!newGrid[i][j].isOriginal) {
            newGrid[i][j] = { ...newGrid[i][j], value: null };
          }
        }
      }
      return newGrid;
    });
    setSelectedCell(null);
  };

  // Use a hint
  const useHint = () => {
    if (!grid.length) return;
    
    if (hintsRemaining <= 0) {
      toast({
        title: "No hints remaining",
        description: "You've used all your available hints.",
        variant: "destructive"
      });
      return;
    }
    
    // Find an empty cell that's part of a cage we can help with
    let targetCell: [number, number] | null = null;
    
    // First check if there's a selected cell
    if (selectedCell) {
      const [row, col] = selectedCell;
      if (!grid[row][col].isOriginal && grid[row][col].value === null) {
        targetCell = selectedCell;
      }
    }
    
    // If no selected cell, find a good candidate
    if (!targetCell) {
      // Find cages that are partially filled
      const cagesWithProgress = cages.filter(cage => {
        const filledCells = cage.cells.filter(([r, c]) => grid[r][c].value !== null);
        return filledCells.length > 0 && filledCells.length < cage.cells.length;
      });
      
      if (cagesWithProgress.length > 0) {
        // Choose a cage with the most filled cells
        const targetCage = cagesWithProgress.sort((a, b) => {
          const aFilled = a.cells.filter(([r, c]) => grid[r][c].value !== null).length;
          const bFilled = b.cells.filter(([r, c]) => grid[r][c].value !== null).length;
          return bFilled - aFilled;
        })[0];
        
        // Find an empty cell in this cage
        for (const [r, c] of targetCage.cells) {
          if (grid[r][c].value === null && !grid[r][c].isOriginal) {
            targetCell = [r, c];
            break;
          }
        }
      } else {
        // If no partially filled cages, just find any empty cell
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            if (grid[i][j].value === null && !grid[i][j].isOriginal) {
              targetCell = [i, j];
              break;
            }
          }
          if (targetCell) break;
        }
      }
    }
    
    if (!targetCell) {
      toast({
        title: "No empty cells",
        description: "All cells are already filled.",
        variant: "destructive"
      });
      return;
    }
    
    // For now, just place a valid number (1-size) that doesn't break row/column uniqueness
    const [row, col] = targetCell;
    const usedInRow = new Set<number>();
    const usedInCol = new Set<number>();
    
    // Find used numbers in this row and column
    for (let i = 0; i < size; i++) {
      if (grid[row][i].value !== null) usedInRow.add(grid[row][i].value!);
      if (grid[i][col].value !== null) usedInCol.add(grid[i][col].value!);
    }
    
    // Find a valid number
    for (let num = 1; num <= size; num++) {
      if (!usedInRow.has(num) && !usedInCol.has(num)) {
        // Place the number
        const newGrid = [...grid];
        newGrid[row][col] = { ...newGrid[row][col], value: num };
        setGrid(newGrid);
        setHintsRemaining(prev => prev - 1);
        
        // Reduce score when using hints
        setScore(prev => Math.max(0, prev - 15));
        
        toast({
          title: "Hint used",
          description: `Placed ${num} at position (${row+1},${col+1}).`,
          variant: "default"
        });
        
        break;
      }
    }
  };

  // Check if the KenKen is valid
  const checkSolution = () => {
    if (!grid.length) return;
    
    // Check if all cells are filled
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (grid[i][j].value === null) {
          toast({
            title: "Incomplete",
            description: "The puzzle is not complete. Fill in all cells.",
            variant: "destructive"
          });
          return;
        }
      }
    }
    
    // Check rows and columns for uniqueness
    for (let i = 0; i < size; i++) {
      const rowValues = new Set<number>();
      const colValues = new Set<number>();
      
      for (let j = 0; j < size; j++) {
        // Check row
        const rowVal = grid[i][j].value!;
        if (rowValues.has(rowVal)) {
          toast({
            title: "Invalid Solution",
            description: `Row ${i+1} contains duplicate value ${rowVal}.`,
            variant: "destructive"
          });
          return;
        }
        rowValues.add(rowVal);
        
        // Check column
        const colVal = grid[j][i].value!;
        if (colValues.has(colVal)) {
          toast({
            title: "Invalid Solution",
            description: `Column ${i+1} contains duplicate value ${colVal}.`,
            variant: "destructive"
          });
          return;
        }
        colValues.add(colVal);
      }
    }
    
    // Check each cage
    for (const cage of cages) {
      const values = cage.cells.map(([r, c]) => grid[r][c].value!);
      let result: number;
      
      switch (cage.operation) {
        case "+":
          result = values.reduce((sum, val) => sum + val, 0);
          break;
        case "-":
          // For subtraction, we assume the largest number minus all others
          result = values.sort((a, b) => b - a).reduce((diff, val, idx) => 
            idx === 0 ? val : diff - val, 0);
          break;
        case "*":
          result = values.reduce((product, val) => product * val, 1);
          break;
        case "/":
          // For division, we assume the largest number divided by all others
          result = values.sort((a, b) => b - a).reduce((quotient, val, idx) => 
            idx === 0 ? val : quotient / val, 1);
          break;
        case "=":
          // For equals, just return the single value
          result = values[0];
          break;
        default:
          result = 0;
      }
      
      if (result !== cage.target) {
        toast({
          title: "Invalid Cage",
          description: `Cage with target ${cage.target} ${cage.operation} equals ${result}, not ${cage.target}.`,
          variant: "destructive"
        });
        return;
      }
    }
    
    // If we got here, the solution is valid
    // Calculate score based on time and difficulty
    const difficultyMultiplier = 
      difficulty === "easy" ? 1 :
      difficulty === "medium" ? 2 : 3;
    
    // Adjust score based on time bonus, difficulty multiplier, and hint penalty
    const timeBonus = 150;
    const hintPenalty = (3 - hintsRemaining) * 15;
    const newScore = (150 + timeBonus * difficultyMultiplier) - hintPenalty;
    
    setScore(prev => prev + Math.floor(newScore));
    setIsGameComplete(true);
    // Game is now complete - GameController will handle stopping the timer
    
    toast({
      title: "Correct!",
      description: `You've solved the puzzle and earned ${Math.floor(newScore)} points!`,
      variant: "default"
    });
    
    // Submit score if user is logged in
    if (user && gameId) {
      submitScore(Math.floor(newScore));
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

  // Helper to get cage information for a cell
  const getCageInfo = (row: number, col: number) => {
    if (!grid.length) return null;
    const cageId = grid[row][col].cageId;
    return cages.find(cage => cage.id === cageId);
  };

  // Helper to determine if a cell is the top-left of its cage (for displaying target)
  const isTopLeftOfCage = (row: number, col: number) => {
    const cage = getCageInfo(row, col);
    if (!cage) return false;
    
    // Sort cells to find the top-left (minimum row, then minimum column)
    const sortedCells = [...cage.cells].sort((a, b) => {
      if (a[0] !== b[0]) return a[0] - b[0]; // Sort by row first
      return a[1] - b[1]; // Then by column
    });
    
    // Check if this cell is the top-left of the cage
    return sortedCells[0][0] === row && sortedCells[0][1] === col;
  };

  // Helper to determine cell borders based on cages
  const getCellBorders = (row: number, col: number) => {
    if (!grid.length) return "";
    
    const cellCageId = grid[row][col].cageId;
    const borderClasses = [];
    
    // Check top border
    if (row === 0 || grid[row-1][col].cageId !== cellCageId) {
      borderClasses.push("border-t-2");
    }
    
    // Check right border
    if (col === size-1 || grid[row][col+1].cageId !== cellCageId) {
      borderClasses.push("border-r-2");
    }
    
    // Check bottom border
    if (row === size-1 || grid[row+1][col].cageId !== cellCageId) {
      borderClasses.push("border-b-2");
    }
    
    // Check left border
    if (col === 0 || grid[row][col-1].cageId !== cellCageId) {
      borderClasses.push("border-l-2");
    }
    
    return borderClasses.join(" ");
  };

  // Get operation symbol for display
  const getOperationSymbol = (op: string) => {
    switch(op) {
      case "+": return "+";
      case "-": return "−";
      case "*": return "×";
      case "/": return "÷";
      case "=": return "";
      default: return "";
    }
  };

  // Game content with KenKen grid and controls
  const gameContent = (
    <>
      {/* Game Information */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Fill each row and column with numbers 1-{size} without repeating. Numbers in cages must combine to match the target using the specified operation.
        </p>
      </div>

      {/* KenKen Grid */}
      <div className="mb-6 flex justify-center">
        <div 
          className="grid gap-0 border-2 border-black bg-white"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const cage = getCageInfo(rowIndex, colIndex);
              const showTarget = isTopLeftOfCage(rowIndex, colIndex) && cage;
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-[40px] h-[40px] md:w-[50px] md:h-[50px] relative flex items-center justify-center 
                    ${getCellBorders(rowIndex, colIndex)} border-black
                    ${cell.isOriginal ? "bg-gray-100 font-bold" : ""}
                    ${selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex ? "bg-blue-100" : ""}
                    ${!cell.isOriginal && !isGameComplete ? "cursor-pointer hover:bg-blue-50" : ""}
                  `}
                  onClick={() => !isGameComplete && selectCell(rowIndex, colIndex)}
                >
                  {showTarget && (
                    <div className="absolute top-1 left-1 text-[10px] font-bold">
                      {cage?.target}{getOperationSymbol(cage?.operation)}
                    </div>
                  )}
                  <span className="font-medium text-lg">
                    {cell.value !== null ? cell.value : ""}
                  </span>
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* Number Input Buttons */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {Array.from({ length: size }, (_, i) => i + 1).map((num) => (
          <Button
            key={num}
            variant="outline"
            className="w-10 h-10 min-w-[40px] flex items-center justify-center text-lg font-medium"
            onClick={() => placeNumber(num)}
            disabled={isGameComplete}
          >
            {num}
          </Button>
        ))}
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-2 flex-wrap mb-6">
        <Button 
          variant="outline" 
          onClick={useHint}
          disabled={isGameComplete || hintsRemaining <= 0}
        >
          <Lightbulb className="mr-1 h-4 w-4" /> Hint ({hintsRemaining})
        </Button>
        <Button 
          variant="destructive" 
          onClick={resetGrid}
          disabled={isGameComplete}
        >
          <Trash2 className="mr-1 h-4 w-4" /> Clear
        </Button>
        <Button 
          variant="default" 
          className="bg-primary hover:bg-primary/90"
          onClick={checkSolution}
          disabled={isGameComplete}
        >
          <Check className="mr-1 h-4 w-4" /> Check
        </Button>
      </div>

      {/* AI Assistant */}
      <div className="mt-4">
        <AIAssistant 
          gameName="KenKen"
          difficulty={difficulty}
          onRequestHint={() => {
            if (hintsRemaining <= 0) {
              const noHintsMessage = "You've used all your available hints. Try using logic and looking for patterns in the grid.";
              setHint(noHintsMessage);
              return noHintsMessage;
            }

            // Generate appropriate hints based on difficulty
            const hints = {
              easy: [
                `Look for cages with only one cell - these are simple "equals" operations.`,
                `For a ${size}x${size} grid, each row and column must contain numbers 1 through ${size} without repeating.`,
                `Addition cages are often the easiest to solve. Look for combinations that add up to the target.`,
                `Start with rows or columns that already have several numbers filled in.`,
                `For small cages with addition, there are limited combinations possible. Try each one.`
              ],
              medium: [
                `When working with multiplication cages, list out all possible factor combinations.`,
                `If a cage has a subtraction or division operation, the largest number is always first.`,
                `Look for intersections between cages - this can limit your possibilities significantly.`,
                `Check each row and column for missing numbers, then see which ones could fit in empty cells.`,
                `For a ${size}x${size} grid, if a row has ${size-1} cells filled, you know exactly what the last number must be.`
              ],
              difficult: [
                `In larger grids, work with "crosshatching" - check rows and columns together to eliminate possibilities.`,
                `For complex cages with several cells, try different combinations and see which ones maintain row/column uniqueness.`,
                `Sometimes it helps to note possible values for each cell and eliminate them as you solve other cells.`,
                `Look for "forced" numbers - where only one number can possibly fit due to constraints from rows, columns, and cages.`,
                `Division operations with odd targets often have limited possibilities - list them out.`
              ]
            };

            // Select a random hint from the appropriate difficulty level
            const difficultyHints = hints[difficulty as keyof typeof hints];
            const randomHint = difficultyHints[Math.floor(Math.random() * difficultyHints.length)];
            
            // Reduce hints remaining and score when using the AI assistant
            setHintsRemaining(prev => Math.max(0, prev - 1));
            setScore(prev => Math.max(0, prev - 10));
            
            setHint(randomHint);
            return randomHint;
          }}
          isPremium={false}
          hintsRemaining={hintsRemaining}
        />
      </div>
    </>
  );

  // Effect to explicitly stop the timer when game is complete
  useEffect(() => {
    if (isGameComplete && controllerRef.current?.stopTimer) {
      // Force stop the timer when the game is complete
      console.log("Game complete - stopping timer");
      controllerRef.current.stopTimer();
    }
  }, [isGameComplete]);

  return (
    <>
      {showDifficultySelector ? (
        <GameInitializer 
          gameName="KenKen"
          gameDescription="A mathematical puzzle that combines elements of Sudoku and arithmetic. Fill the grid so each row and column contains numbers 1 through N, and cells in cages must combine to match the target using the specified operation."
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onStart={handleGameStart}
        />
      ) : (
        <GameController
          ref={controllerRef}
          gameName="KenKen"
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          score={score}
          isGameComplete={isGameComplete}
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

export default KenKen;