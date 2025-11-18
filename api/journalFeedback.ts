
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getJournalFeedbackPrompt } from '../services/prompts';
import { JournalFeedback, TradeEntry } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const isJournalFeedback = (data: any): data is JournalFeedback => {
    return (
        data &&
        typeof data.overallPnl === 'number' &&
        typeof data.winRate === 'number' &&
        Array.isArray(data.strengths) && data.strengths.every((s: any) => typeof s === 'string') &&
        Array.isArray(data.weaknesses) && data.weaknesses.every((w: any) => typeof w === 'string') &&
        Array.isArray(data.suggestions) && data.suggestions.every((s: any) => typeof s === 'string')
    );
};

const robustJsonParse = (jsonString: string) => {
    if (typeof jsonString !== 'string' || !jsonString) {
        throw new Error("The AI's response was unclear or in an unexpected format.");
    }
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        throw new Error("The AI's response was unclear or in an unexpected format.");
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { trades } = req.body;
        if (!Array.isArray(trades)) {
            return res.status(400).json({ message: 'Invalid trades data.' });
        }
        
        const prompt = getJournalFeedbackPrompt(trades as TradeEntry[]);
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const parsedResult = robustJsonParse(response.text);
        if (!isJournalFeedback(parsedResult)) {
            throw new Error("The AI's journal feedback was incomplete or malformed.");
        }
        
        return res.status(200).json(parsedResult);
    } catch (error: any) {
        console.error("Error in /api/journalFeedback:", error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}