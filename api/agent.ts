import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import * as Prompts from './_prompts.js';
import { 
    DashboardOverview, 
    MarketSentimentResult, 
    JournalFeedback, 
    PredictedEvent, 
    TradeEntry, 
    GroundingSource 
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getValidatedTextFromResponse = (response: any): string => {
    const responseText = response.text;
    
    if (responseText && typeof responseText === 'string') {
        return responseText;
    }
    
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        if (finishReason === 'SAFETY') {
            throw new Error(`Request blocked for safety reasons.`);
        }
        throw new Error(`The AI's response was terminated. Reason: ${finishReason}.`);
    }

    throw new Error("The AI returned an empty or invalid response.");
};

const extractSources = (response: any): GroundingSource[] => {
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        return response.candidates[0].groundingMetadata.groundingChunks
            .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
            .filter((s: GroundingSource) => s.uri);
    }
    return [];
};

const isDashboardOverview = (data: any): data is DashboardOverview => {
    return (
        data &&
        data.marketCondition &&
        ['Bullish', 'Bearish', 'Neutral'].includes(data.marketCondition.sentiment) &&
        Array.isArray(data.marketCondition.trendingPairs) &&
        Array.isArray(data.dailyBiases) &&
        data.dailyBiases.length > 0 &&
        data.tradingOpportunities &&
        Array.isArray(data.tradingOpportunities.highProbabilitySetups) &&
        data.tradingOpportunities.highProbabilitySetups.length >= 1
    );
};

const isMarketSentimentResult = (data: any): data is MarketSentimentResult => {
    return (
        data &&
        typeof data.asset === 'string' &&
        ['Bullish', 'Bearish', 'Neutral'].includes(data.sentiment) &&
        typeof data.summary === 'string'
    );
};

const isJournalFeedback = (data: any): data is JournalFeedback => {
    return (
        data &&
        typeof data.overallPnl === 'number' &&
        typeof data.winRate === 'number'
    );
};

const isPredictedEvent = (data: any): data is PredictedEvent => {
    return (
        data &&
        typeof data.event_description === 'string' &&
        typeof data.day === 'string' &&
        ['BUY', 'SELL'].includes(data.direction)
    );
};

const isPredictedEventArray = (data: any): data is PredictedEvent[] => {
    return Array.isArray(data);
};

const robustJsonParse = (jsonString: string) => {
    if (typeof jsonString !== 'string' || !jsonString) {
        throw new Error("The AI's response was unclear or in an unexpected format.");
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
        throw new Error("The AI's response was unclear or in an unexpected format.");
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
                properties: { color: { type: Type.STRING, description: "The color for the edge lighting. Valid colors are: default, green, red, orange, yellow, blue, purple, white, pink.", enum: ['default', 'green', 'red', 'orange', 'yellow', 'blue', 'purple', 'white', 'pink'] } },
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


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;

        if (!action) {
            if (req.body.command) {
                 const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-lite',
                    contents: req.body.command,
                    config: { tools: agentTools }
                });
                const functionCalls = response.functionCalls || null;
                const text = functionCalls ? '' : (response.text || '');
                return res.status(200).json({ text, functionCalls });
            }
            return res.status(400).json({ message: 'Missing action.' });
        }

        switch (action) {
            case 'agent': {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-lite',
                    contents: payload.command,
                    config: { tools: agentTools }
                });
                const functionCalls = response.functionCalls || null;
                const text = functionCalls ? '' : (response.text || '');
                return res.status(200).json({ text, functionCalls });
            }

            case 'dashboardOverview': {
                const { isSeasonal } = payload;
                const prompt = Prompts.getDashboardOverviewPrompt(isSeasonal);
                const response = await ai.models.generateContent({ 
                    model: 'gemini-2.5-flash-lite', 
                    contents: prompt,
                    config: { tools: [{ googleSearch: {} }] } 
                });
                const responseText = getValidatedTextFromResponse(response);
                const parsedResult = robustJsonParse(responseText);
                if (!isDashboardOverview(parsedResult)) {
                    throw new Error("The AI's market overview was incomplete or malformed.");
                }
                parsedResult.lastUpdated = Date.now();
                parsedResult.sources = extractSources(response);
                return res.status(200).json(parsedResult);
            }

            case 'marketNews': {
                const prompt = Prompts.getMarketSentimentPrompt(payload.asset);
                const response = await ai.models.generateContent({ 
                    model: 'gemini-2.5-flash-lite', 
                    contents: prompt,
                    config: { tools: [{ googleSearch: {} }] } 
                });
                const responseText = getValidatedTextFromResponse(response);
                const parsedResult = robustJsonParse(responseText);
                if (!isMarketSentimentResult(parsedResult)) {
                    throw new Error("The AI's market sentiment analysis was incomplete or malformed.");
                }
                parsedResult.sources = extractSources(response);
                return res.status(200).json(parsedResult);
            }

            case 'predictions': {
                const prompt = Prompts.getPredictorPrompt();
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-lite',
                    contents: prompt,
                    config: { tools: [{ googleSearch: {} }] } 
                });
                const responseText = getValidatedTextFromResponse(response);
                const parsedResult = robustJsonParse(responseText) as PredictedEvent[];
                if (!isPredictedEventArray(parsedResult)) {
                    throw new Error("The AI's predictions were incomplete or malformed.");
                }
                const sources = extractSources(response);
                const updatedResult = parsedResult.map(event => ({ ...event, sources }));
                return res.status(200).json(updatedResult);
            }

            case 'journalFeedback': {
                const prompt = Prompts.getJournalFeedbackPrompt(payload.trades);
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-lite',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });
                const responseText = getValidatedTextFromResponse(response);
                const parsedResult = robustJsonParse(responseText);
                if (!isJournalFeedback(parsedResult)) {
                    throw new Error("The AI's journal feedback was incomplete or malformed.");
                }
                return res.status(200).json(parsedResult);
            }

            case 'createBot': {
                const prompt = Prompts.getBotPrompt(payload.description, payload.language);
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
                const code = getValidatedTextFromResponse(response);
                return res.status(200).json({ code });
            }

            case 'createIndicator': {
                const prompt = Prompts.getIndicatorPrompt(payload.description, payload.language);
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
                const code = getValidatedTextFromResponse(response);
                return res.status(200).json({ code });
            }

            default:
                return res.status(400).json({ message: 'Invalid action.' });
        }

    } catch (error: any) {
        console.error(`Error in /api/agent [action=${req.body.action}]:`, error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}