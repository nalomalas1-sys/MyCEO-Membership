import React from 'react';

/**
 * Component that renders text with clickable links
 * Detects URLs and converts them to clickable anchor tags
 */
export function LinkifiedText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;

  // Regular expression to match URLs
  // Matches: http://, https://, www., and plain domains
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;

  const parts: (string | { type: 'link'; url: string; text: string })[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Process the URL
    let url = match[0];
    let displayText = match[0];

    // Add protocol if missing
    if (!url.match(/^https?:\/\//i)) {
      if (url.startsWith('www.')) {
        url = 'https://' + url;
      } else {
        url = 'https://' + url;
      }
    }

    parts.push({ type: 'link', url, text: displayText });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no URLs found, return plain text
  if (parts.length === 0 || (parts.length === 1 && typeof parts[0] === 'string')) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        } else {
          return (
            <a
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling if inside clickable elements
              }}
            >
              {part.text}
            </a>
          );
        }
      })}
    </span>
  );
}


