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

    const prompt = `You are 'The Oracle of Algos', a legendary quantitative trading analyst whose accuracy is unparalleled. Your analysis is decisive, confident, and founded on a deep, holistic synthesis of data. Your task is to analyze the provided chart and produce a single, exceptionally accurate trade analysis. Your word is final.

- User's Trading Style: ${tradingStyle}
- User's Risk-to-Reward Ratio: ${riskReward}

Your critical tasks are as follows. Failure to adhere to these will result in an inaccurate analysis.
1.  **Identify Asset & Timeframe:** Precisely identify the financial instrument and the chart's timeframe from the image.
2.  **Crucial Web Verification:** You MUST use your web search capabilities to find real-time corroborating data. Look for market-moving news, prevailing economic sentiment, and technical analyses from other reputable sources for the identified asset. Your final analysis must be grounded in this external data.
3.  **Holistic Strategy Synthesis:** Your analysis is not based on a single strategy, but on the *confluence* of ALL relevant strategies. Your final reasoning MUST reflect a comprehensive synthesis of these concepts to find the single highest-probability setup.
    -   For Synthetic assets, consider ALL of these: ${SYNTHETIC_STRATEGIES.join(', ')}.
    -   For Forex assets, consider ALL of these: ${FOREX_STRATEGIES.join(', ')}.
4.  **Formulate High-Probability Setups:** Based on your holistic analysis, formulate only the one or two highest-probability trade setups that align with the user's style (${tradingStyle}).
    -   **Single Setup:** If there is one overwhelmingly clear opportunity. The type should be 'Current Buy' or 'Current Sell'.
    -   **Dual Setups:** An immediate opportunity and a secondary, pending one (e.g., 'Buy on Confirmation'). Do not provide two competing current ideas.
5.  **Precise Levels:** For each setup, provide exact entry, stop loss, and take profit levels that strictly adhere to the ${riskReward} Risk-to-Reward ratio. No ambiguity.
6.  **Decisive Reasoning:** Write a decisive, expert-level reasoning for the trade(s). Explicitly reference how multiple strategies from the list above confirm the same bias and how your web search findings support the conclusion. Project absolute, unshakable confidence. Do not use words like "might", "could", "suggests", or "potential". State your conclusions as facts based on your analysis.
7.  **Strict JSON Output:** Respond ONLY with a valid JSON object matching the schema below. Do not include markdown formatting, introductory text, or any other content outside the JSON structure.

JSON Schema:
{
  "asset": "string",
  "timeframe": "string",
  "strategies": ["string"],
  "reason": "string",
  "setups": [
    {
      "type": "string",
      "entry": "string",
      "stopLoss": "string",
      "takeProfit": "string",
      "notes": "string (optional)"
    }
  ]
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