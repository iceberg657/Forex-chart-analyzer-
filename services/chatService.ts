
import { ChatMessage, ChatMessagePart } from "../types";

export const fileToImagePart = async (file: File): Promise<ChatMessagePart> => {
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });

    return {
        inlineData: {
            mimeType: file.type,
            data: base64Data,
        },
    };
};

export const sendMessage = async (history: ChatMessage[], newMessage: ChatMessagePart[]): Promise<ChatMessage> => {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, newMessage }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send message.');
    }

    return result.data as ChatMessage;
};
