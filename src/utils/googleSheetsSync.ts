import { Project, AuthUser } from '../types/project';
import { loadWebhookUrl, saveWebhookUrl } from './storage';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'not-configured';

export interface SyncStatusInfo {
  state: SyncState;
  lastSyncedAt?: string;
  errorMessage?: string;
}

/**
 * Returns the effective Google Sheets webhook URL
 * Checks import.meta.env first, then falls back to localStorage
 */
export const getEffectiveWebhookUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0 && !envUrl.includes('YOUR_DEPLOYED_SCRIPT_ID')) {
    return envUrl.trim();
  }
  return loadWebhookUrl().trim();
};

/**
 * Returns the effective Google Sheet ID
 */
export const getEffectiveSheetId = (user?: AuthUser | null): string => {
  if (user?.connectedSpreadsheetId) {
    return user.connectedSpreadsheetId.trim();
  }
  const envId = (import.meta as any).env?.VITE_GOOGLE_SHEET_ID;
  if (envId && typeof envId === 'string' && envId.trim().length > 0 && !envId.includes('your_google_sheet_id_here')) {
    return envId.trim();
  }
  return '';
};

/**
 * Auto-sync projects to Google Sheets Webhook
 * Sends a clean snapshot partitioned by monthly worksheets
 */
export const syncProjectsToGoogleSheets = async (
  projects: Project[],
  user?: AuthUser | null
): Promise<{ success: boolean; message: string }> => {
  const webhookUrl = getEffectiveWebhookUrl();

  if (!webhookUrl) {
    return {
      success: false,
      message: 'No Google Sheets Webhook URL configured. Open Spreadsheet Tools to set it up.'
    };
  }

  try {
    const payload = {
      timestamp: new Date().toISOString(),
      currency: 'BDT',
      sheetId: getEffectiveSheetId(user),
      user: user ? user.email : 'Anonymous',
      projectsCount: projects.length,
      projects: projects.map(p => ({
        companyName: p.companyName,
        clientsName: p.clientsName,
        companyType: p.companyType,
        projectType: p.projectType,
        startDate: p.startDate || '',
        targetDeadline: p.targetDeadline || '',
        worksheet: p.worksheet || 'General',
        budgetEstimated: p.budgetEstimated,
        budgetConfirmed: p.budgetConfirmed,
        confirmation: p.confirmation,
        advance40: p.milestones.advance40.amount,
        advancePaid: p.milestones.advance40.paid,
        midway30: p.milestones.midway30.amount,
        midwayPaid: p.milestones.midway30.paid,
        handover30: p.milestones.handover30.amount,
        handoverPaid: p.milestones.handover30.paid,
        totalPaid: p.totalPaid,
        dueAmount: p.dueAmount,
        projectStatus: p.projectStatus,
        progressPercent: p.progressPercent,
        deployment: p.deployment || '',
        clientPhone: p.clientPhone || '',
        clientWhatsapp: p.clientWhatsapp || '',
        clientEmail: p.clientEmail || '',
        notes: p.notes || ''
      }))
    };

    // Google Apps Script Web Apps require no-cors or redirect handling
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: `Successfully synchronized ${projects.length} project records to Google Sheets!`
    };
  } catch (err: any) {
    console.error('Google Sheets auto-sync error:', err);
    return {
      success: false,
      message: err?.message || 'Failed to sync with Google Sheets webhook.'
    };
  }
};

