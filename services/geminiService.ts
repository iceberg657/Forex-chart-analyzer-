import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, BotLanguage, IndicatorLanguage, GroundingSource } from '../types';

// This flag checks for a client-side API key, which is present in environments like AI Studio.
const isDirectApiAvailable = !!process.env.API_KEY;
const ai = isDirectApiAvailable ? new GoogleGenAI({ apiKey: process.env.API_KEY! }) : null;

// --- UTILITIES ---

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

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.', details: response.statusText }));
        throw new Error(errorData.details || errorData.error || 'API request failed');
    }
    return response;
};

// --- PROMPT GENERATION LOGIC (mirrors backend) ---

const getAnalysisPrompt = (tradingStyle: string, riskReward: string) => `You are a 'Senior Institutional Quantitative Analyst AI', a sophisticated and objective trading analyst operating at the highest level of financial markets. Your analysis is data-driven, unemotional, and meticulously detailed. You provide institutional-grade trade setups, focusing on probability and risk management. Your tone is professional, precise, and authoritative.

**PRIMARY DIRECTIVE:**
Analyze the provided market chart(s) and generate a comprehensive, actionable trade analysis. Your output MUST be a single, valid JSON object and nothing else.

**MULTI-TIMEFRAME CONTEXT:**
You will be provided with up to three chart images, each preceded by a text label identifying its role:
- **Higher Timeframe Chart:** Use this to establish the overarching market trend, bias, and key higher timeframe levels (e.g., daily order blocks, weekly support).
- **Primary Timeframe Chart:** This is the main chart for your analysis. Identify the primary trade setup, market structure, and points of interest here.
- **Entry Timeframe Chart:** Use this for fine-tuning the entry point, observing for confirmations like a lower-timeframe change of character or liquidity grab.

Your final analysis in the JSON output must synthesize information from ALL provided charts to form a robust, high-probability trade thesis. The 'reasoning' and 'tenReasons' must reflect this top-down analysis. If only one chart (the primary) is provided, analyze it and infer the others.

**ANALYTICAL FRAMEWORK (Internal thought process):**
Before generating the JSON, you must follow this multi-layered framework:

1.  **Contextual Analysis (Top-Down):**
    *   **Asset & Timeframe Identification:** From the images, precisely identify the financial instrument and each chart's timeframe.
    *   **Web Search for Macro Context:** Use your web search tool to find high-impact news, economic data releases, or significant market sentiment shifts relevant to the identified asset around the time of the chart's data. This is CRITICAL for accurate analysis. For example, if you see a large candle, verify if it was caused by a news event.
    *   **Higher Timeframe Bias (Synthesis):** Synthesize the information from the provided Higher Timeframe chart (if available) with your inferred bias. State this synthesized bias in your reasoning.

2.  **Price Action & Market Structure Analysis:**
    *   **Market Structure:** Identify the current market structure on the Primary chart. Is it bullish (HH/HLs), bearish (LH/LLs), or consolidating? Pinpoint the most recent Break of Structure (BOS) or Change of Character (CHoCH).
    *   **Liquidity Mapping:** Identify key liquidity zones, such as old highs/lows, equal highs/lows, and trendline liquidity that the price might target.
    *   **Key Levels:** Mark critical support and resistance levels, supply and demand zones across all provided timeframes.

3.  **Advanced Concepts Integration (SMC/ICT & Others):**
    *   **Synthesize Relevant Strategies:** Your analysis MUST integrate advanced concepts. Do not just list them. Show how they confluence across the different timeframes to form a trade thesis.
    *   **Your Toolkit (Examples, not exhaustive):** You are an expert in ALL trading concepts. Use any relevant tool from your vast knowledge base. This list is just a starting point:
        *   **Smart Money Concepts (SMC):** Order Blocks, Fair Value Gaps (FVG) / Imbalances, Breaker/Mitigation Blocks, Liquidity Grabs (Stop Hunts).
        *   **Inner Circle Trader (ICT):** Premium vs. Discount arrays, Optimal Trade Entry (OTE), Silver Bullet, Judas Swing.
        *   **Wyckoff Method:** Accumulation/Distribution schematics, Springs, Upthrusts.
        *   **Classical Patterns:** Head and Shoulders, Triangles, Flags, Wedges.
        *   **Core Indicators (for confirmation only):** RSI (for divergence), MACD, Moving Averages.
        *   **Volume Analysis:** Volume profile, spikes, and divergences.

4.  **Thesis Formulation & Trade Planning:**
    *   **Primary Thesis:** Formulate a clear, primary trade thesis based on the confluence of evidence from all charts. Example: "The Higher Timeframe chart shows a clear uptrend. The Primary chart shows price has pulled back into a 4H Order Block, and the Entry chart shows a 5m CHoCH, suggesting a bullish reversal is probable."
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
  "timeframe": "string (of the Primary chart)",
  "signal": "'BUY', 'SELL', or 'NEUTRAL'",
  "confidence": "number (percentage, e.g., 85)",
  "entry": "string (or 'N/A' for NEUTRAL)",
  "stopLoss": "string (or 'N/A' for NEUTRAL)",
  "takeProfits": ["string array (or ['N/A'] for NEUTRAL)"],
  "reasoning": "string (Your core thesis, 2-4 sentences max, synthesizing all timeframes)",
  "tenReasons": ["string array (5-10 compelling, distinct points with leading emojis: ✅ for bullish, ❌ for bearish, ⚠️ for neutral/cautionary, referencing different timeframes)"],
  "alternativeScenario": "string (The invalidation thesis. What price action would negate your signal?)",
  "sources": "This will be populated by the system if web search is used."
}`;

const getBotPrompt = (description: string, language: BotLanguage) => `You are an expert MQL developer. Your task is to generate the code for a trading bot (Expert Advisor) based on the user's description.
- Language: ${language}
- User Description of desired behavior: "${description}"
IMPORTANT: At the very top of the generated code, you MUST include the following MQL properties:
#property copyright "Generated by Grey Algo Apex Trader"
#property link      "https://greyalgo-trading.netlify.app"
#property description "Also visit Quant Systems Trading: https://quant-systems-trading.netlify.app"
After these properties, generate the complete, functional, and well-commented ${language} code. The code must be ready to be compiled in MetaEditor. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;

const getIndicatorPrompt = (description: string, language: IndicatorLanguage) => {
    if (language === IndicatorLanguage.PINE_SCRIPT) {
        return `You are an expert Pine Script developer. Your task is to generate the code for a trading indicator based on the user's description.
- Language: Pine Script
- User Description of desired behavior: "${description}"
IMPORTANT: At the very top of the generated code, you MUST include the following header comment:
// This script was generated by Grey Algo Apex Trader
// Grey Algo Trading: https://greyalgo-trading.netlify.app
// Quant Systems Trading: https://quant-systems-trading.netlify.app
After this header, generate the complete, functional, and well-commented Pine Script code, starting with the required \`//@version=5\` declaration. The code must be ready to be used directly in TradingView. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;
    }
    // MQL4 or MQL5
    return `You are an expert MQL developer. Your task is to generate the code for a trading indicator based on the user's description.
- Language: ${language}
- User Description of desired behavior: "${description}"
IMPORTANT: At the very top of the generated code, you MUST include the following MQL properties:
#property copyright "Generated by Grey Algo Apex Trader"
#property link      "https://greyalgo-trading.netlify.app"
#property description "Also visit Quant Systems Trading: https://quant-systems-trading.netlify.app"
After these properties, generate the complete, functional, and well-commented ${language} code. The code must be ready to be compiled in MetaEditor. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;
};


// --- API FUNCTIONS ---

export const analyzeChart = async (chartFiles: { [key: string]: File | null }, riskReward: string, tradingStyle: string): Promise<AnalysisResult> => {
  try {
    const chartFilesBase64: { [key: string]: { data: string; mimeType: string } } = {};
    const timeframeOrder = ['higher', 'primary', 'entry'];
    for (const tf of timeframeOrder) {
        const file = chartFiles[tf];
        if (file) {
            chartFilesBase64[tf] = await fileToBase64(file);
        }
    }

    // AI Studio / Direct API path
    if (isDirectApiAvailable && ai) {
        console.log("Sending analysis request directly to Gemini API...");
        const parts: any[] = [];
        parts.push({ text: getAnalysisPrompt(tradingStyle, riskReward) });

        for (const tf of timeframeOrder) {
            const file = chartFilesBase64[tf];
            if (file && file.data && file.mimeType) {
                let label = '';
                if (tf === 'higher') label = "\n\n--- HIGHER TIMEFRAME CHART ---";
                if (tf === 'primary') label = "\n\n--- PRIMARY TIMEFRAME CHART ---";
                if (tf === 'entry') label = "\n\n--- ENTRY TIMEFRAME CHART ---";
                parts.push({ text: label });
                parts.push({ inlineData: { data: file.data, mimeType: file.mimeType } });
            }
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: { tools: [{ googleSearch: {} }], seed: 42 }
        });

        let jsonString = response.text.trim().replace(/^```(json)?|```$/g, '');
        let result: AnalysisResult = JSON.parse(jsonString);
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            result.sources = groundingChunks.map((chunk: any) => ({
                uri: chunk.web.uri,
                title: chunk.web.title,
            })).filter((source: GroundingSource) => source.uri && source.title);
        }
        return result;
    }

    // Deployed Website / PWA path
    console.log("Sending analysis request to backend API...");
    const response = await fetch('/api/analyzeChart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartFiles: chartFilesBase64, riskReward, tradingStyle }),
    });
    
    const handledResponse = await handleApiResponse(response);
    return await handledResponse.json();

  } catch (error) {
    console.error("Error analyzing chart:", error);
    throw new Error(error instanceof Error ? error.message : "An unknown error occurred while analyzing the chart.");
  }
};

export const createBot = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
  try {
    if (isDirectApiAvailable && ai) {
        console.log("Sending bot creation request directly to Gemini API...");
        const prompt = getBotPrompt(description, language);
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    }
    
    console.log("Sending bot creation request to backend API...");
    const response = await fetch('/api/createBot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, language }),
    });
    const handledResponse = await handleApiResponse(response);
    return await handledResponse.text();

  } catch (error) {
    console.error("Error creating bot:", error);
    throw new Error(error instanceof Error ? error.message : "An unknown error occurred while generating the bot code.");
  }
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    try {
        if (isDirectApiAvailable && ai) {
            console.log("Sending indicator creation request directly to Gemini API...");
            const prompt = getIndicatorPrompt(description, language);
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            return response.text;
        }

      console.log("Sending indicator creation request to backend API...");
      const response = await fetch('/api/createIndicator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, language }),
      });
      const handledResponse = await handleApiResponse(response);
      return await handledResponse.text();
        
    } catch (error) {
        console.error("Error creating indicator:", error);
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred while generating the indicator code.");
  }
};
