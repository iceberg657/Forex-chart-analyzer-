import React, { useState } from 'react';
import { ChatMessage, GroundingSource } from '../types';
import SimpleMarkdown from './SimpleMarkdown';

const SourcesCard: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => (
    <div className="mt-2">
        <div className="bg-black/10 dark:bg-black/20 p-2 rounded-lg">
            <h4 className="text-xs font-semibold mb-1 text-gray-400">Sources:</h4>
            <ul className="space-y-1">
                {sources.map((source, index) => (
                    <li key={index} className="flex items-center">
                        <i className="fas fa-link text-xs mr-2 text-gray-500"></i>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs truncate" title={source.title}>
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
    if (isModel) {
        const signalMatch = combinedText.match(/^signal:(BUY|SELL)\s*\n/i);
        if (signalMatch) {
            signal = signalMatch[1].toUpperCase() as 'BUY' | 'SELL';
        }
    }


    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else if (combinedText) {
            const utterance = new SpeechSynthesisUtterance(combinedText.replace(/^signal:(BUY|SELL)\s*\n/i, ''));
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };
    
    React.useEffect(() => {
      return () => {
        if (isSpeaking) {
          window.speechSynthesis.cancel();
        }
      }
    }, [isSpeaking, message.id]);

    return (
        <div className={`flex items-start gap-3 ${!isModel && 'flex-row-reverse'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isModel ? 'bg-red-500' : 'bg-gray-600'}`}>
                <i className={`fas ${isModel ? 'fa-robot' : 'fa-user'} text-white text-sm`}></i>
            </div>
            <div className={`max-w-xl p-3 rounded-xl ${isModel ? 'bg-[#262626] rounded-bl-none text-gray-200' : 'bg-blue-600 rounded-br-none text-white'}`}>
                {signal && (
                    <div className={`mb-2 font-bold text-lg p-2 rounded-md text-center ${signal === 'BUY' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
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
                            return <img key={index} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="user upload" className="rounded-lg max-w-xs" />;
                        }
                        return null;
                    })}
                </div>
                {sources && sources.length > 0 && <SourcesCard sources={sources} />}
                 {isModel && combinedText && (
                   <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <button onClick={handleSpeak} className="hover:text-blue-400 flex items-center" aria-label={isSpeaking ? 'Stop speech' : 'Read message aloud'}>
                           <i className={`fas ${isSpeaking ? 'fa-stop-circle' : 'fa-play-circle'} mr-1`}></i>
                           {isSpeaking ? 'Stop' : 'Listen'}
                        </button>
                        <div className="flex items-center gap-3">
                            <button onClick={() => onRate(id, 'up')} className={`transition-colors ${rating === 'up' ? 'text-green-400' : 'hover:text-white'}`} aria-label="Good response">
                                <i className="fas fa-thumbs-up"></i>
                            </button>
                             <button onClick={() => onRate(id, 'down')} className={`transition-colors ${rating === 'down' ? 'text-red-400' : 'hover:text-white'}`} aria-label="Bad response">
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