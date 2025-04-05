import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define difficulty enum
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'difficult']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  score: integer("score").default(0).notNull(),
});

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., "hectoclash", "sudoku", etc.
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Game results table for tracking user scores
export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameId: integer("game_id").notNull().references(() => games.id),
  score: integer("score").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Game questions and configurations (for generating game content)
export const gameConfigs = pgTable("game_configs", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  difficulty: difficultyEnum("difficulty").notNull(),
  configData: text("config_data").notNull(), // JSON string with game-specific config
});

// Define Zod schemas for data validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
});

export const insertGameSchema = createInsertSchema(games);

export const insertGameResultSchema = createInsertSchema(gameResults).pick({
  userId: true,
  gameId: true,
  score: true,
  difficulty: true,
});

export const insertGameConfigSchema = createInsertSchema(gameConfigs).pick({
  gameId: true,
  difficulty: true,
  configData: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GameResult = typeof gameResults.$inferSelect;
export type GameConfig = typeof gameConfigs.$inferSelect;
export type Difficulty = "easy" | "medium" | "difficult";
