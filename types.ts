
export interface GroundingSource {
  uri: string;
  title: string;
}

export interface AnalysisResult {
  id: string;
  date: string;
  asset: string;
  timeframe: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number; // e.g., 85
  entryPriceRange: string[]; // Distributed entry zone including current price. e.g., ["1.2360", "1.2345", "1.2350", "1.2355"] where the first element is the current price.
  stopLoss: string;
  takeProfits: string[]; // Can be one or more
  setupQuality?: 'A+ Setup' | 'A Setup' | 'B Setup' | 'C Setup' | 'N/A';
  confluenceScore?: number; // e.g., 8.5/10
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

export interface DashboardOverview {
  marketCondition: {
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    trendingPairs: string; // e.g. "Strong: USD, Weak: JPY"
    volatility: 'High' | 'Medium' | 'Low';
  };
  economicData: {
    recentEvents: { event: string; impact: string }[];
    upcomingEvents: { time: string; event: string; expectedImpact: string }[];
  };
  technicalSummary: {
    dominantTrends: { pair: string; direction: string }[]; // e.g. GBPUSD: Downtrend
    keyLevels: string[]; // List of key price levels e.g. "EURUSD Support: 1.0500"
  };
  tradingOpportunities: {
    highProbabilitySetups: { pair: string; strategy: string; confidence: string }[];
    riskAssessment: {
      marketRisk: 'High' | 'Medium' | 'Low';
      positionSizing: 'Conservative' | 'Moderate' | 'Aggressive';
    };
  };
  lastUpdated: number; // Timestamp
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
  rating?: 'up' | 'down' | null;
}

export interface PredictedEvent {
  event_description: string;
  day: string; // "Monday", "Tuesday", etc.
  date: string; // e.g., "July 26, 2024"
  time: string; // e.g., "08:30 AM EST"
  direction: 'BUY' | 'SELL';
  currencyPairs: string[]; // e.g., ["EUR/USD", "GBP/USD"]
  confidence: number; // 75-90
  potential_effect: string;
  sources?: GroundingSource[];
}
