






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
                throw new Error("The AI service is currently experiencing high demand. Please try again in a few moments.");
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

const isAnalysisResult = (data: any): data is AnalysisResult => {
    return (data && typeof data.asset === 'string' && typeof data.timeframe === 'string' && ['BUY', 'SELL', 'NEUTRAL'].includes(data.signal));
};
const isMarketSentimentResult = (data: any): data is MarketSentimentResult => {
    return (data && typeof data.asset === 'string' && ['Bullish', 'Bearish', 'Neutral'].includes(data.sentiment));
};
const isJournalFeedback = (data: any): data is JournalFeedback => {
    return (data && typeof data.overallPnl === 'number' && Array.isArray(data.suggestions));
};
const isPredictedEventArray = (data: any): data is PredictedEvent[] => {
    return Array.isArray(data) && data.length > 0 ? typeof data[0].event_description === 'string' : Array.isArray(data);
};
const isDashboardOverview = (data: any): data is DashboardOverview => {
    return (data && data.marketCondition && typeof data.marketCondition.dominantSession === 'string' && Array.isArray(data.dailyBiases) && data.economicData && data.tradingOpportunities && Array.isArray(data.next24hOutlook));
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
  if (!ai) throw new Error("GenAI client not initialized for direct call.");
  try {
    return await ai.models.generateContent(params);
  } catch (e) {
    console.error("Gemini API direct call failed:", e);
    throw new Error(`Gemini API error: ${e instanceof Error ? e.message : String(e)}`);
  }
};


// --- Unified API Functions ---

export const analyzeChart = async (chartFiles: { [key: string]: File | null }, riskReward: string, tradingStyle: string): Promise<AnalysisResult> => {
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
                model: 'gemini-flash-latest',
                contents: { parts },
                config: { temperature: 0, tools: [{ googleSearch: {} }] }
            });
            const parsedResult = robustJsonParse(response.text);
            if (!isAnalysisResult(parsedResult)) throw new Error("The AI's analysis was incomplete.");
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
                    .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                    .filter((s: GroundingSource) => s.uri);
            }
            return parsedResult;
        } else {
            const imageParts: { [key: string]: ChatMessagePart } = {};
            for (const key of ['higher', 'primary', 'entry']) {
                if (chartFiles[key]) imageParts[key] = await clientFileToImagePart(chartFiles[key]!);
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
            const response = await generateContentDirect({ model: 'gemini-flash-latest', contents: prompt });
            return response.text;
        } else {
            const result = await postToApi<{ code: string }>('/api/agent', { action: 'createBot', payload: { description, language } });
            return result.code;
        }
    };
    return withRetry(apiCall);
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getIndicatorPrompt(description, language);
            const response = await generateContentDirect({ model: 'gemini-flash-latest', contents: prompt });
            return response.text;
        } else {
            const result = await postToApi<{ code: string }>('/api/agent', { action: 'createIndicator', payload: { description, language } });
            return result.code;
        }
    };
    return withRetry(apiCall);
};

export async function* sendMessageStream(history: ChatMessage[], newMessageParts: ChatMessagePart[]): AsyncGenerator<{ textChunk?: string; sources?: GroundingSource[] }> {
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
            if (chunk.text) yield { textChunk: chunk.text };
            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                const chunkSources = chunk.candidates[0].groundingMetadata.groundingChunks
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
        if (!res.ok || !res.body) throw new Error('Streaming API error');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const jsonChunks = buffer.split('\n');
            buffer = jsonChunks.pop() || '';
            for (const jsonChunk of jsonChunks) {
                if (jsonChunk) try { yield JSON.parse(jsonChunk); } catch (e) {}
            }
        }
    }
}

export const sendMessage = async (history: ChatMessage[], newMessageParts: ChatMessagePart[]): Promise<ChatMessage> => {
     let fullText = '';
     let finalSources: GroundingSource[] | undefined = undefined;
     for await (const chunk of sendMessageStream(history, newMessageParts)) {
        if(chunk.textChunk) fullText += chunk.textChunk;
        if(chunk.sources) finalSources = chunk.sources;
     }
     return { id: Date.now().toString(), role: 'model', parts: [{ text: fullText }], sources: finalSources };
};

export const getMarketNews = async (asset: string): Promise<MarketSentimentResult> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getMarketSentimentPrompt(asset);
            const response = await generateContentDirect({ 
                model: 'gemini-flash-latest', 
                contents: prompt, 
                config: { tools: [{ googleSearch: {} }] } 
            });
            const parsedResult = robustJsonParse(response.text);
            if (!isMarketSentimentResult(parsedResult)) throw new Error("Incomplete market sentiment analysis.");
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
                    .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                    .filter((s: GroundingSource) => s.uri);
            }
            return parsedResult;
        } else {
            return postToApi<MarketSentimentResult>('/api/agent', { action: 'marketNews', payload: { asset } });
        }
    };
    return withRetry(apiCall);
};

export const getTradingJournalFeedback = async (trades: TradeEntry[]): Promise<JournalFeedback> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getJournalFeedbackPrompt(trades);
            const response = await generateContentDirect({ model: 'gemini-flash-latest', contents: prompt, config: { responseMimeType: 'application/json' } });
            const parsedResult = robustJsonParse(response.text);
            if (!isJournalFeedback(parsedResult)) throw new Error("Incomplete journal feedback.");
            return parsedResult;
        } else {
            return postToApi<JournalFeedback>('/api/agent', { action: 'journalFeedback', payload: { trades } });
        }
    };
    return withRetry(apiCall);
};

export const processCommandWithAgent = async (command: string): Promise<{ text: string, functionCalls: any[] | null }> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            if (!ai) throw new Error("GenAI client not initialized.");
            const agentTools = [{
                functionDeclarations: [
                    { name: "navigate", description: "Navigates to a page.", parameters: { type: Type.OBJECT, properties: { page: { type: Type.STRING } }, required: ['page'] } },
                    { name: "changeTheme", description: "Switches theme.", parameters: { type: Type.OBJECT, properties: { theme: { type: Type.STRING, enum: ['light', 'dark'] } }, required: ['theme'] } },
                    { name: "setEdgeLighting", description: "Changes edge lighting.", parameters: { type: Type.OBJECT, properties: { color: { type: Type.STRING, enum: ['default', 'green', 'red', 'orange', 'yellow', 'blue', 'purple', 'white'] } }, required: ['color'] } },
                    { name: "logout", description: "Logs out.", parameters: { type: Type.OBJECT, properties: {} } }
                ]
            }];
            const response = await generateContentDirect({ model: 'gemini-flash-latest', contents: command, config: { tools: agentTools } });
            const functionCalls = response.functionCalls || null;
            const text = functionCalls ? '' : response.text;
            return { text, functionCalls };
        } else {
            return postToApi<{ text: string, functionCalls: any[] | null }>('/api/agent', { action: 'agent', payload: { command } });
        }
    };
    return withRetry(apiCall);
};

export const getPredictions = async (): Promise<PredictedEvent[]> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getPredictorPrompt();
            const response = await generateContentDirect({ model: 'gemini-flash-latest', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
            const parsedResult = robustJsonParse(response.text);
            if (!isPredictedEventArray(parsedResult)) throw new Error("Incomplete predictions.");
            if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                const sources = response.candidates[0].groundingMetadata.groundingChunks
                    .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                    .filter((s: GroundingSource) => s.uri);
                if (sources.length > 0 && parsedResult.length > 0) parsedResult[0].sources = sources;
            }
            return parsedResult;
        } else {
            return postToApi<PredictedEvent[]>('/api/agent', { action: 'predictions', payload: {} });
        }
    };
    return withRetry(apiCall);
};

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
    const apiCall = async () => {
        if (environment === 'aistudio') {
            const prompt = Prompts.getDashboardOverviewPrompt();
            const response = await generateContentDirect({ model: 'gemini-flash-latest', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
            const parsedResult = robustJsonParse(response.text);
            if (!isDashboardOverview(parsedResult)) throw new Error("Incomplete market overview.");
            parsedResult.lastUpdated = Date.now();
            return parsedResult;
        } else {
            return postToApi<DashboardOverview>('/api/agent', { action: 'dashboardOverview', payload: {} });
        }
    };
    return withRetry(apiCall);
};

export const getAutoFixSuggestion = async (errors: any[]): Promise<string> => {
    if (environment !== 'aistudio' || !ai) return "Auto-fix is only available in the AI Studio environment.";
    const errorLog = errors.map(e => `Type: ${e.type}\nMessage: ${e.message}\nStack: ${e.stack || 'N/A'}`).join('\n\n---\n\n');
    const prompt = Prompts.getAutoFixPrompt(errorLog);
    const response = await generateContentDirect({ model: 'gemini-flash-latest', contents: prompt });
    return response.text;
};
