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
import { GoogleGenAI, Type } from '@google/genai';
import { detectEnvironment } from '../hooks/useEnvironment';

const environment = detectEnvironment();

// This client is used ONLY in the AI Studio environment.
const ai = environment === 'aistudio' ? new GoogleGenAI({ apiKey: process.env.API_KEY! }) : null;

// --- Helper Functions for Backend Communication ---

const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await apiCall();
        } catch (error: any) {
            attempt++;
            const errorMessage = (error.message || '').toLowerCase();
            const isOverloaded = errorMessage.includes('503') || 
                                 errorMessage.includes('overloaded') || 
                                 errorMessage.includes('unavailable') ||
                                 errorMessage.includes('rate limit');
            
            if (isOverloaded && attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt - 1);
                console.warn(`API is busy. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else if (isOverloaded) {
                // Last attempt failed with an overload error, throw user-friendly message
                throw new Error("The AI service is currently experiencing high demand. Please try again in a few moments.");
            } else {
                // Not an overload error, re-throw original error immediately
                throw error;
            }
        }
    }
    // Fallback for type safety, should not be reached.
    throw new Error('API call failed after multiple retries.');
};

async function postToApi<T>(endpoint: string, body: any): Promise<T> {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        const errorMessage = `API Error (${res.status}): ${error.message || 'An unknown error occurred.'}`;
        throw new Error(errorMessage);
    }
    return res.json() as Promise<T>;
}

// --- Type Guards ---
const isAnalysisResult = (data: any): data is AnalysisResult => {
    return (
        data &&
        typeof data.asset === 'string' &&
        typeof data.timeframe === 'string' &&
        ['BUY', 'SELL', 'NEUTRAL'].includes(data.signal) &&
        typeof data.confidence === 'number' &&
        Array.isArray(data.entryPriceRange) &&
        data.entryPriceRange.every((e: any) => typeof e === 'string') &&
        typeof data.stopLoss === 'string' &&
        Array.isArray(data.takeProfits) &&
        data.takeProfits.every((tp: any) => typeof tp === 'string') &&
        typeof data.reasoning === 'string' &&
        Array.isArray(data.tenReasons) &&
        data.tenReasons.every((r: any) => typeof r === 'string') &&
        (data.confluenceScore === undefined || typeof data.confluenceScore === 'number')
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
const isPredictedEventArray = (data: any): data is PredictedEvent[] => {
    return Array.isArray(data) && data.every(isPredictedEvent);
};
const isPredictedEvent = (data: any): data is PredictedEvent => {
    return (
        data &&
        typeof data.event_description === 'string' &&
        typeof data.day === 'string' &&
        typeof data.date === 'string' &&
        typeof data.time === 'string' &&
        ['BUY', 'SELL'].includes(data.direction) &&
        Array.isArray(data.currencyPairs) && data.currencyPairs.every((p: any) => typeof p === 'string') &&
        typeof data.confidence === 'number' && data.confidence >= 75 && data.confidence <= 90 &&
        typeof data.potential_effect === 'string'
    );
};


// --- Utility Functions ---
const robustJsonParse = (jsonString: string) => {
    if (typeof jsonString !== 'string' || !jsonString) {
        console.error("AI Response Error: Expected a non-empty string for JSON parsing but received", typeof jsonString, { value: jsonString });
        throw new Error("The AI returned an empty or invalid response. This can happen if a request is blocked for safety reasons.");
    }
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

const clientFileToImagePart = async (file: File): Promise<ChatMessagePart> => {
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

const generateContentDirect = async (params: any): Promise<any> => {
  if (!ai) throw new Error("GenAI client not initialized for direct call.");
  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (e) {
    console.error("Gemini API direct call failed:", e);
    throw new Error(`Gemini API error: ${e instanceof Error ? e.message : String(e)}`);
  }
};

// --- Unified API Functions ---

export const analyzeChart = async (
  chartFiles: { [key: string]: File | null },
  riskReward: string,
  tradingStyle: string
): Promise<AnalysisResult> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getAnalysisPrompt(tradingStyle, riskReward);
            const parts: any[] = [{ text: prompt }];
            for (const key of ['higher', 'primary', 'entry']) {
                if (chartFiles[key]) {
                    parts.push({ text: `${key.charAt(0).toUpperCase() + key.slice(1)} Timeframe Chart:` });
                    parts.push(await clientFileToImagePart(chartFiles[key]!));
                }
            }
            
            const response = await generateContentDirect({
                model: 'gemini-2.5-pro',
                contents: { parts },
                config: {
                    temperature: 0, // Set to 0 for maximum determinism in chart analysis
                    tools: [{ googleSearch: {} }]
                }
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
        } else {
            const imageParts: { [key: string]: ChatMessagePart } = {};
            for (const key of ['higher', 'primary', 'entry']) {
                if (chartFiles[key]) {
                    imageParts[key] = await clientFileToImagePart(chartFiles[key]!);
                }
            }
            return postToApi<AnalysisResult>('/api/analyze', { imageParts, riskReward, tradingStyle });
        }
    };
    return withRetry(apiCall);
};

export const createBot = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getBotPrompt(description, language);
            const response = await generateContentDirect({ model: 'gemini-2.5-flash', contents: prompt });
            return response.text;
        } else {
            const result = await postToApi<{ code: string }>('/api/createBot', { description, language });
            return result.code;
        }
    };
    return withRetry(apiCall);
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getIndicatorPrompt(description, language);
            const response = await generateContentDirect({ model: 'gemini-2.5-flash', contents: prompt });
            return response.text;
        } else {
            const result = await postToApi<{ code: string }>('/api/createIndicator', { description, language });
            return result.code;
        }
    };
    return withRetry(apiCall);
};

export async function* sendMessageStream(
    history: ChatMessage[],
    newMessageParts: ChatMessagePart[]
): AsyncGenerator<{ textChunk?: string; sources?: GroundingSource[] }> {
    // Note: Retries are not implemented for streaming APIs as it would require restarting the stream.
    // The component-level error handling is sufficient for now.
    if (environment === 'aistudio') {
        if (!ai) throw new Error("GenAI client not initialized for direct stream call.");
        const contents = history.map((msg: ChatMessage) => ({ 
            role: msg.role, 
            parts: msg.parts.map(p => p.text ? { text: p.text } : p)
        }));
        contents.push({ role: 'user', parts: newMessageParts });

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-flash-lite-latest',
            contents: contents,
            config: { systemInstruction: Prompts.getChatSystemInstruction(), tools: [{ googleSearch: {} }] },
        });

        let allSources: GroundingSource[] = [];

        for await (const chunk of responseStream) {
            if (chunk.text) {
                yield { textChunk: chunk.text };
            }
            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                const chunkSources: GroundingSource[] = chunk.candidates[0].groundingMetadata.groundingChunks
                    .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                    .filter((s: GroundingSource) => s.uri);
                
                const newSources = chunkSources.filter((cs: GroundingSource) => !allSources.some(as => as.uri === cs.uri));
                
                if (newSources.length > 0) {
                    allSources = [...allSources, ...newSources];
                    yield { sources: allSources };
                }
            }
        }
    } else {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history, newMessageParts }),
        });
        if (!res.ok || !res.body) {
            const error = await res.json().catch(() => ({ message: `API Error: ${res.statusText}` }));
            throw new Error(error.message || 'Streaming API error');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const jsonChunks = buffer.split('\n');
            buffer = jsonChunks.pop() || ''; // Keep the potentially incomplete last chunk
            for (const jsonChunk of jsonChunks) {
                if (jsonChunk) {
                    try {
                        yield JSON.parse(jsonChunk);
                    } catch (e) {
                        console.error("Failed to parse stream chunk", e, jsonChunk);
                    }
                }
            }
        }
    }
}

// Non-streaming chat for simplicity if ever needed
export const sendMessage = async (history: ChatMessage[], newMessageParts: ChatMessagePart[]): Promise<ChatMessage> => {
     let fullText = '';
     let finalSources: GroundingSource[] | undefined = undefined;
     for await (const chunk of sendMessageStream(history, newMessageParts)) {
        if(chunk.textChunk) fullText += chunk.textChunk;
        if(chunk.sources) finalSources = chunk.sources;
     }
     return {
        id: Date.now().toString(),
        role: 'model',
        parts: [{ text: fullText }],
        sources: finalSources
     }
};


export const getMarketNews = async (asset: string): Promise<MarketSentimentResult> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getMarketSentimentPrompt(asset);
            const response = await generateContentDirect({ 
                model: 'gemini-2.5-flash', 
                contents: prompt, 
                config: { tools: [{ googleSearch: {} }] } 
            });
            const parsedResult = robustJsonParse(response.text);
            if (!isMarketSentimentResult(parsedResult)) {
                throw new Error("The AI's market sentiment analysis was incomplete or malformed.");
            }
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
                    .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                    .filter((s: GroundingSource) => s.uri);
            }
            return parsedResult;
        } else {
            return postToApi<MarketSentimentResult>('/api/marketNews', { asset });
        }
    };
    return withRetry(apiCall);
};

export const getTradingJournalFeedback = async (trades: TradeEntry[]): Promise<JournalFeedback> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getJournalFeedbackPrompt(trades);
            const response = await generateContentDirect({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const parsedResult = robustJsonParse(response.text);
            if (!isJournalFeedback(parsedResult)) {
                throw new Error("The AI's journal feedback was incomplete or malformed.");
            }
            return parsedResult;
        } else {
            return postToApi<JournalFeedback>('/api/journalFeedback', { trades });
        }
    };
    return withRetry(apiCall);
};

export const processCommandWithAgent = async (command: string): Promise<{ text: string, functionCalls: any[] | null }> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            if (!ai) throw new Error("GenAI client not initialized for direct agent call.");
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
            const response = await generateContentDirect({
                model: 'gemini-2.5-flash',
                contents: command,
                config: { tools: agentTools }
            });

            const functionCalls = response.functionCalls || null;
            const text = functionCalls ? '' : response.text;
            return { text, functionCalls };
        } else {
            return postToApi<{ text: string, functionCalls: any[] | null }>('/api/agent', { command });
        }
    };
    return withRetry(apiCall);
};

export const getPredictions = async (): Promise<PredictedEvent[]> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getPredictorPrompt();
            const response = await generateContentDirect({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: { tools: [{ googleSearch: {} }] }
            });
            const parsedResult = robustJsonParse(response.text);
            if (!isPredictedEventArray(parsedResult)) {
                throw new Error("The AI's predictions were incomplete or malformed.");
            }
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                const sources = response.candidates[0].groundingMetadata.groundingChunks
                    .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                    .filter((s: GroundingSource) => s.uri);
                if (sources.length > 0 && parsedResult.length > 0) {
                    parsedResult[0].sources = sources;
                }
            }
            return parsedResult;
        } else {
            return postToApi<PredictedEvent[]>('/api/predictions', {});
        }
    };
    return withRetry(apiCall);
};

export const getAutoFixSuggestion = async (errors: any[]): Promise<string> => {
     // This is a dev-only tool for AI Studio, so no backend is needed.
    if (environment !== 'aistudio' || !ai) {
        return "Auto-fix is only available in the AI Studio environment.";
    }
    const errorLog = errors.map(e => `Type: ${e.type}\nMessage: ${e.message}\nStack: ${e.stack || 'N/A'}`).join('\n\n---\n\n');
    const prompt = Prompts.getAutoFixPrompt(errorLog);
    const response = await generateContentDirect({
        model: 'gemini-2.5-pro',
        contents: prompt
    });
    return response.text;
}