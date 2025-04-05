import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, 
  Lightbulb, 
  Send, 
  Brain, 
  Sparkles, 
  MessageSquare, 
  RotateCcw 
} from 'lucide-react';

interface AIAssistantProps {
  onRequestHint: () => string;
  difficulty: string;
  gameName: string;
  className?: string;
  isPremium?: boolean;
  hintsRemaining?: number;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  onRequestHint, 
  difficulty, 
  gameName, 
  className = '',
  isPremium = false,
  hintsRemaining = 3
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean, timestamp: Date}>>([
    {
      text: `Hello! I'm your AI Assistant for ${gameName}. Ask me for hints or tips to help you solve the puzzles.`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loadingHint, setLoadingHint] = useState(false);
  const [hintCount, setHintCount] = useState(hintsRemaining);

  const requestHint = () => {
    if (hintCount <= 0 && !isPremium) {
      addMessage(
        "You've used all your free hints. Upgrade to premium for unlimited hints and personalized coaching!", 
        false
      );
      return;
    }
    
    setLoadingHint(true);
    
    // Simulate a small delay for the AI response
    setTimeout(() => {
      const hint = onRequestHint();
      addMessage(hint, false);
      setLoadingHint(false);
      
      if (!isPremium) {
        setHintCount(prev => prev - 1);
      }
    }, 800);
  };

  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [...prev, {
      text,
      isUser,
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    addMessage(inputValue, true);
    setInputValue('');
    
    // Simulate AI response
    setLoadingHint(true);
    setTimeout(() => {
      let response = "";
      
      // Basic pattern matching for common questions
      const lowerInput = inputValue.toLowerCase();
      
      if (lowerInput.includes("hint") || lowerInput.includes("help")) {
        response = onRequestHint();
      } else if (lowerInput.includes("how to play") || lowerInput.includes("rules")) {
        response = getGameRules(gameName);
      } else if (lowerInput.includes("strategy") || lowerInput.includes("tip")) {
        response = getGameStrategy(gameName, difficulty);
      } else {
        response = "I'm not sure how to answer that. Try asking for a hint, tips, or how to play the game.";
      }
      
      addMessage(response, false);
      setLoadingHint(false);
      
      if ((lowerInput.includes("hint") || lowerInput.includes("help")) && !isPremium) {
        setHintCount(prev => Math.max(0, prev - 1));
      }
    }, 1000);
  };

  const getGameRules = (game: string): string => {
    switch (game.toLowerCase()) {
      case 'hectoclash':
        return "In HectoClash, you need to use all the given numbers and mathematical operations to create an expression that equals the target number. Each number must be used exactly once.";
      case 'sudoku':
        return "In Sudoku, fill the 9x9 grid so each row, column, and 3x3 box contains numbers 1-9, with no repetition in any row, column, or box.";
      case 'magicsquares':
        return "In Magic Squares, arrange the numbers so each row, column, and diagonal add up to the same sum.";
      case 'kenken':
        return "In KenKen, fill the grid with numbers so that no number repeats in any row or column, and the numbers in each cage produce the target value using the specified operation.";
      case 'numbersequences':
        return "In Number Sequences, analyze the pattern in the given sequence of numbers and determine what number should come next by identifying the underlying mathematical rule.";
      case 'cryptarithms':
        return "In Cryptarithms, solve the mathematical puzzle by figuring out which digit each letter represents in the given arithmetic problem.";
      default:
        return "This is a mathematical puzzle game that tests your logical thinking skills. Try to solve the puzzle using the rules provided in the game instructions.";
    }
  };

  const getGameStrategy = (game: string, diff: string): string => {
    const diffLevel = diff.toLowerCase();
    
    switch (game.toLowerCase()) {
      case 'hectoclash':
        if (diffLevel === 'easy') 
          return "Start with the largest numbers first, then adjust with smaller numbers. Addition and subtraction are often easier to work with than multiplication and division.";
        else 
          return "Try working backward from the target value. Consider using parentheses strategically to group operations and control the order of evaluation.";
      case 'sudoku':
        return "Look for cells with the fewest possible candidates. The 'pencil marking' technique can help track possible values for each cell. For harder puzzles, try the X-Wing or Swordfish techniques.";
      case 'magicsquares':
        return "Remember that every row, column, and diagonal must sum to the same number (the 'magic constant'). For a 3x3 grid with numbers 1-9, the magic constant is 15.";
      case 'kenken':
        return "Start with cages that have only one cell or cages with large target numbers that have limited combinations. Use pencil marks to keep track of possibilities.";
      case 'numbersequences':
        return "Look for common mathematical patterns: arithmetic (adding/subtracting a constant), geometric (multiplying/dividing by a constant), Fibonacci sequence, square/cubic numbers, or alternating patterns.";
      case 'cryptarithms':
        return "Start with constraints: the leftmost digits can't be zero, and each letter must represent a unique digit. Look at carry operations, especially in the rightmost columns.";
      default:
        return "Break down the problem into smaller parts. Look for patterns and constraints that limit the possible solutions. Sometimes working backward from the expected result can help.";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${className} ${isExpanded ? 'h-[400px]' : 'h-12'}`}>
      {/* Header */}
      <div 
        className="bg-primary text-white p-3 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <Brain className="mr-2 h-5 w-5" />
          <h3 className="font-semibold">AI Assistant</h3>
          {!isExpanded && hintCount < hintsRemaining && !isPremium && (
            <span className="ml-2 text-xs bg-white text-primary px-2 py-0.5 rounded-full">
              {hintCount} hints left
            </span>
          )}
        </div>
        <div className="flex items-center">
          {isPremium && (
            <span className="mr-2 text-xs bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full flex items-center">
              <Sparkles className="mr-1 h-3 w-3" /> Premium
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-white hover:bg-primary/90"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
      </div>
      
      {/* Chat area */}
      {isExpanded && (
        <>
          <div className="h-[300px] overflow-y-auto p-4 bg-white">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-4 flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.isUser 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {!message.isUser && (
                    <div className="flex items-center mb-1">
                      <Bot className="h-4 w-4 mr-1" />
                      <span className="text-xs font-semibold">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm">{message.text}</p>
                  <div className="text-right">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {loadingHint && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 text-gray-800 rounded-lg rounded-tl-none max-w-[75%] p-3">
                  <div className="flex items-center mb-1">
                    <Bot className="h-4 w-4 mr-1" />
                    <span className="text-xs font-semibold">AI Assistant</span>
                  </div>
                  <div className="flex items-center">
                    <div className="dot-typing"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input area */}
          <div className="p-3 border-t bg-gray-50">
            <div className="flex flex-col">
              <div className="flex justify-between mb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7 px-2"
                  onClick={requestHint}
                  disabled={loadingHint || (hintCount <= 0 && !isPremium)}
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {!isPremium ? `Hint (${hintCount} left)` : "Hint"}
                </Button>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7 w-7 p-0"
                    onClick={() => {
                      setMessages([{
                        text: `Hello! I'm your AI Assistant for ${gameName}. Ask me for hints or tips to help you solve the puzzles.`,
                        isUser: false,
                        timestamp: new Date()
                      }]);
                      setHintCount(hintsRemaining);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex mt-1">
                <Textarea
                  placeholder="Ask for help or a hint..."
                  className="min-h-[40px] h-10 resize-none rounded-r-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <Button 
                  className="h-10 rounded-l-none px-2" 
                  onClick={handleSendMessage}
                  disabled={loadingHint || !inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* The typing animation styles are injected in the client/src/index.css file */}
    </div>
  );
};

export default AIAssistant;