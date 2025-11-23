

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getDashboardOverviewPrompt } from '../services/prompts';
import { DashboardOverview } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const isDashboardOverview = (data: any): data is DashboardOverview => {
    return (
        data &&
        data.marketCondition &&
        ['Bullish', 'Bearish', 'Neutral'].includes(data.marketCondition.sentiment) &&
        typeof data.marketCondition.trendingPairs === 'string' &&
        data.economicData &&
        Array.isArray(data.economicData.recentEvents) &&
        Array.isArray(data.economicData.upcomingEvents) &&
        data.technicalSummary &&
        Array.isArray(data.technicalSummary.dominantTrends) &&
        Array.isArray(data.technicalSummary.keyLevels) &&
        data.tradingOpportunities &&
        Array.isArray(data.tradingOpportunities.highProbabilitySetups) &&
        data.tradingOpportunities.riskAssessment
    );
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
        const lastBracket = cleanJsonString.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            cleanJsonString = cleanJsonString.substring(firstBracket, lastBracket + 1);
        }
    }
    try {
        return JSON.parse(cleanJsonString);
    } catch (e) {
        throw new Error("The AI's response was unclear or in an unexpected format.");
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const prompt = getDashboardOverviewPrompt();
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-pro', 
            contents: prompt, 
            config: { tools: [{ googleSearch: {} }] } 
        });
        const parsedResult = robustJsonParse(response.text);
        if (!isDashboardOverview(parsedResult)) {
            throw new Error("The AI's market overview was incomplete or malformed.");
        }
        parsedResult.lastUpdated = Date.now();
        
        return res.status(200).json(parsedResult);
    } catch (error: any) {
        console.error("Error in /api/dashboardOverview:", error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred.' });
    }
}