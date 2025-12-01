
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { symbol } = req.query;
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!symbol || typeof symbol !== 'string') {
        return res.status(400).json({ message: 'Symbol query parameter is required.' });
    }

    if (!apiKey) {
        console.error("ALPHA_VANTAGE_API_KEY environment variable is not set.");
        return res.status(500).json({ message: 'Server configuration error: The Alpha Vantage API key is not configured.' });
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    try {
        const apiResponse = await fetch(url);
        if (!apiResponse.ok) {
            throw new Error(`Alpha Vantage API request failed with status ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        
        if (data.Note) {
             return res.status(429).json({ message: 'Alpha Vantage API rate limit reached.' });
        }

        const quote = data['Global Quote'];
        if (!quote || Object.keys(quote).length === 0) {
            return res.status(404).json({ message: `No quote data found for symbol: ${symbol}.` });
        }
        
        if (!quote['05. price'] || !quote['09. change'] || !quote['10. change percent']) {
            return res.status(500).json({ message: `Incomplete quote data for symbol: ${symbol}.` });
        }

        const result = {
            price: parseFloat(quote['05. price']).toFixed(2),
            change: parseFloat(quote['09. change']).toFixed(2),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')).toFixed(2) + '%'
        };

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // Cache for 1 minute
        return res.status(200).json(result);

    } catch (error) {
        console.error("Error fetching from Alpha Vantage in proxy:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return res.status(502).json({ message: `Bad Gateway: ${errorMessage}` });
    }
}
