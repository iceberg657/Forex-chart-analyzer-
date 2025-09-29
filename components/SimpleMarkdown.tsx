import React from 'react';

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const createMarkup = () => {
        let html = text
          // Sanitize to prevent basic XSS, allow only specific tags if needed in future
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Split by lines to handle lists properly
        const lines = html.split('\n');
        let inList = false;
        const processedLines = lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('* ')) {
                const listItem = `<li>${trimmedLine.substring(2)}</li>`;
                if (!inList) {
                    inList = true;
                    return `<ul>${listItem}`;
                }
                return listItem;
            } else {
                if (inList) {
                    inList = false;
                    return `</ul>${line}`;
                }
                return line;
            }
        });

        if (inList) {
            processedLines.push('</ul>');
        }

        html = processedLines.join('<br />').replace(/<\/ul><br \/>/g, '</ul>').replace(/<br \/><ul>/g, '<ul>').replace(/<\/li><br \/>/g, '</li>');

        return { __html: html };
    };

    return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={createMarkup()} />;
};

export default SimpleMarkdown;
