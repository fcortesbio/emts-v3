// Configuration constants
const COMPANY_NAME = "Domain";
const DOMAIN_NAME = "domain.com";
const EID_LENGTH = 7;
const DEFAULT_AGENT_DIVISION = "Customer Specialist";
const DEFAULT_AGENT_ROLE = "agent";

/**
 * Entry point for the web app
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include HTML files for modular structure
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Initialize spreadsheet with required sheets if they don't exist
 */
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create users sheet if it doesn't exist
  let usersSheet = ss.getSheetByName('users');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('users');
    usersSheet.getRange('A1:E1').setValues([['agent_eid', 'agent_name', 'agent_division', 'agent_role', 'agent_email']]);
  }

  // Create signup sheet if it doesn't exist
  let signupSheet = ss.getSheetByName('signup');
  if (!signupSheet) {
    signupSheet = ss.insertSheet('signup');
    signupSheet.getRange('A1:F1').setValues([['agent_eid', 'agent_name', 'agent_email', 'agent_division', 'agent_role', 'status']]);
  }

  // Create templates sheet if it doesn't exist
  let templatesSheet = ss.getSheetByName('templates');
  if (!templatesSheet) {
    templatesSheet = ss.insertSheet('templates');
    templatesSheet.getRange('A1:H1').setValues([['template_id', 'inquiry_reason', 'topic_name', 'case_name', 'template_content', 'email_subject', 'backend_log', 'tasks']]);
  }
}