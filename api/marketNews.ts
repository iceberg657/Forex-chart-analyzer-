
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getMarketSentimentPrompt } from '../services/prompts';
import { MarketSentimentResult, GroundingSource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
    if (typeof jsonString !== 'string' || !jsonString) {
        throw new Error("The AI's response was unclear or in an unexpected format.");
    }
    let cleanJsonString = jsonString.trim();
    const markdownMatch = cleanJsonString.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[2]) {
        cleanJsonString = markdownMatch[2];
    } else {
        const firstBracket = cleanJsonString.indexOf('{');
        const lastBracket = cleanJsonString.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            cleanJsonString = cleanJsonString.substring(firstBracket, lastBracket + 1);
        }
    }
    try {
        return JSON.parse(cleanJsonString);
    } catch (e) {
        throw new Error("The AI's response was unclear or in an unexpected format.");
    }
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { asset } = req.body;
        if (!asset) {
            return res.status(400).json({ message: 'Missing asset.' });
        }
        
        const prompt = getMarketSentimentPrompt(asset);
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: { tools: [{ googleSearch: {} }] } 
        });
        const parsedResult = robustJsonParse(response.text);
        if (!isMarketSentimentResult(parsedResult)) {
            throw new Error("The AI's market sentiment analysis was incomplete or malformed.");
        }
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
        }
        
        return res.status(200).json(parsedResult);
    } catch (error: any) {
        console.error("Error in /api/marketNews:", error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}