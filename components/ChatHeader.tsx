import React from 'react';

const ChatHeader: React.FC = () => {
    return (
        <header className="p-4 border-b border-black/10 dark:border-white/10 flex-shrink-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm">
            <h1 className="text-lg font-bold text-center text-gray-800 dark:text-gray-200">Apex AI Assistant</h1>
        </header>
    );
};

export default ChatHeader;
