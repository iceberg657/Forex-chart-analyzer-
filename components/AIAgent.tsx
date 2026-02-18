import React, { useState, useEffect } from 'react';
import { processCommandWithAgent } from '../services/agentService';
import { useAppContext } from '../hooks/useAppContext';
import Spinner from './Spinner';
import ErrorDisplay from './ErrorDisplay';
import { EdgeLightColor } from '../hooks/useEdgeLighting';

interface AIAgentProps {
    inline?: boolean;
}

const AIAgent: React.FC<AIAgentProps> = ({ inline = false }) => {
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
                    const page = call.args.page;
                    if (typeof page === 'string') {
                        app.navigate(page);
                        message = `Navigating to ${page}...`;
                    } else {
                        message = "I'm sorry, I don't know which page to navigate to.";
                    }
                    break;
                case 'changeTheme':
                    const theme = call.args.theme;
                    if (theme === 'light' || theme === 'dark') {
                        app.changeTheme(theme);
                        message = `Switched to ${theme} mode.`;
                    } else {
                        message = "I can only switch the theme to 'light' or 'dark'.";
                    }
                    break;
                case 'setEdgeLighting':
                    const color = call.args.color;
                    const validColors: EdgeLightColor[] = ['default', 'green', 'red', 'orange', 'yellow', 'blue', 'purple', 'white', 'pink'];
                    if (typeof color === 'string' && validColors.includes(color as EdgeLightColor)) {
                        app.setEdgeLight(color as EdgeLightColor);
                        message = `Edge lighting set to ${color}.`;
                    } else {
                        message = `I can't set the edge lighting to that color. Try one of: ${validColors.join(', ')}.`;
                    }
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

      if (!inline) {
        setTimeout(() => {
            setIsModalOpen(false);
            setResponseMessage(null);
        }, 3000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Close modal with Escape key
  useEffect(() => {
    if (!inline) {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            setIsModalOpen(false);
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [inline]);

  if (inline) {
    return (
        <div className="w-full">
            {isLoading ? (
                <div className="py-4"><Spinner/></div>
            ) : error ? (
                <ErrorDisplay error={error}/>
            ) : responseMessage ? (
                <div className="text-center py-4 text-green-700 dark:text-green-300 font-bold uppercase tracking-widest text-xs animate-pulse">
                    {responseMessage}
                    <button onClick={() => setResponseMessage(null)} className="block mx-auto mt-2 text-[10px] text-gray-400 hover:text-gray-200">Reset</button>
                </div>
            ) : (
                <form onSubmit={handleCommandSubmit} className="relative">
                    <input
                        type="text"
                        value={command}
                        onChange={e => setCommand(e.target.value)}
                        placeholder="Command AI (e.g. 'Navigate to Dashboard')"
                        className="w-full pl-4 pr-12 py-3.5 text-sm bg-black/20 dark:bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/30 rounded-2xl text-gray-900 dark:text-white font-medium"
                    />
                    <button type="submit" className="absolute right-2 top-1.5 bottom-1.5 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg">
                        <i className="fas fa-chevron-right text-xs"></i>
                    </button>
                </form>
            )}
        </div>
    );
  }

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