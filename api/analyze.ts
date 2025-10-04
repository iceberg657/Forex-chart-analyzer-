
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Part, GenerateContentResponse } from "@google/genai";
import { GroundingSource, AnalysisResult } from '../types';

const getAi = () => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getResponseText = (response: GenerateContentResponse): string => response.text ?? '';

const isAnalysisResult = (data: any): data is AnalysisResult => {
    return (
        data &&
        typeof data.asset === 'string' &&
        typeof data.timeframe === 'string' &&
        ['BUY', 'SELL', 'NEUTRAL'].includes(data.signal) &&
        typeof data.confidence === 'number' &&
        typeof data.entry === 'string' &&
        typeof data.stopLoss === 'string' &&
        Array.isArray(data.takeProfits) &&
        data.takeProfits.every((tp: any) => typeof tp === 'string') &&
        typeof data.reasoning === 'string' &&
        Array.isArray(data.tenReasons) &&
        data.tenReasons.every((r: any) => typeof r === 'string')
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

const getAnalysisPrompt = (tradingStyle: string, riskReward: string) => `You are 'Oracle', an apex-level AI quantitative analyst. Your task is to implement a unified reasoning architecture to produce high-probability trade setups. You are consistent, logical, and your analysis is institutional-grade. Your entire response MUST be a single, valid JSON object that adheres to the provided schema. ...`; // Full prompt omitted for brevity

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { imagePayloads, riskReward, tradingStyle } = req.body;
        const ai = getAi();

        const parts: Part[] = [{ text: getAnalysisPrompt(tradingStyle, riskReward) }];
        for (const key of ['higher', 'primary', 'entry']) {
            if (imagePayloads[key]) {
                parts.push({ text: `${key.charAt(0).toUpperCase() + key.slice(1)} Timeframe Chart:` });
                parts.push({ inlineData: imagePayloads[key] });
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: { tools: [{ googleSearch: {} }] }
        });

        const rawText = getResponseText(response);
        const parsedResult = robustJsonParse(rawText);

        if (!isAnalysisResult(parsedResult)) {
            console.error("AI response for chart analysis failed schema validation.", { response: parsedResult, rawText });
            throw new Error("The AI's analysis was incomplete or malformed. Please try again.");
        }

        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
        }

        res.status(200).json(parsedResult);
    } catch (error) {
        console.error('Error in /api/analyze:', error);
        res.status(500).json({ message: error instanceof Error ? error.message : 'An unknown error occurred.' });
    }
}
