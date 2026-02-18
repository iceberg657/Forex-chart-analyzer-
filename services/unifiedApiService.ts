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
  DashboardOverview,
  UserSettings,
} from '../types';
import { GoogleGenAI, Type } from '@google/genai';
import { detectEnvironment } from '../hooks/useEnvironment';

const environment = detectEnvironment();

// --- Helper to get a fresh GenAI client on every call ---
const getGenAIClient = () => {
    if (environment !== 'aistudio') {
        throw new Error("Direct GenAI client calls are only available in the AI Studio environment.");
    }
    // CRITICAL: Create a new instance for each call to ensure the latest API key is used.
    return new GoogleGenAI({ apiKey: process.env.API_KEY! });
};

// --- Helper Functions for Backend Communication ---

const withRetry = async <T>(
    apiCall: () => Promise<T>, 
    options: { 
        maxRetries?: number; 
        onRetryAttempt?: (attempt: number, maxRetries: number) => void;
    } = {}
): Promise<T> => {
    const { maxRetries = 5, onRetryAttempt } = options;
    const initialDelay = 2000;

    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await apiCall();
        } catch (error: any) {
            attempt++;
            const errorMessage = (error.message || '').toLowerCase();
            
            if (errorMessage.includes('permission denied') || errorMessage.includes('requested entity was not found')) {
                 if (environment === 'aistudio') {
                    console.warn("Permission denied error detected. Dispatching event to reset API key selection.");
                    window.dispatchEvent(new CustomEvent('resetApiKeySelection'));
                 }
                 throw new Error("API Key Permission Denied. Please re-select a valid API key from a project with billing enabled and try again.");
            }
            
            const isQuotaExceeded = errorMessage.includes('429') || 
                                   errorMessage.includes('quota') || 
                                   errorMessage.includes('rate limit');
                                   
            const isOverloaded = errorMessage.includes('503') || 
                                 errorMessage.includes('504') ||
                                 errorMessage.includes('overloaded') || 
                                 errorMessage.includes('unavailable');
            
            if ((isQuotaExceeded || isOverloaded) && attempt < maxRetries) {
                if (onRetryAttempt) {
                    onRetryAttempt(attempt, maxRetries);
                }
                const multiplier = isQuotaExceeded ? 5 : 2;
                const jitter = Math.random() * 1000;
                const delay = initialDelay * Math.pow(multiplier, attempt - 1) + jitter;
                console.warn(`API Quota/Load issue. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else if (isQuotaExceeded) {
                throw new Error("Gemini API quota exceeded. Please wait 60 seconds before trying again to allow the rate limit to reset.");
            } else if (isOverloaded) {
                throw new Error("The AI service is experiencing high traffic. We tried several times without success. Please wait a moment and try again.");
            } else {
                throw error;
            }
        }
    }
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

// --- Validation Utilities ---
const getValidatedTextFromResponse = (response: any): string => {
    const responseText = response.text;
    if (responseText && typeof responseText === 'string') return responseText;
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        if (finishReason === 'SAFETY') throw new Error(`Request blocked for safety reasons.`);
        throw new Error(`The AI's response was terminated. Reason: ${finishReason}.`);
    }
    throw new Error("The AI returned an empty response.");
};

const extractSources = (response: any): GroundingSource[] => {
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        return response.candidates[0].groundingMetadata.groundingChunks
            .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
            .filter((s: GroundingSource) => s.uri);
    }
    return [];
};

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
            if (end > start) cleanJsonString = cleanJsonString.substring(start, end + 1);
        }
    }
    try {
        return JSON.parse(cleanJsonString);
    } catch (e) {
        throw new Error("The AI's response was malformed.");
    }
};

const isAnalysisResult = (data: any): data is AnalysisResult => {
    return (data && typeof data.asset === 'string' && typeof data.timeframe === 'string' && ['BUY', 'SELL', 'NEUTRAL'].includes(data.signal));
};

const clientFileToImagePart = async (file: File): Promise<ChatMessagePart> => {
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
    return { inlineData: { mimeType: file.type, data: base64Data } };
};

const generateContentDirect = async (params: any): Promise<any> => {
  const ai = getGenAIClient();
  return ai.models.generateContent(params);
};

export const analyzeChart = async (
    chartFiles: { [key: string]: File | null }, 
    riskReward: string, 
    tradingStyle: string, 
    isSeasonal: boolean,
    onRetryAttempt?: (attempt: number, maxRetries: number) => void
): Promise<AnalysisResult> => {
    const savedSettings = localStorage.getItem('userSettings');
    const userSettings: UserSettings | undefined = savedSettings ? JSON.parse(savedSettings) : undefined;
    
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getAnalysisPrompt(tradingStyle, riskReward, isSeasonal, userSettings);
            const parts: any[] = [{ text: prompt }];
            for (const key of ['higher', 'primary', 'entry']) {
                if (chartFiles[key]) {
                    parts.push({ text: `${key.charAt(0).toUpperCase() + key.slice(1)} Timeframe Chart:` });
                    parts.push(await clientFileToImagePart(chartFiles[key]!));
                }
            }
            const response = await generateContentDirect({
                model: 'gemini-2.5-flash-lite',
                contents: { parts },
                config: { 
                    temperature: 0,
                    tools: [{ googleSearch: {} }] 
                }
            });
            const responseText = getValidatedTextFromResponse(response);
            const parsedResult = robustJsonParse(responseText);
            if (!isAnalysisResult(parsedResult)) throw new Error("Analysis incomplete.");
            parsedResult.sources = extractSources(response);
            return parsedResult;
        } else {
            const imageParts: { [key: string]: ChatMessagePart } = {};
            for (const key of ['higher', 'primary', 'entry']) {
                if (chartFiles[key]) imageParts[key] = await clientFileToImagePart(chartFiles[key]!);
            }
            return postToApi<AnalysisResult>('/api/analyze', { imageParts, riskReward, tradingStyle, isSeasonal, userSettings });
        }
    };
    return withRetry(apiCall, { onRetryAttempt });
};

export const createBot = async (
    { description, language }: { description: string; language: BotLanguage; },
    onRetryAttempt?: (attempt: number, maxRetries: number) => void
): Promise<string> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getBotPrompt(description, language);
            const response = await generateContentDirect({ model: 'gemini-2.5-flash-lite', contents: prompt });
            return getValidatedTextFromResponse(response);
        } else {
            const result = await postToApi<{ code: string }>('/api/agent', { action: 'createBot', payload: { description, language } });
            return result.code;
        }
    };
    return withRetry(apiCall, { onRetryAttempt });
};

export const createIndicator = async (
    { description, language }: { description: string; language: IndicatorLanguage; },
    onRetryAttempt?: (attempt: number, maxRetries: number) => void
): Promise<string> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getIndicatorPrompt(description, language);
            const response = await generateContentDirect({ model: 'gemini-2.5-flash-lite', contents: prompt });
            return getValidatedTextFromResponse(response);
        } else {
            const result = await postToApi<{ code: string }>('/api/agent', { action: 'createIndicator', payload: { description, language } });
            return result.code;
        }
    };
    return withRetry(apiCall, { onRetryAttempt });
};

export async function* sendMessageStream(history: ChatMessage[], newMessageParts: ChatMessagePart[]): AsyncGenerator<{ textChunk?: string; sources?: GroundingSource[] }> {
    if (environment === 'aistudio') {
        const ai = getGenAIClient();
        const contents = history.map((msg: ChatMessage) => ({ 
            role: msg.role, 
            parts: msg.parts.map(p => p.text ? { text: p.text } : p)
        }));
        contents.push({ role: 'user', parts: newMessageParts });

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash-lite',
            contents: contents,
            config: { 
                systemInstruction: Prompts.getChatSystemInstruction(),
                tools: [{ googleSearch: {} }] 
            },
        });

        for await (const chunk of responseStream) {
            const result: { textChunk?: string; sources?: GroundingSource[] } = {};
            if (chunk.text) result.textChunk = chunk.text;
            const sources = extractSources(chunk);
            if (sources.length > 0) result.sources = sources;
            yield result;
        }
    } else {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history, newMessageParts }),
        });
        if (!res.body) {
            throw new Error("Streaming response body is null.");
        }
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(`API Error (${res.status}): ${error.message || 'Streaming request failed.'}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const jsonChunks = buffer.split('\n');
            buffer = jsonChunks.pop() || '';
            for (const jsonChunk of jsonChunks) if (jsonChunk) yield JSON.parse(jsonChunk);
        }
    }
}

export const sendMessage = async (history: ChatMessage[], newMessageParts: ChatMessagePart[]): Promise<ChatMessage> => {
     let fullText = '';
     let finalSources: GroundingSource[] = [];
     for await (const chunk of sendMessageStream(history, newMessageParts)) {
        if(chunk.textChunk) fullText += chunk.textChunk;
        if(chunk.sources) finalSources = chunk.sources;
     }
     return { id: Date.now().toString(), role: 'model', parts: [{ text: fullText }], sources: finalSources };
};

export const getMarketNews = async (asset: string, onRetryAttempt?: (attempt: number, maxRetries: number) => void): Promise<MarketSentimentResult> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getMarketSentimentPrompt(asset);
            const response = await generateContentDirect({ 
                model: 'gemini-2.5-flash-lite', 
                contents: prompt,
                config: { tools: [{ googleSearch: {} }] }
            });
            const parsed = robustJsonParse(getValidatedTextFromResponse(response));
            parsed.sources = extractSources(response);
            return parsed;
        } else return postToApi<MarketSentimentResult>('/api/agent', { action: 'marketNews', payload: { asset } });
    };
    return withRetry(apiCall, { onRetryAttempt });
};

export const getTradingJournalFeedback = async (trades: TradeEntry[], onRetryAttempt?: (attempt: number, maxRetries: number) => void): Promise<JournalFeedback> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getJournalFeedbackPrompt(trades);
            const response = await generateContentDirect({ model: 'gemini-2.5-flash-lite', contents: prompt, config: { responseMimeType: 'application/json' } });
            return robustJsonParse(getValidatedTextFromResponse(response));
        } else return postToApi<JournalFeedback>('/api/agent', { action: 'journalFeedback', payload: { trades } });
    };
    return withRetry(apiCall, { onRetryAttempt });
};

export const processCommandWithAgent = async (command: string): Promise<{ text: string, functionCalls: any[] | null }> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const agentTools = [{ functionDeclarations: [{ name: "navigate", parameters: { type: Type.OBJECT, properties: { page: { type: Type.STRING } }, required: ['page'] } }] }];
            const response = await generateContentDirect({ model: 'gemini-2.5-flash-lite', contents: command, config: { tools: agentTools } });
            return { text: response.text || '', functionCalls: response.functionCalls || null };
        } else return postToApi<{ text: string, functionCalls: any[] | null }>('/api/agent', { action: 'agent', payload: { command } });
    };
    return withRetry(apiCall);
};

export const getPredictions = async (onRetryAttempt?: (attempt: number, maxRetries: number) => void): Promise<PredictedEvent[]> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const response = await generateContentDirect({ 
                model: 'gemini-2.5-flash-lite', 
                contents: Prompts.getPredictorPrompt(),
                config: { tools: [{ googleSearch: {} }] }
            });
            const parsed = robustJsonParse(getValidatedTextFromResponse(response)) as PredictedEvent[];
            const sources = extractSources(response);
            return parsed.map(p => ({ ...p, sources }));
        } else return postToApi<PredictedEvent[]>('/api/agent', { action: 'predictions', payload: {} });
    };
    return withRetry(apiCall, { onRetryAttempt });
};

export const getDashboardOverview = async (isSeasonal: boolean, onRetryAttempt?: (attempt: number, maxRetries: number) => void): Promise<DashboardOverview> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const response = await generateContentDirect({ 
                model: 'gemini-2.5-flash-lite', 
                contents: Prompts.getDashboardOverviewPrompt(isSeasonal),
                config: { tools: [{ googleSearch: {} }] }
            });
            const parsed = robustJsonParse(getValidatedTextFromResponse(response));
            parsed.lastUpdated = Date.now();
            parsed.sources = extractSources(response);
            return parsed;
        } else return postToApi<DashboardOverview>('/api/agent', { action: 'dashboardOverview', payload: { isSeasonal } });
    };
    return withRetry(apiCall, { onRetryAttempt });
};

export const getAutoFixSuggestion = async (errors: any[]): Promise<string> => {
    if (environment !== 'aistudio') return "AI Studio only.";
    const response = await generateContentDirect({ model: 'gemini-2.5-flash-lite', contents: Prompts.getAutoFixPrompt(JSON.stringify(errors)) });
    return getValidatedTextFromResponse(response);
};
