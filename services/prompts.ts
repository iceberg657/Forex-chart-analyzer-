import { TradeEntry } from '../types';

export const getAnalysisPrompt = (tradingStyle: string, riskReward: string): string => `
**TASK:** Analyze financial chart image(s) and generate a single, valid JSON object representing a trade setup.

**CRITICAL INSTRUCTIONS:**
1.  **JSON ONLY:** Your entire response MUST be a single, valid JSON object.
2.  **NO EXTRA TEXT:** Do not include ANY text, conversation, or explanations outside the JSON object. The response should start with \`{\` and end with \`}\`.
3.  **USER CONTEXT:**
    - Trading Style: ${tradingStyle}
    - Desired Risk/Reward: ${riskReward}

**JSON SCHEMA:**
{
  "asset": "string // Identify the asset from the chart (e.g., 'EUR/USD', 'BTC/USD').",
  "timeframe": "string // Identify the primary timeframe from the chart (e.g., '4H', '15m').",
  "signal": "'BUY' | 'SELL' | 'NEUTRAL' // Your primary trading signal.",
  "confidence": "number // Your confidence level in the signal, as a percentage (e.g., 85).",
  "entry": "string // The specific entry price for the trade. If neutral, provide a key level to watch.",
  "stopLoss": "string // The specific stop-loss price. If neutral, provide a key level.",
  "takeProfits": "string[] // An array of 1 to 3 take-profit price levels.",
  "setupQuality": "'A+ Setup' | 'A Setup' | 'B Setup' | 'C Setup' | 'N/A' // Grade the setup quality.",
  "reasoning": "string // A detailed, professional paragraph explaining the entire trade thesis.",
  "tenReasons": "string[] // An array of 10 distinct, concise reasons supporting your thesis. Start each reason with an appropriate emoji (e.g., '✅', '📈', '📉').",
  "alternativeScenario": "string // A brief explanation of what price action would invalidate your thesis."
}

**BEGIN JSON RESPONSE:**
`;

export const getBotPrompt = (description: string, language: string): string => `
**TASK:** Generate a complete, single-file MQL source code for a trading bot (Expert Advisor).

**LANGUAGE:** ${language}

**STRICT REQUIREMENTS:**
1.  **CODE ONLY:** The entire response must be ONLY the raw source code.
2.  **NO EXTRA TEXT:** DO NOT include explanations, greetings, titles, or markdown formatting like \`\`\`mql5 ... \`\`\`.
3.  **COMPLETE & COMPILABLE:** The code must be fully functional and ready to compile. This includes all '#property' definitions, input parameters, event handlers ('OnInit', 'OnDeinit', 'OnTick'), and the core trading logic.
4.  **CUSTOMIZABLE INPUTS:** Expose all key strategic variables (e.g., Moving Average periods, RSI levels, lot size, stop loss, take profit) as 'input' parameters so the user can easily customize the bot.
5.  **CLEAR COMMENTS:** Add concise comments to explain the main sections of the code: inputs, global variables, initialization, entry conditions, exit conditions, and trade management logic.
6.  **BASIC ERROR HANDLING:** Implement basic checks for trade execution results (e.g., from 'OrderSend').

**USER'S BOT DESCRIPTION:**
"${description}"

**BEGIN ${language} CODE:**
`;

export const getIndicatorPrompt = (description: string, language: string): string => {
    return `
**TASK:** Generate a complete, single-file source code for a trading indicator.

**LANGUAGE:** ${language}

**STRICT REQUIREMENTS:**
1.  **CODE ONLY:** The entire response must be ONLY the raw source code.
2.  **NO EXTRA TEXT:** DO NOT include any explanations, greetings, titles, or markdown formatting like \`\`\` ... \`\`\`.
3.  **COMPLETE & COMPILABLE:** The code must be fully functional and ready to compile in its target platform (MetaEditor for MQL, TradingView for Pine Script).
4.  **CUSTOMIZABLE INPUTS:** Expose all key variables (e.g., indicator periods, levels, colors) as 'input' parameters so the user can easily customize the indicator.
5.  **CLEAR COMMENTS:** Add concise comments to explain the core calculation logic and plotting instructions.

**USER'S INDICATOR DESCRIPTION:**
"${description}"

**BEGIN ${language} CODE:**
`;
};

export const getChatSystemInstruction = (): string => `You are Apex AI, a senior institutional quantitative analyst integrated into the 'Grey Algo Apex Trader' application. Your role is to be an expert trading assistant.

**Core Directives:**
1.  **Be Professional & Data-Driven:** Provide high-value, actionable insights.
2.  **Analyze Charts:** When a user provides a chart image and asks for analysis, perform a detailed analysis and give a trade setup.
3.  **Explain Concepts:** Clearly explain trading concepts (e.g., 'order blocks', 'RSI').
4.  **Use Search:** Leverage Google Search for real-time market news and sentiment.
5.  **Critical Instruction - Trade Signals:** If your analysis results in a clear buy or sell recommendation, you MUST begin your entire response with either \`signal:BUY\` or \`signal:SELL\` on its own separate line, followed by your reasoning. Example:
    \`signal:BUY

    The setup on EUR/USD is bullish due to the bounce from the daily support...\`
6.  **No Signal:** For all other responses (greetings, explanations, general chat), DO NOT use the \`signal:\` prefix.
`;

export const getMarketSentimentPrompt = (asset: string): string => `
**TASK:** Perform a market sentiment analysis for a given financial asset using Google Search and return the results as a single JSON object.

**CRITICAL INSTRUCTIONS:**
1.  **JSON ONLY:** Your entire response MUST be a single, valid JSON object.
2.  **NO EXTRA TEXT:** Do not include ANY text, conversation, or explanations outside the JSON object. The response should start with \`{\` and end with \`}\`.
3.  **ASSET:** ${asset}

**JSON SCHEMA:**
{
  "asset": "string // The asset being analyzed, should match '${asset}'.",
  "sentiment": "'Bullish' | 'Bearish' | 'Neutral' // Your overall sentiment.",
  "confidence": "number // Your confidence level in the sentiment, as an integer from 0 to 100.",
  "summary": "string // A concise, 2-3 sentence summary of the current market sentiment and its key drivers.",
  "keyPoints": "string[] // An array of 3-5 bullet points highlighting the most important news or technical factors."
}

**BEGIN JSON RESPONSE:**
`;

export const getJournalFeedbackPrompt = (trades: TradeEntry[]): string => `
**TASK:** Analyze a list of trading journal entries and return a performance review as a single JSON object.

**CRITICAL INSTRUCTIONS:**
1.  **JSON ONLY:** Your entire response MUST be a single, valid JSON object.
2.  **NO EXTRA TEXT:** Do not include any text, conversation, or explanations outside the JSON object.

**INPUT DATA:**
${JSON.stringify(trades, null, 2)}

**JSON SCHEMA:**
{
  "overallPnl": "number // Calculate the total profit or loss from all trades.",
  "winRate": "number // Calculate the percentage of winning trades.",
  "strengths": "string[] // An array of 2-3 specific, positive trading habits observed.",
  "weaknesses": "string[] // An array of 2-3 specific, negative trading habits observed.",
  "suggestions": "string[] // An array of 2-3 actionable suggestions for improvement based on weaknesses."
}

**BEGIN JSON RESPONSE:**
`;

export const getPredictorPrompt = (): string => `
**TASK:** Use Google Search to find 3-5 high-impact economic news events for the upcoming week and return them as a JSON array.

**CRITICAL INSTRUCTIONS:**
1.  **JSON ARRAY ONLY:** Your entire response MUST be a single, valid JSON array.
2.  **NO EXTRA TEXT:** Do not include ANY text, conversation, or explanations outside the JSON array. The response must start with \`[\` and end with \`]\`.

**JSON SCHEMA FOR EACH OBJECT IN THE ARRAY:**
{
  "eventName": "string // The full name of the economic event.",
  "time": "string // The specific date and time of the event in 'YYYY-MM-DD HH:MM UTC' format.",
  "currency": "string // The primary currency or asset affected (e.g., 'USD', 'EUR').",
  "directionalBias": "'BUY' | 'SELL' // Your predicted short-term market direction for the currency.",
  "confidence": "number // Your confidence in this prediction, as an integer from 0 to 100.",
  "rationale": "string // A concise, one-sentence explanation for your prediction."
}

**BEGIN JSON RESPONSE:**
`;