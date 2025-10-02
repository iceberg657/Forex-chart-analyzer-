
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Tool } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const agentTools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "navigate",
                description: "Navigates the user to a different page in the application.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        page: {
                            type: Type.STRING,
                            description: "The name of the page to navigate to. Available pages are: 'home', 'analysis', 'market-news', 'journal', 'coders', 'bot-maker', 'indicator-maker', 'pricing', 'login', 'signup'."
                        }
                    },
                    required: ["page"]
                }
            },
            {
                name: "changeTheme",
                description: "Switches the application's color theme.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        theme: {
                            type: Type.STRING,
                            description: "The theme to switch to. Can be 'light' or 'dark'."
                        }
                    },
                    required: ["theme"]
                }
            },
            {
                name: "setEdgeLighting",
                description: "Changes the color of the glowing edge lighting effect around the application border.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        color: {
                            type: Type.STRING,
                            description: "The color for the edge lighting. Can be 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'white', or 'default'."
                        }
                    },
                    required: ["color"]
                }
            },
            {
                name: "logout",
                description: "Logs the current user out of the application."
            }
        ]
    }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ success: false, message: 'API key not configured' });
    }

    try {
        const { command } = req.body;
        if (!command) {
            return res.status(400).json({ success: false, message: 'Missing command' });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: command,
            config: {
                tools: agentTools
            }
        });
        
        const data = {
            text: response.text,
            functionCalls: response.functionCalls || null,
        };

        return res.status(200).json({ success: true, data });

    } catch (error: any) {
        console.error("Error in /api/agent:", error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
}