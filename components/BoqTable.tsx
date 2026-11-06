import React, { useState } from 'react';
import { BoqItem } from '../engineering/eurocode';

interface BoqTableProps {
  items: BoqItem[];
  summary: {
    totalConcreteVolumeM3: number;
    totalSteelTonnageTons: number;
    totalFormworkAreaM2: number;
    totalEstimatedCostUSD: number;
    steelToConcreteRatioKgM3: number;
  };
  onExportPdf?: () => void;
}

export const BoqTable: React.FC<BoqTableProps> = ({ items, summary, onExportPdf }) => {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const sections = ['All', 'Substructure', 'Superstructure Concrete', 'Reinforcement Steel', 'Formwork & Shuttering', 'Masonry & Finishes'];

  const filteredItems = items.filter((item) => {
    const matchesSection = selectedSection === 'All' || item.billSection === selectedSection;
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) || item.itemNumber.includes(searchQuery);
    return matchesSection && matchesSearch;
  });

  const filteredTotal = filteredItems.reduce((sum, item) => sum + item.totalAmountUSD, 0);

  const handleCopyCsv = () => {
    const header = 'Item No.,Bill Section,Description,Unit,Quantity,Unit Rate (USD),Total Amount (USD)\n';
    const rows = filteredItems
      .map((it) => `"${it.itemNumber}","${it.billSection}","${it.description.replace(/"/g, '""')}","${it.unit}",${it.quantity},${it.unitRateUSD},${it.totalAmountUSD}`)
      .join('\n');
    navigator.clipboard.writeText(header + rows);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              📊
            </span>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Metric Bill of Quantities (BoQ) - Eurocode & CESMM4
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated material take-off generated from architectural & structural drawing dimensions
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyCsv}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
            title="Copy as CSV for Excel"
          >
            <span>{copied ? '✓ Copied' : '📋 Copy CSV'}</span>
          </button>

          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
            >
              <span>📄</span>
              <span>Export BoQ PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Concrete:</span>
          <span className="text-base font-bold text-white font-mono">{summary.totalConcreteVolumeM3} m³</span>
          <span className="text-[10px] text-slate-500 block">EN 206 C30/37</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Steel Rebar:</span>
          <span className="text-base font-bold text-emerald-400 font-mono">{summary.totalSteelTonnageTons} Tons</span>
          <span className="text-[10px] text-slate-500 block">Grade B500B</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Steel/Concrete Ratio:</span>
          <span className="text-base font-bold text-cyan-400 font-mono">{summary.steelToConcreteRatioKgM3} kg/m³</span>
          <span className="text-[10px] text-slate-500 block">Standard 95-130 kg/m³</span>
        </div>

        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Formwork:</span>
          <span className="text-base font-bold text-amber-400 font-mono">{summary.totalFormworkAreaM2} m²</span>
          <span className="text-[10px] text-slate-500 block">Class F2 Shuttering</span>
        </div>

        <div className="bg-blue-950/60 p-3 rounded-xl border border-blue-500/40 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-blue-300 uppercase font-bold block">Estimated Value:</span>
          <span className="text-base font-extrabold text-blue-400 font-mono">
            ${summary.totalEstimatedCostUSD.toLocaleString()}
          </span>
          <span className="text-[10px] text-blue-300/80 block">Direct Construction Cost</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedSection === sec
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search items or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* BoQ Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800/90 text-slate-300 border-b border-slate-700 font-mono uppercase text-[11px]">
              <th className="py-3 px-3 w-16">Item</th>
              <th className="py-3 px-4">Description of Works (Metric SI)</th>
              <th className="py-3 px-3 w-16 text-center">Unit</th>
              <th className="py-3 px-3 text-right">Qty</th>
              <th className="py-3 px-3 text-right">Rate ($)</th>
              <th className="py-3 px-4 text-right">Total ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-blue-400">{item.itemNumber}</td>
                <td className="py-3 px-4 text-slate-200">
                  <div className="font-medium">{item.description}</div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">{item.billSection}</span>
                </td>
                <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400">{item.unit}</td>
                <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                  {item.quantity.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-400">
                  ${item.unitRateUSD.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                  ${item.totalAmountUSD.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-850 font-mono font-bold text-white border-t-2 border-slate-700">
              <td colSpan={5} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs">
                Total Amount ({selectedSection}):
              </td>
              <td className="py-3.5 px-4 text-right text-sm text-emerald-400">
                ${filteredTotal.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
};

export default BoqTable;
