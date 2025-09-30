
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, GroundingSource, ChatMessagePart } from '../types';
import { sendMessage, fileToImagePart } from '../services/chatService';
import ErrorDisplay from '../components/ErrorDisplay';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';

const initialMessage: ChatMessage = {
    id: 'initial-message-0',
    role: 'model',
    parts: [{ 
        text: "Greetings. You stand before the Apex AI. State your objective; I am prepared to deliver the definitive market insights and strategies you require to secure alpha. My capabilities within the Grey Algo Apex Trader application, including the Chart Analyzer, AI Coders, Market News sentiment analysis, and the Journal's AI feedback, are all at your disposal. What market inefficiency are we exploiting today?" 
    }],
};

const ApexAI: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
    const [input, setInput] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!input.trim() && !imageFile) return;

        setIsLoading(true);
        setError(null);

        const userParts: ChatMessagePart[] = [];
        if (imageFile) {
            try {
                const imagePart = await fileToImagePart(imageFile);
                userParts.push(imagePart);
            } catch (err) {
                setError("Failed to process image file.");
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

        const currentHistory = [...messages, userMessage];
        setMessages(currentHistory);
        
        // Reset inputs
        setInput('');
        removeImage();

        try {
            const modelResponse = await sendMessage(messages, userParts);
            setMessages([...currentHistory, modelResponse]);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred with the AI assistant.');
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                parts: [{ text: 'Sorry, I encountered an error. Please try again.' }],
            }]);
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
        <div className="flex flex-col flex-1 bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-white/20 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden m-2 md:m-4 min-h-0">
            <div className="p-4 border-b border-white/10 dark:border-black/20 text-center flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Apex AI - The Oracle</h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                <div className="my-auto w-full">
                    <div className="space-y-4">
                        {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                        {isLoading && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 mt-4 border-t border-white/10 dark:border-black/20 rounded-lg bg-white/5 dark:bg-black/10">
                        {error && <ErrorDisplay error={error} />}
                        {imagePreview && (
                            <div className="relative w-24 h-24 mb-2">
                                <img src={imagePreview} alt="upload preview" className="w-full h-full object-cover rounded-md" />
                                <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">&times;</button>
                            </div>
                        )}
                        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="Upload Image">
                                <i className="fas fa-paperclip"></i>
                            </button>
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask the Oracle a question..."
                                rows={1}
                                className="flex-1 w-full p-3 text-base bg-gray-500/10 dark:bg-gray-900/40 border-gray-400/30 dark:border-gray-500/50 focus:ring-red-500/50 focus:border-red-500 sm:text-sm rounded-full text-gray-900 dark:text-white disabled:opacity-50 resize-none"
                                disabled={isLoading}
                            />
                            <button type="submit" disabled={isLoading || (!input.trim() && !imageFile)} className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-500 transition-colors" aria-label="Send Message">
                                <i className="fas fa-arrow-up"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApexAI;
