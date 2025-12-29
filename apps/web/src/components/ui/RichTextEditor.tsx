import { useRef, useState } from 'react';
import { Bold } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  id?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  rows = 4,
  className = '',
  id,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleBold = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      // Wrap selected text with **
      const newValue =
        value.substring(0, start) +
        `**${selectedText}**` +
        value.substring(end);
      onChange(newValue);

      // Restore cursor position after the closing **
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + selectedText.length + 4; // 4 = ** + **
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // If no text selected, insert **|** and place cursor in between
      const newValue =
        value.substring(0, start) + `****` + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + 2; // Place cursor between **
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  return (
    <div className={`border-2 border-gray-200 rounded-xl bg-white ${isFocused ? 'ring-2 ring-primary-500 border-primary-500' : ''} transition-all ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <button
          type="button"
          onClick={handleBold}
          className="p-2 hover:bg-gray-200 rounded transition-colors flex items-center justify-center"
          title="Bold (Ctrl+B)"
          onMouseDown={(e) => e.preventDefault()} // Prevent textarea from losing focus
        >
          <Bold className="h-4 w-4 text-gray-700" />
        </button>
        <div className="text-xs text-gray-500 ml-auto px-2">
          Use <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs font-mono">**text**</kbd> for bold
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id={id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          // Ctrl+B or Cmd+B for bold
          if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            handleBold();
          }
        }}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-0 focus:ring-0 focus:outline-none resize-none bg-transparent min-h-[100px]"
      />
    </div>
  );
}

