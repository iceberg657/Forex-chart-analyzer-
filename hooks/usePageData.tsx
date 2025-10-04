

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { PredictedEvent, MarketSentimentResult, ChatMessage, AnalysisResult } from '../types';

interface PageDataState {
    predictor: {
        events: PredictedEvent[] | null;
        error: string | null;
    };
    marketNews: {
        result: MarketSentimentResult | null;
        asset: string;
        error: string | null;
    };
    apexAI: {
        messages: ChatMessage[];
    };
    analysisHistory: {
        history: AnalysisResult[];
    };
}

interface PageDataContextType {
    pageData: PageDataState;
    setPredictorData: (data: { events: PredictedEvent[] | null; error: string | null; }) => void;
    setMarketNewsData: (data: { result: MarketSentimentResult | null; asset: string; error: string | null; }) => void;
    // FIX: Updated type to allow functional updates, e.g., setApexAIMessages(prev => [...prev, newMessage])
    setApexAIMessages: (messages: ChatMessage[] | ((prevMessages: ChatMessage[]) => ChatMessage[])) => void;
    clearApexChat: () => void;
    addAnalysisToHistory: (result: AnalysisResult) => void;
    clearAnalysisHistory: () => void;
}

const PageDataContext = createContext<PageDataContextType | undefined>(undefined);

const initialState: PageDataState = {
    predictor: { events: null, error: null },
    marketNews: { result: null, asset: '', error: null },
    apexAI: { messages: [] },
    analysisHistory: { history: [] },
};

export const PageDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pageData, setPageData] = useState<PageDataState>(() => {
        let history: AnalysisResult[] = [];
        try {
            const savedHistory = localStorage.getItem('analysisHistory');
            if (savedHistory) {
                history = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error("Failed to parse analysis history from localStorage", error);
            localStorage.removeItem('analysisHistory');
        }
        return { ...initialState, analysisHistory: { history } };
    });

    const setPredictorData = (data: { events: PredictedEvent[] | null; error: string | null; }) => {
        setPageData(prev => ({ ...prev, predictor: data }));
    };

    const setMarketNewsData = (data: { result: MarketSentimentResult | null; asset: string; error: string | null; }) => {
        setPageData(prev => ({ ...prev, marketNews: data }));
    };

    // FIX: Updated implementation to handle both direct array and functional updates for messages.
    const setApexAIMessages = (messages: ChatMessage[] | ((prevMessages: ChatMessage[]) => ChatMessage[])) => {
        setPageData(prev => {
            const newMessages = typeof messages === 'function' ? messages(prev.apexAI.messages) : messages;
            return {
                ...prev,
                apexAI: { ...prev.apexAI, messages: newMessages },
            };
        });
    };
    
    const clearApexChat = () => {
        setPageData(prev => ({ ...prev, apexAI: { messages: [] } }));
    };

    const addAnalysisToHistory = (result: AnalysisResult) => {
        setPageData(prev => {
            const newHistory = [result, ...prev.analysisHistory.history];
            try {
                localStorage.setItem('analysisHistory', JSON.stringify(newHistory));
            } catch (error) {
                console.error("Failed to save analysis history to localStorage", error);
            }
            return { ...prev, analysisHistory: { history: newHistory } };
        });
    };

    const clearAnalysisHistory = () => {
        try {
            localStorage.removeItem('analysisHistory');
        } catch (error) {
            console.error("Failed to remove analysis history from localStorage", error);
        }
        setPageData(prev => ({ ...prev, analysisHistory: { history: [] } }));
    };

    const value = {
        pageData,
        setPredictorData,
        setMarketNewsData,
        setApexAIMessages,
        clearApexChat,
        addAnalysisToHistory,
        clearAnalysisHistory,
    };

    return (
        <PageDataContext.Provider value={value}>
            {children}
        </PageDataContext.Provider>
    );
};

export const usePageData = (): PageDataContextType => {
    const context = useContext(PageDataContext);
    if (!context) {
        throw new Error('usePageData must be used within a PageDataProvider');
    }
    return context;
};