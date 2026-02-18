export interface GroundingSource {
  uri: string;
  title: string;
}

export interface UserSettings {
  accountType: 'Live Account' | 'Funded Account';
  balance: number;
  targetPercent: number;
  dailyDrawdown: number;
  maxDrawdown: number;
  tradingDays?: number; // Only for Funded Accounts
}

export interface AnalysisResult {
  id: string;
  date: string;
  asset: string;
  timeframe: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number; 
  entryPriceRange: string[]; 
  entryType: 'Market Execution' | 'Pullback' | 'Breakout';
  stopLoss: string;
  takeProfits: string[]; 
  estimatedDuration: string; 
  setupQuality?: 'A+ Setup' | 'A Setup' | 'B Setup' | 'C Setup' | 'N/A';
  confluenceScore?: number; 
  reasoning: string; 
  tenReasons: string[]; 
  alternativeScenario?: string; 
  sources?: GroundingSource[];
}

export interface ActivityItem {
  type: 'news' | 'alert' | 'calendar';
  title: string;
  content: string;
  time: string;
  asset?: string;
  impact?: 'High' | 'Medium' | 'Low';
}

export interface HeatmapAsset {
  symbol: string;
  change24h: number;
  volumeRatio: number; // 1.0 is average
  rsi: number;
  zScore: number;
  shortInterest?: number;
  liquidityScore: number;
}

export interface DashboardOverview {
  activityFeed: ActivityItem[];
  watchlist: { symbol: string; price: string; change24h: string }[];
  sectorHeatmap: { sector: string; strength: number; status: 'hot' | 'cold' }[];
  opportunityHeatmap: HeatmapAsset[];
  nextBigEvent: { title: string; timeUntil: string; importance: string };
  lastUpdated: number;
  sources?: GroundingSource[];
}

export interface MarketSentimentResult {
    asset: string;
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    confidence: number;
    summary: string;
    keyPoints: string[];
    sources?: GroundingSource[];
    price?: string;
    change?: string;
    changePercent?: string;
}

export interface GeneratedCode {
  code: string;
  language: string;
}

export enum BotLanguage {
  MQL4 = 'MQL4',
  MQL5 = 'MQL5',
}

export enum IndicatorLanguage {
  MQL4 = 'MQL4',
  MQL5 = 'MQL5',
  PINE_SCRIPT = 'Pine Script',
}

export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  isFeatured?: boolean;
}

export interface TradeEntry {
  id: string;
  asset: string;
  tradeType: 'Long' | 'Short';
  entryPrice: number;
  exitPrice: number;
  date: string;
  notes: string;
}

export interface JournalFeedback {
  overallPnl: number;
  winRate: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface ChatMessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: ChatMessagePart[];
  sources?: GroundingSource[];
  rating?: 'up' | 'down' | null;
}

export interface PredictedEvent {
  event_description: string;
  day: string; 
  date: string; 
  time: string; 
  direction: 'BUY' | 'SELL';
  currencyPairs: string[]; 
  confidence: number; 
  potential_effect: string;
  sources?: GroundingSource[];
}

export type SeasonalModeSetting = 'Auto' | 'On' | 'Off';

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}