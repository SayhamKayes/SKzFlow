import { Project, AuthUser, PaymentMilestones } from '../types/project';
import { loadWebhookUrl, saveWebhookUrl, computeMilestones, formatLocalDate, normalizeWorksheetName } from './storage';

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

    // Safe date formatter to avoid timezone day shifts
    function formatDateClean(val) {
      if (!val) return "";
      if (val instanceof Date) {
        if (isNaN(val.getTime())) return "";
        var year = val.getFullYear();
        var month = String(val.getMonth() + 1);
        if (month.length < 2) month = "0" + month;
        var day = String(val.getDate());
        if (day.length < 2) day = "0" + day;
        return year + "-" + month + "-" + day;
      }
      var str = String(val).trim();
      var match = str.match(/^(\\d{4})-(\\d{1,2})-(\\d{1,2})/);
      if (match) {
        var m = match[2].length < 2 ? "0" + match[2] : match[2];
        var d = match[3].length < 2 ? "0" + match[3] : match[3];
        return match[1] + "-" + m + "-" + d;
      }
      var slashMatch = str.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})/);
      if (slashMatch) {
        var sd = slashMatch[1].length < 2 ? "0" + slashMatch[1] : slashMatch[1];
        var sm = slashMatch[2].length < 2 ? "0" + slashMatch[2] : slashMatch[2];
        return slashMatch[3] + "-" + sm + "-" + sd;
      }
      return str;
    }

    // Normalizes worksheet name to avoid Google Sheets Date object conversions
    function formatWorksheetClean(val, fallback) {
      var str = String(val || "").trim();
      if (!str) return fallback || "General";
      var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      var strLower = str.toLowerCase();
      for (var mi = 0; mi < months.length; mi++) {
        var mName = months[mi].toLowerCase();
        var mShort = mName.substring(0, 3);
        if (strLower.indexOf(mName) !== -1 || strLower.indexOf(mShort) !== -1) {
          var yMatch = str.match(/\\b(20\\d\\d)\\b/);
          if (yMatch) {
            return months[mi] + " " + yMatch[1];
          }
        }
      }
      return fallback || str;
    }

    for (var s = 0; s < sheets.length; s++) {
      var sheet = sheets[s];
      var rawSheetName = sheet.getName();
      if (!rawSheetName || rawSheetName === "Template" || rawSheetName.indexOf("_") === 0) continue;
      var cleanSheetName = formatWorksheetClean(rawSheetName, rawSheetName);
      worksheets.push(cleanSheetName);

      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) continue; // Skip header-only sheets

      var headerRow = data[0] || [];
      var colMap = {};
      for (var h = 0; h < headerRow.length; h++) {
        colMap[String(headerRow[h] || "").trim().toLowerCase()] = h;
      }

      var colCompany = colMap["company name"] !== undefined ? colMap["company name"] : 0;
      var colClient = colMap["clients name"] !== undefined ? colMap["clients name"] : 1;
      var colCompType = colMap["company type"] !== undefined ? colMap["company type"] : 2;
      var colProjType = colMap["project type"] !== undefined ? colMap["project type"] : 3;
      var colStart = colMap["start date"] !== undefined ? colMap["start date"] : 4;
      var colDeadline = colMap["target deadline"] !== undefined ? colMap["target deadline"] : 5;
      var colWs = colMap["worksheet"] !== undefined ? colMap["worksheet"] : 6;
      var colEst = colMap["budget estimated"] !== undefined ? colMap["budget estimated"] : 7;
      var colConf = colMap["budget confirmed"] !== undefined ? colMap["budget confirmed"] : 8;
      var colConfType = colMap["confirmation"] !== undefined ? colMap["confirmation"] : 9;
      var colAdv = colMap["40% / 50% advance"] !== undefined ? colMap["40% / 50% advance"] : 10;
      var colMid = colMap["30% (at 70%)"] !== undefined ? colMap["30% (at 70%)"] : 11;
      var colEnd = colMap["30% / 50% handover"] !== undefined ? colMap["30% / 50% handover"] : 12;
      var colPaid = colMap["total paid"] !== undefined ? colMap["total paid"] : 13;
      var colDue = colMap["due"] !== undefined ? colMap["due"] : 14;
      var colStatus = colMap["project status"] !== undefined ? colMap["project status"] : 15;
      var colProg = colMap["progress %"] !== undefined ? colMap["progress %"] : 16;
      
      var colDepPlatform = colMap["deployment platform"] !== undefined ? colMap["deployment platform"] : (colMap["deployment"] !== undefined ? colMap["deployment"] : 17);
      var colDepUrl = colMap["live deployment url"] !== undefined ? colMap["live deployment url"] : (colMap["deployment url"] !== undefined ? colMap["deployment url"] : (colMap["live url"] !== undefined ? colMap["live url"] : -1));

      var colPhone = colMap["client phone"] !== undefined ? colMap["client phone"] : (colDepUrl !== -1 ? 19 : 18);
      var colWhatsapp = colMap["whatsapp"] !== undefined ? colMap["whatsapp"] : (colDepUrl !== -1 ? 20 : 19);
      var colEmail = colMap["client email"] !== undefined ? colMap["client email"] : (colDepUrl !== -1 ? 21 : 20);
      var colNotes = colMap["notes"] !== undefined ? colMap["notes"] : (colDepUrl !== -1 ? 22 : 21);

      for (var r = 1; r < data.length; r++) {
        var row = data[r];
        if (!row[0] && !row[1]) continue; // Skip empty rows

        var companyName = String(row[colCompany] || "").trim();
        var clientsName = String(row[colClient] || "").trim();
        var companyType = String(row[colCompType] || "Enterprise Client").trim();
        var projectType = String(row[colProjType] || "web-app").toLowerCase().replace(/\\s+/g, '-').trim();
        var startDate = formatDateClean(row[colStart]);
        var targetDeadline = formatDateClean(row[colDeadline]);
        var ws = formatWorksheetClean(row[colWs], cleanSheetName);
        var budgetEstimated = Number(row[colEst]) || 0;
        var budgetConfirmed = Number(row[colConf]) || 0;
        var confirmation = String(row[colConfType] || "Signed Contract").trim();

        var advRaw = String(row[colAdv] || "").toUpperCase();
        var midRaw = String(row[colMid] || "").toUpperCase();
        var endRaw = String(row[colEnd] || "").toUpperCase();

        var advancePaid = advRaw.indexOf("PAID") !== -1;
        var midwayPaid = midRaw.indexOf("PAID") !== -1;
        var handoverPaid = endRaw.indexOf("PAID") !== -1;

        var isSocial = projectType === "social-media-marketing";
        var advanceAmount = isSocial ? Math.round(budgetConfirmed * 0.5) : Math.round(budgetConfirmed * 0.4);
        var midwayAmount = isSocial ? 0 : Math.round(budgetConfirmed * 0.3);
        var handoverAmount = budgetConfirmed - advanceAmount - midwayAmount;

        var totalPaid = (advancePaid ? advanceAmount : 0) + (isSocial ? 0 : (midwayPaid ? midwayAmount : 0)) + (handoverPaid ? handoverAmount : 0);
        var dueAmount = Math.max(0, budgetConfirmed - totalPaid);

        var projectStatus = String(row[colStatus] || (totalPaid === budgetConfirmed && budgetConfirmed > 0 ? "Completed" : "In Progress")).trim();

        // Parse Progress % accurately
        var rawProg = row[colProg];
        var progressPercent = 0;
        if (rawProg !== "" && rawProg !== null && rawProg !== undefined) {
          var pNum = Number(String(rawProg).replace("%", "").trim());
          if (!isNaN(pNum)) {
            if (pNum > 0 && pNum <= 1 && String(rawProg).indexOf("%") === -1) {
              progressPercent = Math.round(pNum * 100);
            } else {
              progressPercent = Math.round(pNum);
            }
          }
        } else {
          progressPercent = projectStatus === "Completed" ? 100 : (projectStatus === "70% Done" ? 70 : 0);
        }

        // Parse Deployment Platform & Live URL accurately
        var deployment = "";
        var deploymentUrl = "";
        if (colDepUrl !== -1) {
          deployment = String(row[colDepPlatform] || "").trim();
          deploymentUrl = String(row[colDepUrl] || "").trim();
        } else {
          var rawDepVal = String(row[colDepPlatform] || "").trim();
          if (rawDepVal.indexOf("http://") === 0 || rawDepVal.indexOf("https://") === 0) {
            deploymentUrl = rawDepVal;
            deployment = "Live";
          } else {
            deployment = rawDepVal;
            deploymentUrl = "";
          }
        }

        var clientPhone = String(row[colPhone] || "").trim();
        var clientWhatsapp = String(row[colWhatsapp] || clientPhone).trim();
        var clientEmail = String(row[colEmail] || "").trim();
        var notes = String(row[colNotes] || "").trim();

        var id = "proj-" + cleanSheetName.toLowerCase().replace(/[^a-z0-9]/g, '-') + "-" + r;

        allProjects.push({
          id: id,
          companyName: companyName,
          clientsName: clientsName,
          companyType: companyType,
          projectType: projectType,
          budgetEstimated: budgetEstimated,
          budgetConfirmed: budgetConfirmed,
          confirmation: confirmation,
          confirmationDate: startDate || formatDateClean(new Date()),
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
          deploymentUrl: deploymentUrl,
          clientEmail: clientEmail,
          clientPhone: clientPhone,
          clientWhatsapp: clientWhatsapp,
          startDate: startDate,
          targetDeadline: targetDeadline,
          worksheet: ws,
          notes: notes,
          createdAt: startDate || formatDateClean(new Date()),
          updatedAt: formatDateClean(new Date())
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
    var currency = contents.currency || "BDT";
    var action = contents.action || "sync";

    var headers = [
      "Company Name", "Clients Name", "Company Type", "Project Type",
      "Start Date", "Target Deadline", "Worksheet",
      "Budget Estimated (" + currency + ")", "Budget Confirmed (" + currency + ")",
      "Confirmation", "40% / 50% Advance", "30% (at 70%)", "30% / 50% Handover",
      "Total Paid (" + currency + ")", "Due (" + currency + ")",
      "Project Status", "Progress %", "Deployment Platform", "Live Deployment URL",
      "Client Phone", "WhatsApp", "Client Email", "Notes"
    ];

    // Handle explicit single worksheet deletion
    if (action === "deleteWorksheet" && contents.worksheetName) {
      var targetSheet = ss.getSheetByName(contents.worksheetName);
      if (targetSheet) {
        if (ss.getSheets().length > 1) {
          ss.deleteSheet(targetSheet);
        } else {
          targetSheet.clearContents();
          targetSheet.setName("General");
          targetSheet.appendRow(headers);
        }
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          message: "Worksheet " + contents.worksheetName + " deleted successfully."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "not_found",
        message: "Worksheet " + contents.worksheetName + " was not found."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle full database reset
    if (action === "resetAll") {
      var sheets = ss.getSheets();
      var defaultSheet = sheets[0];
      defaultSheet.setName("General");
      defaultSheet.clearContents();
      defaultSheet.appendRow(headers);
      var headerRange = defaultSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#93cf8c").setFontColor("#090d16").setFontWeight("bold");

      for (var d = sheets.length - 1; d > 0; d--) {
        ss.deleteSheet(sheets[d]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Database reset successfully."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Standard sync action
    var projects = contents.projects || [];
    var activeWorksheets = contents.activeWorksheets || contents.worksheets || [];

    // Group projects by monthly worksheet
    var grouped = {};
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var ws = p.worksheet || "General";
      if (!grouped[ws]) grouped[ws] = [];
      grouped[ws].push(p);
    }

    // Collect all valid target sheets
    var targetSheets = {};
    if (Array.isArray(activeWorksheets)) {
      for (var a = 0; a < activeWorksheets.length; a++) {
        var wName = String(activeWorksheets[a] || "").trim();
        if (wName && wName !== "All Worksheets") {
          targetSheets[wName] = true;
        }
      }
    }
    for (var g in grouped) {
      if (g && g !== "All Worksheets") {
        targetSheets[g] = true;
      }
    }

    // Remove any physical sheets in spreadsheet that are NOT in targetSheets (except Template/system)
    if (Object.keys(targetSheets).length > 0) {
      var existingSheets = ss.getSheets();
      for (var k = 0; k < existingSheets.length; k++) {
        var curSheet = existingSheets[k];
        var curName = curSheet.getName();
        if (!curName || curName === "Template" || curName.indexOf("_") === 0) continue;
        if (!targetSheets[curName]) {
          if (ss.getSheets().length > 1) {
            ss.deleteSheet(curSheet);
          } else {
            curSheet.clearContents();
          }
        }
      }
    }

    // Mirror each target sheet
    for (var sheetName in targetSheets) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }

      sheet.clearContents();
      sheet.appendRow(headers);

      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#93cf8c").setFontColor("#090d16").setFontWeight("bold");

      var items = grouped[sheetName] || [];
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
          (item.progressPercent !== undefined ? item.progressPercent : 0) + "%",
          item.deployment || "",
          item.deploymentUrl || "",
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
      // Normalize project records and sanitize worksheet / progress fields
      const sanitizedProjects: Project[] = data.projects.map((p: any) => {
        const ws = normalizeWorksheetName(p.worksheet);

        // Convert percentage decimals (e.g. 0.5) to integer percentages (e.g. 50)
        let progress = 0;
        if (p.progressPercent !== undefined && p.progressPercent !== null) {
          const num = Number(p.progressPercent);
          if (!isNaN(num)) {
            if (num > 0 && num <= 1) {
              progress = Math.round(num * 100);
            } else {
              progress = Math.round(num);
            }
          }
        }

        const cleanStart = formatLocalDate(p.startDate);
        const cleanDeadline = formatLocalDate(p.targetDeadline);
        const cleanConfirmation = formatLocalDate(p.confirmationDate || p.startDate);

        const cleanDeployment = String(p.deployment || '').trim();
        let cleanDeploymentUrl = String(p.deploymentUrl || '').trim();
        // Prevent non-URL platform labels (like legacy "Live") from masquerading as a URL
        if (cleanDeploymentUrl && !cleanDeploymentUrl.startsWith('http://') && !cleanDeploymentUrl.startsWith('https://') && !cleanDeploymentUrl.includes('.')) {
          cleanDeploymentUrl = '';
        }

        // Sanitize milestone paid dates to prevent timezone drift
        const cleanMilestones = p.milestones ? {
          ...p.milestones,
          advance40: p.milestones.advance40 ? {
            ...p.milestones.advance40,
            paidDate: p.milestones.advance40.paidDate ? formatLocalDate(p.milestones.advance40.paidDate) : undefined
          } : undefined,
          midway30: p.milestones.midway30 ? {
            ...p.milestones.midway30,
            paidDate: p.milestones.midway30.paidDate ? formatLocalDate(p.milestones.midway30.paidDate) : undefined
          } : undefined,
          handover30: p.milestones.handover30 ? {
            ...p.milestones.handover30,
            paidDate: p.milestones.handover30.paidDate ? formatLocalDate(p.milestones.handover30.paidDate) : undefined
          } : undefined,
        } : undefined;

        return {
          ...p,
          startDate: cleanStart,
          targetDeadline: cleanDeadline,
          confirmationDate: cleanConfirmation,
          milestones: cleanMilestones || p.milestones,
          worksheet: ws || 'General',
          progressPercent: progress,
          deployment: cleanDeployment,
          deploymentUrl: cleanDeploymentUrl,
        };
      });

      // Normalize worksheet tab names
      const rawWorksheets: string[] = Array.isArray(data.worksheets) ? data.worksheets : [];
      const cleanedWorksheets = rawWorksheets
        .map(w => normalizeWorksheetName(w))
        .filter(w => Boolean(w) && w !== 'Template' && !w.startsWith('_'));

      // Also ensure all worksheets present in loaded projects are listed
      sanitizedProjects.forEach(p => {
        if (p.worksheet && !cleanedWorksheets.includes(p.worksheet)) {
          cleanedWorksheets.push(p.worksheet);
        }
      });

      return {
        success: true,
        projects: sanitizedProjects,
        worksheets: cleanedWorksheets.length > 0 ? cleanedWorksheets : undefined,
        message: `Successfully loaded ${sanitizedProjects.length} project records from Google Sheets database.`
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
 * Supports both signatures:
 *   syncProjectsToGoogleSheets(projects, worksheets, user)
 *   syncProjectsToGoogleSheets(projects, user)
 */
export async function syncProjectsToGoogleSheets(
  projects: Project[],
  worksheetsOrUser?: string[] | AuthUser | null,
  userArg?: AuthUser | null
): Promise<{ success: boolean; message: string }> {
  const webhookUrl = getEffectiveWebhookUrl();

  if (!webhookUrl) {
    return {
      success: false,
      message: 'No Google Sheets Webhook URL configured. Open Profile Settings to configure.'
    };
  }

  const worksheets = Array.isArray(worksheetsOrUser) ? worksheetsOrUser : undefined;
  const user = Array.isArray(worksheetsOrUser) ? userArg : worksheetsOrUser;

  try {
    const payload = {
      action: 'sync',
      timestamp: new Date().toISOString(),
      currency: 'BDT',
      sheetId: getEffectiveSheetId(user),
      user: user ? user.email : 'Anonymous',
      projectsCount: projects.length,
      activeWorksheets: worksheets || [],
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
          progressPercent: p.progressPercent ?? 0,
          deployment: p.deployment || '',
          deploymentUrl: p.deploymentUrl || '',
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
}

/**
 * Delete a specific worksheet tab permanently from Google Sheets
 */
export const deleteWorksheetFromGoogleSheets = async (
  worksheetName: string,
  user?: AuthUser | null
): Promise<{ success: boolean; message: string }> => {
  const webhookUrl = getEffectiveWebhookUrl();
  if (!webhookUrl || !worksheetName.trim()) {
    return { success: false, message: 'Invalid webhook URL or worksheet name.' };
  }

  try {
    const payload = {
      action: 'deleteWorksheet',
      worksheetName: worksheetName.trim(),
      sheetId: getEffectiveSheetId(user),
      timestamp: new Date().toISOString()
    };

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
      message: `Worksheet "${worksheetName}" deleted from Google Sheets.`
    };
  } catch (err: any) {
    console.error('Delete worksheet error:', err);
    return {
      success: false,
      message: err?.message || `Failed to delete worksheet "${worksheetName}".`
    };
  }
};

/**
 * Reset all sheets and data across the Google Sheets database to clean slate
 */
export const resetGoogleSheetsDatabase = async (
  user?: AuthUser | null
): Promise<{ success: boolean; message: string }> => {
  const webhookUrl = getEffectiveWebhookUrl();
  if (!webhookUrl) {
    return { success: false, message: 'No Google Sheets Webhook URL configured.' };
  }

  try {
    const payload = {
      action: 'resetAll',
      sheetId: getEffectiveSheetId(user),
      timestamp: new Date().toISOString()
    };

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
      message: 'Successfully reset Google Sheets database to a clean state.'
    };
  } catch (err: any) {
    console.error('Reset database error:', err);
    return {
      success: false,
      message: err?.message || 'Failed to reset Google Sheets database.'
    };
  }
};
