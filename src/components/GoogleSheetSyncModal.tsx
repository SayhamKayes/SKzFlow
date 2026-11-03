import React, { useState } from 'react';
import { Project, AuthUser } from '../types/project';
import { 
  generateSpreadsheetTSV, 
  downloadProjectsCSV, 
  loadWebhookUrl, 
  saveWebhookUrl,
  loadAuthUser,
  saveAuthUser,
  clearAuthUser,
  formatMoney
} from '../utils/storage';
import { 
  getEffectiveWebhookUrl, 
  getEffectiveSheetId, 
  syncProjectsToGoogleSheets,
  APPS_SCRIPT_MASTER_CODE
} from '../utils/googleSheetsSync';
import { 
  X, 
  FileSpreadsheet, 
  Copy, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Send, 
  Sparkles, 
  User, 
  LogOut, 
  Calendar, 
  Check,
  RefreshCw,
  AlertCircle,
  Code2,
  Settings
} from 'lucide-react';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  worksheets: string[];
  authUser?: AuthUser | null;
  onAuthChange?: (user: AuthUser | null) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  projects,
  worksheets,
  authUser: propAuthUser,
  onAuthChange
}) => {
  if (!isOpen) return null;

  const [copiedTsv, setCopiedTsv] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState(loadWebhookUrl());
  const [sheetIdInput, setSheetIdInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'autosync' | 'script' | 'copy' | 'monthly' | 'download'>('autosync');
  const [selectedMonthExport, setSelectedMonthExport] = useState<string>('All Worksheets');

  // Internal or prop auth user
  const authUser = propAuthUser !== undefined ? propAuthUser : loadAuthUser();

  const effectiveWebhook = webhookUrlInput.trim() || getEffectiveWebhookUrl();
  const effectiveSheetId = sheetIdInput.trim() || getEffectiveSheetId(authUser);

  const handleSaveSettings = () => {
    saveWebhookUrl(webhookUrlInput.trim());
    if (authUser && sheetIdInput.trim()) {
      const updatedUser: AuthUser = {
        ...authUser,
        connectedSpreadsheetId: sheetIdInput.trim()
      };
      saveAuthUser(updatedUser);
      if (onAuthChange) onAuthChange(updatedUser);
    }
    setIsSavingSettings(true);
    setTimeout(() => setIsSavingSettings(false), 2000);
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const result = await syncProjectsToGoogleSheets(projects, authUser);
      if (result.success) {
        setSyncStatusMsg({ type: 'success', text: result.message });
      } else {
        setSyncStatusMsg({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setSyncStatusMsg({ type: 'error', text: err?.message || 'Failed to sync with Google Sheets.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const projectsToExport = selectedMonthExport === 'All Worksheets'
    ? projects
    : projects.filter(p => p.worksheet === selectedMonthExport);

  const handleCopyTSV = async () => {
    try {
      const tsv = generateSpreadsheetTSV(projectsToExport);
      await navigator.clipboard.writeText(tsv);
      setCopiedTsv(true);
      setTimeout(() => setCopiedTsv(false), 3000);
    } catch (err) {
      console.error('Failed to copy TSV:', err);
    }
  };

  // Google Apps Script code that creates/manages dedicated monthly tabs and provides GET/POST API
  const appsScriptCode = APPS_SCRIPT_MASTER_CODE;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(appsScriptCode);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 3000);
    } catch (err) {
      console.error('Failed to copy script:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Google Sheets Live Sync & Data Vault</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  2-Way Architecture
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sync and preserve your project records by month across Google Sheets with zero data loss
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

        {/* Status Bar */}
        <div className="px-6 py-2.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span className="text-slate-400">Account:</span>
            <strong className="text-white font-mono">{authUser?.email || 'Guest User'}</strong>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              authUser?.isDemo ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {authUser?.isDemo ? 'Demo Mode' : 'Connected to Google'}
            </span>
          </div>

          {effectiveSheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${effectiveSheetId}/edit`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-mono transition"
            >
              <span>Open Connected Google Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900 shrink-0 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('autosync')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'autosync'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Live Auto-Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'script'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Apps Script Code</span>
          </button>
          <button
            onClick={() => setActiveTab('copy')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'copy'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy TSV Data</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Monthly Vault</span>
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'download'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* TAB 1: Live Auto-Sync & Credentials */}
          {activeTab === 'autosync' && (
            <div className="space-y-5">
              
              {/* Sync Trigger Action */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                      <RefreshCw className="w-4 h-4 mr-1.5 text-emerald-400" />
                      Trigger Google Sheets Synchronization
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Transmits all {projects.length} project records partitioned across their respective monthly tabs in Google Sheets.
                    </p>
                  </div>

                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Synchronizing...' : 'Sync Now to Google Sheets'}</span>
                  </button>
                </div>

                {syncStatusMsg && (
                  <div className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                    syncStatusMsg.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}>
                    {syncStatusMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{syncStatusMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Webhook and Sheet Credentials Configuration */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span>Google Sheets Connection Credentials</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Google Apps Script Webhook URL:
                    </label>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                      value={webhookUrlInput}
                      onChange={(e) => setWebhookUrlInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Configured in <strong>.env</strong> as <code className="text-emerald-400">VITE_GOOGLE_SHEETS_WEBHOOK_URL</code> or saved locally here.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Google Spreadsheet ID:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      value={sheetIdInput || authUser?.connectedSpreadsheetId || ''}
                      onChange={(e) => setSheetIdInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Found in your Google Sheet URL between <strong>/d/</strong> and <strong>/edit</strong>. Configured in <strong>.env</strong> as <code className="text-emerald-400">VITE_GOOGLE_SHEET_ID</code>.
                    </span>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSaveSettings}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      {isSavingSettings ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Settings Saved!</span>
                        </>
                      ) : (
                        <span>Save Credentials</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Apps Script Code */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Google Apps Script Code (Copy & Paste)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deploy this simple script in your Google Sheet to enable automatic month partitioning and real-time sync.
                  </p>
                </div>

                <button
                  onClick={handleCopyScript}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Apps Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 max-h-72 overflow-y-auto leading-relaxed">
                <pre>{appsScriptCode}</pre>
              </div>

              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <strong className="text-white block font-semibold">How to setup in 2 minutes:</strong>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Open your Google Sheet, click <strong>Extensions &gt; Apps Script</strong>.</li>
                  <li>Delete any existing code, paste the script above, and click <strong>Save</strong>.</li>
                  <li>Click <strong>Deploy &gt; New deployment</strong>. Select type <strong>Web app</strong>.</li>
                  <li>Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>.</li>
                  <li>Click <strong>Deploy</strong>, copy the resulting Web app URL, and paste it in <code className="text-emerald-400">.env</code> as <code className="text-emerald-400">VITE_GOOGLE_SHEETS_WEBHOOK_URL</code>!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Copy TSV Data */}
          {activeTab === 'copy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Clipboard TSV Transfer
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Copy tab-separated data and paste directly (<kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Ctrl+V</kbd>) into any sheet.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedMonthExport}
                    onChange={(e) => setSelectedMonthExport(e.target.value)}
                    className="bg-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 border border-slate-700 cursor-pointer focus:outline-none"
                  >
                    <option value="All Worksheets">All Worksheets ({projects.length})</option>
                    {worksheets.map(ws => (
                      <option key={ws} value={ws}>{ws}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleCopyTSV}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    {copiedTsv ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied TSV!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy for Sheets</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <span className="font-semibold text-slate-200 block">Preview of Headers Copied:</span>
                <p className="font-mono text-[11px] text-emerald-400 truncate">
                  Company Name | Clients Name | Company Type | Project Type | Start Date | Target Deadline | Worksheet | Budget Confirmed | Confirmation | 40% Advance | 30% Midway | 30% Handover | Total Paid | Due Amount | Status
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Monthly Vault */}
          {activeTab === 'monthly' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                ProjectFlow partitions all client projects by month (e.g. <strong>November 2026</strong>, <strong>October 2026</strong>). Each worksheet acts as an isolated accounting tab.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {worksheets.map(ws => {
                  const wsProjects = projects.filter(p => p.worksheet === ws);
                  const wsValue = wsProjects.reduce((sum, p) => sum + (p.budgetConfirmed || 0), 0);
                  const wsPaid = wsProjects.reduce((sum, p) => sum + (p.totalPaid || 0), 0);

                  return (
                    <div key={ws} className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center">
                          <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                          {ws}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          {wsProjects.length} {wsProjects.length === 1 ? 'project' : 'projects'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Total: {formatMoney(wsValue)}</span>
                        <span className="text-emerald-400">Paid: {formatMoney(wsPaid)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: Download CSV */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Download your project records as a standard UTF-8 CSV file. It can be uploaded directly to Google Drive, Google Sheets, or Microsoft Excel with all columns and financial records preserved.
              </p>

              <button
                onClick={() => downloadProjectsCSV(projects)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 flex items-center space-x-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download UTF-8 CSV File</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Active Records: <strong className="text-white font-mono">{projects.length}</strong> | Currency: <strong className="text-emerald-400 font-mono">BDT (৳)</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
