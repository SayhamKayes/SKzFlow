export type ServiceType =
  | 'web-app'
  | 'ai-integration'
  | 'saas-product'
  | 'mobile-app'
  | 'social-media-marketing';

export interface ServiceMeta {
  id: ServiceType;
  label: string;
  iconName: string;
  color: string;
  bgLight: string;
  borderLight: string;
}

export const SERVICE_DEFINITIONS: Record<ServiceType, ServiceMeta> = {
  'web-app': {
    id: 'web-app',
    label: 'Web Application',
    iconName: 'Globe',
    color: 'text-blue-400',
    bgLight: 'bg-blue-950/40',
    borderLight: 'border-blue-800',
  },
  'ai-integration': {
    id: 'ai-integration',
    label: 'AI Integration',
    iconName: 'Cpu',
    color: 'text-purple-400',
    bgLight: 'bg-purple-950/40',
    borderLight: 'border-purple-800',
  },
  'saas-product': {
    id: 'saas-product',
    label: 'SaaS Product',
    iconName: 'Layers',
    color: 'text-emerald-400',
    bgLight: 'bg-emerald-950/40',
    borderLight: 'border-emerald-800',
  },
  'mobile-app': {
    id: 'mobile-app',
    label: 'App Development',
    iconName: 'Smartphone',
    color: 'text-amber-400',
    bgLight: 'bg-amber-950/40',
    borderLight: 'border-amber-800',
  },
  'social-media-marketing': {
    id: 'social-media-marketing',
    label: 'Social Media Marketing',
    iconName: 'Share2',
    color: 'text-rose-400',
    bgLight: 'bg-rose-950/40',
    borderLight: 'border-rose-800',
  },
};

export type ProjectStatus =
  | 'Lead'
  | 'Confirmed'
  | 'In Progress'
  | '70% Done'
  | 'Review / QA'
  | 'Completed'
  | 'On Hold';

export type DeploymentStatus =
  | 'Not Started'
  | 'In Staging'
  | 'Production / Live'
  | 'Play Store'
  | 'App Store'
  | 'Internal Demo';

export const CONFIRMATION_OPTIONS = [
  'Signed Contract',
  'Proposal Accepted'
] as const;

export type ConfirmationType = typeof CONFIRMATION_OPTIONS[number];

export type DateRangePreset =
  | 'all'
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'past-6-months'
  | 'past-1-year'
  | 'custom';

export interface MilestoneItem {
  percent: number; // e.g. 40, 30, 30
  label: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
  note?: string;
}

export interface PaymentMilestones {
  advance40: MilestoneItem; // 40% Advance on start, or 50% for social-media-marketing
  midway30: MilestoneItem;  // 30% when work reaches 70% (amount: 0, paid: false for 50-50)
  handover30: MilestoneItem;// 30% on Handover, or 50% Month-End for social-media-marketing
  model?: '40-30-30' | '50-50';
}

export interface Project {
  id: string;
  companyName: string;
  clientsName: string;
  companyType: string;
  projectType: ServiceType;
  budgetEstimated: number;
  budgetConfirmed: number;
  confirmation: string;
  confirmationDate: string;
  progressPercent: number;
  milestones: PaymentMilestones;
  totalPaid: number;
  dueAmount: number;
  projectStatus: ProjectStatus;
  deployment: string;
  deploymentUrl?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientWhatsapp?: string;
  startDate?: string;
  targetDeadline?: string;
  worksheet?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  email: string;
  name: string;
  password?: string;
  accessKey?: string;
  avatar?: string;
  isDemo: boolean;
  connectedSpreadsheetId?: string;
  connectedAt?: string;
}
