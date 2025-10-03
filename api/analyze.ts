import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Part, GenerateContentResponse, GroundingSource } from "@google/genai";

const getAi = () => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getResponseText = (response: GenerateContentResponse): string => response.text;

const robustJsonParse = (jsonString: string) => {
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
        throw new Error("The AI returned a response in an unexpected format.");
    }
};

const getAnalysisPrompt = (tradingStyle: string, riskReward: string) => `You are 'Oracle', an apex-level AI quantitative analyst. Your task is to implement a unified reasoning architecture to produce high-probability trade setups. You are consistent, logical, and your analysis is institutional-grade. Your entire response MUST be a single, valid JSON object that adheres to the provided schema. ...`; // Full prompt omitted for brevity

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { imagePayloads, riskReward, tradingStyle } = req.body;
        const isSingleChart = !!imagePayloads.primary && !imagePayloads.higher && !imagePayloads.entry;
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

        const parsedResult = robustJsonParse(getResponseText(response));
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