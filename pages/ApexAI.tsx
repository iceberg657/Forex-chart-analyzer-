

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatMessagePart } from '../types';
import { sendMessageStream, fileToImagePart } from '../services/chatService';
import ErrorDisplay from '../components/ErrorDisplay';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';
import ChatHeader from '../components/ChatHeader';
import { usePageData } from '../hooks/usePageData';

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
            // FIX: Explicitly typing `newFiles` as `File[]` ensures correct type inference for the `map` function below.
            const newFiles: File[] = Array.from(files);
            setImageFiles(prev => [...prev, ...newFiles]);

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };
    
    const removeImage = (index: number) => {
        const urlToRevoke = imagePreviews[index];
        if (urlToRevoke) {
            URL.revokeObjectURL(urlToRevoke);
        }

        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const clearImages = () => {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImageFiles([]);
        setImagePreviews([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
                setError("Failed to process one or more image files.");
                setIsLoading(false);
                return;
            }
        }
        if (input.trim()) {
            userParts.push({ text: input });
        }
        
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            parts: userParts,
        };
        
        const modelMessageId = (Date.now() + 1).toString();
        const modelPlaceholder: ChatMessage = {
            id: modelMessageId,
            role: 'model',
            parts: [{ text: '' }],
        };

        setApexAIMessages(prevMessages => [...prevMessages, userMessage, modelPlaceholder]);
        
        setInput('');
        clearImages();

        try {
            let fullText = '';
            for await (const chunk of sendMessageStream(messages, userParts)) {
                if (chunk.textChunk) {
                    fullText += chunk.textChunk;
                    setApexAIMessages((prevMessages: ChatMessage[]) => 
                        prevMessages.map(msg => 
                            msg.id === modelMessageId 
                            ? { ...msg, parts: [{ text: fullText }] } 
                            : msg
                        )
                    );
                }
                if (chunk.sources) {
                    setApexAIMessages((prevMessages: ChatMessage[]) => 
                        prevMessages.map(msg => 
                            msg.id === modelMessageId 
                            ? { ...msg, sources: chunk.sources } 
                            : msg
                        )
                    );
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred with the AI assistant.');
            const errorText = 'Sorry, I encountered an error. Please try again.';
            setApexAIMessages((prevMessages: ChatMessage[]) => 
                prevMessages.map(msg => 
                    msg.id === modelMessageId 
                    ? { ...msg, parts: [{ text: errorText }] } 
                    : msg
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
        <div className="relative flex flex-col flex-1 h-full bg-gradient-to-br from-red-50 to-sky-100 dark:bg-gradient-to-br dark:from-slate-900 dark:to-indigo-900 text-gray-900 dark:text-white rounded-xl overflow-hidden">
            <ChatHeader />
            {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-16 h-16 mb-4">
                         <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <defs>
                              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                 <stop offset="0%" stopColor="#34d399" />
                                <stop offset="33%" stopColor="#38bdf8" />
                                <stop offset="66%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                              </linearGradient>
                            </defs>
                            <path d="M50 2.5 L95.5 26.25 V 73.75 L50 97.5 L4.5 73.75 V 26.25 Z" stroke="url(#logoGradient)" strokeWidth="5" />
                            <text x="50" y="68" fontFamily="Arial, sans-serif" fontSize="50" fontWeight="bold" fill="url(#logoGradient)" textAnchor="middle" >GA</text>
                            <path d="M25 70 L40 60 L55 75 L75 55" stroke="url(#logoGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                    </div>
                    <h1 className="text-3xl font-bold">Hi, I'm Apex AI</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">How can I help you today?</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => <ChatBubble key={msg.id} message={msg} onRate={handleRating} />)}
                    {isLoading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>
            )}
            
            <footer className="p-4 flex-shrink-0">
                 {error && <div className="mb-2"><ErrorDisplay error={error} /></div>}
                <form onSubmit={handleFormSubmit} className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-white/10 shadow-sm rounded-2xl p-2 flex flex-col gap-2">
                     {imagePreviews.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto p-2 border-b border-black/10 dark:border-white/10">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative w-16 h-16 flex-shrink-0">
                                    <img src={preview} alt={`upload preview ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                    <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10">&times;</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-end gap-2">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message Apex AI..."
                            rows={1}
                            style={{ maxHeight: '150px' }}
                            className="flex-1 w-full p-3 bg-transparent border-none focus:ring-0 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                            disabled={isLoading}
                        />
                        <div className="flex items-center gap-1">
                             <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload-chat" multiple />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10" aria-label="Attach file">
                                <i className="fas fa-plus text-lg text-gray-500 dark:text-gray-400"></i>
                            </button>
                            <button type="submit" disabled={isLoading || (!input.trim() && imageFiles.length === 0)} className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-500">
                                <i className="fas fa-arrow-up text-lg"></i>
                            </button>
                        </div>
                    </div>
                </form>
            </footer>

            {messages.length > 0 && (
                 <button
                    onClick={clearApexChat}
                    className="absolute bottom-24 right-6 bg-red-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 z-10"
                    aria-label="Start new chat"
                    title="Start new chat"
                >
                    <i className="fas fa-plus text-xl"></i>
                </button>
            )}
        </div>
    );
};

export default ApexAI;