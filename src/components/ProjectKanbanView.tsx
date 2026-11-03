import React from 'react';
import { Project, ProjectStatus, SERVICE_DEFINITIONS } from '../types/project';
import { formatMoney } from '../utils/storage';
import { 
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface ProjectKanbanViewProps {
  projects: Project[];
  onViewProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onQuickUpdateStatus: (projectId: string, newStatus: ProjectStatus) => void;
  onToggleMilestone: (projectId: string, milestoneKey: 'advance40' | 'midway30' | 'handover30') => void;
}

const KANBAN_COLUMNS: { id: ProjectStatus; title: string; color: string }[] = [
  { id: 'Confirmed', title: 'Confirmed / Kickoff', color: 'border-teal-500' },
  { id: 'In Progress', title: 'In Progress', color: 'border-blue-500' },
  { id: '70% Done', title: '70% Milestone (30% Due)', color: 'border-indigo-500' },
  { id: 'Review / QA', title: 'Review & Client QA', color: 'border-amber-500' },
  { id: 'Completed', title: 'Completed & Handed Over', color: 'border-emerald-500' },
];

export const ProjectKanbanView: React.FC<ProjectKanbanViewProps> = ({
  projects,
  onViewProject,
  onEditProject,
  onQuickUpdateStatus,
  onToggleMilestone
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(col => {
        const colProjects = projects.filter(p => p.projectStatus === col.id);
        const colTotal = colProjects.reduce((sum, p) => sum + (p.budgetConfirmed || 0), 0);

        return (
          <div 
            key={col.id}
            className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col min-w-[270px] max-h-[820px] shadow-sm"
          >
            {/* Column Header */}
            <div className={`p-3 border-t-4 ${col.color} border-b border-slate-800 bg-slate-850 rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">
                  {col.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {colProjects.length}
                </span>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
                {formatMoney(colTotal)}
              </div>
            </div>

            {/* Column Cards Container */}
            <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
              {colProjects.map(p => {
                const sMeta = SERVICE_DEFINITIONS[p.projectType] || SERVICE_DEFINITIONS['web-app'];
                const adv = p.milestones.advance40;
                const mid = p.milestones.midway30;
                const fin = p.milestones.handover30;

                return (
                  <div
                    key={p.id}
                    className="bg-slate-850 rounded-lg p-3 border border-slate-800 shadow-sm hover:border-slate-700 transition cursor-pointer group"
                    onClick={() => onViewProject(p)}
                  >
                    {/* Service badge */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${sMeta.bgLight} ${sMeta.color} border ${sMeta.borderLight}`}>
                        {sMeta.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {p.companyType}
                      </span>
                    </div>

                    {/* Company and Client */}
                    <h4 className="font-bold text-xs text-white group-hover:text-emerald-400 transition">
                      {p.companyName}
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-2">
                      {p.clientsName}
                    </p>

                    {/* Dates */}
                    {(p.startDate || p.targetDeadline) && (
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mb-2 font-mono">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{p.startDate || '—'}</span>
                        <span>→</span>
                        <span className="text-amber-400">{p.targetDeadline || '—'}</span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-0.5">
                        <span>Progress</span>
                        <span>{p.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            p.progressPercent >= 100 
                              ? 'bg-emerald-500' 
                              : p.progressPercent >= 70 
                              ? 'bg-indigo-500' 
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${p.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestone Mini Status Pills (2 columns for Social Media, 3 columns for others) */}
                    {(() => {
                      const isSocial = p.projectType === 'social-media-marketing' || p.milestones?.model === '50-50';
                      if (isSocial) {
                        return (
                          <div className="grid grid-cols-2 gap-1 my-2 text-[9px] font-mono">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleMilestone(p.id, 'advance40');
                              }}
                              className={`px-1 py-0.5 rounded text-center border font-bold cursor-pointer ${
                                adv.paid 
                                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700' 
                                  : 'bg-amber-950/70 text-amber-300 border-amber-700'
                              }`}
                              title="50% Advance"
                            >
                              50% ADV: {adv.paid ? 'PAID' : 'DUE'}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleMilestone(p.id, 'handover30');
                              }}
                              className={`px-1 py-0.5 rounded text-center border font-bold cursor-pointer ${
                                fin.paid 
                                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700' 
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                              title="50% Month-End Retainer"
                            >
                              50% END: {fin.paid ? 'PAID' : 'DUE'}
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-3 gap-1 my-2 text-[9px] font-mono">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleMilestone(p.id, 'advance40');
                            }}
                            className={`px-1 py-0.5 rounded text-center border font-bold cursor-pointer ${
                              adv.paid 
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700' 
                                : 'bg-amber-950/70 text-amber-300 border-amber-700'
                            }`}
                            title="40% Advance"
                          >
                            40%: {adv.paid ? 'PAID' : 'DUE'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleMilestone(p.id, 'midway30');
                            }}
                            className={`px-1 py-0.5 rounded text-center border font-bold cursor-pointer ${
                              mid.paid 
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700' 
                                : p.progressPercent >= 70
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700 font-extrabold animate-pulse'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                            title="30% at 70% Progress"
                          >
                            30%: {mid.paid ? 'PAID' : 'DUE'}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleMilestone(p.id, 'handover30');
                            }}
                            className={`px-1 py-0.5 rounded text-center border font-bold cursor-pointer ${
                              fin.paid 
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700' 
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                            title="30% Handover"
                          >
                            30%: {fin.paid ? 'PAID' : 'DUE'}
                          </button>
                        </div>
                      );
                    })()}

                    {/* Bottom Financial & Quick Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400">Budget: </span>
                        <strong className="text-white font-mono">{formatMoney(p.budgetConfirmed)}</strong>
                      </div>
                      <div>
                        {p.dueAmount > 0 ? (
                          <span className="text-rose-400 font-bold font-mono">Due: {formatMoney(p.dueAmount)}</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Paid</span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}

              {colProjects.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  No projects
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
