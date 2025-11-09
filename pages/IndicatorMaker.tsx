import React, { useState } from 'react';
import { INDICATOR_LANGUAGES } from '../constants';
import { IndicatorLanguage } from '../types';
import { createIndicator } from '../services/geminiService';
import Spinner from '../components/Spinner';
import CodeBlock from '../components/CodeBlock';
import { useAuth } from '../hooks/useAuth';
import ErrorDisplay from '../components/ErrorDisplay';

const IndicatorMaker: React.FC = () => {
  const [language, setLanguage] = useState<IndicatorLanguage>(IndicatorLanguage.PINE_SCRIPT);
  const [description, setDescription] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      setError("Please provide a description of the indicator's logic.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedCode(null);

    try {
      const code = await createIndicator({ description, language });
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
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI Indicator Maker</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Generate a custom trading indicator for MT4, MT5, or TradingView.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-8 space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value as IndicatorLanguage)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-500/10 dark:bg-gray-900/40 border-gray-400/30 dark:border-gray-500/50 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
              {INDICATOR_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Describe Indicator Logic</label>
          <textarea id="description" rows={8} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full bg-gray-500/10 dark:bg-gray-900/40 border-gray-400/30 dark:border-gray-500/50 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md text-gray-900 dark:text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed" placeholder="e.g., 'Create an indicator that plots arrows on the chart. A green up arrow should appear when the 10 EMA crosses above the 20 EMA...'"></textarea>
        </div>
        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-green-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed">
          {isLoading ? 'Generating Code...' : 'Generate Indicator'}
        </button>
      </form>
      
      {isLoading && <div className="mt-8"><Spinner /></div>}
      {error && <ErrorDisplay error={error} />}
      {generatedCode && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-center mb-4">Your Generated Indicator Code</h2>
          <CodeBlock code={generatedCode} language={language} />
        </div>
      )}
    </div>
  );
};

export default IndicatorMaker;