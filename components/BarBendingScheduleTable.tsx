import React, { useState } from 'react';
import { BarBendingScheduleItem } from '../engineering/eurocode';

interface BarBendingScheduleTableProps {
  items: BarBendingScheduleItem[];
  onExportPdf?: () => void;
}

export const BarBendingScheduleTable: React.FC<BarBendingScheduleTableProps> = ({ items, onExportPdf }) => {
  const [selectedDiameter, setSelectedDiameter] = useState<number | 'all'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  const diameters = [8, 10, 12, 16, 20, 25];

  const filteredItems = items.filter((it) => {
    return selectedDiameter === 'all' || it.barSize === selectedDiameter;
  });

  const totalSteelWeight = filteredItems.reduce((sum, it) => sum + it.totalWeightKg, 0);

  const handleCopyBbs = () => {
    const header = 'Member Mark,Bar Mark,Grade,Size (mm),Total Bars,Length (m),Shape Code,Shape,Dim A,Dim B,Dim C,Weight (kg)\n';
    const rows = filteredItems
      .map((it) => `"${it.memberMark}","${it.barMark}","${it.typeAndGrade}",${it.barSize},${it.totalBars},${it.lengthPerBar},"${it.shapeCode}","${it.shapeDescription}",${it.dimA},${it.dimB},${it.dimC},${it.totalWeightKg}`)
      .join('\n');
    navigator.clipboard.writeText(header + rows);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              🔩
            </span>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Bar Bending Schedule (BBS) & Rebar Detailing Table
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conforming to BS 8666 / EN ISO 3766 • High-Yield Ribbed Steel Grade B500B / B500C
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyBbs}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 transition-colors"
          >
            {copied ? '✓ Copied' : '📋 Copy Schedule'}
          </button>
        </div>
      </div>

      {/* Diameter Filters & Total Weight */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          <span className="text-xs text-slate-400 font-semibold uppercase mr-1">Filter Diameter:</span>
          <button
            onClick={() => setSelectedDiameter('all')}
            className={`text-xs px-2.5 py-1 rounded-md font-mono ${
              selectedDiameter === 'all' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            All Sizes
          </button>
          {diameters.map((dia) => (
            <button
              key={dia}
              onClick={() => setSelectedDiameter(dia)}
              className={`text-xs px-2.5 py-1 rounded-md font-mono ${
                selectedDiameter === dia ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Ø{dia}mm
            </button>
          ))}
        </div>

        <div className="text-xs font-mono bg-emerald-950/50 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-emerald-300">
          Subtotal Weight: <strong className="text-emerald-400 text-sm font-bold">{totalSteelWeight.toLocaleString()} kg</strong> ({(totalSteelWeight / 1000).toFixed(2)} Tons)
        </div>
      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800/90 text-slate-300 border-b border-slate-700 font-mono uppercase text-[11px]">
              <th className="py-3 px-3">Member</th>
              <th className="py-3 px-2 text-center">Bar</th>
              <th className="py-3 px-2 text-center">Type</th>
              <th className="py-3 px-2 text-center">Size (mm)</th>
              <th className="py-3 px-2 text-center">No. Bars</th>
              <th className="py-3 px-3 text-right">Length (m)</th>
              <th className="py-3 px-3 text-center">Shape</th>
              <th className="py-3 px-4">Bending Dimensions (mm)</th>
              <th className="py-3 px-4 text-right">Total Weight (kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-3 font-semibold text-slate-200">{item.memberMark}</td>
                <td className="py-3 px-2 text-center font-mono font-bold text-blue-400">{item.barMark}</td>
                <td className="py-3 px-2 text-center font-mono text-slate-400">{item.typeAndGrade}</td>
                <td className="py-3 px-2 text-center font-mono font-bold text-cyan-400">Ø{item.barSize}</td>
                <td className="py-3 px-2 text-center font-mono font-semibold text-slate-300">{item.totalBars}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-300">{item.lengthPerBar.toFixed(2)}</td>
                <td className="py-3 px-3 text-center">
                  <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-bold">
                    Shape {item.shapeCode}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                  {item.dimA > 0 && <span>A={item.dimA} </span>}
                  {item.dimB > 0 && <span>B={item.dimB} </span>}
                  {item.dimC > 0 && <span>C={item.dimC} </span>}
                  <span className="text-slate-500 block text-[10px]">{item.shapeDescription}</span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                  {item.totalWeightKg.toLocaleString()} kg
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default BarBendingScheduleTable;
