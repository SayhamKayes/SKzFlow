import React from 'react';
import { Project } from '../types/project';
import { formatMoney } from '../utils/storage';
import { 
  DollarSign, 
  Wallet, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  FileText
} from 'lucide-react';

interface MetricsOverviewProps {
  projects: Project[];
  timeframeLabel?: string;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  projects,
  timeframeLabel
}) => {
  const totalConfirmedBudget = projects.reduce((acc, p) => acc + (p.budgetConfirmed || 0), 0);
  const totalPaid = projects.reduce((acc, p) => acc + (p.totalPaid || 0), 0);
  const totalDue = projects.reduce((acc, p) => acc + (p.dueAmount || 0), 0);
  
  // 40% Advance total collected
  const advanceCollected = projects.reduce((acc, p) => {
    return acc + (p.milestones.advance40.paid ? p.milestones.advance40.amount : 0);
  }, 0);

  // Projects pending milestone 2 payment (at 70%+ work)
  const pendingMilestone2 = projects.filter(
    p => p.progressPercent >= 70 && !p.milestones.midway30.paid
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-5">
      
      {/* 1. Total Value */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">
            Total Value
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-white font-mono">
          {formatMoney(totalConfirmedBudget)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center">
          <FileText className="w-3 h-3 mr-1 text-slate-500" />
          <span>{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
          {timeframeLabel && <span className="ml-1 text-slate-500">• {timeframeLabel}</span>}
        </p>
      </div>

      {/* 2. Advance Collected */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">
            Advance Collected
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
          {formatMoney(advanceCollected)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Initial 40% Kickoff Funds
        </p>
      </div>

      {/* 3. Revenue Collected */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">
            Revenue Collected
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-800/50 flex items-center justify-center text-teal-400">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-teal-300 font-mono">
          {formatMoney(totalPaid)}
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
          <div 
            className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${totalConfirmedBudget > 0 ? (totalPaid / totalConfirmedBudget) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* 4. Outstanding Due */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">
            Outstanding Due
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono">
          {formatMoney(totalDue)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Remaining across milestones
        </p>
      </div>

      {/* 5. 70% Milestone Alerts */}
      <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-800/70 rounded-xl p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-indigo-200 flex items-center">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-indigo-400" />
            70% Work Alerts
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
            pendingMilestone2.length > 0 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {pendingMilestone2.length}
          </span>
        </div>
        <div className="text-xs text-indigo-200 font-medium">
          {pendingMilestone2.length > 0 ? (
            <span className="text-rose-300 font-semibold">
              {pendingMilestone2.length} {pendingMilestone2.length === 1 ? 'project' : 'projects'} reached 70% work; 30% milestone is due now!
            </span>
          ) : (
            <span className="text-slate-400">
              All 70% progress milestone payments are settled.
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
