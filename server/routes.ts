import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertGameResultSchema,
  Difficulty
} from "@shared/schema";
import { z } from "zod";
import { generateHint, initAIClient } from "./ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize AI client
  initAIClient();
  
  // API routes should be prefixed with /api
  const apiRouter = app.route('/api');
  
  // Authentication routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you would set up sessions and JWT here
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error during login" });
    }
  });
  
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error during registration" });
    }
  });
  
  // Game routes
  app.get('/api/games', async (_req: Request, res: Response) => {
    try {
      const games = await storage.getActiveGames();
      res.status(200).json(games);
    } catch (error) {
      res.status(500).json({ message: "Error fetching games" });
    }
  });
  
  app.get('/api/games/:type', async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const game = await storage.getGameByType(type);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.status(200).json(game);
    } catch (error) {
      res.status(500).json({ message: "Error fetching game" });
    }
  });
  
  app.get('/api/games/:type/config/:difficulty', async (req: Request, res: Response) => {
    try {
      const { type, difficulty } = req.params;
      
      // Validate difficulty param
      if (!['easy', 'medium', 'difficult'].includes(difficulty)) {
        return res.status(400).json({ message: "Invalid difficulty level" });
      }
      
      const game = await storage.getGameByType(type);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      const config = await storage.getGameConfig(
        game.id, 
        difficulty as Difficulty
      );
      
      if (!config) {
        return res.status(404).json({ message: "Game configuration not found" });
      }
      
      // Parse the config data JSON
      const configData = JSON.parse(config.configData);
      
      res.status(200).json({
        gameId: game.id,
        gameName: game.name,
        difficulty,
        config: configData
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching game configuration" });
    }
  });
  
  // Leaderboard routes
  app.get('/api/leaderboard', async (_req: Request, res: Response) => {
    try {
      const topUsers = await storage.getTopUsers(10);
      res.status(200).json(topUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching leaderboard" });
    }
  });
  
  app.get('/api/leaderboard/:gameType', async (req: Request, res: Response) => {
    try {
      const { gameType } = req.params;
      const game = await storage.getGameByType(gameType);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      const topResults = await storage.getTopResults(game.id, 10);
      
      res.status(200).json(topResults);
    } catch (error) {
      res.status(500).json({ message: "Error fetching game leaderboard" });
    }
  });
  
  // Game results routes
  app.post('/api/results', async (req: Request, res: Response) => {
    try {
      const resultData = insertGameResultSchema.parse(req.body);
      
      // Validate that the user and game exist
      const user = await storage.getUser(resultData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const game = await storage.getGame(resultData.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      const newResult = await storage.createGameResult(resultData);
      res.status(201).json(newResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid result data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error saving game result" });
    }
  });
  
  // AI hint endpoint
  app.post('/api/ai/hint', async (req: Request, res: Response) => {
    try {
      const { gameType, difficulty, context } = req.body;
      
      // Validation
      if (!gameType || !difficulty || !context) {
        return res.status(400).json({ 
          message: "Missing required parameters: gameType, difficulty, and context are required"
        });
      }
      
      // Validate difficulty
      if (!['easy', 'medium', 'difficult'].includes(difficulty)) {
        return res.status(400).json({ message: "Invalid difficulty level" });
      }
      
      // Generate the hint using the AI service
      const hint = await generateHint(
        gameType, 
        difficulty as Difficulty, 
        context
      );
      
      res.status(200).json({ hint });
    } catch (error) {
      console.error("Error generating AI hint:", error);
      res.status(500).json({ 
        message: "Error generating hint",
        fallbackHint: "Try breaking down the problem into smaller steps and focusing on one part at a time."
      });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
