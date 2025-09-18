
import { GoogleGenAI } from "@google/genai";

// --- START: Duplicated Types and Constants ---
// This is necessary to make the function self-contained
// without a complex monorepo setup.

interface GroundingSource {
  uri: string;
  title: string;
}

export interface AnalysisResult {
  asset: string;
  timeframe: string;
  signal: 'BUY' | 'SELL';
  confidence: number;
  entry: string;
  stopLoss: string;
  takeProfits: string[];
  reasoning: string;
  tenReasons: string[];
  sources?: GroundingSource[];
}

// --- END: Duplicated Types and Constants ---

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { imageData, mimeType, riskReward, tradingStyle } = req.body;

        if (!imageData || !mimeType || !riskReward || !tradingStyle) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

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
    
        const result: AnalysisResult = JSON.parse(jsonString);

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            result.sources = groundingChunks.map((chunk: any) => ({
                uri: chunk.web.uri,
                title: chunk.web.title,
            })).filter((source: GroundingSource) => source.uri && source.title);
        }

        return res.status(200).json(result);

    } catch (error: any) {
        console.error("Error in /api/analyzeChart:", error);
        if (error instanceof SyntaxError) {
             return res.status(500).json({ error: "Failed to analyze chart. The AI returned a response that was not valid JSON. This can happen with complex requests. Please try again." });
        }
        return res.status(500).json({ error: "An internal server error occurred while analyzing the chart." });
    }
}
