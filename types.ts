
export interface GroundingSource {
  uri: string;
  title: string;
}

export interface AnalysisResult {
  asset: string;
  timeframe: string;
  signal: 'BUY' | 'SELL';
  confidence: number; // e.g., 85
  entry: string;
  stopLoss: string;
  takeProfits: string[]; // Can be one or more
  reasoning: string; // The main explanation
  tenReasons: string[]; // e.g., ["✅ Bullish engulfing pattern identified."]
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
