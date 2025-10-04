import { GoogleGenAI } from '@google/genai';
import * as Prompts from './prompts';
import {
  AnalysisResult,
  BotLanguage,
  IndicatorLanguage,
  GroundingSource,
  MarketSentimentResult,
  TradeEntry,
  JournalFeedback,
  ChatMessage,
  ChatMessagePart,
  PredictedEvent,
} from '../types';
import { Type } from '@google/genai';

// --- Type Guards ---

const isAnalysisResult = (data: any): data is AnalysisResult => {
    return (
        data &&
        typeof data.asset === 'string' &&
        typeof data.timeframe === 'string' &&
        ['BUY', 'SELL', 'NEUTRAL'].includes(data.signal) &&
        typeof data.confidence === 'number' &&
        typeof data.entry === 'string' &&
        typeof data.stopLoss === 'string' &&
        Array.isArray(data.takeProfits) &&
        data.takeProfits.every((tp: any) => typeof tp === 'string') &&
        typeof data.reasoning === 'string' &&
        Array.isArray(data.tenReasons) &&
        data.tenReasons.every((r: any) => typeof r === 'string')
    );
};

const isMarketSentimentResult = (data: any): data is MarketSentimentResult => {
    return (
        data &&
        typeof data.asset === 'string' &&
        ['Bullish', 'Bearish', 'Neutral'].includes(data.sentiment) &&
        typeof data.confidence === 'number' &&
        typeof data.summary === 'string' &&
        Array.isArray(data.keyPoints) &&
        data.keyPoints.every((p: any) => typeof p === 'string')
    );
};

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

const isPredictedEvent = (data: any): data is PredictedEvent => {
    return (
        data &&
        typeof data.event_description === 'string' &&
        typeof data.asset === 'string' &&
        ['High', 'Medium', 'Low'].includes(data.predicted_impact) &&
        typeof data.probability === 'number' &&
        typeof data.potential_effect === 'string'
    );
};

const isPredictedEventArray = (data: any): data is PredictedEvent[] => {
    return Array.isArray(data) && data.every(isPredictedEvent);
};


// --- Utility Functions ---

const robustJsonParse = (jsonString: string) => {
    let cleanJsonString = jsonString.trim();
    const markdownMatch = cleanJsonString.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[2]) {
        cleanJsonString = markdownMatch[2];
    } else {
        const firstBracket = cleanJsonString.indexOf('{');
        const firstSquare = cleanJsonString.indexOf('[');
        let start = -1;
        if (firstBracket === -1) start = firstSquare;
        else if (firstSquare === -1) start = firstBracket;
        else start = Math.min(firstBracket, firstSquare);

        if (start !== -1) {
            const lastBracket = cleanJsonString.lastIndexOf('}');
            const lastSquare = cleanJsonString.lastIndexOf(']');
            const end = Math.max(lastBracket, lastSquare);
            if (end > start) {
                cleanJsonString = cleanJsonString.substring(start, end + 1);
            }
        }
    }
    try {
        return JSON.parse(cleanJsonString);
    } catch (e) {
        console.error("Failed to parse JSON from AI response.", { original: jsonString, cleaned: cleanJsonString });
        throw new Error("The AI's response was unclear or in an unexpected format. Please try again.");
    }
};

const fileToImagePart = async (file: File): Promise<ChatMessagePart> => {
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });

    return {
        inlineData: {
            mimeType: file.type,
            data: base64Data,
        },
    };
};

/**
 * A universal function to generate content from the Gemini API.
 * It automatically detects if the app is running in AI Studio and uses the
 * provided `window.service` or falls back to the `@google/genai` SDK for
 * standalone operation.
 */
const generateContent = async (params: any): Promise<any> => {
  // AI Studio environment provides a global `service` object.
  if (window.service?.gemini?.generateContent) {
    try {
      return await window.service.gemini.generateContent(params);
    } catch (e) {
      console.error("AI Studio API call failed:", e);
      throw new Error(`AI Studio service error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Fallback to @google/genai for standalone environments (website/PWA).
  // The API_KEY is expected to be available as an environment variable.
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable is not set for standalone mode.");
    throw new Error("This application is not configured for standalone use. API_KEY is missing.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // The parameters for the SDK are identical to the AI Studio service.
    return await ai.models.generateContent(params);
  } catch (e) {
    console.error("Google GenAI SDK call failed:", e);
    // Provide a more user-friendly error message.
    throw new Error(`The AI service is currently unavailable. Please check your connection or API key. Details: ${e instanceof Error ? e.message : String(e)}`);
  }
};


// --- Unified API Functions ---

export const analyzeChart = async (
  chartFiles: { [key: string]: File | null },
  riskReward: string,
  tradingStyle: string
): Promise<AnalysisResult> => {
    const prompt = Prompts.getAnalysisPrompt(tradingStyle, riskReward);
    const parts: any[] = [{ text: prompt }];
    for (const key of ['higher', 'primary', 'entry']) {
        if (chartFiles[key]) {
            parts.push({ text: `${key.charAt(0).toUpperCase() + key.slice(1)} Timeframe Chart:` });
            parts.push(await fileToImagePart(chartFiles[key]!));
        }
    }
    
    const response = await generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: { tools: [{ googleSearch: {} }] }
    });

    const parsedResult = robustJsonParse(response.text);
    if (!isAnalysisResult(parsedResult)) {
        console.error("AI response for chart analysis failed schema validation.", { response: parsedResult });
        throw new Error("The AI's analysis was incomplete or malformed. Please try again.");
    }

    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
            .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
            .filter((s: GroundingSource) => s.uri);
    }
    return parsedResult;
};

export const createBot = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
    const prompt = Prompts.getBotPrompt(description, language);
    const response = await generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    const prompt = Prompts.getIndicatorPrompt(description, language);
    const response = await generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const sendMessage = async (history: ChatMessage[], newMessageParts: ChatMessagePart[]): Promise<ChatMessage> => {
    const contents = history.map((msg: ChatMessage) => ({ 
        role: msg.role, 
        parts: msg.parts.map(p => p.text ? { text: p.text } : p)
    }));
    contents.push({ role: 'user', parts: newMessageParts });

    const response = await generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: { systemInstruction: Prompts.getChatSystemInstruction(), tools: [{ googleSearch: {} }] },
    });

    const modelResponse: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        parts: [{ text: response.text }],
    };

    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        modelResponse.sources = response.candidates[0].groundingMetadata.groundingChunks
            .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
            .filter((s: GroundingSource) => s.uri);
    }
    return modelResponse;
};

export const getMarketNews = async (asset: string): Promise<MarketSentimentResult> => {
    const prompt = Prompts.getMarketSentimentPrompt(asset);
    const response = await generateContent({ 
        model: 'gemini-2.5-flash', 
        contents: prompt, 
        config: { tools: [{ googleSearch: {} }] } 
    });
    const parsedResult = robustJsonParse(response.text);
    if (!isMarketSentimentResult(parsedResult)) {
        console.error("AI response for market news failed schema validation.", { response: parsedResult });
        throw new Error("The AI's market sentiment analysis was incomplete or malformed. Please try again.");
    }
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
            .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
            .filter((s: GroundingSource) => s.uri);
    }
    return parsedResult;
};

export const getTradingJournalFeedback = async (trades: TradeEntry[]): Promise<JournalFeedback> => {
    const prompt = Prompts.getJournalFeedbackPrompt(trades);
    const response = await generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    const parsedResult = robustJsonParse(response.text);
    if (!isJournalFeedback(parsedResult)) {
        console.error("AI response for journal feedback failed schema validation.", { response: parsedResult });
        throw new Error("The AI's journal feedback was incomplete or malformed. Please try again.");
    }
    return parsedResult;
};

export const getPredictions = async (): Promise<PredictedEvent[]> => {
    const prompt = Prompts.getPredictorPrompt();
    const response = await generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    const parsedResult = robustJsonParse(response.text);
    if (!isPredictedEventArray(parsedResult)) {
        console.error("AI response for predictions failed schema validation.", { response: parsedResult });
        throw new Error("The AI's predictions were incomplete or malformed. Please try again.");
    }
    
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const sources = response.candidates[0].groundingMetadata.groundingChunks
            .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
            .filter((s: GroundingSource) => s.uri);
        if (sources.length > 0 && parsedResult.length > 0) {
             // Attach all sources to the first event for simplicity
            parsedResult[0].sources = sources;
        }
    }
    return parsedResult;
};

const agentTools = [{
    functionDeclarations: [
        { 
            name: "navigate", 
            description: "Navigates to a specific page in the application. Valid pages are: home, landing, dashboard, analysis, market-news, journal, coders, bot-maker, indicator-maker, pricing, predictor, apex-ai, login, signup.",
            parameters: {
                type: Type.OBJECT,
                properties: { page: { type: Type.STRING, description: "The page to navigate to." } },
                required: ['page'],
            },
        },
        { 
            name: "changeTheme", 
            description: "Switches the application's color theme.",
            parameters: {
                type: Type.OBJECT,
                properties: { theme: { type: Type.STRING, description: "The theme to switch to. Can be 'light' or 'dark'.", enum: ['light', 'dark'] } },
                required: ['theme'],
            },
        },
        { 
            name: "setEdgeLighting", 
            description: "Changes the color of the application's edge lighting effect.",
            parameters: {
                type: Type.OBJECT,
                properties: { color: { type: Type.STRING, description: "The color for the edge lighting. Valid colors are: default, green, red, orange, yellow, blue, purple, white.", enum: ['default', 'green', 'red', 'orange', 'yellow', 'blue', 'purple', 'white'] } },
                required: ['color'],
            },
        },
        { 
            name: "logout", 
            description: "Logs the current user out of the application.",
            parameters: { type: Type.OBJECT, properties: {} }
        }
    ]
}];

export const processCommandWithAgent = async (command: string): Promise<{ text: string; functionCalls: any[] | null; }> => {
    const response = await generateContent({
        model: 'gemini-2.5-flash',
        contents: command,
        config: { tools: agentTools }
    });
    return {
        text: response.text,
        functionCalls: response.functionCalls || null,
    };
};

export const getAutoFixSuggestion = async (errors: { message: string, stack?: string }[]): Promise<string> => {
    const errorLog = errors.map(e => `Message: ${e.message}\nStack: ${e.stack || 'Not available'}`).join('\n\n');
    const prompt = Prompts.getAutoFixPrompt(errorLog);
    const response = await generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text;
};