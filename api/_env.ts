// This helper function reads all environment variables starting with "API_KEY_"
// and returns them as an array of strings, sorted numerically.
function getAllApiKeys(): string[] {
    const allKeys: string[] = [];
    let i = 1;
    // Loop to find all API_KEY_n variables until one is not found.
    while (process.env[`API_KEY_${i}`]) {
        const key = process.env[`API_KEY_${i}`];
        if (key) {
           allKeys.push(key);
        }
        i++;
    }
    
    if (allKeys.length === 0) {
        console.warn('CRITICAL: No API_KEY_n environment variables found. The application will not be able to make API calls.');
    }
    
    return allKeys;
}

const ALL_KEYS = getAllApiKeys();

// --- API Key Laning Strategy ---
// Distribute the collected keys into their dedicated pools for different application features.
// This isolates workloads and improves resilience.
export const ANALYSIS_KEYS = ALL_KEYS.slice(0, 3);     // Uses API_KEY_1, API_KEY_2, API_KEY_3
export const DASHBOARD_KEYS = ALL_KEYS.slice(3, 5);    // Uses API_KEY_4, API_KEY_5
export const CHAT_KEYS = ALL_KEYS.slice(5, 7);         // Uses API_KEY_6, API_KEY_7

// Log the distribution for debugging purposes during deployment.
console.log(`[API Key Service] Initialized. Total keys found: ${ALL_KEYS.length}. Distribution: Analysis(${ANALYSIS_KEYS.length}), Dashboard(${DASHBOARD_KEYS.length}), Chat(${CHAT_KEYS.length})`);


// --- Model Fallback Chains ---
// Define the model fallback chain in order of preference for standard calls.
export const MODEL_FALLBACK_CHAIN = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash-lite', 
];

// Define the model fallback chain for streaming calls.
export const STREAM_MODEL_FALLBACK_CHAIN = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash-lite',
];
