import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { DASHBOARD_KEYS } from './_env.js';
import { makeResilientCall } from './_resilience.js';
import * as Prompts from './_prompts.js';
import { 
    DashboardOverview, 
    MarketSentimentResult, 
    JournalFeedback, 
    PredictedEvent, 
    GroundingSource 
} from '../types';

const getValidatedTextFromResponse = (response: any): string => {
    const responseText = response.text;
    if (responseText && typeof responseText === 'string') return responseText;
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        if (finishReason === 'SAFETY') throw new Error(`Request blocked for safety reasons.`);
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

// ... (isDashboardOverview, isMarketSentimentResult, etc. helper functions remain the same) ...
const isDashboardOverview = (data: any): data is DashboardOverview => {
    return (
        data &&
        Array.isArray(data.activityFeed) &&
        Array.isArray(data.watchlist) &&
        Array.isArray(data.sectorHeatmap) &&
        Array.isArray(data.opportunityHeatmap) &&
        data.nextBigEvent
    );
};
const isMarketSentimentResult = (data: any): data is MarketSentimentResult => (data && typeof data.asset === 'string' && ['Bullish', 'Bearish', 'Neutral'].includes(data.sentiment));
const isJournalFeedback = (data: any): data is JournalFeedback => (data && typeof data.overallPnl === 'number' && typeof data.winRate === 'number');
const isPredictedEventArray = (data: any): data is PredictedEvent[] => (Array.isArray(data));


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
        console.error("JSON Parse failed for string:", jsonString);
        throw new Error("The AI's response was unclear or in an unexpected format.");
    }
};

const agentTools = [{
    functionDeclarations: [
        { name: "navigate", description: "Navigates to a specific page.", parameters: { type: Type.OBJECT, properties: { page: { type: Type.STRING } }, required: ['page'] } },
        { name: "changeTheme", description: "Switches the color theme.", parameters: { type: Type.OBJECT, properties: { theme: { type: Type.STRING, enum: ['light', 'dark'] } }, required: ['theme'] } },
        { name: "setEdgeLighting", description: "Changes the edge lighting color.", parameters: { type: Type.OBJECT, properties: { color: { type: Type.STRING, enum: ['default', 'green', 'red', 'orange', 'yellow', 'blue', 'purple', 'white', 'pink'] } }, required: ['color'] } },
        { name: "logout", description: "Logs the user out.", parameters: { type: Type.OBJECT, properties: {} } }
    ]
}];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    if (DASHBOARD_KEYS.length === 0) {
        return res.status(503).json({ message: 'Service Unavailable: Agent API keys are not configured.' });
    }

    try {
        const { action, payload } = req.body;
        if (!action) return res.status(400).json({ message: 'Missing action.' });

        const executeAgentCall = (requestPayload: any) => makeResilientCall(DASHBOARD_KEYS, requestPayload, false);
        
        switch (action) {
            case 'agent': {
                const response = await executeAgentCall({ contents: payload.command, config: { tools: agentTools } });
                return res.status(200).json({ text: response.text || '', functionCalls: response.functionCalls || null });
            }
            case 'dashboardOverview': {
                const prompt = Prompts.getDashboardOverviewPrompt(payload.isSeasonal);
                const response = await executeAgentCall({ contents: prompt, config: { tools: [{ googleSearch: {} }] } });
                const parsedResult = robustJsonParse(getValidatedTextFromResponse(response));
                if (!isDashboardOverview(parsedResult)) throw new Error("Malformed dashboard overview.");
                parsedResult.lastUpdated = Date.now();
                parsedResult.sources = extractSources(response);
                return res.status(200).json(parsedResult);
            }
            case 'marketNews': {
                const prompt = Prompts.getMarketSentimentPrompt(payload.asset);
                const response = await executeAgentCall({ contents: prompt, config: { tools: [{ googleSearch: {} }] } });
                const parsedResult = robustJsonParse(getValidatedTextFromResponse(response));
                if (!isMarketSentimentResult(parsedResult)) throw new Error("Malformed market sentiment.");
                parsedResult.sources = extractSources(response);
                return res.status(200).json(parsedResult);
            }
            case 'predictions': {
                const prompt = Prompts.getPredictorPrompt();
                const response = await executeAgentCall({ contents: prompt, config: { tools: [{ googleSearch: {} }] } });
                const parsedResult = robustJsonParse(getValidatedTextFromResponse(response)) as PredictedEvent[];
                if (!isPredictedEventArray(parsedResult)) throw new Error("Malformed predictions.");
                const sources = extractSources(response);
                return res.status(200).json(parsedResult.map(event => ({ ...event, sources })));
            }
            case 'journalFeedback': {
                const prompt = Prompts.getJournalFeedbackPrompt(payload.trades);
                const response = await executeAgentCall({ contents: prompt, config: { responseMimeType: 'application/json' } });
                const parsedResult = robustJsonParse(getValidatedTextFromResponse(response));
                if (!isJournalFeedback(parsedResult)) throw new Error("Malformed journal feedback.");
                return res.status(200).json(parsedResult);
            }
            case 'createBot': {
                const prompt = Prompts.getBotPrompt(payload.description, payload.language);
                const response = await executeAgentCall({ contents: prompt });
                return res.status(200).json({ code: getValidatedTextFromResponse(response) });
            }
            case 'createIndicator': {
                const prompt = Prompts.getIndicatorPrompt(payload.description, payload.language);
                const response = await executeAgentCall({ contents: prompt });
                return res.status(200).json({ code: getValidatedTextFromResponse(response) });
            }
            default:
                return res.status(400).json({ message: 'Invalid action.' });
        }
    } catch (error: any) {
        console.error(`Error in /api/agent [action=${req.body.action}]:`, error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}
