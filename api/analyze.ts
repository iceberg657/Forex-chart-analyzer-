import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ANALYSIS_KEYS } from './_env.js';
import { makeResilientCall } from './_resilience.js';
import { getAnalysisPrompt } from './_prompts.js';
import { AnalysisResult } from '../types';

const getValidatedTextFromResponse = (response: any): string => {
    const responseText = response.text;
    if (responseText && typeof responseText === 'string') return responseText;
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        if (finishReason === 'SAFETY') throw new Error(`Safety block.`);
        throw new Error(`AI terminated. Reason: ${finishReason}.`);
    }
    throw new Error("Empty response.");
};

const robustJsonParse = (jsonString: string) => {
    let cleanJsonString = jsonString.trim();
    const markdownMatch = cleanJsonString.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[2]) {
        cleanJsonString = markdownMatch[2];
    } else {
        const firstBracket = cleanJsonString.indexOf('{');
        const lastBracket = cleanJsonString.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket > firstBracket) cleanJsonString = cleanJsonString.substring(firstBracket, lastBracket + 1);
    }
    try {
        return JSON.parse(cleanJsonString);
    } catch (e) {
        throw new Error("Malformed JSON.");
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    if (ANALYSIS_KEYS.length === 0) {
        return res.status(503).json({ message: 'Service Unavailable: Chart Analysis API keys are not configured.' });
    }

    try {
        const { imageParts, riskReward, tradingStyle, isSeasonal, userSettings } = req.body;
        const prompt = getAnalysisPrompt(tradingStyle, riskReward, isSeasonal, userSettings);
        const parts: any[] = [{ text: prompt }];
        for (const key of ['higher', 'primary', 'entry']) {
            if (imageParts[key]) {
                parts.push({ text: `${key.charAt(0).toUpperCase() + key.slice(1)} Timeframe Chart:` });
                parts.push(imageParts[key]);
            }
        }
        
        const requestPayload = {
            contents: { parts },
            config: { 
                temperature: 0,
                tools: [{ googleSearch: {} }] 
            }
        };

        const response = await makeResilientCall(ANALYSIS_KEYS, requestPayload, false);
        const responseText = getValidatedTextFromResponse(response);
        const parsedResult = robustJsonParse(responseText);
        return res.status(200).json(parsedResult);

    } catch (error: any) {
        console.error("Error in /api/analyze:", error);
        return res.status(500).json({ message: error.message || 'Error processing analysis request.' });
    }
}
