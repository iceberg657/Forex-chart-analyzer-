import React from 'react';

interface ErrorDisplayProps {
  error: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  // Split the error message into main parts for better formatting
  const [mainError, fixSuggestion] = error.split('\n\nPossible Fix:');
  const [location, ...detailsParts] = mainError.split(': ');
  const details = detailsParts.join(': ');


  return (
    <div className="bg-red-500/10 p-4 rounded-lg my-4 text-left" role="alert">
        <div className="flex">
            <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800 dark:text-red-300">An Error Occurred</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400 space-y-1">
                    {details && location ? (
                        <>
                            <p><strong className="font-semibold">Location:</strong> {location}</p>
                            <p><strong className="font-semibold">Details:</strong> {details}</p>
                        </>
                    ) : (
                        <p>{error}</p> 
                    )}
                    {fixSuggestion && (
                         <p className="mt-2 pt-2 border-t border-red-500/20"><strong className="font-semibold text-red-800 dark:text-red-200">Suggested Fix:</strong> {fixSuggestion}</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ErrorDisplay;