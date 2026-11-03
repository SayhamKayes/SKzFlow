import React, { useState } from 'react';
import { AuthUser, Project } from '../types/project';
import { saveAuthUser, saveWebhookUrl, loadWebhookUrl } from '../utils/storage';
import { 
  getEffectiveWebhookUrl, 
  getEffectiveSheetId, 
  syncProjectsToGoogleSheets,
  SyncStatusInfo 
} from '../utils/googleSheetsSync';
import { 
  X, 
  User, 
  KeyRound, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  ExternalLink, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Mail
} from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser | null;
  onSignOut: () => void;
  projects: Project[];
  worksheets?: string[];
  syncStatus?: SyncStatusInfo;
  onUpdateUser: (updatedUser: AuthUser) => void;
  onRefreshCloud?: () => Promise<void> | void;
  isRefreshingCloud?: boolean;
  onResetDatabase?: () => Promise<void> | void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onSignOut,
  projects,
  worksheets,
  syncStatus,
  onUpdateUser,
  onRefreshCloud,
  isRefreshingCloud = false,
  onResetDatabase
}) => {
  if (!isOpen || !authUser) return null;

  const [copiedKey, setCopiedKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSheetId, setCustomSheetId] = useState(authUser.connectedSpreadsheetId || '');
  const [customWebhook, setCustomWebhook] = useState(loadWebhookUrl());
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const effectiveSheetId = customSheetId.trim() || getEffectiveSheetId(authUser);
  const effectiveWebhook = customWebhook.trim() || getEffectiveWebhookUrl();
  const isLiveMode = Boolean(effectiveWebhook);

  const displayPassword = authUser.password || authUser.accessKey || 'PF-SECURE-ACCESS';

  const handleCopyCredentials = async () => {
    try {
      const text = `Email: ${authUser.email}\nPassword: ${displayPassword}`;
      await navigator.clipboard.writeText(text);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    } catch (err) {
      console.error('Failed to copy credentials', err);
    }
  };

  const handleSaveCustomSettings = async () => {
    saveWebhookUrl(customWebhook.trim());
    const updated: AuthUser = {
      ...authUser,
      connectedSpreadsheetId: customSheetId.trim() || undefined
    };
    saveAuthUser(updated);
    onUpdateUser(updated);
    setIsSavingCustom(true);
    if (onRefreshCloud) {
      await onRefreshCloud();
    }
    setTimeout(() => setIsSavingCustom(false), 2000);
  };

  const handleTriggerSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      if (onRefreshCloud) {
        await onRefreshCloud();
      }
      const res = await syncProjectsToGoogleSheets(projects, worksheets, authUser);
      setSyncFeedback(res.message);
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetGoogleSheets = async () => {
    if (!window.confirm('Are you sure you want to completely RESET the Google Sheets database? This will clear all data across sheets.')) {
      return;
    }
    setIsResetting(true);
    setSyncFeedback(null);
    try {
      if (onResetDatabase) {
        await onResetDatabase();
      }
      setSyncFeedback('Google Sheets database reset to clean state.');
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Failed to reset database.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleRefreshFromCloud = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      if (onRefreshCloud) {
        await onRefreshCloud();
        setSyncFeedback('Successfully pulled latest records from Google Sheets database!');
      }
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Failed to pull from Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
              {authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Account Profile & Settings</span>
              </h2>
              <p className="text-xs text-slate-400">
                User credentials, sync mode, and spreadsheet tools
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
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          
          {/* User Details & Connection Status Card */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">{authUser.name}</span>
                <span className="text-xs text-slate-400 font-mono flex items-center space-x-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>{authUser.email}</span>
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
                isLiveMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                <span className={`w-2 h-2 rounded-full inline-block ${isLiveMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>{isLiveMode ? 'Live Sync Mode' : 'Local Offline Mode'}</span>
              </span>
            </div>

            {/* Sync Telemetry */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Total Active Records: <strong className="text-white font-mono">{projects.length}</strong></span>
              {syncStatus?.lastSyncedAt && (
                <span className="text-emerald-400 font-mono">Last synced: {syncStatus.lastSyncedAt}</span>
              )}
            </div>
          </div>

          {/* Cross-Device Login Credentials */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                <KeyRound className="w-4 h-4 mr-1.5" />
                Cross-Device Login Credentials
              </span>
              <button
                onClick={handleCopyCredentials}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Login Info</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Use this email and password to log in to your project management workspace on any other browser or device:
            </p>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Email:</span>
                <strong className="text-slate-200">{authUser.email}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Access Password:</span>
                <strong className="text-emerald-400 select-all">{displayPassword}</strong>
              </div>
            </div>
          </div>

          {/* Connected Google Sheet Link (if active) */}
          {effectiveSheetId && (
            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Google Sheet:</span>
                <span className="font-mono text-emerald-400 text-[11px] truncate max-w-[170px]">{effectiveSheetId}</span>
              </div>
              <a
                href={`https://docs.google.com/spreadsheets/d/${effectiveSheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-semibold transition"
              >
                <span>Open Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Optional / Advanced Spreadsheet Tools Collapsible */}
          <div className="bg-slate-850 rounded-xl border border-slate-800 overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:bg-slate-800/50 transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Custom Spreadsheet Tools (Optional)</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3.5 text-xs">
                <p className="text-slate-400 text-[11px] mt-3">
                  Only needed if you want to override the default system Google Sheet with your own personal spreadsheet link or webhook.
                </p>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Custom Google Spreadsheet ID:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    value={customSheetId}
                    onChange={(e) => setCustomSheetId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Custom Webhook URL:
                  </label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={customWebhook}
                    onChange={(e) => setCustomWebhook(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleTriggerSyncNow}
                      disabled={isSyncing || isRefreshingCloud}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 font-semibold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      title="Run two-way sync: Pull latest records from Google Sheets and sync local updates"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isRefreshingCloud ? 'animate-spin' : ''}`} />
                      <span>{isSyncing || isRefreshingCloud ? 'Syncing...' : 'Sync Now'}</span>
                    </button>

                    <button
                      onClick={handleRefreshFromCloud}
                      disabled={isSyncing || isRefreshingCloud}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                      title="Pull all live records directly from Google Sheets"
                    >
                      <span>Pull Data</span>
                    </button>
                  </div>

                  <button
                    onClick={handleSaveCustomSettings}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                  >
                    {isSavingCustom ? 'Saved!' : 'Save Settings'}
                  </button>
                </div>

                {onResetDatabase && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Wipe all cloud worksheets & start clean:
                    </span>
                    <button
                      type="button"
                      onClick={handleResetGoogleSheets}
                      disabled={isResetting || isSyncing}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition cursor-pointer disabled:opacity-50"
                    >
                      {isResetting ? 'Resetting...' : 'Reset Cloud Database'}
                    </button>
                  </div>
                )}

                {syncFeedback && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 font-mono">
                    {syncFeedback}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

