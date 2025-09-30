

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface AnalysisResult {
  asset: string;
  timeframe: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number; // e.g., 85
  entry: string;
  stopLoss: string;
  takeProfits: string[]; // Can be one or more
  setupQuality?: 'A+ Setup' | 'A Setup' | 'B Setup' | 'C Setup' | 'N/A';
  reasoning: string; // The main explanation
  tenReasons: string[]; // e.g., ["✅ Bullish engulfing pattern identified."]
  alternativeScenario?: string; // What would invalidate the thesis
  sources?: GroundingSource[];
}

export interface MarketSentimentResult {
    asset: string;
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    confidence: number;
    summary: string;
    keyPoints: string[];
    sources?: GroundingSource[];
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

// New types for chat
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
}

export interface PredictedEvent {
    eventName: string;
    time: string; // e.g., "YYYY-MM-DD HH:MM UTC"
    currency: string;
    directionalBias: 'BUY' | 'SELL';
    confidence: number; // 0-100
    rationale: string;
    sources: GroundingSource[];
}