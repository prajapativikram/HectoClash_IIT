import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Difficulty } from '@shared/schema';
import { Play, Pause, Clock, Star, RefreshCw } from 'lucide-react';
import { useTimer } from "../../utils/timerUtils";

interface GameControllerProps {
  gameName: string;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  score: number;
  isGameComplete: boolean;
  onReset: () => void;
  onShowDifficultySelector: () => void;
  children: React.ReactNode;
  countdownMode?: boolean;
}

export interface GameControllerRef {
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

const GameController = forwardRef<GameControllerRef, GameControllerProps>((props, ref) => {
  const {
    gameName,
    difficulty,
    setDifficulty,
    score,
    isGameComplete,
    onReset,
    onShowDifficultySelector,
    children,
    countdownMode = true // Default to countdown mode
  } = props;
  
  const [timerStarted, setTimerStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Set initial time based on difficulty
  const getInitialTimeForDifficulty = (diff: Difficulty): number => {
    switch (diff) {
      case "easy": return 30; // 30 seconds for easy
      case "medium": return 45; // 45 seconds for medium
      case "difficult": return 60; // 60 seconds for difficult
      default: return 30;
    }
  };
  
  const [timeIsUp, setTimeIsUp] = useState(false);
  
  const handleTimeUp = () => {
    // Time's up - game over
    if (!isGameComplete) {
      setTimeIsUp(true);
      setTimerStarted(false);
    }
  };
  
  const { 
    time, 
    startTimer, 
    stopTimer, 
    resetTimer, 
    formatTime, 
    setInitialTime,
    isRunning
  } = useTimer({
    isCountdown: countdownMode,
    initialTime: getInitialTimeForDifficulty(difficulty),
    onTimeUp: handleTimeUp
  });
  
  // Update timer when difficulty changes
  useEffect(() => {
    if (!timerStarted) {
      setInitialTime(getInitialTimeForDifficulty(difficulty));
    }
  }, [difficulty, timerStarted, setInitialTime]);

  // Start the timer manually
  const handleStartTimer = () => {
    if (!timerStarted) {
      resetTimer();
      startTimer();
      setTimerStarted(true);
    }
  };

  // Toggle pause/resume
  const togglePause = () => {
    if (isPaused) {
      startTimer();
    } else {
      stopTimer();
    }
    setIsPaused(!isPaused);
  };

  // Reset timer and game
  const handleReset = () => {
    stopTimer();
    resetTimer();
    setTimerStarted(false);
    setIsPaused(false);
    setTimeIsUp(false); // Reset time's up notification
    onReset();
  };

  // Show difficulty selector (go back)
  const handleShowDifficultySelector = () => {
    stopTimer();
    resetTimer();
    setTimerStarted(false);
    setIsPaused(false);
    setTimeIsUp(false); // Reset time's up notification
    onShowDifficultySelector();
  };
  
  // Effect to reset timeIsUp when difficulty changes
  useEffect(() => {
    setTimeIsUp(false);
  }, [difficulty]);
  
  // Effect to handle game completion
  useEffect(() => {
    if (isGameComplete && timerStarted) {
      stopTimer();
      setTimerStarted(false);
    }
  }, [isGameComplete, timerStarted, stopTimer]);
  
  // Expose timer methods via ref
  useImperativeHandle(ref, () => ({
    startTimer,
    stopTimer,
    resetTimer
  }));

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        {/* Game Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{gameName}</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className={`mr-2 h-5 w-5 ${countdownMode && time <= 10 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
              <span className={`font-mono text-lg ${countdownMode && time <= 10 ? 'text-red-500 font-bold' : ''}`}>
                {formatTime(time)}
              </span>
            </div>
            <div className="flex items-center">
              <Star className="text-yellow-500 mr-2 h-5 w-5" />
              <span className="font-mono text-lg">{score}</span>
            </div>
            <Badge variant="outline">
              <span className="text-sm font-medium">
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </span>
            </Badge>
          </div>
        </div>

        {/* Timer Controls */}
        {!isGameComplete && (
          <div className="flex justify-center gap-2 mb-6">
            {!timerStarted ? (
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleStartTimer}
              >
                <Play className="mr-2 h-4 w-4" /> Start Timer
              </Button>
            ) : (
              <Button 
                variant={isPaused ? "default" : "outline"}
                onClick={togglePause}
                className={isPaused ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isPaused ? (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </>
                )}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleReset}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShowDifficultySelector}
              className="border-red-400 text-red-600 hover:bg-red-50"
            >
              Change Difficulty
            </Button>
          </div>
        )}

        {/* Main Game Content */}
        <div className={`relative ${isPaused ? "opacity-50 pointer-events-none" : ""}`}>
          {isPaused ? (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <h3 className="text-xl font-semibold mb-2">Game Paused</h3>
                <p className="mb-4">Click the Resume button to continue playing.</p>
              </div>
            </div>
          ) : null}
          
          {!timerStarted ? (
            timeIsUp ? (
              <div className="text-center p-8 bg-red-50 rounded-lg mb-6 border-2 border-red-300">
                <h3 className="text-xl font-semibold mb-2 text-red-600">Time's Up!</h3>
                <p className="mb-4">You've run out of time for this challenge.</p>
                <div className="flex justify-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    className="border-red-400 text-red-600 hover:bg-red-50"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={handleShowDifficultySelector}
                    className="bg-primary"
                  >
                    Change Difficulty
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg mb-6">
                <h3 className="text-xl font-semibold mb-2">Ready to Play</h3>
                <p className="mb-4">Click the Start Timer button above to begin.</p>
                <p className="text-sm text-gray-600">
                  {countdownMode ? 
                    `You'll have ${formatTime(getInitialTimeForDifficulty(difficulty))} to complete this challenge.` :
                    "The timer will start when you're ready."
                  }
                </p>
              </div>
            )
          ) : (
            children
          )}
        </div>

        {/* Game Complete Controls */}
        {isGameComplete && (
          <div className="flex justify-center gap-2 mt-6">
            <Button 
              variant="default" 
              onClick={handleShowDifficultySelector}
              className="bg-primary"
            >
              Play New Game
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Add display name for better debugging
GameController.displayName = 'GameController';

export default GameController;