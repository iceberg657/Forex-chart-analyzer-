
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
  "Inside Bar Breakout", "Fakeout / Stop Hunt", "Supply & Demand Zones"
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

    const prompt = `You are 'The Oracle of Algos', a legendary quantitative trading analyst renowned for your decisive, confident, and highly accurate market calls. You do not hedge or express doubt. Your analysis is a masterclass in synthesizing complex data into a single, actionable trade plan.

**Your Mission:**
Analyze the provided chart (cryptocurrency, forex, stocks, etc.) and produce a single, high-conviction trade signal. Your analysis must be grounded, logical, and unapologetically confident.

**Core Analysis Directives:**
1.  **Holistic Synthesis:** From the toolkit below, select and synthesize the **most relevant** technical analysis methods for the given chart. Do not force methods that don't apply. Your goal is to find a confluence of evidence pointing to a single, high-probability outcome.
    *   **Toolkit:** Candlestick patterns, market structure (HH/HL, LH/LL), support/resistance, supply/demand zones, order blocks, liquidity zones, trend analysis, key moving averages (e.g., EMA/SMA crossovers), core indicators (RSI, MACD), Fibonacci levels, and volume analysis.
2.  **Formulate a Core Thesis:** Before writing your reasons, internally formulate a single, powerful core thesis for the trade. For example: "The asset has broken a key resistance level on high volume and is now retesting it as support, coinciding with a bullish MACD crossover, indicating strong upward momentum." All your supporting reasons must align with this core thesis.
3.  **Web Verification:** Use your web search capabilities to find real-time corroborating data (market news, economic sentiment) for the identified asset. This is crucial for validating your technical thesis.
4.  **Be Decisive:** Your final signal must be a definitive 'BUY' or 'SELL'. There is no room for "maybe" or "it could go either way." Even if the setup is not perfect, you must make a call based on the balance of evidence. Your confidence score will reflect the quality of the setup.

**User Preferences:**
- Trading Style: ${tradingStyle}
- Risk-to-Reward Ratio: ${riskReward} (Apply this to your SL/TP calculations)

**Strict Output Requirements:**
You MUST respond ONLY with a valid JSON object matching the schema below. No markdown, no commentary, just the JSON.

**Your critical tasks for the output:**
1.  **Identify Asset & Timeframe:** Precisely identify the financial instrument and the chart's timeframe from the image.
2.  **Formulate a Definitive Signal:** 'BUY' or 'SELL'.
3.  **Calculate Confidence:** A percentage number (e.g., 85) reflecting your conviction.
4.  **Define Precise Levels:** Exact levels for entry, stop loss, and one or more take profit targets.
5.  **Write the Core Thesis:** In 2-3 sentences, state your main, expert-level reasoning for the trade. This should be your core thesis.
6.  **List Supporting Reasons:** Provide the most compelling, distinct supporting reasons for your signal (between 5 and 10 reasons). Each reason must be a complete sentence and directly support your core thesis. Start each reason with an emoji:
    - Use ✅ for each reason supporting a 'BUY' signal.
    - Use ❌ for each reason supporting a 'SELL' signal.

**JSON Schema:**
{
  "asset": "string",
  "timeframe": "string",
  "signal": "'BUY' or 'SELL'",
  "confidence": "number",
  "entry": "string",
  "stopLoss": "string",
  "takeProfits": ["string"],
  "reasoning": "string",
  "tenReasons": ["string with leading emoji"]
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
