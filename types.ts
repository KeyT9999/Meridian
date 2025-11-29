
export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  summary: string;
  trendingScore: number;
  engagement: string;
  verificationStatus: 'Verified' | 'Needs Review' | 'Risky';
  category: string;
  url?: string;
}

export interface TrendItem {
  rank: number;
  keyword: string;
  mentions: string;
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  change: number;
}

export interface ContentConfig {
  style: string;
  tone: string;
  format: string;
  topic: string;
  keyPoints: string;
}

export interface VerificationResult {
  score: number;
  status: 'Verified' | 'Needs Review' | 'Risky';
  analysis: string;
  corrections: string[];
}

export interface SavedItem {
  id: string;
  type: 'CONTENT' | 'REPORT';
  title: string;
  content: string | VerificationResult;
  createdAt: string;
  tags?: string[];
}

export interface DailyStrategy {
  headline: string;
  marketMood: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile';
  actionItems: string[];
  focusTopics: string[];
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  GENERATOR = 'GENERATOR',
  TRENDS = 'TRENDS',
  FACT_CHECK = 'FACT_CHECK',
  LIBRARY = 'LIBRARY'
}

export interface User {
  email: string;
  name: string;
  avatarUrl?: string;
}

export enum AuthState {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER'
}
