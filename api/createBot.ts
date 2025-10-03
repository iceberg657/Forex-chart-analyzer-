import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAi = () => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getResponseText = (response: GenerateContentResponse): string => response.text ?? '';

const getBotPrompt = (description: string, language: string) => `You are an expert MQL developer...`; // Full prompt omitted for brevity

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    try {
        const { description, language } = req.body;
        const ai = getAi();
        const prompt = getBotPrompt(description, language);

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const code = getResponseText(response);

        if (!code) throw new Error("API response did not include the generated code.");

        res.status(200).json({ code });
    } catch (error) {
        console.error('Error in /api/createBot:', error);
        res.status(500).json({ message: error instanceof Error ? error.message : 'An unknown error occurred.' });
    }
}