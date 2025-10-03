
import { detectEnvironment } from '../hooks/useEnvironment';
import { postToApi } from './api';
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
        throw new Error("The AI returned a response in an unexpected format.");
    }
};

const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('FileReader result is not a string'));
      }
      const result = reader.result;
      const data = result.split(',')[1];
      const mimeType = file.type;
      resolve({ data, mimeType });
    };
    reader.onerror = error => reject(error);
  });
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

// --- Unified API Functions ---

export const analyzeChart = async (
  chartFiles: { [key: string]: File | null },
  riskReward: string,
  tradingStyle: string
): Promise<AnalysisResult> => {
    const isStudio = detectEnvironment() === 'aistudio';
    if (isStudio) {
        const prompt = Prompts.getAnalysisPrompt(tradingStyle, riskReward);
        const parts: any[] = [{ text: prompt }];
        for (const key of ['higher', 'primary', 'entry']) {
            if (chartFiles[key]) {
                parts.push({ text: `${key.charAt(0).toUpperCase() + key.slice(1)} Timeframe Chart:` });
                parts.push(await fileToImagePart(chartFiles[key]!));
            }
        }
        
        const response = await window.service!.gemini.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: { tools: [{ googleSearch: {} }] }
        });

        const parsedResult = robustJsonParse(response.text);
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
        }
        return parsedResult;
    } else {
        const imagePayloads: { [key: string]: { data: string; mimeType: string } | null } = { higher: null, primary: null, entry: null };
        for (const key of Object.keys(chartFiles)) {
            if (chartFiles[key]) {
                imagePayloads[key] = await fileToBase64(chartFiles[key]!);
            }
        }
        return postToApi<AnalysisResult>('/api/analyze', { imagePayloads, riskReward, tradingStyle });
    }
};

export const createBot = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
    const isStudio = detectEnvironment() === 'aistudio';
    if (isStudio) {
        const prompt = Prompts.getBotPrompt(description, language);
        const response = await window.service!.gemini.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } else {
        const { code } = await postToApi<{ code: string }>('/api/createBot', { description, language });
        return code;
    }
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    const isStudio = detectEnvironment() === 'aistudio';
    if (isStudio) {
        const prompt = Prompts.getIndicatorPrompt(description, language);
        const response = await window.service!.gemini.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } else {
        const { code } = await postToApi<{ code: string }>('/api/createIndicator', { description, language });
        return code;
    }
};

export const sendMessage = async (history: ChatMessage[], newMessageParts: ChatMessagePart[]): Promise<ChatMessage> => {
    const isStudio = detectEnvironment() === 'aistudio';
    if (isStudio) {
        const contents = history.map((msg: ChatMessage) => ({ 
            role: msg.role, 
            parts: msg.parts.map(p => p.text ? { text: p.text } : p)
        }));
        contents.push({ role: 'user', parts: newMessageParts });

        const response = await window.service!.gemini.generateContent({
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
    } else {
        return postToApi<ChatMessage>('/api/chat', { history, newMessageParts });
    }
};

export const getMarketNews = async (asset: string): Promise<MarketSentimentResult> => {
    const isStudio = detectEnvironment() === 'aistudio';
    if (isStudio) {
        const prompt = Prompts.getMarketSentimentPrompt(asset);
        const response = await window.service!.gemini.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt, 
            config: { tools: [{ googleSearch: {} }] } 
        });
        const parsedResult = robustJsonParse(response.text);
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

export const getTradingJournalFeedback = async (trades: TradeEntry[]): Promise<JournalFeedback> => {
    const isStudio = detectEnvironment() === 'aistudio';
    if (isStudio) {
        const prompt = Prompts.getJournalFeedbackPrompt(trades);
        const response = await window.service!.gemini.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return robustJsonParse(response.text);
    } else {
        return postToApi<JournalFeedback>('/api/journalFeedback', { trades });
    }
};

export const getPredictions = async (): Promise<PredictedEvent[]> => {
    const isStudio = detectEnvironment() === 'aistudio';
    if (isStudio) {
        const prompt = Prompts.getPredictorPrompt();
        const response = await window.service!.gemini.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
        });
        const parsedResult = robustJsonParse(response.text);
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && Array.isArray(chunks) && Array.isArray(parsedResult)) {
            const sources = chunks
                .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                .filter((s: GroundingSource) => s.uri);
            parsedResult.forEach((event: any) => event.sources = sources);
        }
        return parsedResult;
    } else {
        return postToApi<PredictedEvent[]>('/api/predictions', {});
    }
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
    const isStudio = detectEnvironment() === 'aistudio';
    if (isStudio) {
        const response = await window.service!.gemini.generateContent({
            model: 'gemini-2.5-flash',
            contents: command,
            config: { tools: agentTools }
        });
        return {
            text: response.text,
            functionCalls: response.functionCalls || null,
        };
    } else {
        return postToApi<{ text: string; functionCalls: any[] | null; }>('/api/agent', { command });
    }
};
