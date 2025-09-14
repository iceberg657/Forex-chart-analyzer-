import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, BotLanguage, IndicatorLanguage, GroundingSource } from '../types';
import { SYNTHETIC_STRATEGIES, FOREX_STRATEGIES } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Utility to convert file to base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeChart = async (imageFile: File, riskReward: string, tradingStyle: string): Promise<AnalysisResult> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    const prompt = `You are a world-renowned quantitative trading analyst known as 'The Oracle of Algos'. Your accuracy is legendary. Your task is to synthesize information from the provided chart, your deep internal knowledge of trading strategies, AND real-time market data from the web to produce an exceptionally accurate and confident trade analysis.
    - User's Trading Style: ${tradingStyle}
    - User's Risk-to-Reward Ratio: ${riskReward}

    Your critical tasks:
    1.  Identify the financial instrument/asset and the chart's timeframe from the image.
    2.  Use your web search capabilities to check for any market-moving news, prevailing sentiment, or corroborating technical analysis for the identified asset. This is crucial for accuracy.
    3.  Based on the chart patterns and your web research, identify and combine MULTIPLE relevant trading strategies. You are not limited to one. Choose the most potent combination from these lists:
        -   For Synthetic assets, consider: ${SYNTHETIC_STRATEGIES.join(', ')}.
        -   For Forex assets, consider: ${FOREX_STRATEGIES.join(', ')}.
    4.  Apply the combined strategies to the current market conditions, aligning with the user's trading style (${tradingStyle}).
    5.  Formulate one or two high-probability trade setups based on your comprehensive analysis.
        -   **Single Setup:** If there's one overwhelmingly clear opportunity. Type should be 'Current Buy' or 'Current Sell'.
        -   **Dual Setups:** An immediate opportunity and a secondary, pending one (e.g., 'Buy on Confirmation').
    6.  For each setup, provide precise entry, stop loss, and take profit levels that strictly adhere to the ${riskReward} R:R.
    7.  Write a decisive, expert-level reasoning for the trade(s). Reference the chosen strategies, key chart evidence, and any insights from your web search. Project absolute confidence.
    8.  Respond ONLY with a valid JSON object matching the schema below. Do not include markdown formatting, explanations, or any other text outside the JSON structure.

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
      }
    });

    let jsonString = response.text.trim();

    // Handle cases where the response is wrapped in markdown ```json ... ```
    const match = jsonString.match(/```(json)?\s*(\{[\s\S]*\})\s*```/);

    if (match && match[2]) {
      jsonString = match[2];
    } else {
      // If no markdown block is found, try to find the JSON object within the string
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }
    }
    
    const result: AnalysisResult = JSON.parse(jsonString);

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      result.sources = groundingChunks.map((chunk: any) => ({
          uri: chunk.web.uri,
          title: chunk.web.title,
      })).filter((source: GroundingSource) => source.uri && source.title); // Ensure we only add valid sources
    }

    return result;
  } catch (error) {
    console.error("Error analyzing chart:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to analyze chart. The AI returned a response that was not valid JSON. This can happen with complex requests. Please try again.");
    }
    throw new Error("Failed to analyze chart. An error occurred while communicating with the AI. Please try again.");
  }
};

interface BotOptions {
  description: string;
  language: BotLanguage;
}

export const createBot = async ({ description, language }: BotOptions): Promise<string> => {
  try {
    const prompt = `You are an expert MQL developer. Your task is to generate the code for a trading bot (Expert Advisor) based on the user's description.
- Language: ${language}
- User Description of desired behavior: "${description}"

IMPORTANT: At the very top of the generated code, you MUST include the following MQL properties:
#property copyright "Generated by Grey Algo Apex Trader"
#property link      "https://greyalgo-trading.netlify.app"
#property description "Also visit Quant Systems Trading: https://quant-systems-trading.netlify.app"

After these properties, generate the complete, functional, and well-commented ${language} code. The code must be ready to be compiled in MetaEditor. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Error creating bot:", error);
    throw new Error("Failed to generate bot code.");
  }
};

interface IndicatorOptions {
  description: string;
  language: IndicatorLanguage;
}

export const createIndicator = async ({ description, language }: IndicatorOptions): Promise<string> => {
  try {
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
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Error creating indicator:", error);
    throw new Error("Failed to generate indicator code.");
  }
};