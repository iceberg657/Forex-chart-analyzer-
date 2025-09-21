import React from 'react';

interface ErrorDisplayProps {
  error: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  const isApiKeyError = /api key/i.test(error);

  return (
    <div className="text-center text-red-700 dark:text-red-400 bg-red-500/10 p-6 rounded-lg my-8">
        {isApiKeyError && <p className="font-bold text-lg mb-2">Configuration Error</p>}
        <p>{error}</p>
        {isApiKeyError && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                This application requires an API key to be configured in its environment to function. If you are a developer, please ensure the <code>API_KEY</code> environment variable is set.
            </p>
        )}
    </div>
  );
};

export default ErrorDisplay;
