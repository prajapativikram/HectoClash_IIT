import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PlayerCardProps {
  rank: number;
  username: string;
  displayName: string;
  score: number;
}

const PlayerCard = ({ rank, username, displayName, score }: PlayerCardProps) => {
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center">
        <span className="w-6 text-center font-medium">{rank}</span>
        <Avatar className="ml-4 bg-primary">
          <AvatarFallback className="bg-primary text-white">
            {getInitial(displayName)}
          </AvatarFallback>
        </Avatar>
        <span className="ml-4">{displayName}</span>
      </div>
      <span className="font-mono font-medium">{score}</span>
    </div>
  );
};

export default PlayerCard;
