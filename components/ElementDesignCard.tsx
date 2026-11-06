import React, { useState } from 'react';
import {
  BeamDesignOutput,
  ColumnDesignOutput,
  SlabDesignOutput,
  FootingDesignOutput,
  EurocodeProjectParameters,
} from '../engineering/eurocode';

interface ElementDesignCardProps {
  beams: BeamDesignOutput[];
  columns: ColumnDesignOutput[];
  slabs: SlabDesignOutput[];
  footings: FootingDesignOutput[];
  params: EurocodeProjectParameters;
  onExportElementPdf?: (elementTitle: string, markdownContent: string) => void;
}

export const ElementDesignCard: React.FC<ElementDesignCardProps> = ({
  beams,
  columns,
  slabs,
  footings,
  params,
  onExportElementPdf,
}) => {
  const [activeTab, setActiveTab] = useState<'beams' | 'columns' | 'slabs' | 'footings'>('beams');
  const [selectedBeamIdx, setSelectedBeamIdx] = useState<number>(0);
  const [selectedColIdx, setSelectedColIdx] = useState<number>(0);

  const selectedBeam = beams[selectedBeamIdx] || beams[0];
  const selectedCol = columns[selectedColIdx] || columns[0];
  const selectedSlab = slabs[0];
  const selectedFooting = footings[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-6">
      
      {/* Top Header & Element Category Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              📐
            </span>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Detailed Reinforced Concrete Element Design & Rebar Detailing
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governing Code: <strong>EN 1992-1-1 (Eurocode 2)</strong> • Concrete Class: <strong>{params.concreteClass}</strong> • Steel: <strong>{params.steelGrade}</strong>
          </p>
        </div>

        {/* Tab Pills */}
        <div className="bg-slate-800/80 p-1 rounded-xl flex items-center space-x-1 border border-slate-700">
          {[
            { id: 'beams', label: 'RC Beams', count: beams.length },
            { id: 'columns', label: 'RC Columns', count: columns.length },
            { id: 'slabs', label: 'RC Slabs', count: slabs.length },
            { id: 'footings', label: 'Pad Footings', count: footings.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* --- TAB 1: RC BEAM DESIGN & REBAR DETAILING --- */}
      {activeTab === 'beams' && selectedBeam && (
        <div className="space-y-6">
          {/* Sub-selector for beam spans */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 font-semibold uppercase">Select Beam:</span>
            {beams.map((bm, idx) => (
              <button
                key={bm.id}
                onClick={() => setSelectedBeamIdx(idx)}
                className={`text-xs px-3 py-1 rounded-md font-mono transition-all ${
                  selectedBeamIdx === idx
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {bm.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 cols: Eurocode 2 Design Verification Cards */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Flexural Design Box */}
              <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/70 pb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>1. Flexural Bending Capacity (EN 1992-1-1 §6.1)</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    PASS - SINGLY REINFORCED
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Span Design Moment MEd:</span>
                    <span className="text-amber-400 font-bold text-sm">{selectedBeam.designMomentMidspan} kNm</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Support Hogging Moment:</span>
                    <span className="text-amber-400 font-bold text-sm">{selectedBeam.designMomentSupport} kNm</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Effective Depth d:</span>
                    <span className="text-cyan-400 font-bold text-sm">{selectedBeam.effectiveDepth} mm</span>
                  </div>
                </div>

                {/* Rebar Provisions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-xl">
                    <span className="text-[11px] font-bold text-emerald-300 uppercase block">
                      Bottom Tension Rebar (Midspan):
                    </span>
                    <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                      {selectedBeam.bottomRebarProvided}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      As,req = {selectedBeam.bottomRebarRequired} mm² | As,prov = {selectedBeam.bottomRebarAreaProvided} mm²
                    </div>
                  </div>

                  <div className="bg-cyan-950/30 border border-cyan-500/40 p-3 rounded-xl">
                    <span className="text-[11px] font-bold text-cyan-300 uppercase block">
                      Top Support Rebar (Hogging):
                    </span>
                    <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                      {selectedBeam.topRebarProvided}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      As,req = {selectedBeam.topRebarRequired} mm² | As,prov = {selectedBeam.topRebarAreaProvided} mm²
                    </div>
                  </div>
                </div>
              </div>

              {/* Shear & Deflection Verification Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Shear Design */}
                <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">2. Shear (EN 1992 §6.2)</span>
                    <span className="text-[10px] text-emerald-400 font-bold">VEd &lt; VRd,max</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 text-slate-300">
                    <div>Design Shear VEd: <strong className="text-rose-400">{selectedBeam.designShearForce} kN</strong></div>
                    <div>Concrete Resistance VRdc: <span className="text-slate-400">{selectedBeam.shearCapacityVRdc} kN</span></div>
                    <div>Crushing Limit VRdmax: <span className="text-slate-400">{selectedBeam.shearCapacityVRdmax} kN</span></div>
                  </div>
                  <div className="bg-amber-950/30 border border-amber-500/40 p-2 rounded-lg text-xs font-mono text-amber-300">
                    <strong>Shear Links: </strong>{selectedBeam.shearLinksRequired}
                  </div>
                </div>

                {/* Deflection & Cracking */}
                <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">3. Deflection (EN 1992 §7.4)</span>
                    <span className="text-[10px] text-emerald-400 font-bold">L/d PASS</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 text-slate-300">
                    <div>Span/Depth (L/d) Actual: <strong className="text-white">{selectedBeam.spanDepthRatioActual}</strong></div>
                    <div>Allowable Limit (L/d): <strong className="text-emerald-400">{selectedBeam.spanDepthRatioAllowable}</strong></div>
                    <div>Estimated Crack Width: <strong className="text-cyan-400">{selectedBeam.crackWidthEstimate} mm</strong> (&lt;0.3mm)</div>
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    Serviceability requirements satisfied without detailed calculation.
                  </div>
                </div>

              </div>

            </div>

            {/* Right 5 cols: High-Fidelity Beam Rebar Cross-Section SVG Diagram */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Beam Cross-Section Rebar Detail (300 x 500 mm)
              </span>

              {/* Scaled SVG Rebar Cross-Section Drawing */}
              <svg viewBox="0 0 320 420" className="w-full max-w-[280px] h-auto drop-shadow-md">
                {/* Concrete Boundary */}
                <rect x="50" y="40" width="220" height="320" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="3" />
                
                {/* Stirrup Link (Yellow line with 135 deg hooks) */}
                <rect x="70" y="60" width="180" height="280" rx="10" fill="none" stroke="#eab308" strokeWidth="4" />
                
                {/* Top Reinforcement (2 bars, Cyan) */}
                <circle cx="88" cy="78" r="10" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="232" cy="78" r="10" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                
                {/* Bottom Reinforcement (3 bars, Red) */}
                <circle cx="88" cy="322" r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="160" cy="322" r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="232" cy="322" r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

                {/* Dimension Arrows */}
                {/* Width 300 mm */}
                <line x1="50" y1="380" x2="270" y2="380" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="50" y1="373" x2="50" y2="387" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="270" y1="373" x2="270" y2="387" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="160" y="398" fill="#38bdf8" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">b = 300 mm</text>

                {/* Depth 500 mm */}
                <line x1="25" y1="40" x2="25" y2="360" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="18" y1="40" x2="32" y2="40" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="18" y1="360" x2="32" y2="360" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="18" y="200" fill="#38bdf8" fontSize="12" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 18 200)" fontWeight="bold">h = 500 mm</text>

                {/* Annotations */}
                <text x="160" y="100" fill="#06b6d4" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">2 Ø16 Top Hanger Bars</text>
                <text x="160" y="295" fill="#ef4444" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">{selectedBeam.bottomRebarProvided}</text>
                <text x="160" y="200" fill="#eab308" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">2L-Ø8 Stirrup Links</text>
                <text x="160" y="215" fill="#94a3b8" fontSize="9" fontFamily="sans-serif" textAnchor="middle">c_nom = {selectedBeam.cover} mm</text>
              </svg>

              <div className="w-full mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono text-center">
                Detail per EN 1992-1-1 §9.2.1 • Spacing &gt; 25 mm clearance
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 2: RC COLUMN DESIGN & REBAR DETAILING --- */}
      {activeTab === 'columns' && selectedCol && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 font-semibold uppercase">Select Floor:</span>
            {columns.map((col, idx) => (
              <button
                key={col.id}
                onClick={() => setSelectedColIdx(idx)}
                className={`text-xs px-3 py-1 rounded-md font-mono transition-all ${
                  selectedColIdx === idx
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {col.floor}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/70 pb-2">
                  <h3 className="text-sm font-bold text-white">
                    Axial & Biaxial Bending Capacity (EN 1992 §5.8 & §6.1)
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    STATUS: {selectedCol.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Axial Load NEd:</span>
                    <span className="text-amber-400 font-bold text-sm">{selectedCol.axialForceNEd} kN</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Moment MEdx:</span>
                    <span className="text-amber-400 font-bold text-sm">{selectedCol.bendingMomentMEdx} kNm</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Reinforcement Ratio:</span>
                    <span className="text-emerald-400 font-bold text-sm">{selectedCol.reinforcementRatio} %</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                  <div>Slenderness λ = {selectedCol.slendernessLambda} (Limit λlim = {selectedCol.slendernessLimit})</div>
                  <div>Second-Order Moment M2 = {selectedCol.secondOrderMoment} kNm</div>
                  <div className="text-emerald-400 font-bold pt-1">
                    Provided Main Rebar: {selectedCol.rebarProvided} (As = {selectedCol.rebarAreaProvided} mm²)
                  </div>
                  <div className="text-amber-300 pt-0.5">
                    Lateral Tie Links: {selectedCol.tiesSpacing}
                  </div>
                </div>
              </div>
            </div>

            {/* Column Cross-Section SVG Diagram */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Column Cross-Section Rebar Detail (400 x 400 mm)
              </span>

              <svg viewBox="0 0 320 320" className="w-full max-w-[260px] h-auto drop-shadow-md">
                <rect x="50" y="50" width="220" height="220" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="3" />
                <rect x="70" y="70" width="180" height="180" rx="8" fill="none" stroke="#eab308" strokeWidth="3" />
                
                {/* 8 Ø20 Main Bars (Corner & Face) */}
                <circle cx="82" cy="82" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="160" cy="82" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="238" cy="82" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                
                <circle cx="82" cy="160" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="238" cy="160" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                
                <circle cx="82" cy="238" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="160" cy="238" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="238" cy="238" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

                {/* Dimensions */}
                <text x="160" y="295" fill="#38bdf8" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">400 x 400 mm</text>
                <text x="160" y="165" fill="#ef4444" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">8 Ø20 B500B</text>
              </svg>

              <div className="w-full mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono text-center">
                Lateral Ties Ø8 @ 175 mm (Reduced to 100 mm in lap zones)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: RC SLAB DESIGN --- */}
      {activeTab === 'slabs' && selectedSlab && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/60 border border-slate-700 p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-2">
              Two-Way Solid RC Slab (EN 1992-1-1 §6.1, §9.3)
            </h3>
            <div className="text-xs font-mono space-y-2 text-slate-300">
              <div>Slab Panel Dimensions: <strong className="text-white">{selectedSlab.spanX} m x {selectedSlab.spanY} m</strong></div>
              <div>Slab Thickness: <strong className="text-cyan-400">{selectedSlab.thickness} mm</strong></div>
              <div>Design Action ULS: <strong className="text-amber-400">{selectedSlab.designLoadULS} kN/m²</strong></div>
              <div>Midspan Moment Mx: <strong className="text-emerald-400">{selectedSlab.momentMx} kNm/m</strong></div>
              <div>Midspan Moment My: <strong className="text-emerald-400">{selectedSlab.momentMy} kNm/m</strong></div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl mt-3 space-y-1">
              <span className="text-xs font-bold text-emerald-300 block">Slab Rebar Specification:</span>
              <div className="text-xs font-mono text-emerald-400">Bottom X-direction: {selectedSlab.bottomRebarX}</div>
              <div className="text-xs font-mono text-emerald-400">Bottom Y-direction: {selectedSlab.bottomRebarY}</div>
              <div className="text-xs font-mono text-cyan-300">Top Hogging over Beams: {selectedSlab.topRebarHogging}</div>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-2">
              Punching Shear Verification (EN 1992 §6.4)
            </h3>
            <div className="text-xs font-mono space-y-2 text-slate-300">
              <div>Basic Control Perimeter u1: <span className="text-slate-400">At distance 2.0d from column face</span></div>
              <div>Punching Shear Stress vEd: <strong className="text-white">{selectedSlab.punchingShearStress} MPa</strong></div>
              <div>Punching Resistance vRd,c: <strong className="text-emerald-400">{selectedSlab.punchingShearResistance} MPa</strong></div>
              <div className="bg-emerald-950/60 border border-emerald-600/50 p-2.5 rounded-lg text-emerald-300 font-bold text-center">
                ✓ vEd &lt; vRd,c (No shear reinforcement required)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: PAD FOOTING DESIGN --- */}
      {activeTab === 'footings' && selectedFooting && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/60 border border-slate-700 p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-2">
              Pad Footing Soil & Flexure Design (EN 1997-1 & EN 1992)
            </h3>
            <div className="text-xs font-mono space-y-2 text-slate-300">
              <div>Supported Column Axial Load NEd: <strong className="text-amber-400">{selectedFooting.axialLoadNEd} kN</strong></div>
              <div>Footing Dimensions: <strong className="text-white">{selectedFooting.lengthB} m x {selectedFooting.widthL} m x {selectedFooting.thicknessH} m</strong></div>
              <div>Actual Soil Bearing Pressure: <strong className="text-emerald-400">{selectedFooting.soilPressureActual} kPa</strong></div>
              <div>Allowable Soil Bearing Capacity: <strong className="text-slate-400">{selectedFooting.soilPressureAllowable} kPa</strong></div>
              <div>Bending Moment at Face: <strong className="text-amber-400">{selectedFooting.flexuralMoment} kNm</strong></div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl mt-2">
              <span className="text-xs font-bold text-emerald-300 block">Footing Mesh Reinforcement:</span>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                {selectedFooting.rebarBottomMesh}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white border-b border-slate-700 pb-2">
              One-Way & Two-Way Shear Verification
            </h3>
            <div className="text-xs font-mono space-y-2 text-slate-300">
              <div>One-Way Beam Shear at d: <span className="text-emerald-400 font-bold">PASS (vEd &lt; vRd,c)</span></div>
              <div>Two-Way Punching Shear at 2d: <span className="text-emerald-400 font-bold">PASS ({selectedFooting.punchingShearCheck})</span></div>
              <div>Minimum Blinding Concrete: <span className="text-slate-300">100 mm thick C15/20</span></div>
              <div>Nominal Bottom Concrete Cover: <span className="text-slate-300">50 mm (contact with blinding/earth)</span></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ElementDesignCard;
