
import { GoogleGenAI } from "@google/genai";
import { MarketSentimentResult, GroundingSource } from '../types';
import { apiClient } from './apiClient';

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

const getMarketSentimentPrompt = (asset: string) => `You are 'Oracle', an apex-level trading AI. Analyze the latest market news and sentiment for a given financial asset.

**PRIMARY DIRECTIVE:**
1.  **Perform a Web Search:** Use your tool to find recent news for: **${asset}**. Prioritize reputable financial news sources.
2.  **Analyze Sentiment:** Determine the overall market sentiment.
3.  **Generate JSON Output:** Your entire response MUST be only a single, valid JSON object.

**STRICT JSON SCHEMA:**
{
  "asset": "string (e.g., '${asset}')",
  "sentiment": "'Bullish', 'Bearish', or 'Neutral'",
  "confidence": "number (0-100)",
  "summary": "string (1-3 sentence summary)",
  "keyPoints": ["string array (3-5 bullet points)"],
  "sources": "This will be populated by the system."
}`;

export const getMarketNews = async (asset: string): Promise<MarketSentimentResult> => {
    if (process.env.API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = getMarketSentimentPrompt(asset);
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{googleSearch: {}}] } });
        const parsedResult = robustJsonParse(response.text) as MarketSentimentResult;
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks.map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' })).filter((s: any) => s.uri);
        }
        return parsedResult;
    } else {
        return apiClient.post<MarketSentimentResult>('getMarketNews', { asset });
    }
};