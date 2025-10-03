import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, ChatMessagePart, GroundingSource } from '../types';

const getAi = () => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getResponseText = (response: GenerateContentResponse): string => response.text ?? '';

const SYSTEM_INSTRUCTION = `You are the Oracle, a senior institutional quantitative analyst AI...`; // Full prompt omitted for brevity

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { history, newMessageParts } = req.body as { history: ChatMessage[], newMessageParts: ChatMessagePart[] };
        const ai = getAi();
        
        const contents = history.map((msg: ChatMessage) => ({ 
            role: msg.role, 
            parts: msg.parts.map(p => p.text ? { text: p.text } : p)
        }));
        contents.push({ role: 'user', parts: newMessageParts });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }] },
        });
        
        const modelResponse: ChatMessage = {
            id: Date.now().toString(),
            role: 'model',
            parts: [{ text: getResponseText(response) }],
        };

        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            modelResponse.sources = response.candidates[0].groundingMetadata.groundingChunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
        }

        res.status(200).json(modelResponse);
    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ message: error instanceof Error ? error.message : 'An unknown error occurred.' });
    }
}