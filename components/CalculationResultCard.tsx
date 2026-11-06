import React from 'react';
import { CalculationResult } from '../types';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { DocumentIcon } from './icons/DocumentIcon';

interface CalculationResultCardProps {
  result: CalculationResult;
  explanation: string;
  onExport?: () => void;
}

declare global {
  interface Window {
    marked: {
      parse(markdownString: string): string;
    };
  }
}

const CalculationResultCard: React.FC<CalculationResultCardProps> = ({ result, explanation, onExport }) => {
  const createMarkup = (text: string) => {
    if (typeof window.marked === 'undefined') {
      return { __html: text.replace(/\n/g, '<br>') };
    }
    const rawMarkup = window.marked.parse(text);
    return { __html: rawMarkup };
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 md:p-5 w-full max-w-2xl border border-gray-700 shadow-xl space-y-4">
      {/* Title & Export */}
      <div className="flex items-center justify-between border-b border-gray-700/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            <CalculatorIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{result.calculationName}</h3>
            <span className="text-[11px] text-gray-400 font-mono">Structural & Electrical Verification</span>
          </div>
        </div>

        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center space-x-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-1 rounded-md transition-colors font-medium"
            title="Export this calculation as PDF sheet"
          >
            <DocumentIcon className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        )}
      </div>
      
      {/* Parameters & Result */}
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Input Parameters:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {result.inputs.map((input, index) => (
              <div key={index} className="bg-gray-900/60 border border-gray-700/60 p-2.5 rounded-lg flex items-center justify-between">
                <span className="text-gray-300 font-medium">{input.name}:</span>
                <span className="font-mono text-cyan-400 font-bold ml-2">{input.value} {input.unit}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Computed Engineering Output:</h4>
          <div className="bg-emerald-950/40 border border-emerald-500/50 p-3.5 rounded-xl flex items-center justify-between shadow-inner">
            <span className="text-sm font-semibold text-gray-200">{result.result.name}:</span>
            <span className="font-mono text-xl md:text-2xl font-bold text-emerald-400">
              {result.result.value} <span className="text-sm font-medium text-emerald-300">{result.result.unit}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Technical Explanation */}
      {explanation && (
        <div className="border-t border-gray-700 pt-3">
          <div
            className="prose prose-sm prose-invert prose-p:text-gray-300 text-xs leading-relaxed"
            dangerouslySetInnerHTML={createMarkup(explanation)}
          />
        </div>
      )}
    </div>
  );
};

export default CalculationResultCard;
