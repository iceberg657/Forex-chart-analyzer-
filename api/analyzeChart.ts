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