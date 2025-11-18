
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getBotPrompt } from '../services/prompts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { description, language } = req.body;
        if (!description || !language) {
            return res.status(400).json({ message: 'Missing description or language.' });
        }
        
        const prompt = getBotPrompt(description, language);
        const response = await ai.models.generateContent({ model: 'gemini-flash-latest', contents: prompt });
        
        return res.status(200).json({ code: response.text });
    } catch (error: any) {
        console.error("Error in /api/createBot:", error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}