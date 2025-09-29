import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-red-500">
        <i className="fas fa-robot text-white text-sm"></i>
      </div>
      <div className="max-w-xl p-3 rounded-xl bg-gray-500/10 dark:bg-gray-900/40 rounded-bl-none">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
