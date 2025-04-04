import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { GameProvider } from "./providers/GameProvider";
import { AuthProvider } from "./providers/AuthProvider";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Import pages
import HomePage from "./pages/HomePage";
import GamesPage from "./pages/GamesPage";
import PuzzlesPage from "./pages/PuzzlesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LearnPage from "./pages/LearnPage";
import GamePlayPage from "./pages/GamePlayPage";
import LoginPage from "./pages/LoginPage";
import ConnectDevicesPage from "./pages/ConnectDevicesPage";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/games" component={GamesPage} />
      <Route path="/puzzles" component={PuzzlesPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/learn/:gameType" component={LearnPage} />
      <Route path="/play/:gameType" component={GamePlayPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/connect" component={ConnectDevicesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GameProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </GameProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
