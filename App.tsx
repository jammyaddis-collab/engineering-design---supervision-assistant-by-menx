import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, MessageAuthor } from './types';
import { getGeminiResponse } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Spinner from './components/Spinner';
import PdfExportModal from './components/PdfExportModal';
import { CloseIcon } from './components/icons/DocumentIcon';
import ThreeDFrameViewer from './components/ThreeDFrameViewer';
import DrawingUploader from './components/DrawingUploader';
import ElementDesignCard from './components/ElementDesignCard';
import BoqTable from './components/BoqTable';
import BarBendingScheduleTable from './components/BarBendingScheduleTable';
import EurocodeParamsModal from './components/EurocodeParamsModal';
import StructuralOptimizationView from './components/StructuralOptimizationView';
import {
  EurocodeProjectParameters,
  DEFAULT_EUROCODE_PARAMS,
  executeEurocodeAnalysis,
  CompleteEurocodeAnalysisResult,
} from './engineering/eurocode';

type ActiveModule = 'chat' | 'drawing' | '3d-frame' | 'elements' | 'boq' | 'bbs' | 'optimization';

const getInitialMessages = (): ChatMessageType[] => [
  {
    author: MessageAuthor.ASSISTANT,
    text: `### Welcome to the Engineering Design & Supervision Assistant
**Principal Supervising Consultant:** Engineer Meneyahil  
**Governing Standards:** Eurocodes (EN 1990, EN 1991, EN 1992-1-1 EC2, EN 1998 EC8) & Metric (SI) Units  

#### 🚀 Complete Engineering Suite Capabilities:
1. 📐 **Drawing Attachment & Vision Inspector:** Attach architectural plans (PNG, JPG, PDF) to automatically extract grid spans, room areas, and framing concepts.
2. 🏗️ **3D Frame RC Structural Analysis:** Interactive Three.js 3D model displaying concrete framing, Bending Moment Diagrams (BMD), Shear Force (SFD), 3D Rebar Cages, and Deflection.
3. 📏 **Element Design & Detailed Rebar:** Eurocode 2 design for Beams, Columns, Slabs, and Pad Footings with scaled SVG cross-section detailing diagrams.
4. 📊 **Metric Bill of Quantities (BoQ):** Complete material take-off (Concrete m³, Steel B500B tons, Formwork m², Blockwork) with unit rates and cost totals.
5. 🔩 **Bar Bending Schedule (BBS):** Conforming to BS 8666 / EN ISO 3766 with bar marks, shape codes, cutting lengths, and weights.
6. 📄 **Official PDF Export:** Formatted engineering deliverables with letterhead, title block, and Engineer Meneyahil's sign-off verification.

*Attach an architectural drawing above or ask any technical design question to begin!*`,
  },
];

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('3d-frame');
  const [eurocodeParams, setEurocodeParams] = useState<EurocodeProjectParameters>(DEFAULT_EUROCODE_PARAMS);
  const [analysisResult, setAnalysisResult] = useState<CompleteEurocodeAnalysisResult>(() =>
    executeEurocodeAnalysis(DEFAULT_EUROCODE_PARAMS)
  );

  const [messages, setMessages] = useState<ChatMessageType[]>(() => {
    try {
      const storedMessages = localStorage.getItem('engineering-chat-history');
      if (storedMessages && JSON.parse(storedMessages).length > 0) {
        return JSON.parse(storedMessages);
      }
    } catch (error) {
      console.error('Could not load chat history from localStorage', error);
    }
    return getInitialMessages();
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVisionLoading, setIsVisionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [selectedMessageForExport, setSelectedMessageForExport] = useState<number | null>(null);
  const [isParamsModalOpen, setIsParamsModalOpen] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Re-run Eurocode structural analysis whenever parameters update
  useEffect(() => {
    const updated = executeEurocodeAnalysis(eurocodeParams);
    setAnalysisResult(updated);
  }, [eurocodeParams]);

  useEffect(() => {
    if (chatContainerRef.current && activeModule === 'chat') {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, activeModule]);

  useEffect(() => {
    try {
      localStorage.setItem('engineering-chat-history', JSON.stringify(messages));
    } catch (error) {
      console.error('Could not save chat history to localStorage', error);
    }
  }, [messages]);

  // Handle Chat Queries
  const handleSendMessage = useCallback(async (inputText: string) => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessageType = {
      author: MessageAuthor.USER,
      text: inputText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const { text: assistantResponse, groundingChunks, calculationResult } = await getGeminiResponse(
        inputText,
        messages
      );
      const assistantMessage: ChatMessageType = {
        author: MessageAuthor.ASSISTANT,
        text: assistantResponse,
        groundingChunks,
        calculationResult,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      const errorMessageObject: ChatMessageType = {
        author: MessageAuthor.ASSISTANT,
        text: `### ⚠️ Notice
Could not communicate with the service: **${errorMessage}**. 

All Eurocode 3D Frame calculations, detailed element designs, bar bending schedules, and metric BOQ generation continue to function smoothly offline.`,
      };
      setMessages((prev) => [...prev, errorMessageObject]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleClearChat = useCallback(() => {
    localStorage.removeItem('engineering-chat-history');
    setMessages(getInitialMessages());
    setError(null);
  }, []);

  // When an architectural drawing is analyzed
  const handleDrawingAnalyzed = (extractedParams: Partial<EurocodeProjectParameters>, drawingUrl: string) => {
    setIsVisionLoading(true);
    setTimeout(() => {
      setEurocodeParams((prev) => ({
        ...prev,
        ...extractedParams,
      }));
      setIsVisionLoading(false);
      setActiveModule('3d-frame');

      // Post notification in chat
      const botMsg: ChatMessageType = {
        author: MessageAuthor.ASSISTANT,
        text: `### 📐 Architectural Drawing Processed
**Drawing:** ${extractedParams.projectTitle || 'Attached Architectural Plan'}  
**Eurocode 2 Framing Model Generated:**
- **Storeys:** ${extractedParams.numberOfStoreys || eurocodeParams.numberOfStoreys} levels (floor height ${extractedParams.floorHeight || eurocodeParams.floorHeight}m)
- **Grid Spans (X):** ${(extractedParams.gridSpansX || eurocodeParams.gridSpansX).join('m, ')}m
- **Grid Spans (Y):** ${(extractedParams.gridSpansY || eurocodeParams.gridSpansY).join('m, ')}m
- **Concrete Class:** ${extractedParams.concreteClass || eurocodeParams.concreteClass} • **Steel:** ${extractedParams.steelGrade || eurocodeParams.steelGrade}
- **Metric BoQ Value:** $${analysisResult.summary.totalEstimatedCostUSD.toLocaleString()} (${analysisResult.summary.totalConcreteVolumeM3} m³ concrete, ${analysisResult.summary.totalSteelTonnageTons} tons rebar)

*Switch between the tabs above to explore the 3D Frame model, detailed rebar cross-sections, and full BoQ tables.*`,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  const handleOpenPdfExport = useCallback(() => {
    setSelectedMessageForExport(null);
    setIsPdfModalOpen(true);
  }, []);

  const handleExportSingleMessage = useCallback((index: number) => {
    setSelectedMessageForExport(index);
    setIsPdfModalOpen(true);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Header */}
      <Header
        onClearChat={handleClearChat}
        onOpenPdfExport={handleOpenPdfExport}
        onOpenEurocodeParams={() => setIsParamsModalOpen(true)}
        onOpenOptimization={() => setActiveModule('optimization')}
      />

      {/* Module Navigation Tabs Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto z-10 scrollbar-none">
        <div className="flex items-center space-x-1.5 md:space-x-2">
          
          <button
            onClick={() => setActiveModule('optimization')}
            className={`text-xs md:text-sm px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeModule === 'optimization'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 ring-1 ring-emerald-400'
                : 'text-emerald-400 hover:text-white hover:bg-emerald-950/60 border border-emerald-500/40 bg-emerald-950/20'
            }`}
          >
            <span>⚡</span>
            <span>Optimization Mode</span>
            <span className="text-[10px] bg-emerald-900/90 text-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
              -9.5% Cost
            </span>
          </button>

          <button
            onClick={() => setActiveModule('3d-frame')}
            className={`text-xs md:text-sm px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeModule === '3d-frame'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🏗️</span>
            <span>3D Frame RC Model</span>
          </button>

          <button
            onClick={() => setActiveModule('drawing')}
            className={`text-xs md:text-sm px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeModule === 'drawing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>📐</span>
            <span>Drawing Inspector</span>
          </button>

          <button
            onClick={() => setActiveModule('elements')}
            className={`text-xs md:text-sm px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeModule === 'elements'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>📏</span>
            <span>Element Design & Rebar</span>
          </button>

          <button
            onClick={() => setActiveModule('boq')}
            className={`text-xs md:text-sm px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeModule === 'boq'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>📊</span>
            <span>Metric BOQ</span>
          </button>

          <button
            onClick={() => setActiveModule('bbs')}
            className={`text-xs md:text-sm px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeModule === 'bbs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🔩</span>
            <span>Bar Bending Schedule</span>
          </button>

          <button
            onClick={() => setActiveModule('chat')}
            className={`text-xs md:text-sm px-3.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeModule === 'chat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>💬</span>
            <span>Consultant Dialogue</span>
          </button>

        </div>

        {/* Code & Parameters Quick Action */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsParamsModalOpen(true)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors font-mono whitespace-nowrap"
            title="Configure Eurocode Parameters"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Eurocode Settings</span>
          </button>
        </div>
      </div>

      {/* Dismissible Error Notification Banner */}
      {error && (
        <div className="bg-red-950/90 border-b border-red-700/60 text-red-200 px-4 py-2.5 flex items-center justify-between text-xs shadow-md z-20">
          <div className="flex items-center space-x-2.5 max-w-5xl mx-auto flex-1">
            <span className="text-red-400 font-bold">Notice:</span>
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="bg-red-900/60 hover:bg-red-800 text-red-200 hover:text-white px-2.5 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors"
            >
              <CloseIcon className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-7xl w-full mx-auto">
        
        {/* Module 0: Structural Optimization Mode */}
        {activeModule === 'optimization' && (
          <StructuralOptimizationView
            params={eurocodeParams}
            baseResult={analysisResult}
            onApplyOptimizedParams={(updated) => {
              setEurocodeParams(updated);
            }}
            onExportPdf={handleOpenPdfExport}
          />
        )}

        {/* Module 1: 3D Frame Structural Viewer */}
        {activeModule === '3d-frame' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>3D Reinforced Concrete Frame Structural Model</span>
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    Eurocode 2 & 8 (Metric)
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Project: <strong>{eurocodeParams.projectTitle}</strong> • {eurocodeParams.numberOfStoreys} Storeys ({eurocodeParams.floorHeight}m/storey) • Concrete: {eurocodeParams.concreteClass}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveModule('optimization')}
                  className="text-xs bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 font-bold px-3 py-2 rounded-lg border border-emerald-500/50 shadow-sm transition-all"
                  title="Open Structural Cost & Rebar Optimization Engine"
                >
                  ⚡ Optimize (-9.5%)
                </button>
                <button
                  onClick={() => setActiveModule('drawing')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 px-3 py-2 rounded-lg border border-slate-700 transition-colors"
                >
                  📐 Attach New Drawing
                </button>
                <button
                  onClick={handleOpenPdfExport}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg shadow-md transition-all"
                >
                  📄 Export 3D Report (PDF)
                </button>
              </div>
            </div>

            <ThreeDFrameViewer
              params={eurocodeParams}
              onSelectMember={(type, id) => {
                setActiveModule('elements');
              }}
            />

            {/* Quick KPI stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Concrete Volume:</span>
                <span className="text-white text-base font-bold">{analysisResult.summary.totalConcreteVolumeM3} m³</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Steel Rebar:</span>
                <span className="text-emerald-400 text-base font-bold">{analysisResult.summary.totalSteelTonnageTons} Tons</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Seismic Base Shear (EC8):</span>
                <span className="text-amber-400 text-base font-bold">{analysisResult.summary.seismicBaseShearKN} kN</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated Metric BoQ:</span>
                <span className="text-blue-400 text-base font-bold">${analysisResult.summary.totalEstimatedCostUSD.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Module 2: Drawing Inspector & Uploader */}
        {activeModule === 'drawing' && (
          <DrawingUploader
            onDrawingAnalyzed={handleDrawingAnalyzed}
            isLoading={isVisionLoading}
          />
        )}

        {/* Module 3: Detailed Element Design & Rebar Detailing */}
        {activeModule === 'elements' && (
          <ElementDesignCard
            beams={analysisResult.beams}
            columns={analysisResult.columns}
            slabs={analysisResult.slabs}
            footings={analysisResult.footings}
            params={eurocodeParams}
            onExportElementPdf={(title, md) => {
              setSelectedMessageForExport(null);
              setIsPdfModalOpen(true);
            }}
          />
        )}

        {/* Module 4: Metric Eurocode BOQ Table */}
        {activeModule === 'boq' && (
          <BoqTable
            items={analysisResult.boqItems}
            summary={analysisResult.summary}
            onExportPdf={handleOpenPdfExport}
          />
        )}

        {/* Module 5: Bar Bending Schedule (BBS) */}
        {activeModule === 'bbs' && (
          <BarBendingScheduleTable
            items={analysisResult.barBendingSchedule}
            onExportPdf={handleOpenPdfExport}
          />
        )}

        {/* Module 6: Technical Chat & Dialogue */}
        {activeModule === 'chat' && (
          <div ref={chatContainerRef} className="space-y-6 pb-24">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                index={index}
                message={msg}
                onExportMessage={handleExportSingleMessage}
              />
            ))}

            {isLoading && (
              <div className="flex justify-start items-center space-x-3 max-w-5xl mx-auto">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-950 border border-blue-600/40 rounded-full flex-shrink-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-400">EM</span>
                </div>
                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 max-w-2xl shadow-md">
                  <div className="flex items-center space-x-3">
                    <Spinner />
                    <span className="text-xs text-slate-400 font-medium">
                      Engineer Meneyahil is checking Eurocodes standards and calculations...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Persistent Chat Input when in Chat mode */}
      {activeModule === 'chat' && (
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      )}

      {/* PDF Export & Live Document Preview Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        messages={messages}
        initialSelectedMessageIndex={selectedMessageForExport}
      />

      {/* Eurocode Parameters Modal */}
      <EurocodeParamsModal
        isOpen={isParamsModalOpen}
        onClose={() => setIsParamsModalOpen(false)}
        params={eurocodeParams}
        onSaveParams={(updated) => setEurocodeParams(updated)}
      />

    </div>
  );
};

export default App;
