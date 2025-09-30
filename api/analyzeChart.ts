
import { GoogleGenAI, Part } from "@google/genai";
import { AnalysisResult, GroundingSource } from '../types';

const getAnalysisPrompt = (tradingStyle: string, riskReward: string) => `You are a 'Senior Institutional Quantitative Analyst AI'. Your goal is to provide institutional-grade trade setups based on user-provided charts. Your analysis must be data-driven, objective, and focus on market structure and probability.

**PRIMARY DIRECTIVE:**
Analyze the provided chart(s) and generate a single, valid JSON object as your output. No other text or markdown.

**ANALYSIS CONTEXT:**
- You may receive up to three charts: Higher, Primary, and Entry Timeframe. Synthesize all of them for a top-down analysis.
- **For standard assets (FX, stocks, crypto):** You MUST use your web search tool to understand the current news, fundamentals, and market sentiment. Incorporate these findings into your reasoning.
- **For Synthetic Indices (V75, Boom/Crash, etc.):** DO NOT use web search. Your analysis must be purely technical, based on price action and algorithmic patterns unique to these instruments.
- **Your analysis should prioritize:** Market Structure (BOS, CHoCH), Liquidity (internal/external), Premium/Discount arrays, and key institutional levels (Order Blocks, FVGs). Use other concepts (Wyckoff, patterns, indicators) for confirmation.

**USER PREFERENCES:**
- Trading Style: ${tradingStyle}
- Risk-to-Reward Ratio: ${riskReward}

**STRICT JSON OUTPUT SCHEMA:**
{
  "asset": "string",
  "timeframe": "string (Primary chart's timeframe)",
  "signal": "'BUY', 'SELL', or 'NEUTRAL'",
  "confidence": "number (percentage)",
  "entry": "string (or 'N/A')",
  "stopLoss": "string (or 'N/A')",
  "takeProfits": ["string array (or ['N/A'])"],
  "setupQuality": "string ('A+ Setup', 'A Setup', 'B Setup', 'C Setup', or 'N/A')",
  "reasoning": "string (A 2-4 sentence core thesis synthesizing your technical and fundamental (if applicable) analysis)",
  "tenReasons": ["string array (5-10 concise points with emojis: ✅ Bullish, ❌ Bearish, ⚠️ Neutral, 🌐 Web Context)"],
  "alternativeScenario": "string (What price action would invalidate your signal?)",
  "sources": "This will be populated by the system if web search is used."
}`;

const robustJsonParse = (jsonString: string) => {
    let cleanJsonString = jsonString.trim();
    const match = cleanJsonString.match(/```(json)?\s*(\{[\s\S]*\})\s*```/);
    if (match && match[2]) {
        cleanJsonString = match[2];
    } else {
        const jsonStart = cleanJsonString.indexOf('{');
        const jsonEnd = cleanJsonString.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            cleanJsonString = cleanJsonString.substring(jsonStart, jsonEnd + 1);
        }
    }
    try {
        return JSON.parse(cleanJsonString);
    } catch (parseError) {
        console.error("Failed to parse JSON from AI response:", cleanJsonString);
        throw new Error("Failed to process the request. The AI returned an invalid format.");
    }
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API Key not configured." });
    }

    try {
        const { imageParts, riskReward, tradingStyle } = req.body;
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const parts: Part[] = [
            { text: getAnalysisPrompt(tradingStyle, riskReward) },
        ];

        const fileTypeMap: { [key: string]: string } = {
            higher: 'Higher Timeframe Chart:',
            primary: 'Primary Timeframe Chart:',
            entry: 'Entry Timeframe Chart:',
        };
        
        for (const key of ['higher', 'primary', 'entry']) {
            if (imageParts[key]) {
                parts.push({ text: fileTypeMap[key] });
                parts.push({
                    inlineData: imageParts[key],
                });
            }
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                tools: [{googleSearch: {}}],
            }
        });

        const parsedResult = robustJsonParse(response.text) as AnalysisResult;

        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
            .map((chunk: any) => ({
                uri: chunk.web?.uri || '',
                title: chunk.web?.title || 'Source',
            }))
            .filter((source: GroundingSource) => source.uri);
        }

        return res.status(200).json(parsedResult);

    } catch (error: any) {
        console.error("Error in /api/analyzeChart:", error);
        res.status(500).json({ error: "API request failed", details: error.message });
    }
}
