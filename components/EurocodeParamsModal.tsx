import React from 'react';
import { EurocodeProjectParameters } from '../engineering/eurocode';
import { CloseIcon } from './icons/DocumentIcon';

interface EurocodeParamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: EurocodeProjectParameters;
  onSaveParams: (updated: EurocodeProjectParameters) => void;
}

export const EurocodeParamsModal: React.FC<EurocodeParamsModalProps> = ({
  isOpen,
  onClose,
  params,
  onSaveParams,
}) => {
  const [formData, setFormData] = React.useState<EurocodeProjectParameters>(params);

  React.useEffect(() => {
    setFormData(params);
  }, [params, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveParams(formData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              ⚙️
            </span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Eurocode 2 & 8 Input Parameters (Metric SI)
              </h2>
              <p className="text-xs text-slate-400">
                Configure material grades, exposure class, cover, seismic factors, and building geometry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* Section 1: Materials & Exposure (EN 1992-1-1) */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
              1. Materials, Concrete Cover & Durability (EN 1992-1-1)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">Concrete Strength Class (fck):</label>
                <select
                  value={formData.concreteClass}
                  onChange={(e) => setFormData({ ...formData, concreteClass: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  <option value="C20/25">C20/25 (fck=20 MPa)</option>
                  <option value="C25/30">C25/30 (fck=25 MPa)</option>
                  <option value="C30/37">C30/37 (fck=30 MPa - Standard)</option>
                  <option value="C35/45">C35/45 (fck=35 MPa - High Strength)</option>
                  <option value="C40/50">C40/50 (fck=40 MPa)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Reinforcement Grade (fyk):</label>
                <select
                  value={formData.steelGrade}
                  onChange={(e) => setFormData({ ...formData, steelGrade: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  <option value="B500B">B500B (fyk=500 MPa, Class B ductility)</option>
                  <option value="B500C">B500C (fyk=500 MPa, High Seismic Ductility)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Exposure Class (EN 206):</label>
                <select
                  value={formData.exposureClass}
                  onChange={(e) => setFormData({ ...formData, exposureClass: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  <option value="XC1">XC1 (Dry / permanently wet)</option>
                  <option value="XC2">XC2 (Wet, rarely dry / Foundations)</option>
                  <option value="XC3">XC3 (Moderate humidity / Superstructure)</option>
                  <option value="XC4">XC4 (Cyclic wet and dry)</option>
                  <option value="XD1">XD1 (Moderate de-icing salts)</option>
                  <option value="XS1">XS1 (Airborne sea salt)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-300 block mb-1">Nominal Concrete Cover c_nom (mm):</label>
                <input
                  type="number"
                  min="20"
                  max="60"
                  value={formData.nominalCover}
                  onChange={(e) => setFormData({ ...formData, nominalCover: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
                <span className="text-[10px] text-slate-500">c_nom = c_min + Δc_dev (typically 25-35 mm)</span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Fire Resistance Rating:</label>
                <select
                  value={formData.fireResistance}
                  onChange={(e) => setFormData({ ...formData, fireResistance: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                >
                  <option value="R30">R30 (30 minutes)</option>
                  <option value="R60">R60 (60 minutes)</option>
                  <option value="R90">R90 (90 minutes)</option>
                  <option value="R120">R120 (120 minutes)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Building Geometry & Grid Spans */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              2. 3D Frame Geometry & Storeys (Metric)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">Number of Storeys:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.numberOfStoreys}
                  onChange={(e) => setFormData({ ...formData, numberOfStoreys: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Floor-to-Floor Height (m):</label>
                <input
                  type="number"
                  step="0.1"
                  min="2.5"
                  max="6.0"
                  value={formData.floorHeight}
                  onChange={(e) => setFormData({ ...formData, floorHeight: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Slab Thickness hs (mm):</label>
                <input
                  type="number"
                  min="100"
                  max="300"
                  value={formData.slabThickness}
                  onChange={(e) => setFormData({ ...formData, slabThickness: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">X-Direction Bay Spans (meters separated by comma):</label>
                <input
                  type="text"
                  value={formData.gridSpansX.join(', ')}
                  onChange={(e) => {
                    const spans = e.target.value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
                    if (spans.length > 0) setFormData({ ...formData, gridSpansX: spans });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  placeholder="e.g. 5.5, 6.0, 5.5"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Y-Direction Bay Spans (meters separated by comma):</label>
                <input
                  type="text"
                  value={formData.gridSpansY.join(', ')}
                  onChange={(e) => {
                    const spans = e.target.value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
                    if (spans.length > 0) setFormData({ ...formData, gridSpansY: spans });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  placeholder="e.g. 5.0, 5.0"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Geotechnical, Loads & Eurocode 8 Seismic */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              3. Geotechnical, Actions & Seismic (EN 1991, EN 1997, EN 1998)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 block mb-1">Soil Allowable Bearing Cap. (kPa):</label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  value={formData.soilBearingCapacity}
                  onChange={(e) => setFormData({ ...formData, soilBearingCapacity: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Imposed Load Qk (kN/m²):</label>
                <input
                  type="number"
                  step="0.5"
                  min="1.0"
                  max="10.0"
                  value={formData.imposedLoadQk}
                  onChange={(e) => setFormData({ ...formData, imposedLoadQk: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Seismic Accel. ag/g (EN 1998):</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="0.45"
                  value={formData.seismicZoneAg}
                  onChange={(e) => setFormData({ ...formData, seismicZoneAg: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30"
            >
              Apply Eurocode Parameters & Recompute
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default EurocodeParamsModal;
