import React, { useState, useEffect } from 'react';
import { processCommandWithAgent } from '../services/geminiService';
import { useAppContext } from '../hooks/useAppContext';
import Spinner from './Spinner';
import ErrorDisplay from './ErrorDisplay';
import { EdgeLightColor } from '../hooks/useEdgeLighting';

const AIAgent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const app = useAppContext();

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponseMessage(null);

    try {
      const result = await processCommandWithAgent(command);
      let message = "I'm not sure how to do that.";

      if (result.functionCalls) {
        message = "Done!";
        for (const call of result.functionCalls) {
            switch (call.name) {
                case 'navigate':
                    // FIX: Cast argument to the expected type 'string'.
                    app.navigate(call.args.page as string);
                    message = `Navigating to ${call.args.page}...`;
                    break;
                case 'changeTheme':
                    // FIX: Cast argument to the expected type '"light" | "dark"'.
                    app.changeTheme(call.args.theme as 'light' | 'dark');
                    message = `Switched to ${call.args.theme} mode.`;
                    break;
                case 'setEdgeLighting':
                    // FIX: Cast argument to the expected type 'EdgeLightColor'.
                    app.setEdgeLight(call.args.color as EdgeLightColor);
                    message = `Edge lighting set to ${call.args.color}.`;
                    break;
                case 'logout':
                    app.logout();
                    message = `Logging you out...`;
                    break;
                default:
                     console.warn(`Unknown function call: ${call.name}`);
            }
        }
      } else if (result.text) {
        message = result.text;
      }
      
      setResponseMessage(message);
      setCommand('');

      setTimeout(() => {
        setIsModalOpen(false);
        setResponseMessage(null);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Close modal with Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 z-[60]"
        aria-label="Open AI Assistant"
      >
        <i className="fas fa-robot text-2xl"></i>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-6 w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-center mb-4 text-gray-900 dark:text-white">AI App Assistant</h2>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">What would you like me to do? Try "Go to the journal" or "Change theme to dark".</p>
            
            {isLoading ? (
                <div className="py-8"><Spinner/></div>
            ) : error ? (
                <ErrorDisplay error={error}/>
            ) : responseMessage ? (
                <div className="text-center py-8 text-green-700 dark:text-green-300 font-semibold">{responseMessage}</div>
            ) : (
                <form onSubmit={handleCommandSubmit}>
                    <input
                        type="text"
                        value={command}
                        onChange={e => setCommand(e.target.value)}
                        placeholder="e.g., set edge lighting to red"
                        className="w-full pl-4 pr-4 py-3 text-base bg-gray-500/10 dark:bg-gray-900/40 border-gray-400/30 dark:border-gray-500/50 focus:ring-red-500/50 focus:border-red-500 sm:text-sm rounded-md text-gray-900 dark:text-white"
                        autoFocus
                    />
                    <button type="submit" className="w-full mt-4 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none">
                        Execute Command
                    </button>
                </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIAgent;