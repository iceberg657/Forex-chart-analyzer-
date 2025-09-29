

import { GoogleGenAI, Type, Tool, GenerateContentResponse, Part } from "@google/genai";
import { AnalysisResult, BotLanguage, IndicatorLanguage, GroundingSource, MarketSentimentResult, TradeEntry, JournalFeedback } from '../types';

// Per instructions, assume API_KEY is available in the execution environment.
// The 'ai' instance is initialized directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- AI AGENT TOOLS ---

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


// --- UTILITIES ---

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

const robustJsonParse = (jsonString: string) => {
    let cleanJsonString = jsonString.trim();
    const match = cleanJsonString.match(/```(json)?\s*(\{[\s\S]*\})\s*```/);
    if (match && match[2]) {
        cleanJsonString = match[2];
    } else {
        const jsonStart = cleanJsonString.indexOf('{');
        const jsonEnd = cleanJsonString.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            cleanJsonString = cleanJsonString.substring(jsonStart, jsonEnd + 1);
        }
    }
    try {
        return JSON.parse(cleanJsonString);
    } catch (parseError) {
        console.error("Failed to parse JSON from AI response:", cleanJsonString);
        throw new Error("Failed to process the request. The AI returned an invalid format.");
    }
};


// --- PROMPT GENERATION LOGIC ---
const getJournalFeedbackPrompt = (trades: TradeEntry[]) => `You are a 'Trading Performance Coach AI'. Your role is to analyze a trader's journal and provide objective, actionable feedback to help them improve. You are encouraging but direct.

**PRIMARY DIRECTIVE:**
Analyze the provided list of trades and generate a comprehensive performance review. Your entire response MUST be a single, valid JSON object.

**PROVIDED DATA:**
A JSON array of trade objects:
\`\`\`json
${JSON.stringify(trades, null, 2)}
\`\`\`

**ANALYTICAL FRAMEWORK (Internal thought process):**
1.  **Calculate Key Metrics:**
    -   Calculate the total Profit/Loss (P/L).
    -   Calculate the Win Rate (percentage of profitable trades).
    -   Calculate the Average Win and Average Loss.
    -   Determine the Profit Factor (Gross Profit / Gross Loss).
2.  **Identify Patterns & Habits:**
    -   **Strengths:** What is the trader doing right? Do they have a high win rate on a specific asset? Are they good at cutting losses on short trades? Do they let winners run? Find positive patterns based on the data and notes.
    -   **Weaknesses:** What is the trader doing wrong? Are they holding onto losing trades for too long (large average loss)? Are they cutting winners short? Do they over-trade a specific asset with poor results? Do they seem to revenge trade (e.g., a large loss followed by several small, quick trades)? Analyze the notes for emotional language.
3.  **Formulate Actionable Suggestions:**
    -   Based on the identified weaknesses, provide 3-5 specific, actionable suggestions for improvement.
    -   Examples: "Consider implementing a stricter stop-loss rule to reduce your average loss." or "Your win rate on 'EUR/USD' is significantly higher than on other pairs. Consider focusing more on this asset." or "Review your notes for losing trades to identify if emotional decisions are a factor."

**STRICT JSON OUTPUT REQUIREMENTS:**
You MUST respond ONLY with a single, valid JSON object matching the schema below. No markdown, no commentary, just the JSON. Round all numbers to 2 decimal places.

**JSON Schema:**
{
  "overallPnl": "number (Total profit or loss. Positive for profit, negative for loss)",
  "winRate": "number (Percentage of winning trades, 0-100)",
  "strengths": ["string array (2-3 bullet points identifying positive patterns)"],
  "weaknesses": ["string array (2-3 bullet points identifying negative patterns or areas for improvement)"],
  "suggestions": ["string array (3-5 actionable steps the trader can take to improve)"]
}`;


const getMarketSentimentPrompt = (asset: string) => `You are a 'Senior Market Analyst AI'. Your primary function is to analyze the latest market news and sentiment for a given financial asset. You are objective, data-driven, and concise.

**PRIMARY DIRECTIVE:**
1.  **Perform a Web Search:** Use your web search tool to find the most relevant and recent news, articles, and analyses for the asset: **${asset}**. Focus on information from the last 24-48 hours.
2.  **Analyze Sentiment:** Based on your search results, determine the overall market sentiment.
3.  **Generate JSON Output:** Consolidate your findings into a single, valid JSON object. Your entire response MUST be only this JSON object and nothing else.

**ANALYTICAL FRAMEWORK (Internal thought process):**
- **Identify Key Drivers:** What are the main narratives? Is it an earnings report, a regulatory change, macroeconomic data (like inflation or jobs reports), a major partnership, or a geopolitical event?
- **Assess Tone:** Is the language in the news sources predominantly positive, negative, or neutral? Are analysts bullish or bearish?
- **Quantify Confidence:** Based on the strength and consensus of the news, assign a confidence score to your sentiment analysis. A strong consensus on a major event warrants a high confidence score.
- **Synthesize Information:** Create a brief, neutral summary of the current situation. Extract 3-5 of the most important takeaways as key points.

**STRICT JSON OUTPUT REQUIREMENTS:**
You MUST respond ONLY with a single, valid JSON object matching the schema below. No markdown, no commentary, just the JSON.

**JSON Schema:**
{
  "asset": "string (The name of the asset you analyzed, e.g., '${asset}')",
  "sentiment": "'Bullish', 'Bearish', or 'Neutral'",
  "confidence": "number (A percentage from 0-100 representing your confidence in the sentiment analysis)",
  "summary": "string (A concise, 1-3 sentence summary of the current market situation for the asset)",
  "keyPoints": ["string array (3-5 bullet points of the most critical news or factors influencing the sentiment)"],
  "sources": "This will be populated by the system if web search is used."
}`;


const getAnalysisPrompt = (tradingStyle: string, riskReward: string) => `You are a 'Senior Institutional Quantitative Analyst AI', a sophisticated and objective trading analyst operating at the highest level of financial markets. Your analysis is data-driven, unemotional, and meticulously detailed. You provide institutional-grade trade setups, focusing on probability and risk management. Your tone is professional, precise, and authoritative.

**PRIMARY DIRECTIVE:**
Analyze the provided market chart(s) and generate a comprehensive, actionable trade analysis. Your output MUST be a single, valid JSON object and nothing else.

**Core Analytical Principle: Market Structure is King.** Your entire analysis must be rooted in market structure. Trends, biases, and trade ideas are derived from the sequence of highs and lows, Breaks of Structure (BOS), and Changes of Character (CHoCH). All other tools (indicators, patterns) are secondary and serve only as confirmation.

**MULTI-TIMEFRAME CONTEXT:**
You will be provided with up to three chart images, each preceded by a text label identifying its role:
- **Higher Timeframe Chart:** Use this to establish the overarching market trend, bias, and key higher timeframe levels (e.g., daily order blocks, weekly support).
- **Primary Timeframe Chart:** This is the main chart for your analysis. Identify the primary trade setup, market structure, and points of interest here.
- **Entry Timeframe Chart:** Use this for fine-tuning the entry point, observing for confirmations like a lower-timeframe change of character or liquidity grab.

Your final analysis in the JSON output must synthesize information from ALL provided charts to form a robust, high-probability trade thesis. The 'reasoning' and 'tenReasons' must reflect this top-down analysis. If only one chart (the primary) is provided, analyze it and infer the others.

**ANALYTICAL FRAMEWORK (Internal thought process):**
Before generating the JSON, you must follow this multi-layered framework:

1.  **Global Context Synthesis (Your Digital Research Assistant):**
    *   **MANDATORY WEB SEARCH:** Before any technical analysis, perform a deep and broad web search to build a complete contextual picture. Synthesize information from reputable financial news (Bloomberg, Reuters), institutional analysis (major bank reports), high-quality trading forums (ForexFactory, TradingView ideas), and economic calendars. Your goal is to understand the *'why'* behind the price action.
    *   **Search Queries should include:**
        *   "[Asset Name] news and sentiment"
        *   "[Asset Currency 1] vs [Asset Currency 2] fundamental analysis"
        *   "Major economic events affecting [Asset Name] this week"
        *   "Institutional outlook for [Asset Name]"
        *   "[Asset Name] COT report analysis" (if applicable)
    *   **Information to Synthesize:**
        *   **Macroeconomic Factors:** Key data releases (CPI, NFP, GDP), central bank policy shifts.
        *   **Institutional & Retail Sentiment:** Is the smart money bullish or bearish? What is the retail crowd thinking?
        *   **Upcoming Catalysts:** Are there any high-impact news events on the horizon that could invalidate this setup?
        *   **Geopolitical Landscape:** Any global tensions or events influencing the asset?

2.  **Price Action & Market Structure Analysis (Primary Focus):**
    *   **Trading Session Analysis:** Identify the trading session(s) visible on the chart (e.g., Asian, London, New York, or their overlaps). Acknowledge the typical price action characteristics of that session in your reasoning. (e.g., "The setup occurs during the volatile London/New York overlap, adding credibility to this breakout pattern.").
    *   **Market Structure:** This is your primary tool. Meticulously identify the current market structure on the Primary chart. Is it bullish (higher highs & higher lows - HH/HLs), bearish (lower highs & lower lows - LH/LLs), or consolidating? Pinpoint the most recent significant Break of Structure (BOS) or Change of Character (CHoCH). A CHoCH against the higher timeframe trend is a powerful signal.
    *   **Liquidity Mapping:** Where is the money? Identify key liquidity pools, such as old highs/lows, equal highs/lows (EQL/EQH), and trendline liquidity. Price is drawn to liquidity. Your analysis should predict the next liquidity grab.
    *   **Premium vs. Discount:** Evaluate if the price is currently in a premium (expensive to buy, good to sell) or discount (cheap to buy, good to sell) market based on the recent trading range. This is critical for high-probability entries.
    *   **Key Levels:** Mark critical institutional levels like order blocks, breaker blocks, and fair value gaps (FVGs) across all provided timeframes. These are your points of interest for entries.

3.  **SPECIAL ASSET CONSIDERATIONS:**
    *   **If the asset is Gold (XAU/USD):** Your analysis MUST incorporate the unique drivers of Gold. Use your web search tool to assess:
        1.  **US Dollar Index (DXY) Strength:** Analyze the recent trend of DXY. A weak dollar is typically bullish for Gold, and a strong dollar is bearish. State the correlation in your reasoning.
        2.  **Geopolitical Climate:** Search for any recent major geopolitical events or tensions. Gold is a safe-haven asset and rallies during times of uncertainty.
        3.  **Inflation Data:** Check for recent inflation reports (e.g., CPI). High inflation is generally bullish for Gold as it's an inflation hedge.
    Your reasoning for Gold must explicitly mention these factors.
    *   **If the asset is a Synthetic Index (e.g., Volatility 75, Boom 1000, Crash 500, Step Index):** Your analysis MUST focus exclusively on price action and algorithmic patterns. **DO NOT perform a web search for fundamentals, news, or sentiment, as these markets are algorithmically generated and not tied to real-world events.** Your reasoning should be based on the unique behaviors of these indices.
        *   **For Boom/Crash Indices:** The primary behavior is a series of small ticks followed by a large, sudden "spike" in one direction. Your analysis must prioritize identifying potential spike zones (for counter-trend scalps) or safe entry points to ride the main underlying trend (up for Boom, down for Crash).
        *   **For Volatility Indices (e.g., V75):** These are characterized by high, persistent volatility. Your analysis should focus on patterns that thrive in such conditions, like range breakouts, support/resistance flips, and volatility contraction patterns.
        *   **For Step Index:** This index has a fixed step size, creating very clean trends. Your analysis should focus on trend-following strategies and identifying entries after a clear break of structure in the direction of the trend.
        *   **In your 'tenReasons' for synthetics, DO NOT use the 🌐 emoji or mention web research.** All reasons must be purely technical.

4.  **Advanced Concepts Integration (SMC/ICT & Others):**
    *   **Synthesize Relevant Strategies:** Your analysis MUST integrate advanced concepts. Do not just list them. Show how they confluence across the different timeframes to form a trade thesis.
    *   **Your Toolkit (Examples, not exhaustive):** You are an expert in ALL trading concepts. Use any relevant tool from your vast knowledge base. This list is just a starting point:
        *   **Smart Money Concepts (SMC):** Order Blocks, Fair Value Gaps (FVG) / Imbalances, Breaker/Mitigation Blocks, Liquidity Grabs (Stop Hunts).
        *   **Inner Circle Trader (ICT):** Premium vs. Discount arrays, Optimal Trade Entry (OTE), Silver Bullet, Judas Swing.
        *   **Wyckoff Method:** Accumulation/Distribution schematics, Springs, Upthrusts.
        *   **Classical Patterns:** Head and Shoulders, Triangles, Flags, Wedges.
        *   **Core Indicators (for confirmation only):** RSI (for divergence), MACD, Moving Averages.
        *   **Volume Analysis:** Volume profile, spikes, and divergences.

5.  **Thesis Formulation & Trade Planning:**
    *   **Primary Thesis:** Formulate a clear, primary trade thesis based on the confluence of **both your web research (if applicable) and your technical price action analysis**. Example: "The web search reveals a hawkish stance from the central bank, aligning with the observed bearish market structure on the Higher Timeframe chart. The Primary chart shows..."
    *   **Alternative Thesis / Invalidation:** Define what price action would invalidate your primary thesis. This is crucial for risk management. Example: "A close below the low of the 4H Order Block at $1.2345 would invalidate the bullish thesis and suggest a continuation of the downtrend."
    *   **Trade Parameters:** Based on user preferences (Trading Style, R:R), define precise entry, stop loss, and take profit levels for your primary thesis. For a NEUTRAL signal, these must be "N/A".
    *   **Setup Quality Ranking:** You MUST rank the quality of the setup as 'A+ Setup', 'A Setup', 'B Setup', or 'C Setup'. This ranking is critical and should reflect the confluence of factors.
        -   **'A+ Setup':** Near-perfect alignment across all timeframes. Strong higher timeframe trend, clear pullback to a significant POI, and a textbook confirmation on the entry timeframe. Very high probability.
        -   **'A Setup':** Strong alignment across timeframes with clear confirmations. Minor counter-trend factors might be present but are insignificant. High probability.
        -   **'B Setup':** Good setup, but with some notable counter-arguments. For example, the setup might be against the higher timeframe trend, or the entry confirmation might be weak. Moderate probability.
        -   **'C Setup':** A marginal setup with significant risks. The thesis relies on weaker evidence, and there are strong opposing factors. Lower probability.

**User Preferences:**
- Trading Style: ${tradingStyle}
- Risk-to-Reward Ratio: ${riskReward} (Apply this to your SL/TP calculations for BUY/SELL signals)

**STRICT JSON OUTPUT REQUIREMENTS:**
You MUST respond ONLY with a single, valid JSON object matching the schema below. No markdown, no commentary, just the JSON. Your 'tenReasons' list MUST include at least two points derived from your web search (if used, for non-synthetic assets), prefixed with a 🌐 emoji.

**JSON Schema:**
{
  "asset": "string",
  "timeframe": "string (of the Primary chart)",
  "signal": "'BUY', 'SELL', or 'NEUTRAL'",
  "confidence": "number (percentage, e.g., 85)",
  "entry": "string (or 'N/A' for NEUTRAL)",
  "stopLoss": "string (or 'N/A' for NEUTRAL)",
  "takeProfits": ["string array (or ['N/A'] for NEUTRAL)"],
  "setupQuality": "string ('A+ Setup', 'A Setup', 'B Setup', 'C Setup', or 'N/A' if signal is NEUTRAL)",
  "reasoning": "string (Your core thesis, 2-4 sentences max, synthesizing all timeframes and web research)",
  "tenReasons": ["string array (5-10 compelling, distinct points with leading emojis: ✅ for bullish, ❌ for bearish, ⚠️ for neutral/cautionary, 🌐 for web context, referencing different timeframes)"],
  "alternativeScenario": "string (The invalidation thesis. What price action would negate your signal?)",
  "sources": "This will be populated by the system if web search is used."
}`;

const getBotPrompt = (description: string, language: BotLanguage) => `You are an expert MQL developer. Your task is to generate the code for a trading bot (Expert Advisor) based on the user's description.
- Language: ${language}
- User Description of desired behavior: "${description}"
IMPORTANT: At the very top of the generated code, you MUST include the following MQL properties:
#property copyright "Generated by Grey Algo Apex Trader"
#property link      "https://greyalgo-trading.netlify.app"
#property description "Also visit Quant Systems Trading: https://quant-systems-trading.netlify.app"
After these properties, generate the complete, functional, and well-commented ${language} code. The code must be ready to be compiled in MetaEditor. Respond with ONLY the raw code, without any surrounding text, explanations, or markdown code blocks.`;

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

// --- SERVICE FUNCTIONS ---

export const analyzeChart = async (
  chartFiles: { [key: string]: File | null },
  riskReward: string,
  tradingStyle: string
): Promise<AnalysisResult> => {
  const parts: Part[] = [
    { text: getAnalysisPrompt(tradingStyle, riskReward) },
  ];

  const fileTypeMap: { [key: string]: string } = {
    higher: 'Higher Timeframe Chart:',
    primary: 'Primary Timeframe Chart:',
    entry: 'Entry Timeframe Chart:',
  };
  
  for (const key of ['higher', 'primary', 'entry']) {
    if (chartFiles[key]) {
      const { data, mimeType } = await fileToBase64(chartFiles[key]!);
      parts.push({ text: fileTypeMap[key] });
      parts.push({
        inlineData: { mimeType, data },
      });
    }
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
        tools: [{googleSearch: {}}],
    }
  });

  const parsedResult = robustJsonParse(response.text) as AnalysisResult;

  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
      .map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Source',
      }))
      .filter((source: GroundingSource) => source.uri);
  }

  return parsedResult;
};

export const createBot = async ({ description, language }: { description: string; language: BotLanguage; }): Promise<string> => {
    const prompt = getBotPrompt(description, language);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    // FIX: Use response.text to directly get the string output.
    return response.text;
};

export const createIndicator = async ({ description, language }: { description: string; language: IndicatorLanguage; }): Promise<string> => {
    const prompt = getIndicatorPrompt(description, language);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    // FIX: Use response.text to directly get the string output.
    return response.text;
};

export const getMarketSentiment = async (asset: string): Promise<MarketSentimentResult> => {
    const prompt = getMarketSentimentPrompt(asset);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        }
    });

    const parsedResult = robustJsonParse(response.text) as MarketSentimentResult;

    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        parsedResult.sources = response.candidates[0].groundingMetadata.groundingChunks
            .map((chunk: any) => ({
                uri: chunk.web?.uri || '',
                title: chunk.web?.title || 'Source',
            }))
            .filter((source: GroundingSource) => source.uri);
    }

    return parsedResult;
};

export const getTradingJournalFeedback = async (trades: TradeEntry[]): Promise<JournalFeedback> => {
    const prompt = getJournalFeedbackPrompt(trades);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
        }
    });
    return robustJsonParse(response.text) as JournalFeedback;
};

export const processCommandWithAgent = async (command: string): Promise<GenerateContentResponse> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: command,
        config: {
            tools: agentTools
        }
    });
    return response;
};