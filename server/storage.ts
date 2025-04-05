import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  gameResults, type GameResult, type InsertGameResult,
  gameConfigs, type GameConfig, type InsertGameConfig,
  Difficulty
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getTopUsers(limit: number): Promise<User[]>;
  updateUserScore(userId: number, score: number): Promise<User | undefined>;
  
  // Game operations
  getGame(id: number): Promise<Game | undefined>;
  getGameByType(type: string): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  getActiveGames(): Promise<Game[]>;
  
  // Game results operations
  createGameResult(result: InsertGameResult): Promise<GameResult>;
  getUserResults(userId: number): Promise<GameResult[]>;
  getTopResults(gameId: number, limit: number): Promise<{ user: User, result: GameResult }[]>;
  
  // Game config operations
  getGameConfig(gameId: number, difficulty: Difficulty): Promise<GameConfig | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private gameResults: Map<number, GameResult>;
  private gameConfigs: Map<number, GameConfig>;
  private userIdCounter: number;
  private gameIdCounter: number;
  private resultIdCounter: number;
  private configIdCounter: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.gameResults = new Map();
    this.gameConfigs = new Map();
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
    this.resultIdCounter = 1;
    this.configIdCounter = 1;
    
    // Initialize with some sample games
    this.initializeGames();
    // Initialize default users
    this.initializeUsers();
    // Initialize game configs
    this.initializeGameConfigs();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, score: 0 };
    this.users.set(id, user);
    return user;
  }

  async getTopUsers(limit: number): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async updateUserScore(userId: number, score: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, score: user.score + score };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Game operations
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGameByType(type: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(
      (game) => game.type.toLowerCase() === type.toLowerCase()
    );
  }

  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getActiveGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.isActive);
  }

  // Game results operations
  async createGameResult(insertResult: InsertGameResult): Promise<GameResult> {
    const id = this.resultIdCounter++;
    const completedAt = new Date();
    const result: GameResult = { ...insertResult, id, completedAt };
    this.gameResults.set(id, result);
    
    // Update user score
    await this.updateUserScore(insertResult.userId, insertResult.score);
    
    return result;
  }

  async getUserResults(userId: number): Promise<GameResult[]> {
    return Array.from(this.gameResults.values())
      .filter(result => result.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  async getTopResults(gameId: number, limit: number): Promise<{ user: User, result: GameResult }[]> {
    const results = Array.from(this.gameResults.values())
      .filter(result => result.gameId === gameId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    const resultsWithUsers = await Promise.all(
      results.map(async (result) => {
        const user = await this.getUser(result.userId);
        return { user: user!, result };
      })
    );
    
    return resultsWithUsers;
  }

  // Game config operations
  async getGameConfig(gameId: number, difficulty: Difficulty): Promise<GameConfig | undefined> {
    return Array.from(this.gameConfigs.values()).find(
      config => config.gameId === gameId && config.difficulty === difficulty
    );
  }

  // Initialize with sample data
  private initializeGames(): void {
    const gamesData: Omit<Game, 'id'>[] = [
      {
        name: 'HectoClash',
        type: 'hectoclash',
        description: 'Challenge your mental math skills in competitive real-time duels. Solve Hectoc puzzles faster than your opponent!',
        isActive: true
      },
      {
        name: 'Sudoku',
        type: 'sudoku',
        description: 'Test your logical reasoning with our Sudoku puzzles. Multiple difficulty levels available.',
        isActive: true
      },
      {
        name: 'Magic Squares',
        type: 'magicsquares',
        description: 'Arrange numbers in a grid so that the sum of each row, column, and diagonal is the same.',
        isActive: true
      },
      {
        name: 'KenKen',
        type: 'kenken',
        description: 'Similar to Sudoku but includes mathematical operations like addition, subtraction, multiplication, or division within specific blocks.',
        isActive: true
      },
      {
        name: 'Number Sequences',
        type: 'numbersequences',
        description: 'Find the next number in a given sequence by identifying the pattern rule.',
        isActive: true
      },
      {
        name: 'Cryptarithms',
        type: 'cryptarithms',
        description: 'Replace letters with digits to solve equations like SEND + MORE = MONEY.',
        isActive: true
      }
    ];
    
    gamesData.forEach(game => {
      const id = this.gameIdCounter++;
      this.games.set(id, { ...game, id });
    });
  }

  private initializeUsers(): void {
    const usersData: InsertUser[] = [
      { username: 'mathmaster', password: 'hashed_password', displayName: 'MathMaster' },
      { username: 'quickcalc', password: 'hashed_password', displayName: 'QuickCalc' },
      { username: 'numberking', password: 'hashed_password', displayName: 'NumberKing' },
      { username: 'mathwiz42', password: 'hashed_password', displayName: 'MathWiz42' },
      { username: 'johndoe42', password: 'hashed_password', displayName: 'JohnDoe42' },
      { username: 'chibumikira', password: 'hashed_password', displayName: 'Chibu Mikira' }
    ];
    
    const scores = [1892, 1845, 1798, 1545, 1289, 1289];
    
    usersData.forEach((userData, index) => {
      const id = this.userIdCounter++;
      this.users.set(id, { ...userData, id, score: scores[index] });
    });
  }

  private initializeGameConfigs(): void {
    const difficulties: Difficulty[] = ['easy', 'medium', 'difficult'];
    
    // For each game, create configs for all difficulty levels
    for (let gameId = 1; gameId <= this.gameIdCounter - 1; gameId++) {
      difficulties.forEach(difficulty => {
        const id = this.configIdCounter++;
        // Create placeholder config data (this would be actual game generation parameters in a real app)
        const configData = JSON.stringify({
          difficulty,
          timeLimit: difficulty === 'easy' ? 180 : difficulty === 'medium' ? 120 : 90,
          hints: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 1 : 0,
          gameSpecific: {}
        });
        
        this.gameConfigs.set(id, {
          id,
          gameId,
          difficulty,
          configData
        });
      });
    }
  }
}

export const storage = new MemStorage();
