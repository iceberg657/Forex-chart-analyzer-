

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Self-contained types to avoid import issues
interface PredictedEvent {
    eventName: string;
    time: string;
    currency: string;
    directionalBias: 'BUY' | 'SELL';
    confidence: number;
    rationale: string;
    sources: GroundingSource[];
}

interface GroundingSource {
  uri: string;
  title: string;
}

const getResponseText = (response: GenerateContentResponse): string => {
    return response.text;
};

const robustJsonParse = (jsonString: string) => {
    let cleanJsonString = jsonString.trim();
    const match = cleanJsonString.match(/```(json)?\s*(\[[\s\S]*\])\s*```/);

    if (match && match[2]) {
        cleanJsonString = match[2];
    } else {
        const jsonStart = cleanJsonString.indexOf('[');
        const jsonEnd = cleanJsonString.lastIndexOf(']');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            cleanJsonString = cleanJsonString.substring(jsonStart, jsonEnd + 1);
        }
    }
    try {
        return JSON.parse(cleanJsonString);
    } catch (parseError) {
        console.error("Failed to parse JSON array from AI response:", cleanJsonString);
        throw new Error("Failed to process the request. The AI returned an invalid format.");
    }
};

const getPredictorPrompt = () => `You are 'Oracle', an apex-level trading AI with a specialization in predicting the market impact of economic news events. Scan financial calendars and identify the top 3-5 HIGHEST impact events for the next 7 days. You must DECLARE the initial price spike direction (BUY/SELL). You MUST return a single, valid JSON array of objects. Schema: [{ "eventName": "string", "time": "string (YYYY-MM-DD HH:MM UTC)", "currency": "string", "directionalBias": "'BUY'|'SELL'", "confidence": "number (0-100)", "rationale": "string", "sources": "populated by system" }]`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ success: false, message: 'API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const prompt = getPredictorPrompt();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}]
            }
        });

        const parsedResult = robustJsonParse(getResponseText(response)) as PredictedEvent[];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        if (chunks && Array.isArray(chunks)) {
            const sources = chunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
            // Attach all sources to each event
            parsedResult.forEach(event => event.sources = sources);
        }
        
        return res.status(200).json({ success: true, data: parsedResult });

    } catch (error: any) {
        console.error("Error in /api/predictions:", error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
}
