
import { GoogleGenAI } from "@google/genai";
import { TradeEntry, JournalFeedback } from '../types';

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = getJournalFeedbackPrompt(trades);
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    return robustJsonParse(response.text) as JournalFeedback;
};