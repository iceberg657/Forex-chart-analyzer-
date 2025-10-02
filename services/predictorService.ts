import { GoogleGenAI } from "@google/genai";
import { PredictedEvent, GroundingSource } from '../types';
import { apiClient } from './apiClient';
import { detectEnvironment } from '../hooks/useEnvironment';

const environment = detectEnvironment();
let ai: GoogleGenAI | null = null;
if (environment === 'aistudio') {
    if (process.env.API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
        console.error("API Key not found for AI Studio environment. Direct API calls will fail.");
    }
}

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

export const getPredictions = async (): Promise<PredictedEvent[]> => {
    if (environment === 'website' || environment === 'pwa') {
        return apiClient.post<PredictedEvent[]>('getPredictions', {});
    } else {
        if (!ai) throw new Error("Gemini AI not initialized for AI Studio. An API_KEY environment variable is required.");
        
        const prompt = getPredictorPrompt();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}]
            }
        });

        const parsedResult = robustJsonParse(response.text) as PredictedEvent[];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        if (chunks && Array.isArray(chunks)) {
            const sources = chunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
            // Attach all sources to each event as the model doesn't specify which source is for which event.
            parsedResult.forEach(event => event.sources = sources);
        }
        
        return parsedResult;
    }
};
