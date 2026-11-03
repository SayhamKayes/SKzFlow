import React from 'react';
import { Project, SERVICE_DEFINITIONS } from '../types/project';
import { formatMoney } from '../utils/storage';
import { 
  X, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  FileSpreadsheet,
  Building,
  CheckCircle2
} from 'lucide-react';

interface ProjectDetailDrawerProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onToggleMilestone: (projectId: string, milestoneKey: 'advance40' | 'midway30' | 'handover30') => void;
}

export const ProjectDetailDrawer: React.FC<ProjectDetailDrawerProps> = ({
  project,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleMilestone,
}) => {
  if (!isOpen || !project) return null;

  const sMeta = SERVICE_DEFINITIONS[project.projectType] || SERVICE_DEFINITIONS['web-app'];
  const adv = project.milestones.advance40;
  const mid = project.milestones.midway30;
  const fin = project.milestones.handover30;

  const phoneForWa = project.clientWhatsapp || project.clientPhone || '';
  const cleanPhoneForWa = phoneForWa.replace(/[^0-9]/g, '');
  const waLink = cleanPhoneForWa ? `https://wa.me/${cleanPhoneForWa}` : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden text-slate-100">
        
        {/* Drawer Header - Matching Dark Theme */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${sMeta.bgLight} ${sMeta.color} ${sMeta.borderLight}`}>
              {sMeta.label}
            </span>
            {project.worksheet && (
              <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-emerald-300 border border-slate-700 flex items-center">
                <FileSpreadsheet className="w-3 h-3 mr-1 text-emerald-400" />
                {project.worksheet}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(project)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition cursor-pointer"
              title="Edit Project"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this project?')) {
                  onDelete(project.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content Body - All dark, zero white backgrounds */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-200">
          
          {/* Main Title & Status */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-semibold flex items-center">
                <Building className="w-3 h-3 mr-1 text-slate-500" />
                {project.companyType}
              </span>
              <span className="px-2.5 py-0.5 text-xs rounded-full font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                {project.projectStatus}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              {project.companyName}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Client: <strong className="text-white">{project.clientsName}</strong>
            </p>
            <div className="mt-2 text-xs text-slate-400">
              Confirmation: <span className="text-slate-200 font-semibold">{project.confirmation}</span>
            </div>
          </div>

          {/* Quick Communication Actions (Call, WhatsApp, Email only if present) */}
          {(project.clientPhone || waLink || project.clientEmail) && (
            <div className="flex items-center space-x-2">
              
              {/* Call Button */}
              {project.clientPhone && (
                <a
                  href={`tel:${project.clientPhone}`}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call</span>
                </a>
              )}

              {/* WhatsApp Button */}
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/80 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              )}

              {/* Email Button (Rendered ONLY if clientEmail is provided) */}
              {project.clientEmail ? (
                <a
                  href={`mailto:${project.clientEmail}`}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-blue-950/60 hover:bg-blue-900/70 text-blue-300 border border-blue-800/80 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Email</span>
                </a>
              ) : null}

            </div>
          )}

          {/* Timeline: Start Date & Deadline */}
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 flex items-center">
                <Calendar className="w-3 h-3 mr-1 text-emerald-400" />
                Start Date:
              </span>
              <span className="font-bold text-white font-mono">
                {project.startDate || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 flex items-center">
                <Calendar className="w-3 h-3 mr-1 text-emerald-400" />
                Target Deadline:
              </span>
              <span className="font-bold text-emerald-300 font-mono">
                {project.targetDeadline || 'Not specified'}
              </span>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-2">
              <span>Work Progress</span>
              <span className="text-emerald-400 font-mono text-sm">{project.progressPercent}%</span>
            </div>
            
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  project.progressPercent >= 100 
                    ? 'bg-emerald-500' 
                    : project.progressPercent >= 70 
                    ? 'bg-indigo-500' 
                    : 'bg-blue-500'
                }`}
                style={{ width: `${project.progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0% Start</span>
              <span className={project.progressPercent >= 70 ? 'text-indigo-400 font-bold' : ''}>
                70% Milestone 2
              </span>
              <span className={project.progressPercent >= 100 ? 'text-emerald-400 font-bold' : ''}>
                100% Handover
              </span>
            </div>
          </div>

          {/* Financial Summary (in BDT) */}
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center">
                <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Financial Breakdown (BDT)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Est: {formatMoney(project.budgetEstimated)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-750">
                <span className="text-[10px] text-slate-400 block">Confirmed</span>
                <span className="font-bold text-xs sm:text-sm font-mono text-white">
                  {formatMoney(project.budgetConfirmed)}
                </span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-750">
                <span className="text-[10px] text-slate-400 block">Total Paid</span>
                <span className="font-bold text-xs sm:text-sm font-mono text-emerald-400">
                  {formatMoney(project.totalPaid)}
                </span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-750">
                <span className="text-[10px] text-slate-400 block">Due Amount</span>
                <span className={`font-bold text-xs sm:text-sm font-mono ${project.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatMoney(project.dueAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Milestones Interactive List (50-50 for Social Media, 40-30-30 for others) */}
          {(() => {
            const isSocialMedia = project.projectType === 'social-media-marketing' || project.milestones?.model === '50-50';
            return (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isSocialMedia ? 'Payment Milestones (50% Advance • 50% Month-End)' : 'Payment Milestones (40% - 30% - 30%)'}
                </h4>

                {/* Milestone 1: Advance */}
                <div className={`p-3 rounded-xl border transition ${
                  adv.paid 
                    ? 'bg-emerald-950/40 border-emerald-700/80' 
                    : 'bg-slate-850 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isSocialMedia ? '50% Advance Payment' : adv.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatMoney(adv.amount)}
                      </span>
                    </div>
                    <button
                      onClick={() => onToggleMilestone(project.id, 'advance40')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition border cursor-pointer ${
                        adv.paid 
                          ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500' 
                          : 'bg-amber-950/80 text-amber-300 border-amber-700 hover:bg-amber-900'
                      }`}
                    >
                      {adv.paid ? '✓ Paid' : 'Mark Paid'}
                    </button>
                  </div>
                  {adv.paidDate && (
                    <div className="text-[10px] text-emerald-400 mt-1">
                      Paid on: {adv.paidDate} {adv.note ? `• ${adv.note}` : ''}
                    </div>
                  )}
                </div>

                {/* Milestone 2: 30% at 70% Progress (Only for non-social media) */}
                {!isSocialMedia && (
                  <div className={`p-3 rounded-xl border transition ${
                    mid.paid 
                      ? 'bg-emerald-950/40 border-emerald-700/80' 
                      : project.progressPercent >= 70
                      ? 'bg-rose-950/50 border-rose-700'
                      : 'bg-slate-850 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-white">
                            {mid.label}
                          </span>
                          {project.progressPercent >= 70 && !mid.paid && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500 text-white animate-pulse">
                              Due Now
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatMoney(mid.amount)}
                        </span>
                      </div>
                      <button
                        onClick={() => onToggleMilestone(project.id, 'midway30')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition border cursor-pointer ${
                          mid.paid 
                            ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500' 
                            : 'bg-amber-950/80 text-amber-300 border-amber-700 hover:bg-amber-900'
                        }`}
                      >
                        {mid.paid ? '✓ Paid' : 'Mark Paid'}
                      </button>
                    </div>
                    {mid.paidDate && (
                      <div className="text-[10px] text-emerald-400 mt-1">
                        Paid on: {mid.paidDate} {mid.note ? `• ${mid.note}` : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* Milestone 3 (or Month-End 50% for Social Media) */}
                <div className={`p-3 rounded-xl border transition ${
                  fin.paid 
                    ? 'bg-emerald-950/40 border-emerald-700/80' 
                    : 'bg-slate-850 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {isSocialMedia ? '50% Month-End Payment' : fin.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatMoney(fin.amount)}
                      </span>
                    </div>
                    <button
                      onClick={() => onToggleMilestone(project.id, 'handover30')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition border cursor-pointer ${
                        fin.paid 
                          ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {fin.paid ? '✓ Paid' : 'Mark Paid'}
                    </button>
                  </div>
                  {fin.paidDate && (
                    <div className="text-[10px] text-emerald-400 mt-1">
                      Paid on: {fin.paidDate} {fin.note ? `• ${fin.note}` : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Deployment Link */}
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Deployment Status:</span>
              <span className="font-semibold text-white">{project.deployment || 'Not Deployed'}</span>
            </div>

            {project.deploymentUrl && (
              <div className="pt-1">
                <a
                  href={project.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center space-x-1.5 transition"
                >
                  <span>Open Live URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Notes */}
          {project.notes && (
            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Project Notes & Scope
              </span>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {project.notes}
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
