import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ message: 'Missing or invalid text.' });
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A standard, clear voice
                    },
                },
            },
        });

        const audioContent = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!audioContent) {
            throw new Error("Failed to generate audio content from the API.");
        }
        
        return res.status(200).json({ audioContent });
    } catch (error: any) {
        console.error("Error in /api/generateSpeech:", error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}
