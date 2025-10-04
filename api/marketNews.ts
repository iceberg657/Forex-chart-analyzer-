
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource, MarketSentimentResult } from '../types';

const getAi = () => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getResponseText = (response: GenerateContentResponse): string => response.text ?? '';

const isMarketSentimentResult = (data: any): data is MarketSentimentResult => {
    return (
        data &&
        typeof data.asset === 'string' &&
        ['Bullish', 'Bearish', 'Neutral'].includes(data.sentiment) &&
        typeof data.confidence === 'number' &&
        typeof data.summary === 'string' &&
        Array.isArray(data.keyPoints) &&
        data.keyPoints.every((p: any) => typeof p === 'string')
    );
};

const robustJsonParse = (jsonString: string) => {
    let cleanJsonString = jsonString.trim();
    // Attempt to find JSON within markdown code blocks
    const markdownMatch = cleanJsonString.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[2]) {
        cleanJsonString = markdownMatch[2];
    } else {
        // If no markdown, find the first '{' or '[' and last '}' or ']'
        const firstBracket = cleanJsonString.indexOf('{');
        const firstSquare = cleanJsonString.indexOf('[');
        
        let start = -1;
        if (firstBracket === -1) start = firstSquare;
        else if (firstSquare === -1) start = firstBracket;
        else start = Math.min(firstBracket, firstSquare);

        if (start !== -1) {
            const lastBracket = cleanJsonString.lastIndexOf('}');
            const lastSquare = cleanJsonString.lastIndexOf(']');
            const end = Math.max(lastBracket, lastSquare);
            if (end > start) {
                cleanJsonString = cleanJsonString.substring(start, end + 1);
            }
        }
    }
    
    try {
        return JSON.parse(cleanJsonString);
    } catch (parseError) {
        console.error("Failed to parse JSON from API response:", { original: jsonString, cleaned: cleanJsonString });
        throw new Error("The AI's response was unclear or in an unexpected format. Please try again.");
    }
};

const getMarketSentimentPrompt = (asset: string) => `You are 'Oracle', an apex-level trading AI. Your response MUST be a single, valid JSON object. Do not include any other text, markdown, or explanations. The response must start with { and end with } and contain nothing else. ...`; // Full prompt omitted for brevity

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { asset } = req.body;
        const ai = getAi();
        const prompt = getMarketSentimentPrompt(asset);

        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: { tools: [{ googleSearch: {} }] } 
        });

        const rawText = getResponseText(response);
        const parsedResult = robustJsonParse(rawText);

        if (!isMarketSentimentResult(parsedResult)) {
            console.error("AI response for market news failed schema validation.", { response: parsedResult, rawText });
            throw new Error("The AI's market sentiment analysis was incomplete or malformed. Please try again.");
        }

        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
        }

        res.status(200).json(parsedResult);
    } catch (error) {
        console.error('Error in /api/marketNews:', error);
        res.status(500).json({ message: error instanceof Error ? error.message : 'An unknown error occurred.' });
    }
}
