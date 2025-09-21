import React, { useState } from 'react';
import { useApiStatus } from '../hooks/useApiStatus';

const ApiKeyErrorModal: React.FC = () => {
  const [inputKey, setInputKey] = useState('');
  const { setApiKey } = useApiStatus();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-[10000]" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-red-500/50">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                 <svg className="h-6 w-6 text-red-600 dark:text-red-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6.364-3.636l-1.414 1.414M20.364 13.364l-1.414-1.414M18 9h2M4 9h2m14-4l-1.414 1.414M6.364 6.364L4.95 4.95M12 4V2m0 18v-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
          <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white" id="modal-title">
            Enter Your API Key
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Please enter your Gemini API key to enable the AI features. If you are in AI Studio, this should be configured automatically. Otherwise, please provide your key.
            </p>
             <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Your key is stored only in your browser's local storage.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
                 <label htmlFor="api-key-input" className="sr-only">Gemini API Key</label>
                 <input
                    type="password"
                    id="api-key-input"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-400/30 dark:border-gray-500/50 bg-gray-500/10 dark:bg-gray-900/40 text-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="Enter your Gemini API key"
                    required
                 />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-red-500"
            >
              Save and Continue
            </button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyErrorModal;
