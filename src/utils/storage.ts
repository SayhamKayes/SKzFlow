import { Project, PaymentMilestones, AuthUser } from '../types/project';

const STORAGE_KEY = 'projectflow_agency_projects_v4';
const WEBHOOK_KEY = 'projectflow_google_sheets_webhook';
const WORKSHEETS_KEY = 'projectflow_worksheets_list_v4';
const AUTH_KEY = 'projectflow_google_auth_session';

export const getCurrentMonthWorksheet = (): string => {
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
};

export const computeMilestones = (
  confirmedBudget: number,
  existingMilestones?: Partial<PaymentMilestones>
): PaymentMilestones => {
  const advanceAmount = Math.round(confirmedBudget * 0.4);
  const midwayAmount = Math.round(confirmedBudget * 0.3);
  const handoverAmount = confirmedBudget - advanceAmount - midwayAmount;

  return {
    advance40: {
      percent: 40,
      label: '40% Advance Payment',
      amount: advanceAmount,
      paid: existingMilestones?.advance40?.paid ?? false,
      paidDate: existingMilestones?.advance40?.paidDate,
      note: existingMilestones?.advance40?.note,
    },
    midway30: {
      percent: 30,
      label: '30% Milestone Payment (at 70% Work)',
      amount: midwayAmount,
      paid: existingMilestones?.midway30?.paid ?? false,
      paidDate: existingMilestones?.midway30?.paidDate,
      note: existingMilestones?.midway30?.note,
    },
    handover30: {
      percent: 30,
      label: '30% Final Payment (Handover)',
      amount: handoverAmount,
      paid: existingMilestones?.handover30?.paid ?? false,
      paidDate: existingMilestones?.handover30?.paidDate,
      note: existingMilestones?.handover30?.note,
    },
  };
};

export const computeFinancials = (confirmedBudget: number, milestones: PaymentMilestones) => {
  let totalPaid = 0;
  if (milestones.advance40.paid) totalPaid += milestones.advance40.amount;
  if (milestones.midway30.paid) totalPaid += milestones.midway30.amount;
  if (milestones.handover30.paid) totalPaid += milestones.handover30.amount;

  const dueAmount = Math.max(0, confirmedBudget - totalPaid);
  return { totalPaid, dueAmount };
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    companyName: 'Apex Health Ltd.',
    clientsName: 'Tanvir Hossain',
    companyType: 'HealthTech',
    projectType: 'web-app',
    budgetEstimated: 150000,
    budgetConfirmed: 140000,
    confirmation: 'Signed Contract',
    confirmationDate: '2026-10-12',
    progressPercent: 75,
    milestones: {
      advance40: {
        percent: 40,
        label: '40% Advance Payment',
        amount: 56000,
        paid: true,
        paidDate: '2026-10-13',
        note: 'Bank Transfer - Brac Bank',
      },
      midway30: {
        percent: 30,
        label: '30% Milestone Payment (at 70% Work)',
        amount: 42000,
        paid: true,
        paidDate: '2026-10-28',
        note: 'Milestone verified after module 3 demo',
      },
      handover30: {
        percent: 30,
        label: '30% Final Payment (Handover)',
        amount: 42000,
        paid: false,
      },
    },
    totalPaid: 98000,
    dueAmount: 42000,
    projectStatus: '70% Done',
    deployment: 'https://staging.apexhealthbd.com',
    deploymentUrl: 'https://staging.apexhealthbd.com',
    clientEmail: 'tanvir@apexhealthbd.com',
    clientPhone: '+880 1711-234567',
    clientWhatsapp: '+880 1711-234567',
    startDate: '2026-10-15',
    targetDeadline: '2026-11-20',
    worksheet: 'October 2026',
    notes: 'React + Node doctor appointment & telemedicine portal with SSLCommerz payment integration.',
    createdAt: '2026-10-12T10:00:00Z',
    updatedAt: '2026-10-28T14:30:00Z',
  },
  {
    id: 'proj-2',
    companyName: 'NeuralDesk Solutions',
    clientsName: 'Mahmudur Rahman',
    companyType: 'FinTech Startup',
    projectType: 'ai-integration',
    budgetEstimated: 260000,
    budgetConfirmed: 250000,
    confirmation: 'Proposal Accepted',
    confirmationDate: '2026-10-18',
    progressPercent: 85,
    milestones: {
      advance40: {
        percent: 40,
        label: '40% Advance Payment',
        amount: 100000,
        paid: true,
        paidDate: '2026-10-19',
        note: 'Cheque deposit',
      },
      midway30: {
        percent: 30,
        label: '30% Milestone Payment (at 70% Work)',
        amount: 75000,
        paid: true,
        paidDate: '2026-10-31',
        note: '70% model tuning & document retrieval completed',
      },
      handover30: {
        percent: 30,
        label: '30% Final Payment (Handover)',
        amount: 75000,
        paid: false,
      },
    },
    totalPaid: 175000,
    dueAmount: 75000,
    projectStatus: 'Review / QA',
    deployment: 'https://ai.neuraldesk.io',
    deploymentUrl: 'https://ai.neuraldesk.io',
    clientEmail: 'mahmud@neuraldesk.io',
    clientPhone: '+880 1819-987654',
    clientWhatsapp: '+880 1819-987654',
    startDate: '2026-10-20',
    targetDeadline: '2026-11-15',
    worksheet: 'October 2026',
    notes: 'Automated invoice extraction and customer support RAG assistant using Gemini API & vector store.',
    createdAt: '2026-10-18T08:00:00Z',
    updatedAt: '2026-10-31T12:00:00Z',
  },
  {
    id: 'proj-3',
    companyName: 'Bazaarly BD',
    clientsName: 'Sabrina Islam',
    companyType: 'E-Commerce & Retail',
    projectType: 'social-media-marketing',
    budgetEstimated: 60000,
    budgetConfirmed: 55000,
    confirmation: 'Signed Contract',
    confirmationDate: '2026-10-01',
    progressPercent: 100,
    milestones: {
      advance40: {
        percent: 40,
        label: '40% Advance Payment',
        amount: 22000,
        paid: true,
        paidDate: '2026-10-02',
      },
      midway30: {
        percent: 30,
        label: '30% Milestone Payment (at 70% Work)',
        amount: 16500,
        paid: true,
        paidDate: '2026-10-18',
      },
      handover30: {
        percent: 30,
        label: '30% Final Payment (Handover)',
        amount: 16500,
        paid: true,
        paidDate: '2026-11-01',
        note: 'Month-end campaign reports handed over & approved',
      },
    },
    totalPaid: 55000,
    dueAmount: 0,
    projectStatus: 'Completed',
    deployment: 'Facebook & Instagram Ads Manager',
    deploymentUrl: 'https://facebook.com/bazaarlybd',
    clientEmail: 'sabrina@bazaarlybd.com',
    clientPhone: '+880 1678-112233',
    clientWhatsapp: '+880 1678-112233',
    startDate: '2026-10-01',
    targetDeadline: '2026-10-31',
    worksheet: 'October 2026',
    notes: 'Full monthly social media management, 18 creative reels, copywriting & Meta ad campaign management.',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-11-01T16:00:00Z',
  },
  {
    id: 'proj-4',
    companyName: 'ShiftOps HR',
    clientsName: 'Farhan Kabir',
    companyType: 'Enterprise Software',
    projectType: 'saas-product',
    budgetEstimated: 450000,
    budgetConfirmed: 420000,
    confirmation: 'Signed Contract',
    confirmationDate: '2026-10-25',
    progressPercent: 40,
    milestones: {
      advance40: {
        percent: 40,
        label: '40% Advance Payment',
        amount: 168000,
        paid: true,
        paidDate: '2026-10-26',
        note: '40% advance received via City Bank wire',
      },
      midway30: {
        percent: 30,
        label: '30% Milestone Payment (at 70% Work)',
        amount: 126000,
        paid: false,
      },
      handover30: {
        percent: 30,
        label: '30% Final Payment (Handover)',
        amount: 126000,
        paid: false,
      },
    },
    totalPaid: 168000,
    dueAmount: 252000,
    projectStatus: 'In Progress',
    deployment: 'https://dev-api.shiftops.app',
    deploymentUrl: 'https://dev-api.shiftops.app',
    clientEmail: 'farhan@shiftops.app',
    clientPhone: '+880 1912-334455',
    clientWhatsapp: '+880 1912-334455',
    startDate: '2026-10-26',
    targetDeadline: '2026-12-15',
    worksheet: 'October 2026',
    notes: 'Multi-tenant payroll, shift scheduling, employee attendance tracking SaaS system with RBAC.',
    createdAt: '2026-10-25T11:00:00Z',
    updatedAt: '2026-10-26T15:00:00Z',
  },
  {
    id: 'proj-5',
    companyName: 'FleetTrack Mobile',
    clientsName: 'Kamrul Hasan',
    companyType: 'Logistics & Fleet',
    projectType: 'mobile-app',
    budgetEstimated: 320000,
    budgetConfirmed: 300000,
    confirmation: 'Signed Contract',
    confirmationDate: '2026-10-10',
    progressPercent: 100,
    milestones: {
      advance40: {
        percent: 40,
        label: '40% Advance Payment',
        amount: 120000,
        paid: true,
        paidDate: '2026-10-11',
      },
      midway30: {
        percent: 30,
        label: '30% Milestone Payment (at 70% Work)',
        amount: 90000,
        paid: true,
        paidDate: '2026-10-24',
      },
      handover30: {
        percent: 30,
        label: '30% Final Payment (Handover)',
        amount: 90000,
        paid: true,
        paidDate: '2026-11-02',
        note: 'APK + iOS IPA handed over and production live',
      },
    },
    totalPaid: 300000,
    dueAmount: 0,
    projectStatus: 'Completed',
    deployment: 'Google Play & App Store Live',
    deploymentUrl: 'https://play.google.com/store/apps/details?id=com.fleettrack.driver',
    clientEmail: 'kamrul@fleettrack.bd',
    clientPhone: '+880 1723-556677',
    clientWhatsapp: '+880 1723-556677',
    startDate: '2026-10-11',
    targetDeadline: '2026-10-31',
    worksheet: 'October 2026',
    notes: 'React Native driver dispatch and live GPS tracking app with background location services.',
    createdAt: '2026-10-10T14:00:00Z',
    updatedAt: '2026-11-02T10:00:00Z',
  },
  {
    id: 'proj-6',
    companyName: 'Apex Cloud Hub',
    clientsName: 'Rakibul Islam',
    companyType: 'Cloud Hosting & Infra',
    projectType: 'saas-product',
    budgetEstimated: 380000,
    budgetConfirmed: 350000,
    confirmation: 'Signed Contract',
    confirmationDate: '2026-11-01',
    progressPercent: 25,
    milestones: {
      advance40: {
        percent: 40,
        label: '40% Advance Payment',
        amount: 140000,
        paid: true,
        paidDate: '2026-11-01',
      },
      midway30: {
        percent: 30,
        label: '30% Milestone Payment (at 70% Work)',
        amount: 105000,
        paid: false,
      },
      handover30: {
        percent: 30,
        label: '30% Final Payment (Handover)',
        amount: 105000,
        paid: false,
      },
    },
    totalPaid: 140000,
    dueAmount: 210000,
    projectStatus: 'In Progress',
    deployment: 'https://staging.apexcloudhub.com',
    deploymentUrl: 'https://staging.apexcloudhub.com',
    clientEmail: 'rakib@apexcloudhub.com',
    clientPhone: '+880 1755-667788',
    clientWhatsapp: '+880 1755-667788',
    startDate: '2026-11-01',
    targetDeadline: '2026-12-28',
    worksheet: 'November 2026',
    notes: 'Custom dashboard with telemetry metrics, server automation and Stripe/bKash billing gateway.',
    createdAt: '2026-11-01T09:30:00Z',
    updatedAt: '2026-11-02T11:00:00Z',
  },
  {
    id: 'proj-7',
    companyName: 'StellarPay BD',
    clientsName: 'Ariful Islam',
    companyType: 'FinTech & Payments',
    projectType: 'web-app',
    budgetEstimated: 220000,
    budgetConfirmed: 200000,
    confirmation: 'Signed Contract',
    confirmationDate: '2026-11-02',
    progressPercent: 30,
    milestones: {
      advance40: {
        percent: 40,
        label: '40% Advance Payment',
        amount: 80000,
        paid: true,
        paidDate: '2026-11-02',
      },
      midway30: {
        percent: 30,
        label: '30% Milestone Payment (at 70% Work)',
        amount: 60000,
        paid: false,
      },
      handover30: {
        percent: 30,
        label: '30% Final Payment (Handover)',
        amount: 60000,
        paid: false,
      },
    },
    totalPaid: 80000,
    dueAmount: 120000,
    projectStatus: 'In Progress',
    deployment: 'https://stellarpay.vercel.app',
    deploymentUrl: 'https://stellarpay.vercel.app',
    clientEmail: 'arif@stellarpaybd.com',
    clientPhone: '+880 1733-445566',
    clientWhatsapp: '+880 1733-445566',
    startDate: '2026-11-02',
    targetDeadline: '2026-12-10',
    worksheet: 'November 2026',
    notes: 'Next.js payment gateway dashboard with merchant onboarding and webhook signature verification.',
    createdAt: '2026-11-02T08:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
  }
];

export const loadProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveProjects(INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_PROJECTS;
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    return INITIAL_PROJECTS;
  }
};

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to storage:', err);
  }
};

export const loadWebhookUrl = (): string => {
  return localStorage.getItem(WEBHOOK_KEY) || '';
};

export const saveWebhookUrl = (url: string): void => {
  localStorage.setItem(WEBHOOK_KEY, url);
};

export const loadWorksheets = (): string[] => {
  const currentMonth = getCurrentMonthWorksheet();
  const defaultWorksheets = [
    'All Worksheets',
    currentMonth,
    'October 2026',
    'December 2026',
    'January 2027',
    '2027 Full Year'
  ];

  try {
    const raw = localStorage.getItem(WORKSHEETS_KEY);
    if (!raw) {
      localStorage.setItem(WORKSHEETS_KEY, JSON.stringify(defaultWorksheets));
      return defaultWorksheets;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Filter out any accidental 'Untitled Worksheet'
      const cleaned = parsed.filter(w => w !== 'Untitled Worksheet');
      if (!cleaned.includes('All Worksheets')) cleaned.unshift('All Worksheets');
      if (!cleaned.includes(currentMonth)) cleaned.splice(1, 0, currentMonth);
      return cleaned;
    }
    return defaultWorksheets;
  } catch {
    return defaultWorksheets;
  }
};

export const saveWorksheets = (worksheets: string[]): void => {
  try {
    const cleaned = worksheets.filter(w => w !== 'Untitled Worksheet');
    localStorage.setItem(WORKSHEETS_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.error('Failed to save worksheets to storage:', err);
  }
};

export const loadAuthUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveAuthUser = (user: AuthUser): void => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save auth session:', err);
  }
};

export const clearAuthUser = (): void => {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (err) {
    console.error('Failed to clear auth session:', err);
  }
};

/**
 * Format currency with Bangladeshi Taka (BDT) symbol
 * All amounts across the app are in BDT
 */
export const formatMoney = (amount: number): string => {
  return `৳${(amount || 0).toLocaleString('en-US')}`;
};

/**
 * Generate formatted TSV for pasting directly into Google Sheets or Excel
 */
export const generateSpreadsheetTSV = (projects: Project[]): string => {
  const headers = [
    'Company Name',
    'Clients Name',
    'Company Type',
    'Project Type',
    'Start Date',
    'Target Deadline',
    'Worksheet',
    'Budget Estimated (BDT)',
    'Budget Confirmed (BDT)',
    'Confirmation',
    '40% Advance',
    '30% (at 70%)',
    '30% Handover',
    'Total Paid (BDT)',
    'Due (BDT)',
    'Project Status',
    'Deployment',
    'Client Phone',
    'WhatsApp',
    'Client Email'
  ];

  const rows = projects.map(p => {
    const advanceStatus = p.milestones.advance40.paid 
      ? `Paid (৳${p.milestones.advance40.amount.toLocaleString()})` 
      : `Due (৳${p.milestones.advance40.amount.toLocaleString()})`;
    const midStatus = p.milestones.midway30.paid 
      ? `Paid (৳${p.milestones.midway30.amount.toLocaleString()})` 
      : `Due (৳${p.milestones.midway30.amount.toLocaleString()})`;
    const finalStatus = p.milestones.handover30.paid 
      ? `Paid (৳${p.milestones.handover30.amount.toLocaleString()})` 
      : `Due (৳${p.milestones.handover30.amount.toLocaleString()})`;

    return [
      p.companyName,
      p.clientsName,
      p.companyType,
      p.projectType,
      p.startDate || '',
      p.targetDeadline || '',
      p.worksheet || '',
      p.budgetEstimated,
      p.budgetConfirmed,
      p.confirmation,
      advanceStatus,
      midStatus,
      finalStatus,
      p.totalPaid,
      p.dueAmount,
      p.projectStatus,
      p.deployment || 'N/A',
      p.clientPhone || '',
      p.clientWhatsapp || '',
      p.clientEmail || ''
    ].map(val => (val !== undefined && val !== null ? String(val).replace(/\t/g, ' ') : ''));
  });

  return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
};

/**
 * Download CSV file with UTF-8 BOM
 */
export const downloadProjectsCSV = (projects: Project[]) => {
  const headers = [
    'Company Name',
    'Clients Name',
    'Company Type',
    'Project Type',
    'Start Date',
    'Target Deadline',
    'Worksheet',
    'Budget Estimated (BDT)',
    'Budget Confirmed (BDT)',
    'Confirmation',
    '40% Advance Status',
    '40% Advance Amount',
    '30% (70% Work) Status',
    '30% (70% Work) Amount',
    '30% Handover Status',
    '30% Handover Amount',
    'Total Paid (BDT)',
    'Due Amount (BDT)',
    'Progress %',
    'Project Status',
    'Deployment',
    'Client Email',
    'Client Phone',
    'WhatsApp Number'
  ];

  const rows = projects.map(p => [
    `"${(p.companyName || '').replace(/"/g, '""')}"`,
    `"${(p.clientsName || '').replace(/"/g, '""')}"`,
    `"${(p.companyType || '').replace(/"/g, '""')}"`,
    `"${p.projectType}"`,
    `"${p.startDate || ''}"`,
    `"${p.targetDeadline || ''}"`,
    `"${p.worksheet || ''}"`,
    p.budgetEstimated,
    p.budgetConfirmed,
    `"${(p.confirmation || '').replace(/"/g, '""')}"`,
    p.milestones.advance40.paid ? 'PAID' : 'DUE',
    p.milestones.advance40.amount,
    p.milestones.midway30.paid ? 'PAID' : 'DUE',
    p.milestones.midway30.amount,
    p.milestones.handover30.paid ? 'PAID' : 'DUE',
    p.milestones.handover30.amount,
    p.totalPaid,
    p.dueAmount,
    `${p.progressPercent}%`,
    `"${p.projectStatus}"`,
    `"${(p.deployment || '').replace(/"/g, '""')}"`,
    `"${p.clientEmail || ''}"`,
    `"${p.clientPhone || ''}"`,
    `"${p.clientWhatsapp || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Projects_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download formatted Excel spreadsheet file (.xls)
 * Compatible with Microsoft Excel, LibreOffice, and Google Sheets
 */
export const downloadProjectsExcel = (projects: Project[], prefix = 'Projects') => {
  const headers = [
    'Company Name',
    'Clients Name',
    'Company Type',
    'Project Type',
    'Start Date',
    'Target Deadline',
    'Worksheet',
    'Budget Estimated (BDT)',
    'Budget Confirmed (BDT)',
    'Confirmation',
    '40% Advance',
    '30% (at 70%)',
    '30% Handover',
    'Total Paid (BDT)',
    'Due (BDT)',
    'Progress %',
    'Status',
    'Deployment',
    'Client Phone',
    'WhatsApp',
    'Client Email'
  ];

  const escapeXml = (str: any) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const rowsXml = projects.map(p => {
    const advStatus = p.milestones.advance40.paid 
      ? `PAID (৳${p.milestones.advance40.amount.toLocaleString()})` 
      : `DUE (৳${p.milestones.advance40.amount.toLocaleString()})`;
    const midStatus = p.milestones.midway30.paid 
      ? `PAID (৳${p.milestones.midway30.amount.toLocaleString()})` 
      : `DUE (৳${p.milestones.midway30.amount.toLocaleString()})`;
    const endStatus = p.milestones.handover30.paid 
      ? `PAID (৳${p.milestones.handover30.amount.toLocaleString()})` 
      : `DUE (৳${p.milestones.handover30.amount.toLocaleString()})`;

    return `
      <Row>
        <Cell><Data ss:Type="String">${escapeXml(p.companyName)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.clientsName)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.companyType)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.projectType)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.startDate)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.targetDeadline)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.worksheet)}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.budgetEstimated || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.budgetConfirmed || 0}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.confirmation)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(advStatus)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(midStatus)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(endStatus)}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.totalPaid || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.dueAmount || 0}</Data></Cell>
        <Cell><Data ss:Type="String">${p.progressPercent}%</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.projectStatus)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.deployment)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.clientPhone)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.clientWhatsapp)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(p.clientEmail)}</Data></Cell>
      </Row>
    `;
  }).join('');

  const headersXml = `
    <Row ss:StyleID="Header">
      ${headers.map(h => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}
    </Row>
  `;

  const excelXml = `<?xml version="1.0"?>
  <?mso-application progid="Excel.Sheet"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:html="http://www.w3.org/TR/REC-html40">
    <Styles>
      <Style ss:ID="Header">
        <Font ss:Bold="1" ss:Color="#000000"/>
        <Interior ss:Color="#93CF8C" ss:Pattern="Solid"/>
      </Style>
    </Styles>
    <Worksheet ss:Name="Client Projects">
      <Table>
        ${headersXml}
        ${rowsXml}
      </Table>
    </Worksheet>
  </Workbook>`;

  const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${prefix}_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
