import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GameCardProps {
  id: number;
  name: string;
  type: string;
  description: string;
  isComingSoon?: boolean;
}

const GameCard = ({ id, name, type, description, isComingSoon = false }: GameCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="bg-primary h-40 flex items-center justify-center text-white">
        <h3 className="text-xl font-bold">{name}</h3>
      </div>
      <CardContent className="p-6">
        <h4 className="font-bold mb-2">{name}</h4>
        <p className="text-sm mb-4">{description}</p>
        <CardFooter className="p-0">
          {isComingSoon ? (
            <Button 
              variant="secondary" 
              className="w-full cursor-not-allowed bg-gray-400 hover:bg-gray-400"
              disabled
            >
              Stay Tuned!
            </Button>
          ) : (
            <Button 
              variant="default" 
              className="w-full bg-[#14213d] hover:bg-[#14213d]/90"
              asChild
            >
              <Link href={`/play/${type.toLowerCase()}`}>
                Play {name}
              </Link>
            </Button>
          )}
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default GameCard;
