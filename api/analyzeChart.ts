import { GoogleGenAI } from "@google/genai";

// --- START: Duplicated Types and Constants ---
// This is necessary to make the function self-contained
// without a complex monorepo setup.

interface GroundingSource {
  uri: string;
  title: string;
}

interface TradeSetup {
  type: string;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  notes?: string;
}

interface AnalysisResult {
  asset: string;
  timeframe: string;
  strategies: string[];
  reason: string;
  setups: TradeSetup[];
  sources?: GroundingSource[];
}

const SYNTHETIC_STRATEGIES = [
  "Volatility Squeeze Release", "Mean-Reversion Booster", "Algorithmic Rejection at Round Numbers",
  "Momentum Ignition & Follow-Through", "False Spike & Immediate Reversion", "Session Open Volatility Shift Scalp"
];

const FOREX_STRATEGIES = [
  "Order Block (Institutional Concept)", "Break of Structure (BOS) & Change of Character (CHoCH)",
  "Inside Bar Breakout", "Fakeout / Stop Hunt", "Supply & Demand Zones"
];
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