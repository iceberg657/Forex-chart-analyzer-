import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatMessagePart } from '../types';
import { sendMessageStream, fileToImagePart } from '../services/chatService';
import ErrorDisplay from '../components/ErrorDisplay';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';
import { usePageData } from '../hooks/usePageData';
import NeuralNetworkBackground from '../components/NeuralNetworkBackground';

const ApexAI: React.FC = () => {
    const { pageData, setApexAIMessages, clearApexChat } = usePageData();
    const { messages } = pageData.apexAI;

    const [input, setInput] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles: File[] = Array.from(files);
            setImageFiles(prev => [...prev, ...newFiles]);
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };
    
    const removeImage = (index: number) => {
        const urlToRevoke = imagePreviews[index];
        if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    const clearImages = () => {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImageFiles([]);
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRating = (messageId: string, newRating: 'up' | 'down') => {
        const newMessages = messages.map(msg => {
            if (msg.id === messageId) {
                return { ...msg, rating: msg.rating === newRating ? null : newRating };
            }
            return msg;
        });
        setApexAIMessages(newMessages);
    };

    const handleSubmit = async () => {
        if (!input.trim() && imageFiles.length === 0) return;
        setIsLoading(true);
        setError(null);
        const userParts: ChatMessagePart[] = [];
        if (imageFiles.length > 0) {
            try {
                const imageParts = await Promise.all(imageFiles.map(fileToImagePart));
                userParts.push(...imageParts);
            } catch (err) {
                setError("Failed to process images.");
                setIsLoading(false);
                return;
            }
        }
        if (input.trim()) userParts.push({ text: input });
        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', parts: userParts };
        const modelMessageId = (Date.now() + 1).toString();
        const modelPlaceholder: ChatMessage = { id: modelMessageId, role: 'model', parts: [{ text: '' }] };
        setApexAIMessages(prevMessages => [...prevMessages, userMessage, modelPlaceholder]);
        setInput('');
        clearImages();
        try {
            let fullText = '';
            for await (const chunk of sendMessageStream(messages, userParts)) {
                if (chunk.textChunk) {
                    fullText += chunk.textChunk;
                    setApexAIMessages((prevMessages: ChatMessage[]) => 
                        prevMessages.map(msg => msg.id === modelMessageId ? { ...msg, parts: [{ text: fullText }] } : msg)
                    );
                }
                if (chunk.sources) {
                    setApexAIMessages((prevMessages: ChatMessage[]) => 
                        prevMessages.map(msg => msg.id === modelMessageId ? { ...msg, sources: chunk.sources } : msg)
                    );
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'AI error occurred.');
            const errorText = 'Sorry, I encountered an error. Please try again.';
            setApexAIMessages((prevMessages: ChatMessage[]) => 
                prevMessages.map(msg => 
                    msg.id === modelMessageId ? { ...msg, parts: [{ text: errorText }] } : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit();
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="relative flex flex-col flex-1 h-full bg-transparent text-gray-900 dark:text-white overflow-hidden">
            <NeuralNetworkBackground />
            
            {messages.length === 0 ? (
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-14 h-14 mb-3 drop-shadow-lg">
                         <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="Grey Algo Apex Trader Logo"
                          >
                            <defs>
                              <linearGradient id="logoGradientLanding" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: 'var(--logo-color-1)' }} />
                                <stop offset="33%" style={{ stopColor: 'var(--logo-color-2)' }} />
                                <stop offset="66%" style={{ stopColor: 'var(--logo-color-3)' }} />
                                <stop offset="100%" style={{ stopColor: 'var(--logo-color-4)' }} />
                              </linearGradient>
                            </defs>
                            <path d="M50 2.5 L95.5 26.25 V 73.75 L50 97.5 L4.5 73.75 V 26.25 Z" stroke="url(#logoGradientLanding)" strokeWidth="5" />
                            <text x="50" y="68" fontFamily="Arial, sans-serif" fontSize="50" fontWeight="bold" fill="url(#logoGradientLanding)" textAnchor="middle" >GA</text>
                            <path d="M25 70 L40 60 L55 75 L75 55" stroke="url(#logoGradientLanding)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                    </div>
                    <h1 className="text-xl font-bold uppercase tracking-tight">Hi, I'm Apex AI</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-xs">How can I help you today?</p>
                </div>
            ) : (
                <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full no-scrollbar">
                    {messages.map(msg => <ChatBubble key={msg.id} message={msg} onRate={handleRating} />)}
                    {isLoading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>
            )}
            
            <footer className="relative z-20 p-6 flex-shrink-0">
                <div className="max-w-3xl mx-auto w-full">
                    {error && <div className="mb-4"><ErrorDisplay error={error} /></div>}
                    <form onSubmit={handleFormSubmit} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl rounded-[2rem] p-3 flex flex-col gap-2 transition-all group focus-within:ring-2 focus-within:ring-red-500/30">
                         {imagePreviews.length > 0 && (
                            <div className="flex items-center gap-3 overflow-x-auto p-3 border-b border-white/10">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative w-20 h-20 flex-shrink-0 group/img">
                                        <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl border border-white/20" />
                                        <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm z-10 shadow-lg">&times;</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-3 px-4">
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message Apex AI..."
                                rows={1}
                                style={{ maxHeight: '150px' }}
                                className="flex-1 w-full py-4 bg-transparent border-none focus:ring-0 placeholder-gray-500 dark:placeholder-gray-400 resize-none font-medium text-base"
                                disabled={isLoading}
                            />
                            <div className="flex items-center gap-2">
                                 <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload-chat" multiple />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full hover:bg-white/10 text-gray-500 transition-all hover:text-white" aria-label="Attach context">
                                    <i className="fas fa-plus-circle text-xl"></i>
                                </button>
                                <button type="submit" disabled={isLoading || (!input.trim() && imageFiles.length === 0)} className="w-12 h-12 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-700 transition-all active:scale-90 shadow-lg shadow-red-500/20">
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </footer>

            {messages.length > 0 && (
                 <button
                    onClick={clearApexChat}
                    className="fixed bottom-28 right-8 bg-black dark:bg-white text-white dark:text-black w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-30"
                    aria-label="New Session"
                    title="New Session"
                >
                    <i className="fas fa-plus text-xl"></i>
                </button>
            )}
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};

export default ApexAI;