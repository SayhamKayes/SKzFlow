import React, { useState } from 'react';
import { 
  Project, 
  ServiceType, 
  SERVICE_DEFINITIONS, 
  ProjectStatus 
} from '../types/project';
import { 
  formatMoney, 
  downloadProjectsCSV, 
  downloadProjectsExcel, 
  generateSpreadsheetTSV 
} from '../utils/storage';
import { 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Eye, 
  Globe, 
  Cpu, 
  Layers, 
  Smartphone, 
  Share2, 
  AlertTriangle, 
  FileSpreadsheet, 
  CheckCircle2, 
  Plus, 
  X, 
  Check, 
  Download, 
  ChevronDown, 
  Copy,
  RefreshCw 
} from 'lucide-react';

interface ProjectTableViewProps {
  projects: Project[];
  activeWorksheet?: string;
  worksheets?: string[];
  onSelectWorksheet?: (ws: string) => void;
  onAddWorksheet?: (name: string) => void;
  onOpenNewProject?: () => void;
  onRefreshCloud?: () => void;
  isRefreshingCloud?: boolean;
  onDeleteWorksheet?: (name: string) => void;
  onEditProject: (project: Project) => void;
  onViewProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onToggleMilestone: (projectId: string, milestoneKey: 'advance40' | 'midway30' | 'handover30') => void;
  onQuickUpdateStatus: (projectId: string, newStatus: ProjectStatus) => void;
  onQuickUpdateConfirmation?: (projectId: string, newConfirmation: string) => void;
}

const getServiceBadge = (type: ServiceType) => {
  const meta = SERVICE_DEFINITIONS[type] || SERVICE_DEFINITIONS['web-app'];

  const renderIcon = () => {
    switch (meta.iconName) {
      case 'Cpu': return <Cpu className="w-3 h-3 mr-1 inline" />;
      case 'Layers': return <Layers className="w-3 h-3 mr-1 inline" />;
      case 'Smartphone': return <Smartphone className="w-3 h-3 mr-1 inline" />;
      case 'Share2': return <Share2 className="w-3 h-3 mr-1 inline" />;
      default: return <Globe className="w-3 h-3 mr-1 inline" />;
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${meta.bgLight} ${meta.color} ${meta.borderLight} whitespace-nowrap`}>
      {renderIcon()}
      {meta.label}
    </span>
  );
};

export const ProjectTableView: React.FC<ProjectTableViewProps> = ({
  projects,
  activeWorksheet = 'All Worksheets',
  worksheets,
  onSelectWorksheet,
  onAddWorksheet,
  onOpenNewProject,
  onRefreshCloud,
  isRefreshingCloud,
  onDeleteWorksheet,
  onEditProject,
  onViewProject,
  onDeleteProject,
  onToggleMilestone,
  onQuickUpdateStatus,
  onQuickUpdateConfirmation
}) => {
  const [isAddingWs, setIsAddingWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedTsv, setCopiedTsv] = useState(false);

  const handleCopyTSV = async () => {
    try {
      const tsv = generateSpreadsheetTSV(projects);
      await navigator.clipboard.writeText(tsv);
      setCopiedTsv(true);
      setTimeout(() => {
        setCopiedTsv(false);
        setShowExportMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy TSV:', err);
    }
  };

  const handleCreateMonthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWsName.trim() && onAddWorksheet) {
      const name = newWsName.trim();
      onAddWorksheet(name);
      if (onSelectWorksheet) {
        onSelectWorksheet(name);
      }
      setNewWsName('');
      setIsAddingWs(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
      
      {/* Header Banner - Business-friendly Title (No overly technical wording) */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
          <span className="font-bold text-slate-200 text-sm tracking-tight">
            Client Project Records
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ({projects.length} {projects.length === 1 ? 'record' : 'records'})
          </span>
          {onRefreshCloud && (
            <button
              onClick={onRefreshCloud}
              disabled={isRefreshingCloud}
              className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
              title="Refresh live data from Google Sheets central cloud database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCloud ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}
        </div>

        {/* Right side: Running Worksheet Indicator & Quick Switcher + New Month Action */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 shadow-xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-slate-400 font-medium">Worksheet:</span>
            
            {worksheets && onSelectWorksheet ? (
              <div className="flex items-center space-x-1">
                <select
                  value={activeWorksheet}
                  onChange={(e) => onSelectWorksheet(e.target.value)}
                  className="bg-slate-800 text-emerald-300 font-bold text-xs rounded px-2 py-0.5 border border-slate-700 cursor-pointer focus:outline-none"
                >
                  {worksheets.map(ws => (
                    <option key={ws} value={ws}>{ws}</option>
                  ))}
                </select>

                {activeWorksheet !== 'All Worksheets' && onDeleteWorksheet && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete worksheet "${activeWorksheet}"? All project records in this worksheet will be preserved and reassigned.`)) {
                        onDeleteWorksheet(activeWorksheet);
                      }
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    title={`Delete "${activeWorksheet}" Worksheet`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <span className="font-bold text-emerald-400 text-xs font-mono">
                {activeWorksheet}
              </span>
            )}
          </div>

          {/* New Month Sheet Creation Form / Button */}
          {isAddingWs ? (
            <form onSubmit={handleCreateMonthSubmit} className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-emerald-500 shadow-md">
              <input
                type="text"
                autoFocus
                placeholder="e.g. December 2026"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                className="w-36 px-2 py-0.5 text-xs bg-slate-950 text-white rounded border border-slate-700 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs transition cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingWs(false);
                  setNewWsName('');
                }}
                className="p-1 text-slate-400 hover:text-white"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            onAddWorksheet && (
              <button
                onClick={() => setIsAddingWs(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition cursor-pointer shadow-xs"
                title="Create a new monthly worksheet (e.g. December 2026, Q1 2027)"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Month Sheet</span>
              </button>
            )
          )}

          {/* Quick Add Project CTA */}
          {onOpenNewProject && (
            <button
              onClick={onOpenNewProject}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer"
              title={`Add Project in ${activeWorksheet}`}
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>Add Project</span>
            </button>
          )}

          {/* Export / Download Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer shadow-xs"
              title="Download or Export Worksheet Records"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                  Export: {activeWorksheet}
                </div>
                <button
                  onClick={() => {
                    downloadProjectsCSV(projects);
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-white flex items-center space-x-2 cursor-pointer transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <div className="font-semibold">Download CSV (UTF-8)</div>
                    <div className="text-[10px] text-slate-400">For Excel, Drive & Sheets</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    downloadProjectsExcel(projects, `${activeWorksheet.replace(/\s+/g, '_')}_Projects`);
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-white flex items-center space-x-2 cursor-pointer transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                  <div>
                    <div className="font-semibold">Download Excel (.xls)</div>
                    <div className="text-[10px] text-slate-400">Formatted spreadsheet table</div>
                  </div>
                </button>
                <button
                  onClick={handleCopyTSV}
                  className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800 hover:text-white flex items-center space-x-2 cursor-pointer transition border-t border-slate-800"
                >
                  {copiedTsv ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied TSV to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <div className="font-semibold">Copy for Google Sheets</div>
                        <div className="text-[10px] text-slate-400">Ctrl+V paste ready</div>
                      </div>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">
            No projects in {activeWorksheet}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You don't have any client projects recorded under {activeWorksheet} yet. Click below to add your first project.
          </p>
          {onOpenNewProject && (
            <button
              onClick={onOpenNewProject}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Add Project to {activeWorksheet}</span>
            </button>
          )}
        </div>
      ) : (
        /* Table Container with Fixed Sticky Left (Company Name) and Sticky Right (Actions) */
        <div className="overflow-x-auto max-h-[720px] overflow-y-auto relative">
        <table className="w-full text-left border-collapse text-xs">
          
          {/* Header Row Styled Like Google Spreadsheet */}
          <thead className="sticky top-0 z-30 shadow-xs">
            <tr className="bg-[#93cf8c] text-slate-950 font-bold border-b border-[#7bb974] divide-x divide-[#7bb974]/60">
              
              {/* FIXED LEFT: Company Name */}
              <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px] sticky left-0 z-40 bg-[#93cf8c] shadow-[2px_0_5px_rgba(0,0,0,0.15)]">
                Company Name
              </th>

              <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">
                Clients Name
              </th>
              
              {/* Company Type column header */}
              <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px]">
                Company Type
              </th>

              <th className="py-2.5 px-3 whitespace-nowrap min-w-[160px]">
                Project Type
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px]">
                Start Date
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px]">
                Deadline
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right min-w-[115px]">
                Budget Estimated
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right min-w-[125px]">
                Budget Confirmed
              </th>
              
              {/* Confirmation Column Header */}
              <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">
                Confirmation
              </th>

              <th className="py-2.5 px-3 whitespace-nowrap text-center min-w-[130px] bg-[#87c480]">
                40% Advance
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center min-w-[130px] bg-[#87c480]">
                30% (70% Work)
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center min-w-[130px] bg-[#87c480]">
                30% Handover
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right min-w-[110px] bg-[#7dbb76]">
                Total Paid
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right min-w-[110px] bg-[#e6a29a] text-red-950">
                Due Amount
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap min-w-[125px]">
                Project Status
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px]">
                Deployment
              </th>

              {/* FIXED RIGHT: Actions */}
              <th className="py-2.5 px-3 whitespace-nowrap text-center min-w-[110px] sticky right-0 z-40 bg-[#93cf8c] shadow-[-2px_0_5px_rgba(0,0,0,0.15)]">
                Actions
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 text-slate-200">
            {projects.map((proj, idx) => {
              const adv = proj.milestones.advance40;
              const mid = proj.milestones.midway30;
              const fin = proj.milestones.handover30;
              const isEven = idx % 2 === 0;

              return (
                <tr 
                  key={proj.id}
                  className={`hover:bg-slate-800/70 transition divide-x divide-slate-800/80 group ${
                    isEven ? 'bg-slate-900' : 'bg-slate-950'
                  }`}
                >
                  
                  {/* FIXED LEFT: Company Name */}
                  <td className={`py-2 px-3 font-semibold sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.35)] ${
                    isEven ? 'bg-slate-900 group-hover:bg-slate-850' : 'bg-slate-950 group-hover:bg-slate-850'
                  }`}>
                    <button 
                      onClick={() => onViewProject(proj)}
                      className="text-left text-white hover:text-emerald-400 font-bold transition flex flex-col group/btn cursor-pointer"
                    >
                      <span className="truncate max-w-[150px]">{proj.companyName}</span>
                    </button>
                    {proj.progressPercent !== undefined && (
                      <div className="w-24 bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            proj.progressPercent >= 100 
                              ? 'bg-emerald-500' 
                              : proj.progressPercent >= 70 
                              ? 'bg-indigo-500' 
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${proj.progressPercent}%` }}
                        />
                      </div>
                    )}
                  </td>

                  {/* Clients Name */}
                  <td className="py-2 px-3 text-slate-300">
                    <div className="font-medium text-slate-200">{proj.clientsName}</div>
                    {proj.clientPhone && (
                      <span className="text-[10px] text-slate-400 font-mono block">{proj.clientPhone}</span>
                    )}
                  </td>

                  {/* Company Type: Converted to clean inline text, no boxy borders */}
                  <td className="py-2 px-3 text-slate-300">
                    <span className="text-slate-300 text-xs font-medium whitespace-nowrap">
                      {proj.companyType}
                    </span>
                  </td>

                  {/* Project Type */}
                  <td className="py-2 px-3">
                    {getServiceBadge(proj.projectType)}
                  </td>

                  {/* Start Date */}
                  <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">
                    {proj.startDate || '—'}
                  </td>

                  {/* Target Deadline */}
                  <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">
                    {proj.targetDeadline || '—'}
                  </td>

                  {/* Budget Estimated */}
                  <td className="py-2 px-3 text-right text-slate-400 font-mono">
                    {formatMoney(proj.budgetEstimated)}
                  </td>

                  {/* Budget Confirmed */}
                  <td className="py-2 px-3 text-right font-bold text-white font-mono">
                    {formatMoney(proj.budgetConfirmed)}
                  </td>

                  {/* Confirmation: 2 options (Signed Contract / Proposal Accepted), switchable right in the row */}
                  <td className="py-2 px-3">
                    {onQuickUpdateConfirmation ? (
                      <select
                        value={proj.confirmation === 'Proposal Accepted' ? 'Proposal Accepted' : 'Signed Contract'}
                        onChange={(e) => onQuickUpdateConfirmation(proj.id, e.target.value)}
                        className={`text-[11px] font-semibold rounded px-1.5 py-0.5 border cursor-pointer focus:outline-none transition ${
                          proj.confirmation === 'Signed Contract'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/80'
                            : 'bg-blue-950/70 text-blue-300 border-blue-700/80 hover:bg-blue-900/80'
                        }`}
                        title="Click to change confirmation status"
                      >
                        <option value="Signed Contract">Signed Contract</option>
                        <option value="Proposal Accepted">Proposal Accepted</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center text-[11px] text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                        {proj.confirmation}
                      </span>
                    )}
                  </td>

                  {/* 40% Advance Payment Milestone */}
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => onToggleMilestone(proj.id, 'advance40')}
                      title={adv.paid ? `Paid: ${adv.paidDate || 'Yes'}. Click to toggle` : 'Mark 40% Advance as Paid'}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center justify-between w-full border cursor-pointer ${
                        adv.paid
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/80'
                          : 'bg-amber-950/70 text-amber-300 border-amber-700/80 hover:bg-amber-900/80'
                      }`}
                    >
                      <span>{adv.paid ? 'PAID' : 'DUE'}</span>
                      <span className="font-mono text-[10px]">{formatMoney(adv.amount)}</span>
                    </button>
                  </td>

                  {/* 30% Milestone Payment (at 70% Work) */}
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => onToggleMilestone(proj.id, 'midway30')}
                      title={mid.paid ? `Paid: ${mid.paidDate || 'Yes'}. Click to toggle` : 'Mark 30% Midway as Paid'}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center justify-between w-full border cursor-pointer ${
                        mid.paid
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/80'
                          : proj.progressPercent >= 70
                          ? 'bg-rose-950/80 text-rose-300 border-rose-700 hover:bg-rose-900/90 animate-pulse font-extrabold'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <span className="flex items-center">
                        {proj.progressPercent >= 70 && !mid.paid && (
                          <AlertTriangle className="w-2.5 h-2.5 mr-0.5 text-rose-400 inline" />
                        )}
                        {mid.paid ? 'PAID' : 'DUE'}
                      </span>
                      <span className="font-mono text-[10px]">{formatMoney(mid.amount)}</span>
                    </button>
                  </td>

                  {/* 30% Final Payment (Handover) */}
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => onToggleMilestone(proj.id, 'handover30')}
                      title={fin.paid ? `Paid: ${fin.paidDate || 'Yes'}. Click to toggle` : 'Mark 30% Handover as Paid'}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center justify-between w-full border cursor-pointer ${
                        fin.paid
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/80'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <span>{fin.paid ? 'PAID' : 'DUE'}</span>
                      <span className="font-mono text-[10px]">{formatMoney(fin.amount)}</span>
                    </button>
                  </td>

                  {/* Total Paid */}
                  <td className="py-2 px-3 text-right font-bold text-emerald-400 font-mono">
                    {formatMoney(proj.totalPaid)}
                  </td>

                  {/* Due */}
                  <td className="py-2 px-3 text-right font-bold font-mono">
                    <span className={proj.dueAmount > 0 ? 'text-rose-400' : 'text-slate-500'}>
                      {formatMoney(proj.dueAmount)}
                    </span>
                  </td>

                  {/* Project Status */}
                  <td className="py-2 px-3">
                    <select
                      value={proj.projectStatus}
                      onChange={(e) => onQuickUpdateStatus(proj.id, e.target.value as ProjectStatus)}
                      className="bg-slate-800 text-[11px] font-semibold text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 hover:border-emerald-500 cursor-pointer focus:outline-none"
                    >
                      <option value="Lead">Lead</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="70% Done">70% Done</option>
                      <option value="Review / QA">Review / QA</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </td>

                  {/* Deployment */}
                  <td className="py-2 px-3">
                    {proj.deploymentUrl ? (
                      <a
                        href={proj.deploymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 hover:underline max-w-[140px] truncate"
                        title={proj.deploymentUrl}
                      >
                        <span className="truncate">{proj.deployment || 'Live URL'}</span>
                        <ExternalLink className="w-3 h-3 ml-1 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        {proj.deployment || 'Not Deployed'}
                      </span>
                    )}
                  </td>

                  {/* FIXED RIGHT: Actions */}
                  <td className={`py-2 px-3 text-center sticky right-0 z-20 shadow-[-2px_0_5px_rgba(0,0,0,0.35)] ${
                    isEven ? 'bg-slate-900 group-hover:bg-slate-850' : 'bg-slate-950 group-hover:bg-slate-850'
                  }`}>
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onViewProject(proj)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditProject(proj)}
                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

    </div>
  );
};
