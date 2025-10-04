import React, { useState, useEffect } from 'react';
import { getAutoFixSuggestion } from '../services/agentService';
import Spinner from './Spinner';

interface LoggedError {
  message: string;
  stack?: string;
  type: 'error' | 'rejection';
}

const ErrorLog: React.FC = () => {
  const [errors, setErrors] = useState<LoggedError[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrors(prev => [...prev, { message: event.message, stack: event.error?.stack, type: 'error' }]);
      setIsOpen(true);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      let message = 'Unhandled promise rejection.';
      let stack;
      if (event.reason instanceof Error) {
        message = event.reason.message;
        stack = event.reason.stack;
      } else if (typeof event.reason === 'string') {
        message = event.reason;
      }
      setErrors(prev => [...prev, { message, stack, type: 'rejection' }]);
      setIsOpen(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const handleClear = () => {
    setErrors([]);
    setSuggestion('');
  };

  const handleGetSuggestion = async () => {
    if (errors.length === 0) return;
    setIsLoading(true);
    setSuggestion('');
    try {
      const suggestionText = await getAutoFixSuggestion(errors);
      setSuggestion(suggestionText);
    } catch (err) {
      setSuggestion(`Error getting suggestion: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (errors.length === 0 && !isOpen) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 left-4 z-[1000] bg-yellow-500 text-black w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl font-bold hover:bg-yellow-400 transition-colors"
          aria-label="Open Error Log"
        >
          {errors.length}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-gray-800 text-white shadow-2xl-top rounded-t-lg max-h-screen flex flex-col">
          <header className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-700 flex-shrink-0">
            <h3 className="font-bold text-sm">AI Studio Error Log ({errors.length})</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGetSuggestion}
                disabled={isLoading || errors.length === 0}
                className="text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 px-2 py-1 rounded"
              >
                {isLoading ? 'Getting Fix...' : 'Auto Fix'}
              </button>
              <button onClick={handleClear} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">Clear</button>
              <button onClick={() => setIsOpen(false)} className="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded">Close</button>
            </div>
          </header>
          <div className="p-2 overflow-y-auto flex-1 max-h-[40vh]">
            {isLoading && (
              <div className="flex justify-center items-center h-full">
                <Spinner />
              </div>
            )}
            {suggestion && !isLoading && (
              <div className="mb-4">
                <h4 className="font-bold text-green-400 text-sm mb-1">AI Fix Suggestion:</h4>
                <pre className="text-xs bg-black p-2 rounded whitespace-pre-wrap font-mono">{suggestion}</pre>
              </div>
            )}
            {errors.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {errors.map((error, index) => (
                  <li key={index} className="bg-red-900/50 p-2 rounded">
                    <p className="font-bold">{error.message}</p>
                    {error.stack && <pre className="mt-1 text-red-300 whitespace-pre-wrap font-mono">{error.stack}</pre>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">No errors logged.</p>
            )}
          </div>
        </div>
      )}
      <style>{`.shadow-2xl-top { box-shadow: 0 -10px 15px -3px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05); }`}</style>
    </>
  );
};

export default ErrorLog;
