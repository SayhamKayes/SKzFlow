import React from 'react';
import { Project, SERVICE_DEFINITIONS } from '../types/project';
import { formatMoney } from '../utils/storage';
import { 
  ExternalLink, 
  Eye, 
  Edit3, 
  Trash2, 
  Calendar,
  Building,
  Phone,
  Mail
} from 'lucide-react';

interface ProjectCardsViewProps {
  projects: Project[];
  onViewProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onToggleMilestone: (projectId: string, milestoneKey: 'advance40' | 'midway30' | 'handover30') => void;
}

export const ProjectCardsView: React.FC<ProjectCardsViewProps> = ({
  projects,
  onViewProject,
  onEditProject,
  onDeleteProject,
  onToggleMilestone
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map(p => {
        const sMeta = SERVICE_DEFINITIONS[p.projectType] || SERVICE_DEFINITIONS['web-app'];
        const adv = p.milestones.advance40;
        const mid = p.milestones.midway30;
        const fin = p.milestones.handover30;

        return (
          <div
            key={p.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition flex flex-col justify-between text-slate-100"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${sMeta.bgLight} ${sMeta.color} ${sMeta.borderLight}`}>
                  {sMeta.label}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                  {p.projectStatus}
                </span>
              </div>

              {/* Company & Client */}
              <h3 
                onClick={() => onViewProject(p)}
                className="font-bold text-base text-white hover:text-emerald-400 cursor-pointer transition"
              >
                {p.companyName}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
                <span>{p.clientsName}</span>
                <span>•</span>
                <span className="text-slate-400">{p.companyType}</span>
              </div>

              {/* Dates */}
              {(p.startDate || p.targetDeadline) && (
                <div className="flex items-center space-x-2 text-xs text-slate-400 mb-3 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Start: {p.startDate || '—'}</span>
                  <span>|</span>
                  <span className="text-emerald-300">Deadline: {p.targetDeadline || '—'}</span>
                </div>
              )}

              {/* Progress Slider Display */}
              <div className="my-3">
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Progress</span>
                  <span className="text-emerald-400 font-mono">{p.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
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

              {/* Milestone Breakdown Box (50-50 for Social Media, 40-30-30 for others) */}
              {(() => {
                const isSocial = p.projectType === 'social-media-marketing' || p.milestones?.model === '50-50';
                return (
                  <div className="bg-slate-850 rounded-lg p-2.5 border border-slate-800 my-3">
                    <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Payment Milestones</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {isSocial ? '50% - 50% Monthly' : '40% - 30% - 30%'}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5 text-xs">
                      {/* Milestone 1: Advance */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300">
                          {isSocial ? '1. 50% Advance' : '1. 40% Advance'}
                        </span>
                        <button
                          onClick={() => onToggleMilestone(p.id, 'advance40')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                            adv.paid 
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700' 
                              : 'bg-amber-950/70 text-amber-300 border-amber-700'
                          }`}
                        >
                          {adv.paid ? `✓ ${formatMoney(adv.amount)}` : `Due: ${formatMoney(adv.amount)}`}
                        </button>
                      </div>

                      {/* Milestone 2: 30% (Only for non-social media) */}
                      {!isSocial && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-300">
                            2. 30% (70% Work)
                          </span>
                          <button
                            onClick={() => onToggleMilestone(p.id, 'midway30')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                              mid.paid 
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700' 
                                : p.progressPercent >= 70
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700 font-extrabold animate-pulse'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {mid.paid ? `✓ ${formatMoney(mid.amount)}` : `Due: ${formatMoney(mid.amount)}`}
                          </button>
                        </div>
                      )}

                      {/* Milestone 3: Handover or Month-End */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300">
                          {isSocial ? '2. 50% Month-End' : '3. 30% Final Handover'}
                        </span>
                        <button
                          onClick={() => onToggleMilestone(p.id, 'handover30')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                            fin.paid 
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {fin.paid ? `✓ ${formatMoney(fin.amount)}` : `Due: ${formatMoney(fin.amount)}`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Financial Status Summary */}
              <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-850 rounded border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400">Total: </span>
                  <span className="font-bold text-white">{formatMoney(p.budgetConfirmed)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Paid: </span>
                  <span className="font-bold text-emerald-400">{formatMoney(p.totalPaid)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Due: </span>
                  <span className={`font-bold ${p.dueAmount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {formatMoney(p.dueAmount)}
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Card Footer Actions */}
            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                {p.deploymentUrl ? (
                  <a
                    href={p.deploymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    <span>{p.deployment || 'Live URL'}</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">{p.deployment || 'Local'}</span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onViewProject(p)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEditProject(p)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition cursor-pointer"
                  title="Edit Project"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteProject(p.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};
