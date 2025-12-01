
export interface AlphaVantageQuote {
    price: string;
    change: string;
    changePercent: string;
}

export const getRealTimeQuote = async (symbol: string): Promise<AlphaVantageQuote | null> => {
    const url = `/api/alphavantage?symbol=${symbol}`;

    try {
        const response = await fetch(url);
        
        if (response.status === 404) {
            console.warn(`No quote data found for symbol: ${symbol}. Proxy returned 404.`);
            return null; // Gracefully handle "not found" as no data
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Alpha Vantage: ${errorData.message || `API request failed with status ${response.status}`}`);
        }

        const data: AlphaVantageQuote = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching from Alpha Vantage proxy:", error);
        throw error;
    }
};
