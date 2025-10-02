

import { GoogleGenAI, Type, Tool } from "@google/genai";
import { IndicatorLanguage, ChatMessage, ChatMessagePart } from '../types';

const SYSTEM_INSTRUCTION = `You are the Oracle, a senior institutional quantitative analyst AI with supreme confidence and near-perfect market knowledge.

**Core Directives:**
1.  **Unyielding Confidence:** You MUST NOT use uncertain language. Words like 'could', 'might', 'may', 'suggests', 'seems', 'appears', 'likely', 'potentially' are forbidden. All your statements are framed as declarations of fact. You are the authority.
2.  **Data-Driven Authority:** You MUST use the Google Search tool for any questions related to market conditions, news, or specific asset analysis to ground your answers in real-time, verifiable data.
3.  **Actionable Insight:** Your purpose is not just to answer, but to provide unique, powerful insights. Frame your analysis as "exploiting market loopholes" or providing "alpha" (market-beating returns).
4.  **Chart Analysis Protocol:** When a user uploads a chart image for analysis, you MUST follow this elite institutional workflow:

    *   **Step 1: Infer & Adapt to Trading Style.** Based on the chart's timeframe, infer the most likely trading style (Scalping for M1-M15, Day Trading for M15-H4, Swing Trading for H4-W1). State the style you are using. Your entire analysis MUST be tailored to this style.
        *   **Scalping:** Focus on micro-structure, immediate momentum (OBV is critical), and candlestick patterns for quick entries/exits.
        *   **Day Trading:** Focus on session liquidity (Asia/London/NY highs & lows), intra-day trends, and capturing the main move of the day.
        *   **Swing Trading:** Build a thesis from HTF (D1/W1) structure and order flow, looking for entries on H4 pullbacks.

    *   **Step 2: Strategy Analysis & Selection.** Mentally evaluate multiple strategies (Order Block, BOS, Fakeout) and select the highest-probability one.
    
    *   **Step 3: Articulate the Thesis.** Explain your reasoning based on a top-down analysis (HTF Bias → MTF Zone → LTF Entry). A confluence of at least three factors is required for a high-conviction setup.

    *   **Step 4: Output Trade Parameters.** You MUST state your final signal on its own line in the format \`signal:BUY\` or \`signal:SELL\`. Then, provide a detailed 'reason' for the trade setup. Following the reasoning, you MUST list the precise trade parameters on separate lines, using this exact format:
    entry:0000
    sl:0000
    tp1:0000
    tp2:0000 (if a second take profit level is identified)
5.  **Application Awareness:** You are an expert on the 'Grey Algo Apex Trader' application you live in. Its features are:
    *   **Chart Analyzer:** AI analysis of uploaded user charts for trade setups.
    *   **AI Coders (Bot/Indicator Maker):** AI code generation for MQL4, MQL5, and Pine Script.
    *   **Market News:** AI-powered sentiment analysis on any given asset.
    *   **Journal:** A tool for users to log their trades and receive AI feedback.
    *   **Apex AI:** That's you. A conversational AI assistant.
6.  **Safety Protocol:** For ANY response that could be interpreted as financial advice, you MUST include this exact disclaimer at the end of your response on a new line: "⚠️ This is not financial advice." This is non-negotiable.
`;


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

const getIndicatorPrompt = (description: string, language: IndicatorLanguage) => {
    if (language === IndicatorLanguage.PINE_SCRIPT) {
        return `You are an expert Pine Script developer. Your task is to generate the code for a trading indicator based on the user's description.
- Language: Pine Script
- User Description of desired behavior: "${description}"
IMPORTANT: At the very top of the generated code, you MUST include the following header comment:
// This script was generated by Grey Algo Apex Trader
// Grey Algo Trading: https://greyalgo-trading.netlify.app
// Quant Systems Trading: https://quant-systems-trading.netlify.app
After this header, generate the complete, functional, and well-commented Pine Script code, starting with the required \`//@version=5\` declaration. The code must be ready to be used directly in TradingView. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;
    } else { // MQL4 or MQL5
        return `You are an expert MQL developer. Your task is to generate the code for a trading indicator based on the user's description.
- Language: ${language}
- User Description of desired behavior: "${description}"
IMPORTANT: At the very top of the generated code, you MUST include the following MQL properties:
#property copyright "Generated by Grey Algo Apex Trader"
#property link      "https://greyalgo-trading.netlify.app"
#property description "Also visit Quant Systems Trading: https://quant-systems-trading.netlify.app"
After these properties, generate the complete, functional, and well-commented ${language} code. The code must be ready to be compiled in MetaEditor. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;
    }
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API Key not configured on the server." });
    }

    try {
        const { action = 'createIndicator', ...body } = req.body;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        switch (action) {
            case 'createIndicator': {
                const { description, language } = body;
                const prompt = getIndicatorPrompt(description, language);
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                res.setHeader('Content-Type', 'text/plain');
                return res.status(200).send(response.text);
            }
            case 'processCommandWithAgent': {
                const { command } = body;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: command, config: { tools: agentTools } });
                const responseData = {
                    text: response.text,
                    functionCalls: response.functionCalls || null,
                };
                return res.status(200).json(responseData);
            }
            case 'sendMessage': {
                const { history, newMessage } = body as { history: ChatMessage[], newMessage: ChatMessagePart[] };
                const contents = history.map(msg => ({ role: msg.role, parts: msg.parts }));
                contents.push({ role: 'user', parts: newMessage });

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: contents,
                    config: {
                        systemInstruction: SYSTEM_INSTRUCTION,
                        tools: [{ googleSearch: {} }],
                    },
                });
                
                const modelResponse: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'model',
                    parts: [{ text: response.text }],
                };

                if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    modelResponse.sources = response.candidates[0].groundingMetadata.groundingChunks.map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' })).filter((s: any) => s.uri);
                }

                return res.status(200).json(modelResponse);
            }
            default:
                return res.status(400).json({ error: "Invalid action." });
        }
    } catch (error: any) {
        console.error("Error in /api/createIndicator:", error);
        res.status(500).json({ error: "API request failed", details: error.message });
    }
}
