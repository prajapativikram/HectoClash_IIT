import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { useAuth } from "../../providers/AuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [location, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/puzzles", label: "Puzzles" },
    { path: "/learn/hectoclash", label: "Learn" },
    { path: "/leaderboard", label: "Leaderboard" }
  ];

  return (
    <header className="bg-[#14213d] text-white">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold font-sans">Mental<span className="text-red-500">Booster</span></span>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`hover:text-gray-300 transition ${location === item.path ? 'text-white font-medium' : 'text-gray-300'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        {user ? (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate('/leaderboard')}
                  className="cursor-pointer"
                >
                  View Leaderboard
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={logout}
                  className="cursor-pointer text-red-500"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate('/login')}
          >
            <User className="mr-2 h-4 w-4" />
            Login
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white" 
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#14213d] border-t border-gray-700">
          <div className="container mx-auto px-4 py-2">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className="py-2 hover:bg-blue-900 px-2 rounded transition"
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}
              {!user && (
                <Link 
                  href="/login"
                  className="py-2 hover:bg-blue-900 px-2 rounded transition mt-2 border-t border-gray-700 pt-4"
                  onClick={closeMenu}
                >
                  Login / Register
                </Link>
              )}
              {user && (
                <Button 
                  variant="ghost" 
                  className="justify-start py-2 px-2 mt-2 border-t border-gray-700 pt-4 text-red-400 hover:text-red-300 hover:bg-blue-900"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                >
                  Logout
                </Button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
