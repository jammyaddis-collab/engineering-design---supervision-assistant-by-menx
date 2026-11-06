import React, { useState } from 'react';
import { ChatMessage as ChatMessageType, MessageAuthor } from '../types';
import CalculationResultCard from './CalculationResultCard';
import { DocumentIcon, CheckIcon } from './icons/DocumentIcon';

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
  onExportMessage?: (index: number) => void;
}

declare global {
  interface Window {
    marked: {
      parse(markdownString: string): string;
    };
  }
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, onExportMessage }) => {
  const isAssistant = message.author === MessageAuthor.ASSISTANT;
  const [copied, setCopied] = useState<boolean>(false);

  const createMarkup = (text: string) => {
    if (typeof window.marked === 'undefined') {
      return { __html: text.replace(/\n/g, '<br>') };
    }
    const rawMarkup = window.marked.parse(text);
    return { __html: rawMarkup };
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isAssistant) {
    return (
      <div className="flex justify-start items-start space-x-3 md:space-x-4 max-w-5xl mx-auto group">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-950 border border-blue-600/40 rounded-full flex-shrink-0 flex items-center justify-center shadow-md">
          <span className="text-sm md:text-base font-bold text-blue-400">EM</span>
        </div>
        <div className="flex flex-col items-start space-y-2 w-full max-w-3xl">
          
          {/* Assistant Name & Action Bar */}
          <div className="flex items-center justify-between w-full text-xs text-gray-400 pb-0.5">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <span>Supervising Assistant</span>
              <span className="text-[10px] text-blue-400 bg-blue-900/40 px-1.5 py-0.2 rounded border border-blue-800/40">
                Engineer Meneyahil
              </span>
            </span>

            <div className="flex items-center space-x-2">
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-gray-200 text-[11px] px-2 py-0.5 rounded hover:bg-gray-800 transition-colors flex items-center gap-1"
                title="Copy markdown text"
              >
                {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {/* Export as PDF button */}
              {onExportMessage && (
                <button
                  onClick={() => onExportMessage(index)}
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 hover:border-blue-400 text-[11px] px-2.5 py-0.5 rounded flex items-center gap-1 font-medium transition-colors"
                  title="Export this response as official PDF document"
                >
                  <DocumentIcon className="w-3 h-3 text-blue-400" />
                  <span>Export to PDF</span>
                </button>
              )}
            </div>
          </div>

          {message.calculationResult ? (
            <CalculationResultCard
              result={message.calculationResult}
              explanation={message.text}
              onExport={() => onExportMessage && onExportMessage(index)}
            />
          ) : (
            <div
              className="bg-gray-800/90 border border-gray-700/80 rounded-xl p-4 md:p-5 w-full prose prose-sm md:prose-base prose-invert prose-p:text-gray-200 prose-headings:text-white prose-strong:text-white prose-blockquote:text-gray-300 prose-blockquote:border-l-blue-500 prose-code:text-cyan-300 prose-a:text-blue-400 prose-table:border-gray-600 prose-th:border-gray-600 prose-td:border-gray-700 prose-th:text-gray-100 prose-th:bg-gray-750/70 shadow-lg overflow-x-auto"
              dangerouslySetInnerHTML={createMarkup(message.text)}
            />
          )}

          {message.groundingChunks && message.groundingChunks.length > 0 && (
            <div className="w-full pt-1">
              <h4 className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Verified Sources & References:
              </h4>
              <div className="flex flex-wrap gap-2">
                {message.groundingChunks.map((chunk, cIdx) => (
                  chunk.web && (
                    <a
                      key={cIdx}
                      href={chunk.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-gray-700 text-blue-400 text-xs px-2.5 py-1 rounded-md border border-gray-700 hover:border-gray-600 transition-colors flex items-center space-x-1 truncate max-w-xs"
                      title={chunk.web.title}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span className="truncate">{chunk.web.title || new URL(chunk.web.uri).hostname}</span>
                    </a>
                  )
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // User message
  return (
    <div className="flex justify-end items-start space-x-3 md:space-x-4 max-w-5xl mx-auto">
      <div className="bg-blue-600 rounded-xl p-3 md:p-4 max-w-2xl shadow-md border border-blue-500/50">
        <p className="text-white whitespace-pre-wrap text-sm md:text-base leading-relaxed">{message.text}</p>
      </div>
      <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center border border-gray-600">
        <span className="text-base md:text-lg">👷‍♂️</span>
      </div>
    </div>
  );
};

export default ChatMessage;
