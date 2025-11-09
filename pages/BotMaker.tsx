import React, { useState } from 'react';
import { BOT_LANGUAGES } from '../constants';
import { BotLanguage } from '../types';
import { createBot } from '../services/geminiService';
import Spinner from '../components/Spinner';
import CodeBlock from '../components/CodeBlock';
import { useAuth } from '../hooks/useAuth';
import ErrorDisplay from '../components/ErrorDisplay';

const BotMaker: React.FC = () => {
  const [language, setLanguage] = useState<BotLanguage>(BotLanguage.MQL5);
  const [description, setDescription] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      setError("Please provide a description of the bot's behavior.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedCode(null);

    try {
      const code = await createBot({ description, language });
      setGeneratedCode(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Bot Maker</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Generate a custom trading bot (Expert Advisor) in seconds.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-8 space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value as BotLanguage)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-500/10 dark:bg-gray-900/40 border-gray-400/30 dark:border-gray-500/50 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
              {BOT_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Describe Bot Behavior</label>
          <textarea id="description" rows={8} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full bg-gray-500/10 dark:bg-gray-900/40 border-gray-400/30 dark:border-gray-500/50 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed" placeholder="e.g., 'Open a buy trade when RSI is below 30 and a 50 EMA crosses above a 200 EMA. Close the trade when RSI is above 70...'"></textarea>
        </div>
        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-red-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed">
          {isLoading ? 'Generating Code...' : 'Generate Bot'}
        </button>
      </form>

      {isLoading && <div className="mt-8"><Spinner /></div>}
      {error && <ErrorDisplay error={error} />}
      {generatedCode && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-center mb-4">Your Generated Bot Code</h2>
          <CodeBlock code={generatedCode} language={language} />
        </div>
      )}
    </div>
  );
};

export default BotMaker;