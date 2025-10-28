
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getPredictorPrompt } from '../services/prompts';
import { PredictedEvent, GroundingSource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const isPredictedEvent = (data: any): data is PredictedEvent => {
    return (
        data &&
        typeof data.event_description === 'string' &&
        typeof data.day === 'string' &&
        typeof data.date === 'string' &&
        typeof data.time === 'string' &&
        ['BUY', 'SELL'].includes(data.direction) &&
        Array.isArray(data.currencyPairs) && data.currencyPairs.every((p: any) => typeof p === 'string') &&
        typeof data.confidence === 'number' && data.confidence >= 75 && data.confidence <= 90 &&
        typeof data.potential_effect === 'string'
    );
};

const isPredictedEventArray = (data: any): data is PredictedEvent[] => {
    return Array.isArray(data) && data.every(isPredictedEvent);
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
        const firstSquare = cleanJsonString.indexOf('[');
        const lastSquare = cleanJsonString.lastIndexOf(']');
        if (firstSquare !== -1 && lastSquare > firstSquare) {
            cleanJsonString = cleanJsonString.substring(firstSquare, lastSquare + 1);
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
        const prompt = getPredictorPrompt();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
        });
        const parsedResult = robustJsonParse(response.text);
        if (!isPredictedEventArray(parsedResult)) {
            throw new Error("The AI's predictions were incomplete or malformed.");
        }
        
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const sources = response.candidates[0].groundingMetadata.groundingChunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
            if (sources.length > 0 && parsedResult.length > 0) {
                // Assign sources to the first event for simplicity, as they likely apply to the whole forecast
                parsedResult[0].sources = sources;
            }
        }
        
        return res.status(200).json(parsedResult);
    } catch (error: any) {
        console.error("Error in /api/predictions:", error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}
