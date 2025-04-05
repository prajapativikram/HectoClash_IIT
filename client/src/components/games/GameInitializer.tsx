import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Difficulty } from '@shared/schema';
import { Sprout, Flame, Crown, Play } from 'lucide-react';

interface GameInitializerProps {
  gameName: string;
  gameDescription: string;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  onStart: () => void;
}

const GameInitializer: React.FC<GameInitializerProps> = ({
  gameName,
  gameDescription,
  difficulty,
  setDifficulty,
  onStart
}) => {
  const difficultyOptions = [
    {
      value: 'easy' as Difficulty,
      label: 'Easy',
      icon: <Sprout className="h-6 w-6 text-green-500" />,
      color: 'bg-green-100',
    },
    {
      value: 'medium' as Difficulty,
      label: 'Medium',
      icon: <Flame className="h-6 w-6 text-yellow-500" />,
      color: 'bg-yellow-100',
    },
    {
      value: 'difficult' as Difficulty,
      label: 'Difficult',
      icon: <Crown className="h-6 w-6 text-red-500" />,
      color: 'bg-red-100',
    }
  ];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">{gameName}</h2>
          <p className="text-gray-600">{gameDescription}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Select Difficulty</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {difficultyOptions.map((option) => (
              <Button
                key={option.value}
                variant={difficulty === option.value ? "default" : "outline"}
                className={`h-auto py-3 px-4 flex flex-col items-center justify-center gap-2 ${
                  difficulty === option.value ? 'border-primary' : ''
                }`}
                onClick={() => setDifficulty(option.value)}
              >
                <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center`}>
                  {option.icon}
                </div>
                <span>{option.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            className="w-full sm:w-auto px-8 bg-red-600 hover:bg-red-700"
            onClick={onStart}
          >
            <Play className="mr-2 h-5 w-5" />
            Start Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameInitializer;