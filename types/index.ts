export type PostType = "photo" | "task" | "report";
export type TaskCategory = "skin" | "grooming" | "style" | "fitness";
export type TaskPriority = "high" | "medium" | "low";

export interface RatioMetrics {
  widthToHeight: number;
  eyeSpacing: number;
  jawBalance: number;
  foreheadRatio: number;
}

export interface FacialStructure {
  faceShape: string;
  symmetryScore: number;
  ratios: RatioMetrics;
}

export interface ScoredIssueArea {
  score: number;
  notes: string;
}

export interface SkinArea extends ScoredIssueArea {
  issues: string[];
}

export interface FaceAreas {
  skin: SkinArea;
  jawline: ScoredIssueArea;
  eyes: ScoredIssueArea;
  symmetry: ScoredIssueArea;
}

export interface HairAreas {
  style: ScoredIssueArea;
  volume: ScoredIssueArea;
  suitability: ScoredIssueArea;
}

export interface GroomingAreas {
  facialHair: ScoredIssueArea;
  eyebrows: ScoredIssueArea;
}

export interface StyleAreas {
  fit: ScoredIssueArea;
  color: ScoredIssueArea;
}

export interface CategoryBlock<TAreas> {
  score: number;
  areas: TAreas;
}

export interface ProgramTask {
  task: string;
  category: string;
  priority: TaskPriority;
}

export interface AIComment {
  text: string;
  focus: string;
}

export interface AIFeedback {
  overallScore: number;
  facialStructure: FacialStructure;
  face: CategoryBlock<FaceAreas>;
  hair: CategoryBlock<HairAreas>;
  grooming: CategoryBlock<GroomingAreas>;
  style: CategoryBlock<StyleAreas>;
  posture: {
    score: number;
    notes: string;
  };
  priorityOrder: string[];
  topImprovements: string[];
  program: {
    daily: ProgramTask[];
    weeklyFocus: string;
  };
  comment: {
    text: string;
    focus: string;
  };
}

export interface Post {
  id?: number;
  type?: PostType;
  image: string;
  createdAt: Date;
  aiFeedback?: AIFeedback | null;
  aiComments?: AIComment[] | null;
  taskTitle?: string;
  taskCategory?: TaskCategory;
  reportSummary?: string;
}

export interface Task {
  id?: number;
  title: string;
  category: TaskCategory;
  completed: boolean;
  date: string;
}

export interface Streak {
  id: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

export interface Report {
  id?: number;
  createdAt: Date;
  weekStart: string;
  avgScore: number;
  prevAvgScore: number;
  postCount: number;
  bestCategory: string;
  weakestCategory: string;
  suggestedFocus: string;
  summary: string;
}

export interface UserProfile {
  id: number;
  isPro: boolean;
  analysisCount: number;
  createdAt: Date;
}
