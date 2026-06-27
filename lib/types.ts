export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type PortfolioValue = "Low" | "Medium" | "High";
export type SourceType = "Live" | "Mock";
export type StudentDiscount = "Yes" | "No" | "Unknown";
export type TrialCredits = "Yes" | "No" | "Unknown";

export interface AccessFlags {
  freeTier: boolean;
  studentDiscount: StudentDiscount;
  openSource: boolean;
  trialCredits: TrialCredits;
  apiAvailable: boolean;
  noCodeFriendly: boolean;
  waitlistRequired: boolean;
  paidOnly: boolean;
}

export interface Tutorial {
  title: string;
  goal: string;
  estimatedTime: string;
  difficulty: string;
  toolsNeeded: string[];
  steps: string[];
  prompt: string;
  expectedOutput: string;
  commonMistakes: string[];
  nextStep: string;
}

export interface PromptPack {
  student: string;
  coding: string;
  marketing: string;
  design: string;
  research: string;
  career: string;
}

export interface MiniProject {
  title: string;
  difficulty: string;
  estimatedTime: string;
  toolsNeeded: string[];
  skillsLearned: string[];
  portfolioValue: PortfolioValue;
  steps: string[];
  output: string;
}

export interface AIUpdate {
  id: string;
  title: string;
  toolName: string;
  category: string;
  summary: string;
  longExplanation: string;
  whyItMatters: string;
  tags: string[];
  date: string;
  hypeScore: number;
  usefulScore: number;
  studentRelevanceScore: number;
  difficulty: Difficulty;
  bestFor: string[];
  access: AccessFlags;
  perks: string[];
  limitations: string[];
  tutorial: Tutorial;
  promptPack: PromptPack;
  miniProject: MiniProject;
  sourceType: SourceType;
  isSaved: boolean;
  isFeatured: boolean;
  sourceUrl?: string;
}

export type TabId = "radar" | "search" | "build";
export type ProjectStatus = "Not Started" | "In Progress" | "Completed";

export interface RadarResponse {
  items: AIUpdate[];
  source: "live" | "mock";
  generatedAt: string;
  message: string;
}

export interface AskResponse {
  answer: string;
  source: "live" | "mock";
}
