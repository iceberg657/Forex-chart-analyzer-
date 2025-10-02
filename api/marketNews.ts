
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Self-contained types to avoid import issues
interface MarketSentimentResult {
    asset: string;
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    confidence: number;
    summary: string;
    keyPoints: string[];
    sources?: GroundingSource[];
}

interface GroundingSource {
  uri: string;
  title: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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

const getMarketSentimentPrompt = (asset: string) => `You are 'Oracle', an apex-level trading AI. Your primary function is to analyze the latest market news and sentiment for a given financial asset. You are objective, data-driven, and concise.

**PRIMARY DIRECTIVE:**
1.  **Perform a Web Search:** Use your web search tool to find the most relevant and recent news, articles, and analyses for the asset: **${asset}**. Focus on information from the last 24-48 hours.
2.  **Analyze Sentiment:** Based on your search results, determine the overall market sentiment.
3.  **Generate JSON Output:** Consolidate your findings into a single, valid JSON object. Your entire response MUST be only this JSON object and nothing else.

**ANALYTICAL FRAMEWORK (Internal thought process):**
- **Identify Key Drivers:** What are the main narratives? Is it an earnings report, a regulatory change, macroeconomic data (like inflation or jobs reports), a major partnership, or a geopolitical event?
- **Assess Tone:** Is the language in the news sources predominantly positive, negative, or neutral? Are analysts bullish or bearish?
- **Quantify Confidence:** Based on the strength and consensus of the news, assign a confidence score to your sentiment analysis. A strong consensus on a major event warrants a high confidence score.
- **Synthesize Information:** Create a brief, neutral summary of the current situation. Extract 3-5 of the most important takeaways as key points.

**STRICT JSON OUTPUT REQUIREMENTS:**
You MUST respond ONLY with a single, valid JSON object matching the schema below. No markdown, no commentary, just the JSON.

**JSON Schema:**
{
  "asset": "string (The name of the asset you analyzed, e.g., '${asset}')",
  "sentiment": "'Bullish', 'Bearish', or 'Neutral'",
  "confidence": "number (A percentage from 0-100 representing your confidence in the sentiment analysis)",
  "summary": "string (A concise, 1-3 sentence summary of the current market situation for the asset)",
  "keyPoints": ["string array (3-5 bullet points of the most critical news or factors influencing the sentiment)"],
  "sources": "This will be populated by the system if web search is used."
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ success: false, message: 'API key not configured' });
    }

    try {
        const { asset } = req.body;
        if (!asset) {
            return res.status(400).json({ success: false, message: 'Missing asset' });
        }

        const prompt = getMarketSentimentPrompt(asset);
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: { 
                tools: [{googleSearch: {}}] 
            } 
        });

        const parsedResult = robustJsonParse(getResponseText(response)) as MarketSentimentResult;

        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
                .map((c: any) => ({ 
                    uri: c.web?.uri || '', 
                    title: c.web?.title || 'Source' 
                }))
                .filter((s: GroundingSource) => s.uri);
        }

        return res.status(200).json({ success: true, data: parsedResult });

    } catch (error: any) {
        console.error("Error in /api/marketNews:", error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
}
