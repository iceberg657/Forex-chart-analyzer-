import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Tool, GenerateContentResponse } from "@google/genai";

// FIX: Replaced stub function with a proper `GoogleGenAI` client initialization.
const getAi = () => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// FIX: Completed the agent tools definition for better function calling.
const agentTools: Tool[] = [{
    functionDeclarations: [
        { 
            name: "navigate", 
            description: "Navigates to a specific page in the application. Valid pages are: home, landing, dashboard, analysis, market-news, journal, coders, bot-maker, indicator-maker, pricing, predictor, apex-ai, login, signup.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    page: {
                        type: Type.STRING,
                        description: "The page to navigate to.",
                    },
                },
                required: ['page'],
            },
        },
        { 
            name: "changeTheme", 
            description: "Switches the application's color theme.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    theme: {
                        type: Type.STRING,
                        description: "The theme to switch to. Can be 'light' or 'dark'.",
                        enum: ['light', 'dark'],
                    },
                },
                required: ['theme'],
            },
        },
        { 
            name: "setEdgeLighting", 
            description: "Changes the color of the application's edge lighting effect.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    color: {
                        type: Type.STRING,
                        description: "The color for the edge lighting. Valid colors are: default, green, red, orange, yellow, blue, purple, white.",
                        enum: ['default', 'green', 'red', 'orange', 'yellow', 'blue', 'purple', 'white'],
                    },
                },
                required: ['color'],
            },
        },
        { 
            name: "logout", 
            description: "Logs the current user out of the application." 
        }
    ]
}];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { command } = req.body;
        const ai = getAi();
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: command,
            config: { tools: agentTools }
        });
        
        const data = {
            text: response.text,
            functionCalls: response.functionCalls || null,
        };

        res.status(200).json(data);
    } catch (error) {
        console.error('Error in /api/agent:', error);
        res.status(500).json({ message: error instanceof Error ? error.message : 'An unknown error occurred.' });
    }
}