import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource } from '../types';

// FIX: Replaced stub function with a proper `GoogleGenAI` client initialization.
const getAi = () => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};
const getResponseText = (response: GenerateContentResponse): string => response.text ?? '';
// FIX: Replaced stub function with a robust JSON parsing implementation.
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
        throw new Error("The API returned a response in an unexpected format. Please try again.");
    }
};

const getPredictorPrompt = () => `You are 'Oracle', an apex-level trading AI...`; // Full prompt omitted for brevity

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

        const parsedResult = robustJsonParse(getResponseText(response));
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && Array.isArray(chunks) && Array.isArray(parsedResult)) {
            const sources = chunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
            parsedResult.forEach((event: any) => event.sources = sources);
        }
        
        res.status(200).json(parsedResult);
    } catch (error) {
        console.error('Error in /api/predictions:', error);
        res.status(500).json({ message: error instanceof Error ? error.message : 'An unknown error occurred.' });
    }
}