




import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import * as Prompts from '../services/prompts';
import { 
    DashboardOverview, 
    MarketSentimentResult, 
    JournalFeedback, 
    PredictedEvent, 
    TradeEntry, 
    GroundingSource 
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Validation Helpers ---

const isDashboardOverview = (data: any): data is DashboardOverview => {
    return (
        data &&
        data.marketCondition &&
        ['Bullish', 'Bearish', 'Neutral'].includes(data.marketCondition.sentiment) &&
        Array.isArray(data.marketCondition.trendingPairs) &&
        typeof data.marketCondition.dominantSession === 'string' &&
        typeof data.marketCondition.marketDriver === 'string' &&
        Array.isArray(data.dailyBiases) &&
        data.dailyBiases.every((b: any) => 
            typeof b.pair === 'string' && 
            ['Bullish', 'Bearish', 'Neutral'].includes(b.bias) &&
            typeof b.reasoning === 'string'
        ) &&
        data.economicData &&
        Array.isArray(data.economicData.recentEvents) &&
        Array.isArray(data.economicData.upcomingEvents) &&
        data.technicalSummary &&
        Array.isArray(data.technicalSummary.dominantTrends) &&
        Array.isArray(data.technicalSummary.keyLevels) &&
        data.tradingOpportunities &&
        Array.isArray(data.tradingOpportunities.highProbabilitySetups) &&
        data.tradingOpportunities.highProbabilitySetups.every((setup: any) => 
            setup.entry && setup.stopLoss && setup.takeProfit && setup.rrRatio
        ) &&
        data.tradingOpportunities.riskAssessment &&
        Array.isArray(data.next24hOutlook)
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
        typeof data.day === 'string' &&
        typeof data.date === 'string' &&
        typeof data.time === 'string' &&
        ['BUY', 'SELL'].includes(data.direction) &&
        Array.isArray(data.currencyPairs) && data.currencyPairs.every((p: any) => typeof p === 'string') &&
        typeof data.confidence === 'number' && data.confidence >= 75 && data.confidence <= 90 &&
        typeof data.potential_effect === 'string'
    );
};

const isPredictedEventArray = (data: any): data is PredictedEvent[] => {
    return Array.isArray(data) && data.every(isPredictedEvent);
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


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;

        if (!action) {
            // Legacy support for the original agent call which might just send { command }
            if (req.body.command) {
                 const response = await ai.models.generateContent({
                    model: 'gemini-flash-latest',
                    contents: req.body.command,
                    config: { tools: agentTools }
                });
                const functionCalls = response.functionCalls || null;
                const text = functionCalls ? '' : response.text;
                return res.status(200).json({ text, functionCalls });
            }
            return res.status(400).json({ message: 'Missing action.' });
        }

        switch (action) {
            case 'agent': {
                const response = await ai.models.generateContent({
                    model: 'gemini-flash-latest',
                    contents: payload.command,
                    config: { tools: agentTools }
                });
                const functionCalls = response.functionCalls || null;
                const text = functionCalls ? '' : response.text;
                return res.status(200).json({ text, functionCalls });
            }

            case 'dashboardOverview': {
                const prompt = Prompts.getDashboardOverviewPrompt();
                const response = await ai.models.generateContent({ 
                    model: 'gemini-flash-latest', 
                    contents: prompt, 
                    config: { tools: [{ googleSearch: {} }] } 
                });
                const parsedResult = robustJsonParse(response.text);
                if (!isDashboardOverview(parsedResult)) {
                    throw new Error("The AI's market overview was incomplete or malformed.");
                }
                parsedResult.lastUpdated = Date.now();
                return res.status(200).json(parsedResult);
            }

            case 'marketNews': {
                const prompt = Prompts.getMarketSentimentPrompt(payload.asset);
                const response = await ai.models.generateContent({ 
                    model: 'gemini-flash-latest', 
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
                return res.status(200).json(parsedResult);
            }

            case 'predictions': {
                const prompt = Prompts.getPredictorPrompt();
                const response = await ai.models.generateContent({
                    model: 'gemini-flash-latest',
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
                return res.status(200).json(parsedResult);
            }

            case 'journalFeedback': {
                const prompt = Prompts.getJournalFeedbackPrompt(payload.trades);
                const response = await ai.models.generateContent({
                    model: 'gemini-flash-latest',
                    contents: prompt,
                    config: { responseMimeType: 'application/json' }
                });
                const parsedResult = robustJsonParse(response.text);
                if (!isJournalFeedback(parsedResult)) {
                    throw new Error("The AI's journal feedback was incomplete or malformed.");
                }
                return res.status(200).json(parsedResult);
            }

            case 'createBot': {
                const prompt = Prompts.getBotPrompt(payload.description, payload.language);
                const response = await ai.models.generateContent({ model: 'gemini-flash-latest', contents: prompt });
                return res.status(200).json({ code: response.text });
            }

            case 'createIndicator': {
                const prompt = Prompts.getIndicatorPrompt(payload.description, payload.language);
                const response = await ai.models.generateContent({ model: 'gemini-flash-latest', contents: prompt });
                return res.status(200).json({ code: response.text });
            }

            default:
                return res.status(400).json({ message: 'Invalid action.' });
        }

    } catch (error: any) {
        console.error(`Error in /api/agent [action=${req.body.action}]:`, error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}
