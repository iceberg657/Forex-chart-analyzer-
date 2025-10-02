import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Part, GenerateContentResponse } from "@google/genai";

// --- TYPES (Duplicated from types.ts for self-containment in serverless function) ---
interface GroundingSource {
  uri: string;
  title: string;
}

interface AnalysisResult {
  asset: string;
  timeframe: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  entry: string;
  stopLoss: string;
  takeProfits: string[];
  setupQuality?: 'A+ Setup' | 'A Setup' | 'B Setup' | 'C Setup' | 'N/A';
  reasoning: string;
  tenReasons: string[];
  alternativeScenario?: string;
  sources?: GroundingSource[];
}

// --- UTILITIES ---

const getResponseText = (response: GenerateContentResponse): string => {
    return response.text ?? '';
};

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

// --- PROMPTS ---

const getAnalysisPrompt = (
    tradingStyle: string,
    riskReward: string,
    isSingleChart: boolean
) => `You are 'Oracle', an apex-level AI quantitative analyst. Your task is to implement a unified reasoning architecture to produce high-probability trade setups. You are consistent, logical, and your analysis is institutional-grade.

Your entire response MUST be a single, valid JSON object that adheres to the provided schema.

---

### 🏛️ Core Architecture & Decision Flow

You will simulate a modular decision engine. For every analysis, you must follow this internal process:

1.  **Data Ingestion & Preprocessing:** Analyze the provided chart(s), identifying key features: Price Action, Volume, OBV (if present), Support/Resistance, Trendlines, Consolidation Patterns, Order Blocks, BOS/CHoCH, Fair Value Gaps (FVG).
2.  **Context Map Generation:** Build a feature vector (a mental "Context Map") based on a 10-point analysis blueprint. Quantify features like structure bias, candle rejection strength, volume profile, etc.
3.  **Strategy Analysis:** Evaluate the chart against a pool of high-probability strategies (e.g., Order Block Reversal, BOS Continuation, Fakeout/Stop Hunt, Inside Bar Breakout). Each strategy gets an internal \`strategy_score\`.
4.  **Scoring & Selection:** Calculate a \`Final Strategy Score\` for the best-fitting strategy using a weighted formula: \`Final Score = (0.5 * strategy_score) + (0.4 * context_match_score) + (0.1 * htf_alignment_score)\`.
5.  **Execution Plan:** Based on the selected strategy and its final score, generate a precise execution plan (Entry, SL, TP).
6.  **Explainability:** Articulate your reasoning clearly, stating the chosen strategy and the key factors from your Context Map.

---

### 🧠 Trading Style Adaptation (Mandatory)

You MUST adapt your entire methodology, including TFs, scoring thresholds, and risk parameters, to the user's selected trading style. You MUST state which style you are applying in your \`reasoning\`.

*   **If Style is 'Scalping' (M1-M15):**
    *   **TFs:** Analyze M1/M5, using M15 for bias.
    *   **Focus:** Micro-structure breaks, momentum shifts (OBV is critical), candlestick patterns.
    *   **Scoring:** Require a \`Final Strategy Score\` ≥ 70.
    *   **Risk:** Tight SL (e.g., 1x ATR(5) or structure wick), small tiered TPs (e.g., 1:1, 1:2 R:R). Setups are rapid.

*   **If Style is 'Day Trading' (M15-H1):**
    *   **TFs:** Analyze M15/H1, using H4 for bias.
    *   **Focus:** Session liquidity (e.g., London/NY session highs/lows), intra-day trends, structural points.
    *   **Scoring:** Require a \`Final Strategy Score\` ≥ 65.
    *   **Risk:** Standard SL (e.g., 1.5-2x ATR(14) or outside key structure), standard tiered TPs (e.g., 1:3+ R:R).

*   **If Style is 'Swing Trading' (H4-D1):**
    *   **TFs:** Analyze H4/D1, using Weekly for bias.
    *   **Focus:** Major market structure, weekly/daily order flow, significant supply/demand zones.
    *   **Scoring:** Require a \`Final Strategy Score\` ≥ 60, but HTF alignment is critical.
    *   **Risk:** Wider SL (e.g., 2-3x ATR(14) or outside major structure), large R:R targets, potentially letting trades run.

---

### 📈 Strategy Module Reasoning (Internal Checklist)

When evaluating strategies, use these confirmation templates. The more checks that pass, the higher the \`strategy_score\`.

*   **Order Block (Institutional):**
    *   Is there a clear OB in a premium/discount zone?
    *   Does it have an associated imbalance (FVG)?
    *   Does price show a reaction (wick rejection, volume absorption) upon returning to the OB?
*   **BOS / CHoCH (Break of Structure / Change of Character):**
    *   Is there a clean, high-momentum break of a significant structural high/low?
    *   Is the break confirmed by HTF momentum?
    *   Is there a subsequent retest of the broken structure or a return to the origin of the break?
*   **Inside Bar Breakout:**
    *   Is there a clear Inside Bar pattern within a consolidation?
    *   Is volume compressing before the breakout?
    *   Does the breakout occur with a volume spike and a candle closing decisively outside the parent bar?
*   **Fakeout / Stop Hunt (Liquidity Sweep):**
    *   Did price convincingly break a key S/R level or swing point?
    *   Did it rapidly reverse back inside the range, often with a long rejection wick?
    *   This is powerful when it sweeps obvious equal highs/lows.

---

### ⚠️ Critical Handling for Missing OBV

**If the OBV indicator is NOT visible, you MUST NOT refuse the analysis.** Instead, you MUST:
1.  Acknowledge its absence in your \`reasoning\`.
2.  Default to pure Price Action and Smart Money Concepts.
3.  Qualify your analysis by assigning a lower \`confidence\` score and a \`setupQuality\` of 'B Setup' or lower.
4.  **Crucially, you MUST still provide a complete and valid JSON response.**

---

**USER PREFERENCES:**
- Trading Style: ${tradingStyle}
- Risk-to-Reward Ratio: ${riskReward}

**STRICT JSON OUTPUT SCHEMA:**
{
  "asset": "string",
  "timeframe": "string (Primary chart's timeframe)",
  "signal": "'BUY', 'SELL', or 'NEUTRAL'",
  "confidence": "number (Your calculated Final Strategy Score, 0-100)",
  "entry": "string (or 'N/A')",
  "stopLoss": "string (or 'N/A')",
  "takeProfits": ["string array (Provide tiered TPs based on trading style, e.g., ['TP1: 1.2345', 'TP2: 1.2365'])"],
  "setupQuality": "string ('A+ Setup', 'A Setup', 'B Setup', 'C Setup', or 'N/A')",
  "reasoning": "string (State the chosen strategy, its score, and a 2-4 sentence core thesis)",
  "tenReasons": ["string array (5-10 concise points from your Context Map analysis, with emojis: ✅ Bullish, ❌ Bearish, ⚠️ Neutral)"],
  "alternativeScenario": "string (What invalidates your signal?)",
  "sources": "This will be populated by the system if web search is used."
}`;


// The Handler Function
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
    
    if (!process.env.API_KEY) {
        return res.status(500).json({ success: false, message: 'API key not configured' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const { chartFiles, riskReward, tradingStyle } = req.body;

        if (!chartFiles || !chartFiles.primary || !riskReward || !tradingStyle) {
            return res.status(400).json({ success: false, message: 'Missing required parameters: chartFiles.primary, riskReward, tradingStyle' });
        }

        const imageParts: { [key: string]: { mimeType: string, data: string } | null } = chartFiles;

        const isSingleChart = !!imageParts.primary && !imageParts.higher && !imageParts.entry;

        const parts: Part[] = [
            { text: getAnalysisPrompt(tradingStyle, riskReward, isSingleChart) },
        ];
        
        for (const key of ['higher', 'primary', 'entry']) {
            if (imageParts[key]) {
                parts.push({ text: `${key.charAt(0).toUpperCase() + key.slice(1)} Timeframe Chart:` });
                parts.push({
                    inlineData: imageParts[key]!,
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

        const parsedResult = robustJsonParse(getResponseText(response)) as AnalysisResult;

        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
            .map((chunk: any) => ({
                uri: chunk.web?.uri || '',
                title: chunk.web?.title || 'Source',
            }))
            .filter((source: GroundingSource) => source.uri);
        }

        return res.status(200).json({ success: true, data: parsedResult });

    } catch (error: any) {
        console.error("Error in /api/analyze:", error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
}
