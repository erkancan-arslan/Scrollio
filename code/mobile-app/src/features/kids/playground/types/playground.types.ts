/**
 * Kids Playground Feature Types
 * Type definitions for drawing, characters, progression, and rewards
 */

export interface KidsDrawing {
  id: string;
  childProfileId: string;
  imageUrl: string;
  title: string;
  width: number;
  height: number;
  paths: CanvasPath[];
  createdAt: string;
  updatedAt: string;
}

export interface KidsCharacter {
  id: string;
  childProfileId: string;
  name: string;
  avatarUrl: string;
  bodyType: string;
  accessories: string[];
  colors: Record<string, string>;
  animationUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KidsProgress {
  id: string;
  childProfileId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalMissionsCompleted: number;
  totalDrawings: number;
  totalCharacters: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface KidsReward {
  id: string;
  childProfileId: string;
  rewardType: 'badge' | 'sticker' | 'frame' | 'accessory';
  rewardName: string;
  rewardDescription: string;
  imageUrl: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KidsDailyMission {
  id: string;
  childProfileId: string;
  title: string;
  description: string;
  type: 'draw' | 'watch' | 'quiz' | 'explore';
  targetCount: number;
  currentCount: number;
  xpReward: number;
  isCompleted: boolean;
  completedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasPath {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  brushSize: number;
  opacity: number;
  createdAt: string;
}
