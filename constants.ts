import { BotLanguage, IndicatorLanguage, PricingPlan } from './types';

export const SYNTHETIC_STRATEGIES = [
  "Boom/Crash Spike Hunting (Counter-Trend Scalp)",
  "Boom/Crash Trend Following (Main Trend)",
  "Volatility Index Range Breakout",
  "Volatility Index Support/Resistance Flip",
  "Step Index Trend Riding",
  "Algorithmic Rejection at Round Numbers",
  "Momentum Ignition & Follow-Through",
  "False Spike & Immediate Reversion",
  "Volatility Squeeze Release",
  "Mean-Reversion Booster",
];

export const FOREX_STRATEGIES = [
  "Order Block (Institutional Concept)",
  "Break of Structure (BOS) & Change of Character (CHoCH)",
  "Inside Bar Breakout",
  "Fakeout / Stop Hunt",
  "Supply & Demand Zones",
  "Breakout/Pullback with Measured Target",
  "Wyckoff Spring (Terminal Shakeout) & Backup",
  "Horizontal High Tight Flag Breakout",
  "Flag/Pennant Breakout (Short-Term Continuation)",
  "Measured Move (Price Swing Projection)",
  "Volatility Contraction Pattern (VCP) Breakout"
];

export const ALL_STRATEGIES = [...SYNTHETIC_STRATEGIES, ...FOREX_STRATEGIES];

export const TIME_FRAMES = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"];

export const INSTRUMENTS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "USD/CHF", "NZD/USD",
  "Volatility 75 Index", "Boom 1000 Index", "Crash 500 Index", "Step Index", "Jump 25 Index"
];

export const TRADING_STYLES = ["Scalping", "Day Trading", "Swing Trading"];

export const BOT_LANGUAGES: BotLanguage[] = [BotLanguage.MQL4, BotLanguage.MQL5];
export const INDICATOR_LANGUAGES: IndicatorLanguage[] = [IndicatorLanguage.MQL4, IndicatorLanguage.MQL5, IndicatorLanguage.PINE_SCRIPT];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free Tier",
    price: "$0",
    features: [
      "1 Bot Generation",
      "1 Indicator Generation",
      "Basic Chart Analysis",
      "Community Support",
    ],
  },
  {
    name: "Pro Trader",
    price: "$49/mo",
    features: [
      "10 Bot Generations per month",
      "10 Indicator Generations per month",
      "Advanced Chart Analysis",
      "Priority Email Support",
      "Access to All Strategies",
    ],
    isFeatured: true,
  },
  {
    name: "Apex Quant",
    price: "$99/mo",
    features: [
      "Unlimited Bot Generations",
      "Unlimited Indicator Generations",
      "Advanced Chart Analysis",
      "Dedicated 24/7 Support",
      "Early Access to New Features",
    ],
  },
];