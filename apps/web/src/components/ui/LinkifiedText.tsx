import React from 'react';

type TextPart = 
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'link'; url: string; text: string };

/**
 * Component that renders text with clickable links and bold formatting
 * Detects URLs and converts them to clickable anchor tags
 * Supports markdown bold syntax: **text**
 */
export function LinkifiedText({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null;

  // Parse text into parts: plain text, bold (**text**), and links
  const parts: TextPart[] = [];

  // First, find all bold markers (**text**)
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const boldMatches: Array<{ start: number; end: number; content: string }> = [];
  let boldMatch;
  
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    boldMatches.push({
      start: boldMatch.index,
      end: boldMatch.index + boldMatch[0].length,
      content: boldMatch[1],
    });
  }

  // Then find all URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
  const urlMatches: Array<{ start: number; end: number; url: string; displayText: string }> = [];
  let urlMatch;
  
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    let url = urlMatch[0];
    // Add protocol if missing
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }
    urlMatches.push({
      start: urlMatch.index,
      end: urlMatch.index + urlMatch[0].length,
      url,
      displayText: urlMatch[0],
    });
  }

  // Merge and sort all matches by position
  const allMatches: Array<{
    start: number;
    end: number;
    type: 'bold' | 'link';
    content?: string;
    url?: string;
    displayText?: string;
  }> = [
    ...boldMatches.map(m => ({ ...m, type: 'bold' as const })),
    ...urlMatches.map(m => ({ ...m, type: 'link' as const })),
  ].sort((a, b) => a.start - b.start);

  // Process text with all matches
  let currentIndex = 0;
  
  for (const match of allMatches) {
    // Add plain text before this match
    if (match.start > currentIndex) {
      const plainText = text.substring(currentIndex, match.start);
      if (plainText) {
        parts.push({ type: 'text', content: plainText });
      }
    }

    // Add the match
    if (match.type === 'bold') {
      parts.push({ type: 'bold', content: match.content! });
    } else {
      parts.push({ type: 'link', url: match.url!, text: match.displayText! });
    }

    currentIndex = match.end;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
  }

  // If no special formatting found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <React.Fragment key={index}>{part.content}</React.Fragment>;
        } else if (part.type === 'bold') {
          return <strong key={index}>{part.content}</strong>;
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


