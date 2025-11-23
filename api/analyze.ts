
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getAnalysisPrompt } from '../services/prompts';
import { AnalysisResult, GroundingSource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const isAnalysisResult = (data: any): data is AnalysisResult => {
    return (
        data &&
        typeof data.asset === 'string' &&
        typeof data.timeframe === 'string' &&
        ['BUY', 'SELL', 'NEUTRAL'].includes(data.signal) &&
        typeof data.confidence === 'number' &&
        Array.isArray(data.entryPriceRange) &&
        data.entryPriceRange.every((e: any) => typeof e === 'string') &&
        typeof data.stopLoss === 'string' &&
        Array.isArray(data.takeProfits) &&
        data.takeProfits.every((tp: any) => typeof tp === 'string') &&
        typeof data.reasoning === 'string' &&
        Array.isArray(data.tenReasons) &&
        data.tenReasons.every((r: any) => typeof r === 'string') &&
        (data.confluenceScore === undefined || typeof data.confluenceScore === 'number')
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
        console.error("Failed to parse JSON from AI response on backend.", { original: jsonString, cleaned: cleanJsonString });
        throw new Error("The AI's response was unclear or in an unexpected format.");
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { imageParts, riskReward, tradingStyle } = req.body;
        
        const prompt = getAnalysisPrompt(tradingStyle, riskReward);
        const parts: any[] = [{ text: prompt }];
        for (const key of ['higher', 'primary', 'entry']) {
            if (imageParts[key]) {
                parts.push({ text: `${key.charAt(0).toUpperCase() + key.slice(1)} Timeframe Chart:` });
                parts.push(imageParts[key]);
            }
        }
    
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: { parts },
            config: {
                temperature: 0, // Set to 0 for maximum determinism in chart analysis
                tools: [{ googleSearch: {} }]
            }
        });

        const parsedResult = robustJsonParse(response.text);
        if (!isAnalysisResult(parsedResult)) {
            console.error("AI response for chart analysis failed schema validation on backend.", { response: parsedResult });
            throw new Error("The AI's analysis was incomplete or malformed.");
        }

        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
        }
    
        return res.status(200).json(parsedResult);
    } catch (error: any) {
        console.error("Error in /api/analyze:", error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}
