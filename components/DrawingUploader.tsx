import React, { useState, useRef } from 'react';
import { EurocodeProjectParameters } from '../engineering/eurocode';

interface DrawingUploaderProps {
  onDrawingAnalyzed: (extractedParams: Partial<EurocodeProjectParameters>, drawingDataUrl: string) => void;
  isLoading: boolean;
}

export interface SampleDrawing {
  id: string;
  name: string;
  type: string;
  description: string;
  spansX: number[];
  spansY: number[];
  floors: number;
  area: number;
  imageUrl: string;
}

// Built-in architectural drawing presets
export const SAMPLE_DRAWINGS: SampleDrawing[] = [
  {
    id: 'comm-office',
    name: '4-Storey Commercial RC Office Building Plan',
    type: 'Commercial / Office',
    description: 'Grid layout 3x2 spans (17m x 10m), open plan offices, central circulation and stair core',
    spansX: [5.5, 6.0, 5.5],
    spansY: [5.0, 5.0],
    floors: 4,
    area: 680,
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400"><rect width="600" height="400" fill="%230f172a"/><rect x="50" y="50" width="500" height="300" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><g stroke="%23334155" stroke-dasharray="4" stroke-width="1.5"><line x1="50" y1="200" x2="550" y2="200"/><line x1="216" y1="50" x2="216" y2="350"/><line x1="384" y1="50" x2="384" y2="350"/></g><g fill="%230284c7"><rect x="42" y="42" width="16" height="16"/><rect x="208" y="42" width="16" height="16"/><rect x="376" y="42" width="16" height="16"/><rect x="542" y="42" width="16" height="16"/><rect x="42" y="192" width="16" height="16"/><rect x="208" y="192" width="16" height="16"/><rect x="376" y="192" width="16" height="16"/><rect x="542" y="192" width="16" height="16"/><rect x="42" y="342" width="16" height="16"/><rect x="208" y="342" width="16" height="16"/><rect x="376" y="342" width="16" height="16"/><rect x="542" y="342" width="16" height="16"/></g><text x="70" y="80" fill="%2394a3b8" font-family="monospace" font-size="12">OFFICE BAY 1 (5.5m x 5.0m)</text><text x="230" y="80" fill="%2394a3b8" font-family="monospace" font-size="12">CENTRAL ATRIUM (6.0m)</text><text x="400" y="80" fill="%2394a3b8" font-family="monospace" font-size="12">OFFICE BAY 2 (5.5m x 5.0m)</text><text x="230" y="230" fill="%2338bdf8" font-family="sans-serif" font-weight="bold" font-size="14">ARCHITECTURAL FLOOR PLAN - LEVEL 1-4</text><text x="230" y="250" fill="%23cbd5e1" font-family="sans-serif" font-size="11">Eurocode 2 Metric Framing • Engineer Meneyahil</text></svg>',
  },
  {
    id: 'res-villa',
    name: '3-Storey Residential Luxury Villa Plan',
    type: 'Residential (Cat. A)',
    description: 'Grid layout 3x2 spans (18m x 12m) with cantilever balconies and double-height living room',
    spansX: [6.0, 6.0, 6.0],
    spansY: [6.0, 6.0],
    floors: 3,
    area: 648,
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400"><rect width="600" height="400" fill="%230f172a"/><rect x="60" y="40" width="480" height="320" fill="%231e293b" stroke="%2310b981" stroke-width="2"/><g stroke="%23334155" stroke-dasharray="4"><line x1="220" y1="40" x2="220" y2="360"/><line x1="380" y1="40" x2="380" y2="360"/><line x1="60" y1="200" x2="540" y2="200"/></g><g fill="%2310b981"><circle cx="60" cy="40" r="8"/><circle cx="220" cy="40" r="8"/><circle cx="380" cy="40" r="8"/><circle cx="540" cy="40" r="8"/><circle cx="60" cy="200" r="8"/><circle cx="220" cy="200" r="8"/><circle cx="380" cy="200" r="8"/><circle cx="540" cy="200" r="8"/><circle cx="60" cy="360" r="8"/><circle cx="220" cy="360" r="8"/><circle cx="380" cy="360" r="8"/><circle cx="540" cy="360" r="8"/></g><text x="80" y="80" fill="%236ee7b7" font-family="sans-serif" font-weight="bold" font-size="14">VILLA GROUND & TYPICAL FLOOR</text><text x="80" y="105" fill="%2394a3b8" font-family="monospace" font-size="12">Span X: 3 x 6.0m = 18.0m | Span Y: 2 x 6.0m = 12.0m</text><text x="80" y="130" fill="%23cbd5e1" font-family="sans-serif" font-size="11">Living Room • Kitchen • 4 Master Suites • Balconies</text></svg>',
  },
  {
    id: 'mixed-commercial',
    name: '5-Storey Mixed-Use Retail & Residential Complex',
    type: 'Mixed Commercial / Residential',
    description: 'Grid layout 4x2 spans (24m x 12m), transfer slab at level 1 over ground floor commercial arcade',
    spansX: [6.0, 6.0, 6.0, 6.0],
    spansY: [6.0, 6.0],
    floors: 5,
    area: 1440,
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400"><rect width="600" height="400" fill="%230f172a"/><rect x="40" y="50" width="520" height="300" fill="%231e293b" stroke="%23f59e0b" stroke-width="2"/><g stroke="%23334155" stroke-dasharray="4"><line x1="170" y1="50" x2="170" y2="350"/><line x1="300" y1="50" x2="300" y2="350"/><line x1="430" y1="50" x2="430" y2="350"/><line x1="40" y1="200" x2="560" y2="200"/></g><g fill="%23f59e0b"><rect x="33" y="43" width="14" height="14"/><rect x="163" y="43" width="14" height="14"/><rect x="293" y="43" width="14" height="14"/><rect x="423" y="43" width="14" height="14"/><rect x="553" y="43" width="14" height="14"/><rect x="33" y="193" width="14" height="14"/><rect x="163" y="193" width="14" height="14"/><rect x="293" y="193" width="14" height="14"/><rect x="423" y="193" width="14" height="14"/><rect x="553" y="193" width="14" height="14"/><rect x="33" y="343" width="14" height="14"/><rect x="163" y="343" width="14" height="14"/><rect x="293" y="343" width="14" height="14"/><rect x="423" y="343" width="14" height="14"/><rect x="553" y="343" width="14" height="14"/></g><text x="60" y="90" fill="%23fcd34d" font-family="sans-serif" font-weight="bold" font-size="14">MIXED USE COMPLEX (24m x 12m)</text><text x="60" y="115" fill="%23cbd5e1" font-family="sans-serif" font-size="12">Ground Retail + 4 Storeys Apartments • Eurocode Design</text></svg>',
  },
];

export const DrawingUploader: React.FC<DrawingUploaderProps> = ({ onDrawingAnalyzed, isLoading }) => {
  const [selectedDrawing, setSelectedDrawing] = useState<SampleDrawing | null>(SAMPLE_DRAWINGS[0]);
  const [customDrawingUrl, setCustomDrawingUrl] = useState<string | null>(null);
  const [customDrawingName, setCustomDrawingName] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [analysisNote, setAnalysisNote] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      alert('Please upload an architectural drawing in PNG, JPG, or SVG image format.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCustomDrawingUrl(dataUrl);
      setCustomDrawingName(file.name);
      setSelectedDrawing(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleProcessDrawing = async () => {
    const drawingUrl = customDrawingUrl || selectedDrawing?.imageUrl || SAMPLE_DRAWINGS[0].imageUrl;
    
    // Call server to analyze drawing via Gemini
    try {
      const res = await fetch('/api/analyze-drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawingDataUrl: drawingUrl,
          drawingName: customDrawingName || selectedDrawing?.name || 'Architectural Floor Plan',
          sampleId: selectedDrawing?.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisNote(data.explanation || 'Architectural drawing structural framing analyzed successfully.');
        onDrawingAnalyzed(data.extractedParams, drawingUrl);
      } else {
        // Fallback to preset architectural dimensions if offline
        const fallbackParams: Partial<EurocodeProjectParameters> = {
          projectTitle: customDrawingName || selectedDrawing?.name || 'Architectural Project',
          gridSpansX: selectedDrawing?.spansX || [5.5, 6.0, 5.5],
          gridSpansY: selectedDrawing?.spansY || [5.0, 5.0],
          numberOfStoreys: selectedDrawing?.floors || 4,
          totalBuildingArea: selectedDrawing?.area || 680,
          imposedLoadQk: selectedDrawing?.type.includes('Commercial') ? 3.0 : 2.0,
        };
        onDrawingAnalyzed(fallbackParams, drawingUrl);
      }
    } catch {
      // Local fallback
      const fallbackParams: Partial<EurocodeProjectParameters> = {
        projectTitle: customDrawingName || selectedDrawing?.name || 'Architectural Project',
        gridSpansX: selectedDrawing?.spansX || [5.5, 6.0, 5.5],
        gridSpansY: selectedDrawing?.spansY || [5.0, 5.0],
        numberOfStoreys: selectedDrawing?.floors || 4,
        totalBuildingArea: selectedDrawing?.area || 680,
      };
      onDrawingAnalyzed(fallbackParams, drawingUrl);
    }
  };

  const currentPreviewUrl = customDrawingUrl || selectedDrawing?.imageUrl;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              📐
            </span>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Architectural Drawing Inspector & Vision Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Attach drawings to automatically extract structural grid spans, generate 3D RC frames, Eurocode calculations, and metric BOQ
          </p>
        </div>

        <button
          onClick={handleProcessDrawing}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing Drawing with Gemini...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Generate 3D RC Frame & BOQ</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid: Upload Area / Sample selector + Drawing Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Preset Selector & Upload Box */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Preset Architectural Drawings */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Select Sample Architectural Drawing:
            </label>
            <div className="space-y-2">
              {SAMPLE_DRAWINGS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => {
                    setSelectedDrawing(sample);
                    setCustomDrawingUrl(null);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedDrawing?.id === sample.id && !customDrawingUrl
                      ? 'bg-blue-950/50 border-blue-500 text-white shadow-md'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-blue-300">{sample.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {sample.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sample.description}</p>
                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 mt-2">
                    <span>Storeys: <strong className="text-white">{sample.floors}</strong></span>
                    <span>•</span>
                    <span>Total Area: <strong className="text-white">{sample.area} m²</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Or Upload Custom Drawing */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Or Attach Custom Architectural Drawing:
            </label>
            
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 text-slate-400 hover:text-slate-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="text-3xl mb-2">📤</div>
              <p className="text-xs font-semibold text-white">
                {customDrawingName ? `Attached: ${customDrawingName}` : 'Click to Upload or Drag & Drop Drawing'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports Architectural Floor Plans, Elevations, and Sections (PNG, JPG, PDF)
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Drawing Preview with Structural Overlays */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Drawing Visualizer & Detected Grid Overlays
            </span>
            <span className="text-xs text-blue-400 font-mono">
              Scale: 1:100 Metric (SI)
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-4 flex flex-col items-center justify-center min-h-[380px] shadow-inner relative group">
            {currentPreviewUrl ? (
              <img
                src={currentPreviewUrl}
                alt="Architectural Drawing"
                className="max-h-[350px] w-auto object-contain rounded-md shadow-lg border border-slate-800 transition-transform group-hover:scale-102"
              />
            ) : (
              <div className="text-slate-500 text-sm italic">No drawing selected.</div>
            )}

            {/* AI Vision Scan Badge */}
            <div className="absolute top-6 left-6 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400 flex items-center space-x-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Vision Status: Ready for Extraction</span>
            </div>
          </div>

          {analysisNote && (
            <div className="bg-blue-950/40 border border-blue-700/60 p-3 rounded-lg text-xs text-blue-200">
              <strong>Gemini Vision Extraction Note: </strong> {analysisNote}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default DrawingUploader;
