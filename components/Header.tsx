import React from 'react';
import { GoogleIcon } from './icons/GoogleIcon';
import { SparkIcon } from './icons/SparkIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DocumentIcon } from './icons/DocumentIcon';

interface HeaderProps {
  onClearChat: () => void;
  onOpenPdfExport: () => void;
  onOpenEurocodeParams?: () => void;
  onOpenOptimization?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClearChat, onOpenPdfExport, onOpenEurocodeParams, onOpenOptimization }) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-3 md:p-3.5 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Left: Branding & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 flex items-center justify-center bg-blue-600 rounded-lg shadow-md shadow-blue-600/30 text-white font-black text-sm">
            EM
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base md:text-lg font-bold text-white tracking-tight">
                Eurocode RC Design & Supervision Suite
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-900/60 text-blue-300 border border-blue-700/60">
                Engineer Meneyahil
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Metric SI • Eurocode 2 (EN 1992-1-1) & Eurocode 8 • 3D Frames, Rebar & BOQ
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          
          <div className="hidden xl:flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-xs">
            <SparkIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-300 font-medium">Gemini 3.8 Flash Vision</span>
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-xs">
            <GoogleIcon className="w-3.5 h-3.5" />
            <span className="text-slate-300 font-medium">Standards Grounded</span>
          </div>

          {/* Optimization Mode Quick Button */}
          {onOpenOptimization && (
            <button
              onClick={onOpenOptimization}
              className="flex items-center space-x-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-bold border border-emerald-500/50 transition-all shadow-sm"
              title="Open Eurocode Structural Cost & Rebar Optimization Mode"
            >
              <span>⚡</span>
              <span className="hidden sm:inline">Optimize</span>
            </button>
          )}

          {/* Eurocode Parameters Button */}
          {onOpenEurocodeParams && (
            <button
              onClick={onOpenEurocodeParams}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium border border-slate-700 transition-colors"
              title="Configure Eurocode Material & Geotechnical Parameters"
            >
              <span>⚙️</span>
              <span className="hidden md:inline">Parameters</span>
            </button>
          )}

          {/* Export PDF Button */}
          <button
            onClick={onOpenPdfExport}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all hover:scale-102"
            title="Export conversation or engineering document to PDF"
          >
            <DocumentIcon className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          {/* Clear / New Chat Button */}
          <button
            onClick={onClearChat}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-medium border border-slate-700 transition-colors"
            aria-label="Start new consultation"
            title="Reset Chat Session"
          >
            <TrashIcon className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
};

export default Header;
