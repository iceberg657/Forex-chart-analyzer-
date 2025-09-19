
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, BotLanguage, IndicatorLanguage, GroundingSource } from '../types';

// --- Environment Detection ---
// In AI Studio, process.env.API_KEY is available client-side.
// In a production build (like on Vercel), it will be undefined in the browser.
const isAiStudio = !!process.env.API_KEY;

// --- START: Duplicated Constants ---
// These are used in the prompt construction for the AI Studio path.
const SYNTHETIC_STRATEGIES = [
  "Volatility Squeeze Release", "Mean-Reversion Booster", "Algorithmic Rejection at Round Numbers",
  "Momentum Ignition & Follow-Through", "False Spike & Immediate Reversion", "Session Open Volatility Shift Scalp"
];

const FOREX_STRATEGIES = [
  "Order Block (Institutional Concept)", "Break of Structure (BOS) & Change of Character (CHoCH)",
  "Inside Bar Breakout", "Fakeout / Stop Hunt", "Supply & Demand Zones", "Breakout/Pullback with Measured Target",
  "Wyckoff Spring (Terminal Shakeout) & Backup", "Horizontal High Tight Flag Breakout", "Flag/Pennant Breakout (Short-Term Continuation)",
  "Measured Move (Price Swing Projection)", "Volatility Contraction Pattern (VCP) Breakout"
];
// --- END: Duplicated Constants ---


// Utility to convert file to base64
const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('FileReader result is not a string'));
      }
      const result = reader.result;
      const data = result.split(',')[1];
      const mimeType = file.type;
      resolve({ data, mimeType });
    };
    reader.onerror = error => reject(error);
  });
};

// --- Client-side AI Studio Logic ---
const analyzeChartClientSide = async (imageFile: File, riskReward: string, tradingStyle: string): Promise<AnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const { data: imageData, mimeType } = await fileToBase64(imageFile);

    const imagePart = {
      inlineData: { data: imageData, mimeType: mimeType },
    };

    const prompt = `You are a 'Senior Institutional Quantitative Analyst AI', a sophisticated and objective trading analyst operating at the highest level of financial markets. Your analysis is data-driven, unemotional, and meticulously detailed. You provide institutional-grade trade setups, focusing on probability and risk management. Your tone is professional, precise, and authoritative.

**PRIMARY DIRECTIVE:**
Analyze the provided market chart and generate a comprehensive, actionable trade analysis. Your output MUST be a single, valid JSON object and nothing else.

**ANALYTICAL FRAMEWORK (Internal thought process):**
Before generating the JSON, you must follow this multi-layered framework:

1.  **Contextual Analysis (Top-Down):**
    *   **Asset & Timeframe Identification:** From the image, precisely identify the financial instrument and the chart's timeframe.
    *   **Web Search for Macro Context:** Use your web search tool to find high-impact news, economic data releases, or significant market sentiment shifts relevant to the identified asset around the time of the chart's data. This is CRITICAL for accurate analysis. For example, if you see a large candle, verify if it was caused by a news event.
    *   **Higher Timeframe Bias (Inference):** Infer the likely trend on higher timeframes (e.g., if analyzing a 15m chart, consider the 1H and 4H trend). State this inferred bias in your reasoning.

2.  **Price Action & Market Structure Analysis:**
    *   **Market Structure:** Identify the current market structure. Is it bullish (HH/HLs), bearish (LH/LLs), or consolidating? Pinpoint the most recent Break of Structure (BOS) or Change of Character (CHoCH).
    *   **Liquidity Mapping:** Identify key liquidity zones, such as old highs/lows, equal highs/lows, and trendline liquidity that the price might target.
    *   **Key Levels:** Mark critical support and resistance levels, supply and demand zones.

3.  **Advanced Concepts Integration (SMC/ICT & Others):**
    *   **Synthesize Relevant Strategies:** Your analysis MUST integrate advanced concepts. Do not just list them. Show how they confluence to form a trade thesis.
    *   **Your Toolkit (Examples, not exhaustive):** You are an expert in ALL trading concepts. Use any relevant tool from your vast knowledge base. This list is just a starting point:
        *   **Smart Money Concepts (SMC):** Order Blocks, Fair Value Gaps (FVG) / Imbalances, Breaker/Mitigation Blocks, Liquidity Grabs (Stop Hunts).
        *   **Inner Circle Trader (ICT):** Premium vs. Discount arrays, Optimal Trade Entry (OTE), Silver Bullet, Judas Swing.
        *   **Wyckoff Method:** Accumulation/Distribution schematics, Springs, Upthrusts.
        *   **Classical Patterns:** Head and Shoulders, Triangles, Flags, Wedges.
        *   **Core Indicators (for confirmation only):** RSI (for divergence), MACD, Moving Averages.
        *   **Volume Analysis:** Volume profile, spikes, and divergences.

4.  **Thesis Formulation & Trade Planning:**
    *   **Primary Thesis:** Formulate a clear, primary trade thesis based on the confluence of evidence. Example: "The price has swept liquidity below a key low and reacted to a 4H Order Block, suggesting a bullish reversal is probable."
    *   **Alternative Thesis / Invalidation:** Define what price action would invalidate your primary thesis. This is crucial for risk management. Example: "A close below the low of the 4H Order Block at $1.2345 would invalidate the bullish thesis and suggest a continuation of the downtrend."
    *   **Trade Parameters:** Based on user preferences (Trading Style, R:R), define precise entry, stop loss, and take profit levels for your primary thesis. For a NEUTRAL signal, these must be "N/A".

**User Preferences:**
- Trading Style: ${tradingStyle}
- Risk-to-Reward Ratio: ${riskReward} (Apply this to your SL/TP calculations for BUY/SELL signals)

**STRICT JSON OUTPUT REQUIREMENTS:**
You MUST respond ONLY with a single, valid JSON object matching the schema below. No markdown, no commentary, just the JSON.

**JSON Schema:**
{
  "asset": "string",
  "timeframe": "string",
  "signal": "'BUY', 'SELL', or 'NEUTRAL'",
  "confidence": "number (percentage, e.g., 85)",
  "entry": "string (or 'N/A' for NEUTRAL)",
  "stopLoss": "string (or 'N/A' for NEUTRAL)",
  "takeProfits": ["string array (or ['N/A'] for NEUTRAL)"],
  "reasoning": "string (Your core thesis, 2-4 sentences max)",
  "tenReasons": ["string array (5-10 compelling, distinct points with leading emojis: ✅ for bullish, ❌ for bearish, ⚠️ for neutral/cautionary)"],
  "alternativeScenario": "string (The invalidation thesis. What price action would negate your signal?)",
  "sources": "This will be populated by the system if web search is used."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [ { text: prompt }, imagePart] },
      config: {
        tools: [{googleSearch: {}}],
        seed: 42,
      }
    });

    let jsonString = response.text.trim();
    const match = jsonString.match(/```(json)?\s*(\{[\s\S]*\})\s*```/);
    if (match && match[2]) {
        jsonString = match[2];
    } else {
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        }
    }

    let result: AnalysisResult;
    try {
        result = JSON.parse(jsonString);
    } catch (parseError) {
        console.error("Failed to parse JSON from AI response:", jsonString);
        throw new Error("Failed to analyze chart. The AI returned an invalid format. Please try again.");
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        result.sources = groundingChunks.map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
        })).filter((source: GroundingSource) => source.uri && source.title);
    }
    return result;
};

const createBotClientSide = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `You are an expert MQL developer. Your task is to generate the code for a trading bot (Expert Advisor) based on the user's description.
- Language: ${language}
- User Description of desired behavior: "${description}"
IMPORTANT: At the very top of the generated code, you MUST include the following MQL properties:
#property copyright "Generated by Grey Algo Apex Trader"
#property link      "https://greyalgo-trading.netlify.app"
#property description "Also visit Quant Systems Trading: https://quant-systems-trading.netlify.app"
After these properties, generate the complete, functional, and well-commented ${language} code. The code must be ready to be compiled in MetaEditor. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;

    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

const createIndicatorClientSide = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    let prompt: string;
    if (language === IndicatorLanguage.PINE_SCRIPT) {
        prompt = `You are an expert Pine Script developer. Your task is to generate the code for a trading indicator based on the user's description.
- Language: Pine Script
- User Description of desired behavior: "${description}"
IMPORTANT: At the very top of the generated code, you MUST include the following header comment:
// This script was generated by Grey Algo Apex Trader
// Grey Algo Trading: https://greyalgo-trading.netlify.app
// Quant Systems Trading: https://quant-systems-trading.netlify.app
After this header, generate the complete, functional, and well-commented Pine Script code, starting with the required \`//@version=5\` declaration. The code must be ready to be used directly in TradingView. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;
    } else { // MQL4 or MQL5
        prompt = `You are an expert MQL developer. Your task is to generate the code for a trading indicator based on the user's description.
- Language: ${language}
- User Description of desired behavior: "${description}"
IMPORTANT: At the very top of the generated code, you MUST include the following MQL properties:
#property copyright "Generated by Grey Algo Apex Trader"
#property link      "https://greyalgo-trading.netlify.app"
#property description "Also visit Quant Systems Trading: https://quant-systems-trading.netlify.app"
After these properties, generate the complete, functional, and well-commented ${language} code. The code must be ready to be compiled in MetaEditor. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;
    }
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};


// --- Server-side (Vercel) Fetching Logic ---
const analyzeChartServerSide = async (imageFile: File, riskReward: string, tradingStyle: string): Promise<AnalysisResult> => {
    const { data: imageData, mimeType } = await fileToBase64(imageFile);
    const response = await fetch('/api/analyzeChart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, mimeType, riskReward, tradingStyle }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze chart.');
    }
    return response.json();
};

const createBotServerSide = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
    const response = await fetch('/api/createBot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, language }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bot.');
    }
    const result = await response.json();
    return result.code;
};

const createIndicatorServerSide = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    const response = await fetch('/api/createIndicator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, language }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create indicator.');
    }
    const result = await response.json();
    return result.code;
};


// --- Public API ---
// These functions are called by the components and decide which implementation to use.

export const analyzeChart = async (imageFile: File, riskReward: string, tradingStyle: string): Promise<AnalysisResult> => {
  try {
    if (isAiStudio) {
      return await analyzeChartClientSide(imageFile, riskReward, tradingStyle);
    } else {
      return await analyzeChartServerSide(imageFile, riskReward, tradingStyle);
    }
  } catch (error) {
    console.error("Error analyzing chart:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while analyzing the chart.");
  }
};

export const createBot = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
  try {
    if (isAiStudio) {
      return await createBotClientSide({ description, language });
    } else {
      return await createBotServerSide({ description, language });
    }
  } catch (error) {
    console.error("Error creating bot:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while generating the bot code.");
  }
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
  try {
    if (isAiStudio) {
      return await createIndicatorClientSide({ description, language });
    } else {
      return await createIndicatorServerSide({ description, language });
    }
  } catch (error) {
    console.error("Error creating indicator:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while generating the indicator code.");
  }
};
