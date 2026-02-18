import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CHAT_KEYS } from './_env.js';
import { makeResilientCall } from './_resilience.js';
import { getChatSystemInstruction } from './_prompts.js';
import { ChatMessage, GroundingSource } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    if (CHAT_KEYS.length === 0) {
        return res.status(503).json({ message: 'Service Unavailable: Chat API keys are not configured.' });
    }
    
    try {
        const { history, newMessageParts } = req.body;
        if (!Array.isArray(history) || !Array.isArray(newMessageParts)) {
            return res.status(400).json({ message: 'Invalid request body' });
        }
        
        const contents = history.map((msg: ChatMessage) => ({ 
            role: msg.role, 
            parts: msg.parts.map(p => p.text ? { text: p.text } : p)
        }));
        contents.push({ role: 'user', parts: newMessageParts });

        const requestPayload = {
            contents: contents,
            config: { 
                systemInstruction: getChatSystemInstruction(),
                tools: [{ googleSearch: {} }]
            },
        };

        const responseStream = await makeResilientCall(CHAT_KEYS, requestPayload, true);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');

        let allSources: GroundingSource[] = [];

        for await (const chunk of responseStream) {
            const responseChunk: { textChunk?: string; sources?: GroundingSource[] } = {};
            if (chunk.text) {
                responseChunk.textChunk = chunk.text;
            }
            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                const chunkSources: GroundingSource[] = chunk.candidates[0].groundingMetadata.groundingChunks
                    .map((c: any) => ({ uri: c.web?.uri || '', title: c.web?.title || 'Source' }))
                    .filter((s: GroundingSource) => s.uri);
                
                const newSources = chunkSources.filter((cs) => !allSources.some(as => as.uri === cs.uri));
                
                if (newSources.length > 0) {
                    allSources = [...allSources, ...newSources];
                    responseChunk.sources = allSources;
                }
            }
            if (Object.keys(responseChunk).length > 0) {
                res.write(JSON.stringify(responseChunk) + '\n');
            }
        }
        res.end();

    } catch (error: any) {
        console.error("Error in /api/chat:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message || 'An internal server error occurred.' });
        } else {
            res.end();
        }
    }
}
