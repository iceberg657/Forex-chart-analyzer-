import React from 'react';

const ChatHeader: React.FC = () => {
    return (
        <header className="p-4 border-b border-black/10 dark:border-white/10 flex-shrink-0 bg-gray-200 dark:bg-[#1e1e1e] rounded-t-xl">
            <h1 className="text-lg font-bold text-center text-gray-800 dark:text-gray-200">Apex AI Assistant</h1>
        </header>
    );
};

export default ChatHeader;
