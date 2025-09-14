import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 rounded-lg my-4 relative">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
        <span className="text-gray-400 text-sm font-semibold">{language}</span>
        <button
          onClick={handleCopy}
          className="bg-gray-700 text-gray-300 hover:bg-red-600 px-3 py-1 text-xs rounded-md transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code className={`language-${language.toLowerCase()} text-gray-200`}>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;