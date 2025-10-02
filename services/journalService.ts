import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TradeEntry, JournalFeedback } from '../types';
import { apiClient } from './apiClient';
import { detectEnvironment } from '../hooks/useEnvironment';

const environment = detectEnvironment();
let ai: GoogleGenAI | null = null;
if (environment === 'aistudio') {
    if (process.env.API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
        console.error("API Key not found for AI Studio environment. Direct API calls will fail.");
    }
}

const getResponseText = (response: GenerateContentResponse): string => {
    if (response?.candidates?.[0]?.content?.parts) {
        const textParts = response.candidates[0].content.parts
            .filter((part: any) => typeof part.text === 'string')
            .map((part: any) => part.text);
        
        if (textParts.length > 0) {
            return textParts.join('');
        }
    }
    return response?.text ?? '';
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

const getJournalFeedbackPrompt = (trades: TradeEntry[]) => `You are 'Oracle', an apex-level trading AI and performance coach. Your role is to analyze a trader's journal and provide objective, actionable feedback with the confidence of an institutional analyst. You are encouraging but direct.

**PRIMARY DIRECTIVE:**
Analyze the provided list of trades and generate a comprehensive performance review. Your entire response MUST be a single, valid JSON object.

**PROVIDED DATA:**
A JSON array of trade objects:
\`\`\`json
${JSON.stringify(trades, null, 2)}
\`\`\`

**ANALYTICAL FRAMEWORK (Internal thought process):**
1.  **Calculate Key Metrics:**
    -   Calculate the total Profit/Loss (P/L).
    -   Calculate the Win Rate (percentage of profitable trades).
    -   Calculate the Average Win and Average Loss.
    -   Determine the Profit Factor (Gross Profit / Gross Loss).
2.  **Identify Patterns & Habits:**
    -   **Strengths:** What is the trader doing right? Do they have a high win rate on a specific asset? Are they good at cutting losses on short trades? Do they let winners run? Find positive patterns based on the data and notes.
    -   **Weaknesses:** What is the trader doing wrong? Are they holding onto losing trades for too long (large average loss)? Are they cutting winners short? Do they over-trade a specific asset with poor results? Do they seem to revenge trade (e.g., a large loss followed by several small, quick trades)? Analyze the notes for emotional language.
3.  **Formulate Actionable Suggestions:**
    -   Based on the identified weaknesses, provide 3-5 specific, actionable suggestions for improvement.
    -   Examples: "Consider implementing a stricter stop-loss rule to reduce your average loss." or "Your win rate on 'EUR/USD' is significantly higher than on other pairs. Consider focusing more on this asset." or "Review your notes for losing trades to identify if emotional decisions are a factor."

**STRICT JSON OUTPUT REQUIREMENTS:**
You MUST respond ONLY with a single, valid JSON object matching the schema below. No markdown, no commentary, just the JSON. Round all numbers to 2 decimal places.

**JSON Schema:**
{
  "overallPnl": "number (Total profit or loss. Positive for profit, negative for loss)",
  "winRate": "number (Percentage of winning trades, 0-100)",
  "strengths": ["string array (2-3 bullet points identifying positive patterns)"],
  "weaknesses": ["string array (2-3 bullet points identifying negative patterns or areas for improvement)"],
  "suggestions": ["string array (3-5 actionable steps the trader can take to improve)"]
}`;

export const getTradingJournalFeedback = async (trades: TradeEntry[]): Promise<JournalFeedback> => {
    if (environment === 'website' || environment === 'pwa') {
        return apiClient.post<JournalFeedback>('getTradingJournalFeedback', { trades });
    } else {
        if (!ai) throw new Error("Gemini AI not initialized for AI Studio. An API_KEY environment variable is required.");

        const prompt = getJournalFeedbackPrompt(trades);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        return robustJsonParse(getResponseText(response)) as JournalFeedback;
    }
};