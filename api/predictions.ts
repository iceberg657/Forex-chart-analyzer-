

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource, PredictedEvent } from '../types';

const getAi = () => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};
const getResponseText = (response: GenerateContentResponse): string => response.text ?? '';

const isPredictedEvent = (data: any): data is PredictedEvent => {
    return (
        data &&
        typeof data.asset === 'string' &&
        ['BUY', 'SELL', 'HOLD'].includes(data.action) &&
        typeof data.price === 'number' &&
        typeof data.timestamp === 'string' &&
        typeof data.confidence === 'number' &&
        (typeof data.target_price === 'number' || data.target_price === null) &&
        (typeof data.stop_loss === 'number' || data.stop_loss === null) &&
        typeof data.strategy_id === 'string'
    );
};

const isPredictedEventArray = (data: any): data is PredictedEvent[] => {
    return Array.isArray(data) && data.every(isPredictedEvent);
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

const getPredictorPrompt = () => `You are 'Oracle', an apex-level trading AI. Your response MUST be a single, valid JSON array of objects. Do not include any other text, markdown, or explanations. The response must start with [ and end with ] and contain nothing else. ...`; // Full prompt omitted for brevity

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') { // Changed to POST for consistency
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const ai = getAi();
        const prompt = getPredictorPrompt();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
        });

        const rawText = getResponseText(response);
        const parsedResult = robustJsonParse(rawText);

        if (!isPredictedEventArray(parsedResult)) {
            console.error("AI response for predictions failed schema validation.", { response: parsedResult, rawText });
            throw new Error("The AI's predictions were incomplete or malformed. Please try again.");
        }
        
        res.status(200).json(parsedResult);
    } catch (error) {
        console.error('Error in /api/predictions:', error);
        res.status(500).json({ message: error instanceof Error ? error.message : 'An unknown error occurred.' });
    }
}
