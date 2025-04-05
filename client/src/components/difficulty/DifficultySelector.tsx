import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Difficulty } from '@shared/schema';
import { useGame } from '../../providers/GameProvider';
import { Sprout, Flame, Crown } from 'lucide-react';

interface DifficultyOption {
  value: Difficulty;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string[];
}

interface DifficultySelectorProps {
  onSelect?: (difficulty: string) => void;
  currentDifficulty?: Difficulty;
}

const DifficultySelector = ({ onSelect, currentDifficulty }: DifficultySelectorProps = {}) => {
  const { difficulty: contextDifficulty, setDifficulty: contextSetDifficulty } = useGame();
  
  // Use props if provided, otherwise use context
  const difficulty = currentDifficulty || contextDifficulty;
  const handleSelect = (value: Difficulty) => {
    if (onSelect) {
      onSelect(value);
    } else {
      contextSetDifficulty(value);
    }
  };
  
  const difficultyOptions: DifficultyOption[] = [
    {
      value: 'easy',
      label: 'Easy',
      icon: <Sprout className="text-green-500 text-2xl" />,
      color: 'bg-green-100',
      description: [
        'Perfect for beginners',
        'Basic patterns and operations',
        'Generous time limits',
        'Helpful hints available'
      ]
    },
    {
      value: 'medium',
      label: 'Medium',
      icon: <Flame className="text-yellow-500 text-2xl" />,
      color: 'bg-yellow-100',
      description: [
        'More complex patterns',
        'Increased number of operations',
        'Moderate time pressure',
        'Limited hints available'
      ]
    },
    {
      value: 'difficult',
      label: 'Difficult',
      icon: <Crown className="text-red-500 text-2xl" />,
      color: 'bg-red-100',
      description: [
        'Advanced patterns and logic',
        'Complex mathematical operations',
        'Strict time limits',
        'No hints available'
      ]
    }
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold font-sans mb-8 text-center">Difficulty Levels</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {difficultyOptions.map((option) => (
            <Card 
              key={option.value} 
              className={`${difficulty === option.value ? 'ring-2 ring-primary' : ''}`}
            >
              <CardContent className="p-6">
                <div className={`w-16 h-16 rounded-full ${option.color} flex items-center justify-center mx-auto mb-4`}>
                  {option.icon}
                </div>
                <h3 className="text-xl font-bold text-center mb-3">{option.label}</h3>
                <ul className="space-y-2 text-sm mb-6">
                  {option.description.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div 
                        className={`h-1.5 w-1.5 rounded-full mt-1.5 mr-2 ${
                          option.value === 'easy' ? 'bg-green-500' :
                          option.value === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={difficulty === option.value ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleSelect(option.value)}
                >
                  {difficulty === option.value ? 'Selected' : 'Select'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DifficultySelector;
