import React, { useState } from 'react';
import { ChatMessage, GroundingSource } from '../types';
import SimpleMarkdown from './SimpleMarkdown';

const SourcesCard: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => (
    <div className="mt-2">
        <div className="bg-black/10 dark:bg-white/5 p-2 rounded-lg">
            <h4 className="text-xs font-semibold mb-1">Sources:</h4>
            <ul className="space-y-1">
                {sources.map((source, index) => (
                    <li key={index} className="flex items-center">
                        <i className="fas fa-link text-xs mr-2"></i>
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate" title={source.title}>
                            {source.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);


const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const { role, parts, sources } = message;
    const isModel = role === 'model';
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const combinedText = parts.map(p => p.text || '').join('\n');

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else if (combinedText) {
            const utterance = new SpeechSynthesisUtterance(combinedText);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };
    
    // Cleanup synthesis on component unmount or if message changes
    React.useEffect(() => {
      return () => {
        if (isSpeaking) {
          window.speechSynthesis.cancel();
        }
      }
    }, [isSpeaking, message.id]);

    return (
        <div className={`flex items-end gap-2 ${!isModel && 'flex-row-reverse'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isModel ? 'bg-red-500' : 'bg-gray-500'}`}>
                <i className={`fas ${isModel ? 'fa-robot' : 'fa-user'} text-white text-sm`}></i>
            </div>
            <div className={`max-w-xl p-3 rounded-xl ${isModel ? 'bg-gray-500/10 dark:bg-gray-900/40 rounded-bl-none' : 'bg-red-500/10 dark:bg-red-900/40 rounded-br-none'}`}>
                <div className="space-y-2">
                    {parts.map((part, index) => {
                        if (part.text) {
                            return <SimpleMarkdown key={index} text={part.text} />;
                        }
                        if (part.inlineData) {
                            return <img key={index} src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="user upload" className="rounded-lg max-w-xs" />;
                        }
                        return null;
                    })}
                </div>
                {sources && sources.length > 0 && <SourcesCard sources={sources} />}
                {isModel && combinedText && (
                   <button onClick={handleSpeak} className="mt-2 text-xs text-gray-500 hover:text-red-500" aria-label={isSpeaking ? 'Stop speech' : 'Read message aloud'}>
                       <i className={`fas ${isSpeaking ? 'fa-stop-circle' : 'fa-play-circle'} mr-1`}></i>
                       {isSpeaking ? 'Stop' : 'Listen'}
                   </button>
                )}
            </div>
        </div>
    );
};

export default ChatBubble;
