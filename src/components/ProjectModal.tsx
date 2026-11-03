import React, { useState, useEffect } from 'react';
import { 
  Project, 
  ServiceType, 
  SERVICE_DEFINITIONS, 
  ProjectStatus, 
  CONFIRMATION_OPTIONS 
} from '../types/project';
import { computeMilestones, computeFinancials, formatMoney, getCurrentMonthWorksheet } from '../utils/storage';
import { 
  X, 
  Calculator, 
  CheckCircle, 
  Building, 
  FileSpreadsheet,
  Calendar,
  Phone,
  MessageSquare,
  Mail,
  Link2
} from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  initialProject?: Project | null;
  worksheets?: string[];
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  worksheets = ['All Worksheets', 'November 2026', 'October 2026', 'December 2026']
}) => {
  const currentRunningMonth = getCurrentMonthWorksheet();
  const [companyName, setCompanyName] = useState('');
  const [clientsName, setClientsName] = useState('');
  const [companyType, setCompanyType] = useState('E-Commerce');
  const [projectType, setProjectType] = useState<ServiceType>('web-app');
  const [budgetEstimated, setBudgetEstimated] = useState<number>(100000);
  const [budgetConfirmed, setBudgetConfirmed] = useState<number>(100000);
  
  // Confirmation (2 clean options: Signed Contract / Proposal Accepted)
  const [confirmation, setConfirmation] = useState<string>('Signed Contract');
  const [confirmationDate, setConfirmationDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Progress & Status
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('Confirmed');
  
  // Deployment
  const [deployment, setDeployment] = useState('');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  
  // Contact details
  const [clientPhone, setClientPhone] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [isWhatsappManuallyChanged, setIsWhatsappManuallyChanged] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  
  // Dates
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDeadline, setTargetDeadline] = useState('');
  
  // Worksheet - defaults to current running month
  const [worksheet, setWorksheet] = useState(currentRunningMonth);
  
  // Notes
  const [notes, setNotes] = useState('');

  // Milestone check states
  const [advancePaid, setAdvancePaid] = useState(false);
  const [midwayPaid, setMidwayPaid] = useState(false);
  const [handoverPaid, setHandoverPaid] = useState(false);

  useEffect(() => {
    if (initialProject) {
      setCompanyName(initialProject.companyName);
      setClientsName(initialProject.clientsName);
      setCompanyType(initialProject.companyType);
      setProjectType(initialProject.projectType);
      setBudgetEstimated(initialProject.budgetEstimated);
      setBudgetConfirmed(initialProject.budgetConfirmed);
      setConfirmation(initialProject.confirmation === 'Proposal Accepted' ? 'Proposal Accepted' : 'Signed Contract');
      setConfirmationDate(initialProject.confirmationDate || '');
      setProgressPercent(initialProject.progressPercent ?? 0);
      setProjectStatus(initialProject.projectStatus);
      setDeployment(initialProject.deployment || '');
      setDeploymentUrl(initialProject.deploymentUrl || '');
      
      setClientPhone(initialProject.clientPhone || '');
      setClientWhatsapp(initialProject.clientWhatsapp || initialProject.clientPhone || '');
      setIsWhatsappManuallyChanged(!!(initialProject.clientWhatsapp && initialProject.clientWhatsapp !== initialProject.clientPhone));
      setClientEmail(initialProject.clientEmail || '');
      
      setStartDate(initialProject.startDate || new Date().toISOString().split('T')[0]);
      setTargetDeadline(initialProject.targetDeadline || '');
      setWorksheet(initialProject.worksheet || currentRunningMonth);
      setNotes(initialProject.notes || '');

      setAdvancePaid(initialProject.milestones?.advance40?.paid ?? false);
      setMidwayPaid(initialProject.milestones?.midway30?.paid ?? false);
      setHandoverPaid(initialProject.milestones?.handover30?.paid ?? false);
    } else {
      // Defaults for new project
      setCompanyName('');
      setClientsName('');
      setCompanyType('Tech Startup');
      setProjectType('web-app');
      setBudgetEstimated(80000);
      setBudgetConfirmed(75000);
      setConfirmation('Signed Contract');
      setConfirmationDate(new Date().toISOString().split('T')[0]);
      setProgressPercent(0);
      setProjectStatus('Confirmed');
      setDeployment('Local Development');
      setDeploymentUrl('');
      setClientPhone('');
      setClientWhatsapp('');
      setIsWhatsappManuallyChanged(false);
      setClientEmail('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setTargetDeadline('');
      setWorksheet(currentRunningMonth);
      setNotes('');
      setAdvancePaid(true); // default advance collected on kickoff
      setMidwayPaid(false);
      setHandoverPaid(false);
    }
  }, [initialProject, isOpen, currentRunningMonth]);

  if (!isOpen) return null;

  // Handle Client Phone change with automatic WhatsApp sync unless user edited WhatsApp separately
  const handleClientPhoneChange = (val: string) => {
    setClientPhone(val);
    if (!isWhatsappManuallyChanged) {
      setClientWhatsapp(val);
    }
  };

  const handleWhatsappChange = (val: string) => {
    setClientWhatsapp(val);
    setIsWhatsappManuallyChanged(true);
  };

  const isSocialMedia = projectType === 'social-media-marketing';

  // Auto-calculated milestone values based on current budgetConfirmed & service category
  const currentMilestones = computeMilestones(budgetConfirmed, {
    advance40: {
      percent: isSocialMedia ? 50 : 40,
      label: isSocialMedia ? '50% Advance Payment' : '40% Advance Payment',
      amount: isSocialMedia ? Math.round(budgetConfirmed * 0.5) : Math.round(budgetConfirmed * 0.4),
      paid: advancePaid,
      paidDate: advancePaid ? (initialProject?.milestones?.advance40?.paidDate || new Date().toISOString().split('T')[0]) : undefined
    },
    midway30: {
      percent: isSocialMedia ? 0 : 30,
      label: isSocialMedia ? 'N/A (50-50 Model)' : '30% Milestone Payment (at 70% Work)',
      amount: isSocialMedia ? 0 : Math.round(budgetConfirmed * 0.3),
      paid: isSocialMedia ? false : midwayPaid,
      paidDate: midwayPaid ? (initialProject?.milestones?.midway30?.paidDate || new Date().toISOString().split('T')[0]) : undefined
    },
    handover30: {
      percent: isSocialMedia ? 50 : 30,
      label: isSocialMedia ? '50% Month-End Payment' : '30% Final Payment (Handover)',
      amount: isSocialMedia
        ? Math.max(0, budgetConfirmed - Math.round(budgetConfirmed * 0.5))
        : budgetConfirmed - Math.round(budgetConfirmed * 0.4) - Math.round(budgetConfirmed * 0.3),
      paid: handoverPaid,
      paidDate: handoverPaid ? (initialProject?.milestones?.handover30?.paidDate || new Date().toISOString().split('T')[0]) : undefined
    },
    model: isSocialMedia ? '50-50' : '40-30-30'
  }, projectType);

  const { totalPaid, dueAmount } = computeFinancials(budgetConfirmed, currentMilestones);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const updatedProject: Project = {
      id: initialProject ? initialProject.id : `proj-${Date.now()}`,
      companyName: companyName.trim(),
      clientsName: clientsName.trim() || 'N/A',
      companyType: companyType.trim() || 'General',
      projectType,
      budgetEstimated: Number(budgetEstimated) || 0,
      budgetConfirmed: Number(budgetConfirmed) || 0,
      confirmation,
      confirmationDate,
      progressPercent: Number(progressPercent) || 0,
      milestones: currentMilestones,
      totalPaid,
      dueAmount,
      projectStatus,
      deployment: deployment.trim(),
      deploymentUrl: deploymentUrl.trim(),
      clientPhone: clientPhone.trim(),
      clientWhatsapp: clientWhatsapp.trim() || clientPhone.trim(),
      clientEmail: clientEmail.trim(),
      startDate,
      targetDeadline,
      worksheet,
      notes: notes.trim(),
      createdAt: initialProject ? initialProject.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-slate-100">
        
        {/* Header - Sleek Dark Theme matching app aesthetic */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center">
              <span>{initialProject ? 'Edit Project Details' : 'Add New Project'}</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-mono bg-emerald-500/15 text-emerald-300 rounded border border-emerald-500/25">
                ৳ BDT
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live updates to database with automatic 40%-30%-30% milestone calculations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Section 1: Client & Company Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Building className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Client & Company Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Health Ltd., Bazaarly"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Clients Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientsName}
                  onChange={(e) => setClientsName(e.target.value)}
                  placeholder="e.g. Tanvir Hossain, John Doe"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Company Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Type / Industry
                </label>
                <input
                  type="text"
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  placeholder="e.g. HealthTech, E-Commerce, FinTech, SaaS"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Project Type (5 Main Services) */}
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  Project Service (5 Main Services) *
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ServiceType)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-emerald-600/70 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="web-app">1. Web Application Development</option>
                  <option value="ai-integration">2. AI Integration</option>
                  <option value="saas-product">3. SaaS Product Development</option>
                  <option value="mobile-app">4. App Development (Mobile)</option>
                  <option value="social-media-marketing">5. Social Media Marketing Management</option>
                </select>
              </div>

              {/* Worksheet / Period selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center">
                  <FileSpreadsheet className="w-3 h-3 mr-1 text-emerald-400" />
                  Worksheet / Period Tag
                </label>
                <select
                  value={worksheet}
                  onChange={(e) => setWorksheet(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {worksheets.filter(w => w !== 'All Worksheets').map(ws => (
                    <option key={ws} value={ws}>{ws}</option>
                  ))}
                  <option value="Custom Worksheet">Other / New Sheet</option>
                </select>
              </div>

              {/* Confirmation Selection (2 options: Signed Contract / Proposal Accepted) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirmation Status *
                </label>
                <select
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Signed Contract">Signed Contract</option>
                  <option value="Proposal Accepted">Proposal Accepted</option>
                </select>
              </div>

            </div>
          </div>

          {/* Section 2: Contact Details (Phone, WhatsApp with auto-fill, Email) */}
          <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Client Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Client Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center">
                  <Phone className="w-3 h-3 mr-1 text-slate-400" />
                  Client Phone
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => handleClientPhoneChange(e.target.value)}
                  placeholder="e.g. +880 1711-234567"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* WhatsApp Number (Auto-fills from Phone, but freely editable) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center">
                    <MessageSquare className="w-3 h-3 mr-1 text-emerald-400" />
                    WhatsApp Number
                  </label>
                  {!isWhatsappManuallyChanged && clientPhone && (
                    <span className="text-[10px] text-emerald-400 font-semibold">Auto-synced</span>
                  )}
                </div>
                <input
                  type="text"
                  value={clientWhatsapp}
                  onChange={(e) => handleWhatsappChange(e.target.value)}
                  placeholder="e.g. +880 1711-234567"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Editable if client uses a separate WhatsApp number
                </span>
              </div>

              {/* Client Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center">
                  <Mail className="w-3 h-3 mr-1 text-blue-400" />
                  Client Email (Optional)
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Email button in View Details only shows if provided
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Project Dates (Start Date & Target Deadline) */}
          <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Project Schedule & Timeline
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Target Deadline */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={targetDeadline}
                  onChange={(e) => setTargetDeadline(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Budget & Automatic 40% - 30% - 30% Milestones */}
          <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                <Calculator className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Budget & Milestone Breakdown (BDT)
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                40% - 30% - 30% Rule
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Estimated Budget */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Budget Estimated (BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    value={budgetEstimated}
                    onChange={(e) => setBudgetEstimated(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              {/* Confirmed Budget */}
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Budget Confirmed (BDT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    required
                    value={budgetConfirmed}
                    onChange={(e) => setBudgetConfirmed(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-emerald-500 rounded-lg text-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Automatic Milestone Breakdown Cards (50-50 for Social Media, 40-30-30 for others) */}
            {isSocialMedia ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {/* Milestone 1: 50% Advance */}
                <div className={`p-2.5 rounded-lg border transition ${
                  advancePaid 
                    ? 'bg-emerald-950/40 border-emerald-700' 
                    : 'bg-slate-800 border-slate-700'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-200">
                      1. 50% Advance (Kickoff)
                    </span>
                    <input
                      type="checkbox"
                      checked={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                      id="adv-check"
                    />
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {formatMoney(currentMilestones.advance40.amount)}
                  </div>
                  <label htmlFor="adv-check" className="text-[10px] text-slate-400 cursor-pointer block mt-1">
                    {advancePaid ? '✓ Advance Received' : '○ Kickoff Due'}
                  </label>
                </div>

                {/* Milestone 2: 50% Month-End */}
                <div className={`p-2.5 rounded-lg border transition ${
                  handoverPaid 
                    ? 'bg-emerald-950/40 border-emerald-700' 
                    : 'bg-slate-800 border-slate-700'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-200">
                      2. 50% Month-End Retainer
                    </span>
                    <input
                      type="checkbox"
                      checked={handoverPaid}
                      onChange={(e) => setHandoverPaid(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                      id="han-check"
                    />
                  </div>
                  <div className="text-sm font-bold font-mono text-blue-400">
                    {formatMoney(currentMilestones.handover30.amount)}
                  </div>
                  <label htmlFor="han-check" className="text-[10px] text-slate-400 cursor-pointer block mt-1">
                    {handoverPaid ? '✓ Month-End Paid' : '○ Billed at month completion'}
                  </label>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                
                {/* Milestone 1: 40% Advance */}
                <div className={`p-2.5 rounded-lg border transition ${
                  advancePaid 
                    ? 'bg-emerald-950/40 border-emerald-700' 
                    : 'bg-slate-800 border-slate-700'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-200">
                      1. 40% Advance
                    </span>
                    <input
                      type="checkbox"
                      checked={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                      id="adv-check"
                    />
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {formatMoney(currentMilestones.advance40.amount)}
                  </div>
                  <label htmlFor="adv-check" className="text-[10px] text-slate-400 cursor-pointer block mt-1">
                    {advancePaid ? '✓ Advance Received' : '○ Kickoff Due'}
                  </label>
                </div>

                {/* Milestone 2: 30% at 70% Progress */}
                <div className={`p-2.5 rounded-lg border transition ${
                  midwayPaid 
                    ? 'bg-emerald-950/40 border-emerald-700' 
                    : progressPercent >= 70
                    ? 'bg-rose-950/40 border-rose-700'
                    : 'bg-slate-800 border-slate-700'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-200">
                      2. 30% (70% Work)
                    </span>
                    <input
                      type="checkbox"
                      checked={midwayPaid}
                      onChange={(e) => setMidwayPaid(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                      id="mid-check"
                    />
                  </div>
                  <div className="text-sm font-bold font-mono text-indigo-400">
                    {formatMoney(currentMilestones.midway30.amount)}
                  </div>
                  <label htmlFor="mid-check" className="text-[10px] text-slate-400 cursor-pointer block mt-1">
                    {midwayPaid ? '✓ Milestone 2 Paid' : '○ Billed at 70%'}
                  </label>
                </div>

                {/* Milestone 3: 30% Handover */}
                <div className={`p-2.5 rounded-lg border transition ${
                  handoverPaid 
                    ? 'bg-emerald-950/40 border-emerald-700' 
                    : 'bg-slate-800 border-slate-700'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-200">
                      3. 30% Handover
                    </span>
                    <input
                      type="checkbox"
                      checked={handoverPaid}
                      onChange={(e) => setHandoverPaid(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                      id="han-check"
                    />
                  </div>
                  <div className="text-sm font-bold font-mono text-blue-400">
                    {formatMoney(currentMilestones.handover30.amount)}
                  </div>
                  <label htmlFor="han-check" className="text-[10px] text-slate-400 cursor-pointer block mt-1">
                    {handoverPaid ? '✓ Handover Paid' : '○ Billed at completion'}
                  </label>
                </div>

              </div>
            )}

            {/* Financial Summary Result Live Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-lg text-xs font-medium border border-slate-800">
              <span className="text-slate-400">
                Total Paid: <strong className="text-emerald-400 font-mono">{formatMoney(totalPaid)}</strong>
              </span>
              <span className="text-slate-400">
                Total Due: <strong className={`font-mono ${dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatMoney(dueAmount)}</strong>
              </span>
            </div>

          </div>

          {/* Section 5: Progress & Deployment */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Progress & Deployment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Progress Slider */}
              <div className="sm:col-span-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Work Progress %
                  </label>
                  <span className="text-xs font-bold text-emerald-400 font-mono">{progressPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setProgressPercent(val);
                    if (val >= 100) setProjectStatus('Completed');
                    else if (val >= 70 && projectStatus !== 'Completed') setProjectStatus('70% Done');
                    else if (val > 0 && projectStatus === 'Confirmed') setProjectStatus('In Progress');
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0%</span>
                  <span className="text-indigo-400 font-bold">70% (Milestone 2)</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Project Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Status
                </label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none"
                >
                  <option value="Lead">Lead</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="70% Done">70% Done</option>
                  <option value="Review / QA">Review / QA</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {/* Deployment Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deployment Platform
                </label>
                <input
                  type="text"
                  value={deployment}
                  onChange={(e) => setDeployment(e.target.value)}
                  placeholder="e.g. Vercel, Play Store, Staging"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Live URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center">
                <Link2 className="w-3 h-3 mr-1 text-slate-400" />
                Live Deployment URL
              </label>
              <input
                type="url"
                value={deploymentUrl}
                onChange={(e) => setDeploymentUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project Scope & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key project features, tech stack, deliverables..."
              className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white resize-none focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              {initialProject ? 'Update Project' : 'Save Project'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
