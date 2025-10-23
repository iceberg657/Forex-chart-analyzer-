import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, GroundingSource } from '../types';
import SimpleMarkdown from './SimpleMarkdown';
import { generateSpeech } from '../services/unifiedApiService';
import { decode, decodeAudioData } from '../utils/audioUtils';


const SourcesCard: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => (
    <div className="mt-2">
        <div className="bg-black/5 dark:bg-black/20 p-2 rounded-lg">
            <h4 className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400">Sources:</h4>
            <ul className="space-y-1">
                {sources.map((source, index) => (
                    <li key={index} className="flex items-center">
                        <i className="fas fa-link text-xs mr-2 text-gray-500"></i>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate" title={source.title}>
                            {source.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

interface ChatBubbleProps {
    message: ChatMessage;
    onRate: (messageId: string, rating: 'up' | 'down') => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onRate }) => {
    const { id, role, parts, sources, rating } = message;
    const isModel = role === 'model';
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    
    const combinedText = parts.map(p => p.text || '').join('\n');
    const textToSpeak = combinedText.replace(/^signal:(BUY|SELL)\s*\n/i, '').trim();

    let signal: 'BUY' | 'SELL' | null = null;
    if (isModel) {
        const signalMatch = combinedText.match(/^signal:(BUY|SELL)\s*\n/i);
        if (signalMatch) {
            signal = signalMatch[1].toUpperCase() as 'BUY' | 'SELL';
        }
    }

    const stopPlayback = () => {
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.stop();
            } catch (e) {
                // Ignore errors if stop is called on an already stopped source.
            }
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        setIsSpeaking(false);
    };

    const handleSpeak = async () => {
        if (isSpeaking) {
            stopPlayback();
            return;
        }
        
        if (!textToSpeak) return;
        
        setIsSpeaking(true);
        setAudioError(null);

        try {
            const base64Audio = await generateSpeech(textToSpeak);

            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const context = audioContextRef.current;
            if (context.state === 'suspended') {
              await context.resume();
            }

            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                context,
                24000,
                1,
            );
            
            stopPlayback(); 
            setIsSpeaking(true);

            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            source.onended = () => {
                setIsSpeaking(false);
                sourceNodeRef.current = null;
            };
            source.start();
            sourceNodeRef.current = source;

        } catch (error) {
            console.error("TTS Error:", error);
            setAudioError("Couldn't play audio.");
            setIsSpeaking(false);
        }
    };
    
    useEffect(() => {
      return () => {
        stopPlayback();
      }
    }, []);

    return (
        <div className={`flex items-start gap-3 ${!isModel && 'flex-row-reverse'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isModel ? 'bg-red-500' : 'bg-gray-600'}`}>
                <i className={`fas ${isModel ? 'fa-robot' : 'fa-user'} text-white text-sm`}></i>
            </div>
            <div className={`max-w-xl p-3 rounded-xl ${isModel ? 'bg-gray-200 dark:bg-[#262626] rounded-bl-none text-gray-800 dark:text-gray-200' : 'bg-blue-600 rounded-br-none text-white'}`}>
                {signal && (
                    <div className={`mb-2 font-bold text-lg p-2 rounded-md text-center ${signal === 'BUY' ? 'bg-green-500/20 text-green-500 dark:text-green-300' : 'bg-red-500/20 text-red-500 dark:text-red-300'}`}>
                        {signal === 'BUY' ? <><i className="fas fa-arrow-trend-up mr-2"></i>BUY SIGNAL</> : <><i className="fas fa-arrow-trend-down mr-2"></i>SELL SIGNAL</>}
                    </div>
                )}
                <div className="space-y-2">
                    {parts.map((part, index) => {
                        if (part.text) {
                            let textToRender = part.text;
                            // Only process the first text part to remove the signal text
                            if (index === parts.findIndex(p => p.text) && signal) {
                                textToRender = textToRender.replace(/^signal:(BUY|SELL)\s*\n/i, '');
                            }
                            return <SimpleMarkdown key={index} text={textToRender} />;
                        }
                        if (part.inlineData) {
                            return <img key={index} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="user upload" className="rounded-lg max-w-64" />;
                        }
                        return null;
                    })}
                </div>
                {sources && sources.length > 0 && <SourcesCard sources={sources} />}
                 {isModel && textToSpeak && (
                   <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <div>
                          <button onClick={handleSpeak} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed" aria-label={isSpeaking ? 'Stop speech' : 'Read message aloud'}>
                             <i className={`fas ${isSpeaking ? 'fa-stop-circle' : 'fa-play-circle'} mr-1`}></i>
                             {isSpeaking ? 'Stop' : 'Listen'}
                          </button>
                           {audioError && <p className="text-red-500 text-xs mt-1">{audioError}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => onRate(id, 'up')} className={`transition-colors ${rating === 'up' ? 'text-green-500 dark:text-green-400' : 'hover:text-black dark:hover:text-white'}`} aria-label="Good response">
                                <i className="fas fa-thumbs-up"></i>
                            </button>
                             <button onClick={() => onRate(id, 'down')} className={`transition-colors ${rating === 'down' ? 'text-red-500 dark:text-red-400' : 'hover:text-black dark:hover:text-white'}`} aria-label="Bad response">
                                <i className="fas fa-thumbs-down"></i>
                            </button>
                        </div>
                   </div>
                )}
            </div>
        </div>
    );
};

export default ChatBubble;