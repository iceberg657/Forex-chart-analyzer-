import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY is not set in environment variables.');
    return res.status(500).json({ error: { message: 'Server configuration error: API key is missing.' } });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const params = req.body;

    if (!params || typeof params !== 'object') {
        return res.status(400).json({ error: { message: 'Invalid request body. Expected a JSON object.' }});
    }

    const response = await ai.models.generateContent(params);
    
    // Construct a serializable plain JSON object from the SDK response
    const serializableResponse = {
        text: response.text,
        functionCalls: response.functionCalls,
        candidates: response.candidates,
    };
    
    return res.status(200).json(serializableResponse);

  } catch (error: any) {
    console.error('Error calling Gemini API via proxy:', error);
    return res.status(500).json({ error: { message: error.message || 'An internal server error occurred.' } });
  }
}
