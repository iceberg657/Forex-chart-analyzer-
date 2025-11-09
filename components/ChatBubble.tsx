
import React, { useState, useEffect } from 'react';
import { ChatMessage, GroundingSource } from '../types';
import SimpleMarkdown from './SimpleMarkdown';


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
    
    const combinedText = parts.map(p => p.text || '').join('\n');
    
    let signal: 'BUY' | 'SELL' | null = null;
    let textToRender = combinedText;

    if (isModel) {
        const signalMatch = combinedText.match(/^signal:(BUY|SELL)/i);
        if (signalMatch) {
            signal = signalMatch[1].toUpperCase() as 'BUY' | 'SELL';
            textToRender = combinedText.replace(/^signal:(BUY|SELL)\s*\n?/i, '').trim();
        }
    }
    
    const textToSpeak = textToRender;

    const handleSpeak = () => {
        if (!textToSpeak || typeof window.speechSynthesis === 'undefined') return;
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("SpeechSynthesis Error", e);
            setIsSpeaking(false);
        };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };
    
    useEffect(() => {
        return () => {
            if (typeof window.speechSynthesis !== 'undefined') {
                 window.speechSynthesis.cancel();
            }
        };
    }, [id]);

    const hasVisibleText = textToRender.trim().length > 0;
    const hasImages = parts.some(p => p.inlineData);

    return (
        <div className={`flex items-start gap-3 ${!isModel && 'flex-row-reverse'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isModel ? 'bg-red-500' : 'bg-gray-600'}`}>
                <i className={`fas ${isModel ? 'fa-robot' : 'fa-user'} text-white text-sm`}></i>
            </div>
            <div className={`max-w-xl rounded-xl overflow-hidden ${isModel ? 'bg-gray-200 dark:bg-[#262626] rounded-bl-none text-gray-800 dark:text-gray-200' : 'bg-blue-600 rounded-br-none text-white'}`}>
                {isModel && signal && (() => {
                    const signalInfo = {
                        BUY: {
                            text: 'Strong Buy Signal',
                            bgColor: 'bg-green-500/10 dark:bg-green-500/20',
                            textColor: 'text-green-800 dark:text-green-200',
                            borderColor: 'border-green-500/50',
                            glowClasses: 'shadow-lg shadow-green-500/40 dark:shadow-green-400/30',
                        },
                        SELL: {
                            text: 'Strong Sell Signal',
                            bgColor: 'bg-red-500/10 dark:bg-red-500/20',
                            textColor: 'text-red-800 dark:text-red-200',
                            borderColor: 'border-red-500/50',
                            glowClasses: 'shadow-lg shadow-red-500/40 dark:shadow-red-400/30',
                        },
                    };
                    const info = signalInfo[signal];

                    return (
                        <div className={`p-4 border-b ${info.borderColor} ${info.bgColor} ${info.glowClasses}`}>
                            <div className="text-center">
                                <p className={`text-sm font-medium ${info.textColor}`}>Signal</p>
                                <p className={`text-2xl font-bold ${info.textColor}`}>{info.text}</p>
                            </div>
                        </div>
                    );
                })()}
                
                {(hasVisibleText || hasImages || (sources && sources.length > 0)) && (
                    <div className="p-3 text-sm">
                        <div className="space-y-2">
                            {hasVisibleText && <SimpleMarkdown text={textToRender} />}
                            {parts.map((part, index) => (
                                part.inlineData ? <img key={index} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="user upload" className="rounded-lg max-w-64" /> : null
                            ))}
                        </div>
                        {sources && sources.length > 0 && <SourcesCard sources={sources} />}
                        {isModel && textToSpeak && (
                           <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <div>
                                  <button onClick={handleSpeak} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed" aria-label={isSpeaking ? 'Stop speech' : 'Read message aloud'}>
                                     <i className={`fas ${isSpeaking ? 'fa-stop-circle' : 'fa-play-circle'} mr-1`}></i>
                                     {isSpeaking ? 'Stop' : 'Listen'}
                                  </button>
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
                )}
            </div>
        </div>
    );
};

export default ChatBubble;
