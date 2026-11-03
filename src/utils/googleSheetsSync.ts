import { Project, AuthUser, PaymentMilestones } from '../types/project';
import { loadWebhookUrl, saveWebhookUrl, computeMilestones } from './storage';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'not-configured';

export interface SyncStatusInfo {
  state: SyncState;
  lastSyncedAt?: string;
  errorMessage?: string;
}

export const DEFAULT_CENTRAL_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbymyyzJ94YTwG5tfvxUt9-Mcgp8gdpja49_1agxdgb7od3Ptsl72TPoo1cIrSVslOU/exec';

export const DEFAULT_CENTRAL_SHEET_ID = '1RNZnmuhohsjVy1kGW3TrJWNv2j9XfO53p42FIVk9TNU';

/**
 * Returns the effective Google Sheets webhook URL
 * Checks custom user setting first, then env, then standard central database fallback
 */
export const getEffectiveWebhookUrl = (): string => {
  const custom = loadWebhookUrl().trim();
  if (custom && custom.startsWith('https://script.google.com/')) {
    return custom;
  }
  const envUrl = (import.meta as any).env?.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0 && !envUrl.includes('YOUR_DEPLOYED_SCRIPT_ID')) {
    return envUrl.trim();
  }
  return DEFAULT_CENTRAL_WEBHOOK_URL;
};

/**
 * Returns the effective Google Sheet ID
 */
export const getEffectiveSheetId = (user?: AuthUser | null): string => {
  if (user?.connectedSpreadsheetId && user.connectedSpreadsheetId.trim().length > 0) {
    return user.connectedSpreadsheetId.trim();
  }
  const envId = (import.meta as any).env?.VITE_GOOGLE_SHEET_ID;
  if (envId && typeof envId === 'string' && envId.trim().length > 0 && !envId.includes('your_google_sheet_id_here')) {
    return envId.trim();
  }
  return DEFAULT_CENTRAL_SHEET_ID;
};

/**
 * Complete Google Apps Script Master Code
 * Handles both GET (Fetch database) and POST (Save & Mirror database)
 */
export const APPS_SCRIPT_MASTER_CODE = `/**
 * PROJECTFLOW GOOGLE SHEETS CENTRAL CLOUD DATABASE WEB APP
 * Deploy this script as a Web App to enable live 2-way sync across all devices.
 */

// 1. GET: Fetches all project records and monthly worksheets across all devices
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var allProjects = [];
    var worksheets = [];

    for (var s = 0; s < sheets.length; s++) {
      var sheet = sheets[s];
      var sheetName = sheet.getName();
      if (!sheetName || sheetName === "Template" || sheetName.indexOf("_") === 0) continue;
      worksheets.push(sheetName);

      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) continue; // Skip header-only sheets

      for (var r = 1; r < data.length; r++) {
        var row = data[r];
        if (!row[0] && !row[1]) continue; // Skip empty rows

        var companyName = String(row[0] || "").trim();
        var clientsName = String(row[1] || "").trim();
        var companyType = String(row[2] || "Enterprise Client").trim();
        var projectType = String(row[3] || "web-app").toLowerCase().replace(/\\s+/g, '-').trim();
        var startDate = row[4] instanceof Date ? row[4].toISOString().split('T')[0] : String(row[4] || "").trim();
        var targetDeadline = row[5] instanceof Date ? row[5].toISOString().split('T')[0] : String(row[5] || "").trim();
        var ws = String(row[6] || sheetName).trim();
        var budgetEstimated = Number(row[7]) || 0;
        var budgetConfirmed = Number(row[8]) || 0;
        var confirmation = String(row[9] || "Signed Contract").trim();

        var advRaw = String(row[10] || "").toUpperCase();
        var midRaw = String(row[11] || "").toUpperCase();
        var endRaw = String(row[12] || "").toUpperCase();

        var advancePaid = advRaw.indexOf("PAID") !== -1;
        var midwayPaid = midRaw.indexOf("PAID") !== -1;
        var handoverPaid = endRaw.indexOf("PAID") !== -1;

        var isSocial = projectType === "social-media-marketing";
        var advanceAmount = isSocial ? Math.round(budgetConfirmed * 0.5) : Math.round(budgetConfirmed * 0.4);
        var midwayAmount = isSocial ? 0 : Math.round(budgetConfirmed * 0.3);
        var handoverAmount = budgetConfirmed - advanceAmount - midwayAmount;

        var totalPaid = (advancePaid ? advanceAmount : 0) + (isSocial ? 0 : (midwayPaid ? midwayAmount : 0)) + (handoverPaid ? handoverAmount : 0);
        var dueAmount = Math.max(0, budgetConfirmed - totalPaid);

        var projectStatus = String(row[15] || (totalPaid === budgetConfirmed && budgetConfirmed > 0 ? "Completed" : "In Progress")).trim();
        var progressPercent = Number(String(row[16] || "").replace("%", "")) || (projectStatus === "Completed" ? 100 : 50);
        var deployment = String(row[17] || "").trim();
        var clientPhone = String(row[18] || "").trim();
        var clientWhatsapp = String(row[19] || clientPhone).trim();
        var clientEmail = String(row[20] || "").trim();
        var notes = String(row[21] || "").trim();

        var id = "proj-" + sheetName.toLowerCase().replace(/[^a-z0-9]/g, '-') + "-" + r;

        allProjects.push({
          id: id,
          companyName: companyName,
          clientsName: clientsName,
          companyType: companyType,
          projectType: projectType,
          budgetEstimated: budgetEstimated,
          budgetConfirmed: budgetConfirmed,
          confirmation: confirmation,
          confirmationDate: startDate || new Date().toISOString().split('T')[0],
          progressPercent: progressPercent,
          milestones: {
            advance40: {
              percent: isSocial ? 50 : 40,
              label: isSocial ? "50% Advance Payment" : "40% Advance Payment",
              amount: advanceAmount,
              paid: advancePaid
            },
            midway30: {
              percent: isSocial ? 0 : 30,
              label: isSocial ? "N/A (50-50 Model)" : "30% Milestone Payment",
              amount: midwayAmount,
              paid: isSocial ? false : midwayPaid
            },
            handover30: {
              percent: isSocial ? 50 : 30,
              label: isSocial ? "50% Month-End Payment" : "30% Final Handover",
              amount: handoverAmount,
              paid: handoverPaid
            },
            model: isSocial ? "50-50" : "40-30-30"
          },
          totalPaid: totalPaid,
          dueAmount: dueAmount,
          projectStatus: projectStatus,
          deployment: deployment,
          deploymentUrl: deployment,
          clientEmail: clientEmail,
          clientPhone: clientPhone,
          clientWhatsapp: clientWhatsapp,
          startDate: startDate,
          targetDeadline: targetDeadline,
          worksheet: ws,
          notes: notes,
          createdAt: startDate || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      projects: allProjects,
      worksheets: worksheets
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. POST: Receives real-time state updates from the web app and mirrors into monthly tabs
function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var projects = contents.projects || [];
    var currency = contents.currency || "BDT";

    // Group projects by monthly worksheet
    var grouped = {};
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var ws = p.worksheet || "General";
      if (!grouped[ws]) grouped[ws] = [];
      grouped[ws].push(p);
    }

    var headers = [
      "Company Name", "Clients Name", "Company Type", "Project Type",
      "Start Date", "Target Deadline", "Worksheet",
      "Budget Estimated (" + currency + ")", "Budget Confirmed (" + currency + ")",
      "Confirmation", "40% / 50% Advance", "30% (at 70%)", "30% / 50% Handover",
      "Total Paid (" + currency + ")", "Due (" + currency + ")",
      "Project Status", "Progress %", "Deployment", "Client Phone", "WhatsApp", "Client Email", "Notes"
    ];

    for (var sheetName in grouped) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }

      sheet.clearContents();
      sheet.appendRow(headers);

      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#93cf8c").setFontColor("#090d16").setFontWeight("bold");

      var items = grouped[sheetName];
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        var isSocial = item.projectType === "social-media-marketing";
        var advStatus = item.advancePaid ? "PAID (৳" + Number(item.advance40 || 0).toLocaleString() + ")" : "DUE (৳" + Number(item.advance40 || 0).toLocaleString() + ")";
        var midStatus = isSocial ? "N/A (50-50)" : (item.midwayPaid ? "PAID (৳" + Number(item.midway30 || 0).toLocaleString() + ")" : "DUE (৳" + Number(item.midway30 || 0).toLocaleString() + ")");
        var endStatus = item.handoverPaid ? "PAID (৳" + Number(item.handover30 || 0).toLocaleString() + ")" : "DUE (৳" + Number(item.handover30 || 0).toLocaleString() + ")";

        sheet.appendRow([
          item.companyName,
          item.clientsName,
          item.companyType,
          item.projectType,
          item.startDate || "",
          item.targetDeadline || "",
          sheetName,
          item.budgetEstimated,
          item.budgetConfirmed,
          item.confirmation,
          advStatus,
          midStatus,
          endStatus,
          item.totalPaid,
          item.dueAmount,
          item.projectStatus,
          (item.progressPercent || 0) + "%",
          item.deployment || "",
          item.clientPhone || "",
          item.clientWhatsapp || "",
          item.clientEmail || "",
          item.notes || ""
        ]);
      }

      for (var c = 1; c <= headers.length; c++) {
        sheet.autoResizeColumn(c);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", count: projects.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

/**
 * Fetch live project records from the central Google Sheet database
 * Powers cross-device consistency so every browser displays the same data
 */
export const fetchProjectsFromGoogleSheets = async (
  user?: AuthUser | null
): Promise<{ success: boolean; projects?: Project[]; worksheets?: string[]; message?: string; needsDeployment?: boolean }> => {
  const webhookUrl = getEffectiveWebhookUrl();
  if (!webhookUrl) {
    return {
      success: false,
      message: 'No Google Sheets Webhook URL configured.'
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      if (text.includes('doGet') || text.includes('ত্রুটি') || text.includes('Script function not found')) {
        return {
          success: false,
          needsDeployment: true,
          message: 'Google Apps Script requires doGet deployment. Please update and deploy a New Version in Apps Script.'
        };
      }
      return {
        success: false,
        message: 'Non-JSON response received from Google Sheets webhook.'
      };
    }

    if (data && data.status === 'success' && Array.isArray(data.projects)) {
      return {
        success: true,
        projects: data.projects,
        worksheets: Array.isArray(data.worksheets) && data.worksheets.length > 0 ? data.worksheets : undefined,
        message: `Successfully loaded ${data.projects.length} project records from Google Sheets database.`
      };
    }

    return {
      success: false,
      message: data?.message || 'Invalid data format received from Google Sheets.'
    };
  } catch (err: any) {
    console.warn('Central Google Sheet database fetch notice:', err?.message || err);
    return {
      success: false,
      message: err?.message || 'Could not fetch live records from Google Sheet.'
    };
  }
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
      message: 'No Google Sheets Webhook URL configured. Open Profile Settings to configure.'
    };
  }

  try {
    const payload = {
      timestamp: new Date().toISOString(),
      currency: 'BDT',
      sheetId: getEffectiveSheetId(user),
      user: user ? user.email : 'Anonymous',
      projectsCount: projects.length,
      projects: projects.map(p => {
        const isSocial = p.projectType === 'social-media-marketing' || p.milestones?.model === '50-50';
        return {
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
          midway30: isSocial ? 0 : (p.milestones.midway30?.amount || 0),
          midwayPaid: isSocial ? false : (p.milestones.midway30?.paid || false),
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
        };
      })
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
