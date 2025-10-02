
import { GoogleGenAI } from "@google/genai";
import { PredictedEvent, GroundingSource } from '../types';

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
        console.error("Failed to parse JSON from AI response:", cleanJsonString);
        throw new Error("Failed to process the request. The AI returned an invalid format.");
    }
};

const getPredictorPrompt = () => `You are 'Oracle', an apex-level trading AI with a specialization in predicting the market impact of economic news events.

**PRIMARY DIRECTIVE:**
1.  **Scan Economic Calendars:** Use your web search tool to scan financial calendars on sites like myfxbook.com, forexfactory.com, and investing.com.
2.  **Identify Catalysts:** Identify the top 3-5 HIGHEST impact economic news events scheduled for the next 7 days. Ignore low and medium-impact events.
3.  **Declare Initial Bias:** For each event, analyze the consensus forecasts versus previous data and current market conditions. You must DECLARE (not "predict" or "suggest") the most probable direction of the *initial* price spike upon news release (BUY or SELL for the base currency, e.g., for EUR/USD, a BUY means EUR strength).
4.  **Generate JSON Output:** Your entire response MUST be a single, valid JSON array of objects.

**STRICT JSON OUTPUT SCHEMA:**
[{
  "eventName": "string",
  "time": "string (in 'YYYY-MM-DD HH:MM UTC' format)",
  "currency": "string (e.g., 'USD', 'EUR')",
  "directionalBias": "'BUY' or 'SELL'",
  "confidence": "number (0-100)",
  "rationale": "string (A concise, 1-2 sentence explanation for your directional bias)",
  "sources": "This will be populated by the system."
}]`;

export const getPredictions = async (): Promise<PredictedEvent[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = getPredictorPrompt();
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{googleSearch: {}}] } });
    const parsedResult = robustJsonParse(response.text) as PredictedEvent[];
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && Array.isArray(chunks)) {
         const sources = chunks.map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' })).filter((s: any) => s.uri);
         // Since we can't easily map sources to events, attach all sources to each event
         parsedResult.forEach(event => event.sources = sources);
    }
   
    return parsedResult;
};