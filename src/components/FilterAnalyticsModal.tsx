import React, { useState } from 'react';
import { Project, DateRangePreset, SERVICE_DEFINITIONS } from '../types/project';
import { formatMoney, downloadProjectsCSV, downloadProjectsExcel } from '../utils/storage';
import { 
  X, 
  FileSpreadsheet, 
  Filter, 
  Plus, 
  Edit2, 
  Check, 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Download,
  Trash2
} from 'lucide-react';

interface FilterAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Worksheets
  worksheets: string[];
  selectedWorksheet: string;
  onSelectWorksheet: (ws: string) => void;
  onRenameWorksheet: (oldName: string, newName: string) => void;
  onDeleteWorksheet: (name: string) => void;

  // Date Range
  dateRange: DateRangePreset;
  onSelectDateRange: (range: DateRangePreset) => void;
  customStartDate: string;
  onCustomStartDateChange: (date: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (date: string) => void;

  // Filtered projects for dynamic analytics calculation
  filteredProjects: Project[];
  totalAllProjects: number;
}

export const FilterAnalyticsModal: React.FC<FilterAnalyticsModalProps> = ({
  isOpen,
  onClose,
  worksheets,
  selectedWorksheet,
  onSelectWorksheet,
  onRenameWorksheet,
  onDeleteWorksheet,
  dateRange,
  onSelectDateRange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  filteredProjects,
  totalAllProjects
}) => {
  if (!isOpen) return null;

  const [editingWs, setEditingWs] = useState<string | null>(null);
  const [renamedWs, setRenamedWs] = useState('');
  const [confirmDeleteWs, setConfirmDeleteWs] = useState<string | null>(null);

  const handleStartRename = (ws: string) => {
    setEditingWs(ws);
    setRenamedWs(ws);
  };

  const handleSaveRename = (oldName: string) => {
    if (renamedWs.trim() && renamedWs !== oldName) {
      onRenameWorksheet(oldName, renamedWs.trim());
    }
    setEditingWs(null);
  };

  // Dynamic Financial Calculations for the selected worksheet/range
  const totalValue = filteredProjects.reduce((acc, p) => acc + (p.budgetConfirmed || 0), 0);
  const totalPaid = filteredProjects.reduce((acc, p) => acc + (p.totalPaid || 0), 0);
  const totalDue = filteredProjects.reduce((acc, p) => acc + (p.dueAmount || 0), 0);
  const advanceCollected = filteredProjects.reduce((acc, p) => {
    return acc + (p.milestones.advance40.paid ? p.milestones.advance40.amount : 0);
  }, 0);

  const collectionRate = totalValue > 0 ? Math.round((totalPaid / totalValue) * 100) : 0;

  // Service distribution in this selection
  const serviceDistribution = Object.keys(SERVICE_DEFINITIONS).map(key => {
    const sId = key as keyof typeof SERVICE_DEFINITIONS;
    const meta = SERVICE_DEFINITIONS[sId];
    const count = filteredProjects.filter(p => p.projectType === sId).length;
    const percentage = filteredProjects.length > 0 ? Math.round((count / filteredProjects.length) * 100) : 0;
    return {
      id: sId,
      label: meta.label,
      count,
      percentage,
      color: meta.color,
      bgLight: meta.bgLight
    };
  });

  // Status breakdown
  const statusCounts = {
    Completed: filteredProjects.filter(p => p.projectStatus === 'Completed').length,
    '70% Done': filteredProjects.filter(p => p.projectStatus === '70% Done').length,
    'In Progress': filteredProjects.filter(p => p.projectStatus === 'In Progress').length,
    'Review / QA': filteredProjects.filter(p => p.projectStatus === 'Review / QA').length,
    Confirmed: filteredProjects.filter(p => p.projectStatus === 'Confirmed').length,
    Lead: filteredProjects.filter(p => p.projectStatus === 'Lead').length,
  };

  const rangeButtons: { id: DateRangePreset; label: string; icon: string }[] = [
    { id: 'all', label: 'All Time', icon: '🌐' },
    { id: 'today', label: 'Today', icon: '⚡' },
    { id: 'this-week', label: 'This Week', icon: '🗓️' },
    { id: 'this-month', label: 'This Month', icon: '📅' },
    { id: 'past-6-months', label: 'Past 6 Months', icon: '📈' },
    { id: 'past-1-year', label: 'Past 1 Year', icon: '🏛️' },
    { id: 'custom', label: 'Custom Range', icon: '⚙️' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Filter & Period Analytics</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono border border-slate-700">
                  {selectedWorksheet}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Switch monthly worksheets, apply date ranges, and view executive telemetry charts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* Section 1: Monthly Worksheet Management */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-400" />
                Select Monthly / Yearly Worksheet
              </span>
              <span className="text-[11px] text-slate-400">
                Click any sheet to filter, or click pencil icon to rename
              </span>
            </div>

            {/* Worksheets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
              {worksheets.map(ws => {
                const isSelected = selectedWorksheet === ws;
                const isEditing = editingWs === ws;

                if (isEditing) {
                  return (
                    <div key={ws} className="flex items-center space-x-1 p-1 bg-slate-800 rounded-lg border border-emerald-500">
                      <input
                        type="text"
                        value={renamedWs}
                        autoFocus
                        onChange={(e) => setRenamedWs(e.target.value)}
                        className="w-full px-2 py-0.5 text-xs bg-slate-900 text-white rounded focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(ws)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingWs(null)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={ws}
                    className={`group relative p-2.5 rounded-lg border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 hover:text-white'
                    }`}
                    onClick={() => onSelectWorksheet(ws)}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="text-xs">{isSelected ? '✓' : '📄'}</span>
                      <span className="text-xs truncate">{ws}</span>
                    </div>

                    {ws !== 'All Worksheets' && (
                      confirmDeleteWs === ws ? (
                        <div className="flex items-center space-x-1 p-0.5 bg-rose-950 border border-rose-500 rounded text-[10px]" onClick={(e) => e.stopPropagation()}>
                          <span className="text-rose-300 font-semibold text-[10px]">Delete?</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteWorksheet(ws);
                              setConfirmDeleteWs(null);
                            }}
                            className="px-1.5 py-0.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteWs(null);
                            }}
                            className="px-1 py-0.5 text-slate-400 hover:text-white cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(ws);
                            }}
                            className={`p-1 rounded transition cursor-pointer ${
                              isSelected ? 'text-slate-950 hover:bg-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                            title="Rename Worksheet"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteWs(ws);
                            }}
                            className={`p-1 rounded transition cursor-pointer ${
                              isSelected ? 'text-slate-950 hover:bg-rose-400' : 'text-slate-400 hover:text-rose-400 hover:bg-slate-700'
                            }`}
                            title="Permanently Delete Worksheet and Records"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Date Range Filter Bar */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <Filter className="w-4 h-4 mr-1.5 text-emerald-400" />
              Filter By Date Range
            </span>

            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              {rangeButtons.map(btn => {
                const isSelected = dateRange === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => onSelectDateRange(btn.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-extrabold border border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
                    }`}
                  >
                    <span>{btn.icon}</span>
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Range Picker */}
            {dateRange === 'custom' && (
              <div className="flex items-center space-x-3 pt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex-wrap gap-2 text-xs">
                <span className="text-slate-300 font-semibold flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Custom Period:
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => onCustomStartDateChange(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => onCustomEndDateChange(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Executive Telemetry & Visual Charts for This Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-400" />
                Live Period Financial & Visual Analytics
              </span>
              <span className="text-xs text-slate-400">
                Showing {filteredProjects.length} of {totalAllProjects} total records
              </span>
            </div>

            {/* Financial Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Total Period Value</span>
                <span className="text-base sm:text-lg font-extrabold text-white font-mono">
                  {formatMoney(totalValue)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Confirmed project value</span>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Advance Collected (40%)</span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono">
                  {formatMoney(advanceCollected)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Kickoff milestone funds</span>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Revenue Realized</span>
                <span className="text-base sm:text-lg font-extrabold text-teal-300 font-mono">
                  {formatMoney(totalPaid)}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                  {collectionRate}% Collected
                </span>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Outstanding Due</span>
                <span className="text-base sm:text-lg font-extrabold text-rose-400 font-mono">
                  {formatMoney(totalDue)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Pending collection</span>
              </div>
            </div>

            {/* Visual Bar: Revenue vs Due Ratio */}
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300">Revenue Realization vs Outstanding Due</span>
                <span className="font-mono text-emerald-400">{collectionRate}% Paid</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${collectionRate}%` }}
                  title={`Collected: ${formatMoney(totalPaid)}`}
                />
                <div 
                  className="bg-rose-500/80 h-full transition-all duration-500"
                  style={{ width: `${100 - collectionRate}%` }}
                  title={`Due: ${formatMoney(totalDue)}`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                  Collected: <strong className="text-emerald-400 font-mono ml-1">{formatMoney(totalPaid)}</strong>
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>
                  Due: <strong className="text-rose-400 font-mono ml-1">{formatMoney(totalDue)}</strong>
                </span>
              </div>
            </div>

            {/* Service & Pipeline Visual Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Service Distribution Graph */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center">
                    <PieChart className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                    Service Portfolio Distribution
                  </span>
                  <span className="text-[11px] text-slate-400">5 Main Categories</span>
                </div>

                <div className="space-y-2 pt-1">
                  {serviceDistribution.map(item => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span className="truncate">{item.label}</span>
                        <span className="font-mono text-slate-400 text-[11px]">{item.count} projects ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Breakdown Bar */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                    Project Status Breakdown
                  </span>
                  <span className="text-[11px] text-slate-400">{filteredProjects.length} in view</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2 bg-slate-800 rounded-lg border border-slate-750 flex justify-between items-center">
                    <span className="text-emerald-400 font-medium">Completed</span>
                    <span className="font-bold text-white font-mono">{statusCounts.Completed}</span>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-lg border border-slate-750 flex justify-between items-center">
                    <span className="text-indigo-400 font-medium">70% Done</span>
                    <span className="font-bold text-white font-mono">{statusCounts['70% Done']}</span>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-lg border border-slate-750 flex justify-between items-center">
                    <span className="text-blue-400 font-medium">In Progress</span>
                    <span className="font-bold text-white font-mono">{statusCounts['In Progress']}</span>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-lg border border-slate-750 flex justify-between items-center">
                    <span className="text-amber-400 font-medium">Review / QA</span>
                    <span className="font-bold text-white font-mono">{statusCounts['Review / QA']}</span>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-lg border border-slate-750 flex justify-between items-center">
                    <span className="text-teal-400 font-medium">Confirmed</span>
                    <span className="font-bold text-white font-mono">{statusCounts.Confirmed}</span>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-lg border border-slate-750 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Lead</span>
                    <span className="font-bold text-white font-mono">{statusCounts.Lead}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Section 4: Export Period Records */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                <Download className="w-4 h-4 mr-1.5 text-emerald-400" />
                Export Records for {selectedWorksheet}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {filteredProjects.length} records ready
              </span>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                onClick={() => downloadProjectsCSV(filteredProjects)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 flex items-center space-x-1.5 cursor-pointer transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download CSV (UTF-8)</span>
              </button>
              <button
                onClick={() => downloadProjectsExcel(filteredProjects, `${selectedWorksheet.replace(/\s+/g, '_')}_Analytics`)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 flex items-center space-x-1.5 cursor-pointer transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                <span>Download Excel (.xls)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Active view: <strong className="text-emerald-400">{selectedWorksheet}</strong> ({dateRange})
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer"
          >
            Apply & View Projects
          </button>
        </div>

      </div>
    </div>
  );
};

