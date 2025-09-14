export interface GroundingSource {
  uri: string;
  title: string;
}

export interface TradeSetup {
  type: string; // e.g., "Current Sell", "Buy on Confirmation"
  entry: string;
  stopLoss: string;
  takeProfit: string;
  notes?: string; // e.g., "Wait for a break above 1.2345"
}

export interface AnalysisResult {
  asset: string;
  timeframe: string;
  strategies: string[];
  reason: string;
  setups: TradeSetup[];
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