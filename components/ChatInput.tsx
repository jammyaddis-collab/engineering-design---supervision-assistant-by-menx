import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const suggestions = [
  'Suggest Structural Cost & Rebar Optimizations (Eurocode 2)',
  'Generate Site Inspection Report (ACI / Eurocode)',
  'Create Bill of Quantities (BoQ) for Foundation Works',
  'Calculate Beam Deflection (w=12 kN/m, L=6m, E=200 GPa)',
  'Draft Request for Information (RFI) for Rebar Clearance',
];

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      onSendMessage(suggestion);
    }
  };

  return (
    <footer className="chat-input-container bg-gray-900/90 backdrop-blur-md p-3 md:p-4 sticky bottom-0 border-t border-gray-800 z-10">
      <div className="max-w-5xl mx-auto">
        
        {/* Suggestion Chips */}
        <div className="flex items-center space-x-2 mb-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-gray-700">
          <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap uppercase tracking-wider flex items-center mr-1">
            Presets:
          </span>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/80 text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-150 enabled:active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Text Input Form */}
        <form onSubmit={handleSubmit} className="flex items-end space-x-2 md:space-x-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Engineer Meneyahil: request a calculation, drafting standard (ACI, Eurocodes), or generate a project template..."
            rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-40 text-sm md:text-base leading-relaxed"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="bg-blue-600 text-white rounded-xl p-3 h-12 w-12 flex-shrink-0 flex items-center justify-center transition-all duration-150 enabled:hover:bg-blue-500 enabled:hover:shadow-lg enabled:hover:shadow-blue-600/30 disabled:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send query"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>

        <p className="text-[11px] text-center text-gray-500 mt-2">
          Engineering Design & Supervision Assistant • Lead: <strong>Engineer Meneyahil</strong> • Outputs adhere to ACI, Eurocodes, and AASHTO standards for technical consultation.
        </p>
      </div>
    </footer>
  );
};

export default ChatInput;
