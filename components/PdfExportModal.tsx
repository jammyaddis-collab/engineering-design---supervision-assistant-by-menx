import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, MessageAuthor } from '../types';
import {
  EngineeringDocumentMetadata,
  DEFAULT_ENGINEERING_METADATA,
  exportElementToPdf,
  triggerBrowserPrint,
} from '../utils/pdfExport';
import { DocumentIcon, DownloadIcon, PrinterIcon, CloseIcon, CheckIcon } from './icons/DocumentIcon';
import Spinner from './Spinner';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageType[];
  initialSelectedMessageIndex?: number | null;
}

// Markdown parser helper for rendering in preview
function renderMarkdown(content: string): string {
  if (typeof window !== 'undefined' && window.marked) {
    try {
      return window.marked.parse(content);
    } catch {
      // Fallback
    }
  }
  return content
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-slate-800 mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-slate-900 mt-5 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-slate-900 mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br />');
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  messages,
  initialSelectedMessageIndex = null,
}) => {
  const [exportMode, setExportMode] = useState<'full' | 'single'>(
    initialSelectedMessageIndex !== null ? 'single' : 'full'
  );
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number>(
    initialSelectedMessageIndex !== null ? initialSelectedMessageIndex : 0
  );
  const [metadata, setMetadata] = useState<EngineeringDocumentMetadata>({
    ...DEFAULT_ENGINEERING_METADATA,
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const printSheetRef = useRef<HTMLDivElement>(null);

  // Filter assistant messages for single document export
  const assistantMessages = messages
    .map((msg, idx) => ({ msg, idx }))
    .filter(item => item.msg.author === MessageAuthor.ASSISTANT);

  // Sync initial message index if passed
  useEffect(() => {
    if (initialSelectedMessageIndex !== null && initialSelectedMessageIndex >= 0) {
      setExportMode('single');
      setSelectedMessageIndex(initialSelectedMessageIndex);
      
      // Auto-derive title if possible from message
      const targetMsg = messages[initialSelectedMessageIndex];
      if (targetMsg) {
        const firstLine = targetMsg.text.split('\n')[0].replace(/[#*]/g, '').trim();
        if (firstLine && firstLine.length > 5 && firstLine.length < 60) {
          setMetadata(prev => ({ ...prev, title: firstLine }));
        }
      }
    }
  }, [initialSelectedMessageIndex, messages]);

  // Support pressing Escape to dismiss the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const sanitizedFilename = `${metadata.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_${Date.now()}.pdf`;
      await exportElementToPdf(printSheetRef.current, sanitizedFilename);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
      // Fallback to browser print if canvas generation has browser security restrictions
      triggerBrowserPrint();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    triggerBrowserPrint();
  };

  // Determine contents to show in the preview sheet
  const targetMessage = messages[selectedMessageIndex];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
      onClick={(e) => {
        // Dismiss if backdrop is clicked
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-6xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-850">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <DocumentIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                Export Engineering Document (PDF)
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  Engineer Meneyahil
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Format official technical memos, site inspection reports, BoQs, and calculation sheets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Dismiss modal"
            title="Dismiss / Close (Esc)"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with 2 columns: Controls and Live Sheet Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Export Scope Selector */}
            <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                Export Scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportMode('full')}
                  className={`text-xs py-2 px-3 rounded-md font-medium text-left border transition-all ${
                    exportMode === 'full'
                      ? 'bg-blue-600 border-blue-500 text-white shadow'
                      : 'bg-gray-700/60 border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-bold">Full Conversation</div>
                  <div className="text-[10px] opacity-80">Complete technical log</div>
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('single')}
                  className={`text-xs py-2 px-3 rounded-md font-medium text-left border transition-all ${
                    exportMode === 'single'
                      ? 'bg-blue-600 border-blue-500 text-white shadow'
                      : 'bg-gray-700/60 border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-bold">Selected Deliverable</div>
                  <div className="text-[10px] opacity-80">Report, BoQ, or Calc</div>
                </button>
              </div>

              {exportMode === 'single' && (
                <div className="mt-2">
                  <label className="text-xs text-gray-400 block mb-1">Select Document Item:</label>
                  <select
                    value={selectedMessageIndex}
                    onChange={(e) => setSelectedMessageIndex(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {assistantMessages.map(({ msg, idx }, i) => (
                      <option key={idx} value={idx}>
                        Item #{i + 1}: {msg.text.slice(0, 50).replace(/[#*]/g, '')}...
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Engineering Metadata Customizer */}
            <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Engineering Title Block Details
                </label>
                <span className="text-[11px] text-blue-400">Standard Code Format</span>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Document Title</label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Project Name</label>
                  <input
                    type="text"
                    value={metadata.projectName}
                    onChange={(e) => setMetadata({ ...metadata, projectName: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Document Ref / ID</label>
                  <input
                    type="text"
                    value={metadata.projectCode}
                    onChange={(e) => setMetadata({ ...metadata, projectCode: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Supervising Engineer</label>
                  <input
                    type="text"
                    value={metadata.engineerName}
                    onChange={(e) => setMetadata({ ...metadata, engineerName: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Project Phase</label>
                  <select
                    value={metadata.projectPhase}
                    onChange={(e) =>
                      setMetadata({
                        ...metadata,
                        projectPhase: e.target.value as EngineeringDocumentMetadata['projectPhase'],
                      })
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Design">Design Phase</option>
                    <option value="Tendering">Tendering Phase</option>
                    <option value="Construction/Supervision">Construction / Supervision</option>
                    <option value="Handover">Handover & Commissioning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Governing Standards / Codes</label>
                <input
                  type="text"
                  value={metadata.applicableCodes}
                  onChange={(e) => setMetadata({ ...metadata, applicableCodes: e.target.value })}
                  placeholder="e.g. ACI 318, Eurocodes, AASHTO LRFD, ASTM"
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-gray-700/60 space-y-2">
                <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metadata.includeSignOff}
                    onChange={(e) => setMetadata({ ...metadata, includeSignOff: e.target.checked })}
                    className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0"
                  />
                  <span>Include Sign-Off & Approval Verification Block</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metadata.includeDisclaimer}
                    onChange={(e) => setMetadata({ ...metadata, includeDisclaimer: e.target.checked })}
                    className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0"
                  />
                  <span>Include Statutory Engineering Advisory Notice</span>
                </label>
              </div>
            </div>

            {/* Quick Template Presets */}
            <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-2">
                Quick Document Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Eurocode Structural Cost & Rebar Optimization Report', code: 'OPT-EC2-01', phase: 'Design', codes: 'EN 1990, EN 1992-1-1 §6.2, §9.2, §9.3' },
                  { label: '3D RC Frame Structural Design Report', code: 'EC2-STR-01', phase: 'Design', codes: 'EN 1990, EN 1991, EN 1992-1-1 (EC2), EN 1998' },
                  { label: 'Metric Bill of Quantities (BoQ)', code: 'BOQ-METRIC-01', phase: 'Tendering', codes: 'CESMM4 / EN 1992-1-1' },
                  { label: 'RC Element Design & Rebar Detailing', code: 'EC2-REBAR-02', phase: 'Design', codes: 'EN 1992-1-1 §6, §9' },
                  { label: 'Bar Bending Schedule (BBS)', code: 'BBS-BS8666-01', phase: 'Construction/Supervision', codes: 'BS 8666 / EN ISO 3766' },
                  { label: 'Site Inspection Report', code: 'SIR-EC-01', phase: 'Construction/Supervision', codes: 'EN 206, EN 13670' },
                  { label: 'Request for Information', code: 'RFI-ENG-018', phase: 'Construction/Supervision', codes: 'EN 1992-1-1' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMetadata(prev => ({
                        ...prev,
                        title: preset.label,
                        projectCode: preset.code,
                        projectPhase: preset.phase as any,
                        applicableCodes: preset.codes,
                      }));
                    }}
                    className="text-[11px] bg-gray-700 hover:bg-gray-600 text-gray-200 px-2.5 py-1 rounded transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Live Printable Sheet Preview */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Document Sheet Preview (A4 Page Layout)</span>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Ready to Print / Export
              </span>
            </div>

            <div className="w-full max-h-[620px] overflow-y-auto bg-gray-950 p-4 rounded-lg border border-gray-800 flex justify-center shadow-inner">
              {/* This exact DIV will be exported to PDF / Printed */}
              <div
                ref={printSheetRef}
                className="engineering-pdf-sheet bg-white text-slate-900 w-full max-w-[760px] p-8 md:p-10 shadow-2xl rounded-sm border border-slate-300 font-sans leading-relaxed text-sm select-text"
                style={{ minHeight: '842px' }}
              >
                
                {/* 1. Official Engineering Title Block / Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-blue-700">
                        ENGINEERING CONSULTANCY & TECHNICAL SUPERVISION
                      </div>
                      <h1 className="text-xl md:text-2xl font-black text-slate-950 mt-0.5 tracking-tight">
                        {metadata.title}
                      </h1>
                      <div className="text-xs font-semibold text-slate-600 mt-1">
                        Principal Supervising Engineer: <span className="text-slate-900 font-bold">{metadata.engineerName}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="inline-block bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        {metadata.projectCode}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-1">
                        Date: {metadata.date}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {metadata.revision}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Table Box */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded text-[11px]">
                    <div>
                      <span className="text-slate-500 block uppercase text-[9px] font-bold">Project:</span>
                      <span className="font-semibold text-slate-900">{metadata.projectName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[9px] font-bold">Project Phase:</span>
                      <span className="font-semibold text-blue-800">{metadata.projectPhase}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[9px] font-bold">Design Codes:</span>
                      <span className="font-semibold text-slate-900">{metadata.applicableCodes}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[9px] font-bold">Document Type:</span>
                      <span className="font-semibold text-slate-900">{metadata.documentType}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Main Engineering Content */}
                <div className="space-y-6 text-slate-800">
                  {exportMode === 'single' ? (
                    targetMessage ? (
                      <div>
                        {targetMessage.calculationResult && (
                          <div className="mb-5 bg-slate-50 border-2 border-emerald-600/40 p-4 rounded-md">
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center justify-between">
                              <span>VERIFIED ENGINEERING CALCULATION SHEET</span>
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px]">
                                PASSED
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-base mb-3">
                              {targetMessage.calculationResult.calculationName}
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                              {targetMessage.calculationResult.inputs.map((inp, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 p-2 rounded">
                                  <span className="text-slate-500">{inp.name}: </span>
                                  <span className="font-mono font-bold text-slate-900">
                                    {inp.value} {inp.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="bg-emerald-50 border border-emerald-300 p-3 rounded flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">
                                {targetMessage.calculationResult.result.name}:
                              </span>
                              <span className="text-lg font-mono font-black text-emerald-700">
                                {targetMessage.calculationResult.result.value}{' '}
                                <span className="text-sm font-semibold">{targetMessage.calculationResult.result.unit}</span>
                              </span>
                            </div>
                          </div>
                        )}

                        <div
                          className="engineering-prose prose prose-sm max-w-none text-slate-800"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(targetMessage.text) }}
                        />

                        {targetMessage.groundingChunks && targetMessage.groundingChunks.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-200 text-xs">
                            <span className="font-bold text-slate-700 block mb-1">
                              Technical References & Web Grounding Sources:
                            </span>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600">
                              {targetMessage.groundingChunks.map((chunk, cIdx) => (
                                <li key={cIdx}>
                                  <span className="font-medium">{chunk.web?.title || 'Engineering Standard Ref'}</span>:{' '}
                                  <span className="text-blue-700 underline font-mono text-[10px]">
                                    {chunk.web?.uri}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-center py-8">No message selected for export.</div>
                    )
                  ) : (
                    /* Full Conversation Export */
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-900">
                        <strong>Record of Engineering Consultation:</strong> This log contains all technical communications, calculations, and specifications provided by the Assistant and Engineer Meneyahil.
                      </div>

                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-md border ${
                            msg.author === MessageAuthor.USER
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-white border-slate-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2 text-xs font-bold">
                            <span className={msg.author === MessageAuthor.USER ? 'text-slate-600' : 'text-blue-700'}>
                              {msg.author === MessageAuthor.USER ? '👤 Client / Project Engineer Query' : `🤖 Technical Consultation (${metadata.engineerName})`}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">Entry #{index + 1}</span>
                          </div>

                          {msg.calculationResult && (
                            <div className="my-2 bg-emerald-50/50 border border-emerald-300 p-3 rounded text-xs">
                              <span className="font-bold text-emerald-800 block mb-1">
                                {msg.calculationResult.calculationName}
                              </span>
                              <div className="font-mono text-slate-700">
                                Result: <strong className="text-emerald-700">{msg.calculationResult.result.value} {msg.calculationResult.result.unit}</strong>
                              </div>
                            </div>
                          )}

                          <div
                            className="engineering-prose prose prose-sm max-w-none text-slate-800"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Formal Engineering Sign-Off Block */}
                {metadata.includeSignOff && (
                  <div className="mt-10 pt-6 border-t-2 border-slate-800">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                      Engineering Authorization & Review Sign-Off
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      
                      <div className="border border-slate-300 p-3 rounded bg-slate-50 flex flex-col justify-between h-28">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Prepared By:</span>
                          <span className="font-bold text-slate-900">{metadata.engineerName}</span>
                          <span className="text-[10px] text-slate-600 block">Lead Supervising Engineer</span>
                        </div>
                        <div className="border-t border-dashed border-slate-400 pt-1 text-[9px] text-slate-400">
                          Signature / Stamp & Date
                        </div>
                      </div>

                      <div className="border border-slate-300 p-3 rounded bg-slate-50 flex flex-col justify-between h-28">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Checked / Verified By:</span>
                          <span className="font-bold text-slate-900">Technical Reviewer</span>
                          <span className="text-[10px] text-slate-600 block">Senior Quality & Standards Eng.</span>
                        </div>
                        <div className="border-t border-dashed border-slate-400 pt-1 text-[9px] text-slate-400">
                          Signature & Date
                        </div>
                      </div>

                      <div className="border border-slate-300 p-3 rounded bg-slate-50 flex flex-col justify-between h-28">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Approved By:</span>
                          <span className="font-bold text-slate-900">Resident Engineer</span>
                          <span className="text-[10px] text-slate-600 block">Project Management Representative</span>
                        </div>
                        <div className="border-t border-dashed border-slate-400 pt-1 text-[9px] text-slate-400">
                          Signature & Date
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 4. Mandatory Statutory Disclaimer */}
                {metadata.includeDisclaimer && (
                  <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-500 leading-snug">
                    <strong className="text-slate-700">TECHNICAL ADVISORY NOTICE:</strong> This document and engineering consultation output are provided for technical assistance, supervision verification, and design consulting. Actual construction execution, structural loads, geotechnical capacities, and material approvals must be checked and formally sealed by the registered Professional Engineer (PE) / Engineer of Record in accordance with applicable jurisdictional building codes.
                  </div>
                )}

                {/* 5. Document Footer */}
                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>Ref: {metadata.projectCode} | {metadata.projectName}</span>
                  <span>Supervising Engineer: {metadata.engineerName}</span>
                  <span>Confidential - For Official Project Use Only</span>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer with Dismiss and Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-850 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            {exportSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckIcon className="w-4 h-4 text-emerald-400" />
                PDF downloaded successfully!
              </span>
            ) : (
              <span>Ready to export {exportMode === 'full' ? 'all conversation items' : 'selected document'}.</span>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            {/* Dismiss / Close button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
            >
              Dismiss
            </button>

            {/* Print / Save PDF via Browser */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-200 hover:text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print / Browser PDF</span>
            </button>

            {/* Download PDF button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Spinner />
                  <span className="ml-2">Generating PDF...</span>
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PdfExportModal;
