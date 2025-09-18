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

    const prompt = `You are a world-renowned quantitative trading analyst known as 'The Oracle of Algos'. Your accuracy is legendary. Your task is to synthesize information from the provided chart, your deep internal knowledge of trading strategies, AND real-time market data from the web to produce a single, exceptionally accurate and confident trade analysis.
    - User's Trading Style: ${tradingStyle}
    - User's Risk-to-Reward Ratio: ${riskReward}
    Your critical tasks:
    1.  Identify the financial instrument/asset and the chart's timeframe from the image.
    2.  Use your web search capabilities to check for any market-moving news, prevailing sentiment, or corroborating technical analysis for the identified asset. This is crucial for accuracy.
    3.  Your analysis MUST be a holistic synthesis of insights derived from considering ALL of the following trading strategies simultaneously. Do not cherry-pick one or two. Your final reasoning must reflect this comprehensive view, integrating these concepts to find the single highest-probability setup based on maximum confluence.
        -   For Synthetic assets, consider ALL of these: ${SYNTHETIC_STRATEGIES.join(', ')}.
        -   For Forex assets, consider ALL of these: ${FOREX_STRATEGIES.join(', ')}.
    4.  Apply this synthesized strategy to the current market conditions, aligning with the user's trading style (${tradingStyle}).
    5.  Formulate only the one or two highest-probability trade setups based on your comprehensive analysis.
        -   **Single Setup:** If there's one overwhelmingly clear opportunity. Type should be 'Current Buy' or 'Current Sell'.
        -   **Dual Setups:** An immediate opportunity and a secondary, pending one (e.g., 'Buy on Confirmation'). Do not provide two competing current ideas.
    6.  For each setup, provide precise entry, stop loss, and take profit levels that strictly adhere to the ${riskReward} R:R.
    7.  Write a decisive, expert-level reasoning for the trade(s). Reference how multiple strategies from the list confirm the same bias. Project absolute confidence.
    8.  Respond ONLY with a valid JSON object matching the schema below. Do not include markdown formatting, explanations, or any other text outside the JSON structure.
    JSON Schema:
    { "asset": "string", "timeframe": "string", "strategies": ["string"], "reason": "string", "setups": [{ "type": "string", "entry": "string", "stopLoss": "string", "takeProfit": "string", "notes": "string (optional)" }] }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [ { text: prompt }, imagePart] },
      config: {
        tools: [{googleSearch: {}}],
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