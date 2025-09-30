
import { GoogleGenAI, Type, Tool } from "@google/genai";
import { apiClient } from './apiClient';

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
                            description: "The name of the page to navigate to. Available pages are: 'home', 'analysis', 'market-news', 'journal', 'coders', 'bot-maker', 'indicator-maker', 'pricing', 'login', 'signup', 'predictor'."
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

export const processCommandWithAgent = async (command: string): Promise<any> => {
    if (process.env.API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: command, config: { tools: agentTools } });
        return {
            text: response.text,
            functionCalls: response.functionCalls || null,
        };
    } else {
        return apiClient.post<any>('processCommandWithAgent', { command });
    }
};