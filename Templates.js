/**
 * Get all templates organized by hierarchy
 */
function getTemplatesHierarchy() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const templatesSheet = ss.getSheetByName('templates');

    if (!templatesSheet) {
      initializeSpreadsheet();
      return {};
    }

    const data = templatesSheet.getDataRange().getValues();
    const hierarchy = {};

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const [templateId, inquiryReason, topicName, caseName, templateContent, emailSubject, backendLog, tasks] = data[i];

      if (!inquiryReason || !topicName || !caseName) continue;

      if (!hierarchy[inquiryReason]) {
        hierarchy[inquiryReason] = {};
      }

      if (!hierarchy[inquiryReason][topicName]) {
        hierarchy[inquiryReason][topicName] = {};
      }

      hierarchy[inquiryReason][topicName][caseName] = {
        templateId,
        templateContent,
        emailSubject,
        backendLog,
        tasks
      };
    }

    return hierarchy;
  } catch (error) {
    console.error('Error getting templates hierarchy:', error);
    return {};
  }
}

/**
 * Get specific template by ID
 */
function getTemplateById(templateId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const templatesSheet = ss.getSheetByName('templates');

    if (!templatesSheet) return null;

    const data = templatesSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === templateId) {
        return {
          templateId: data[i][0],
          inquiryReason: data[i][1],
          topicName: data[i][2],
          caseName: data[i][3],
          templateContent: data[i][4],
          emailSubject: data[i][5],
          backendLog: data[i][6],
          tasks: data[i][7],
          rowIndex: i + 1
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting template by ID:', error);
    return null;
  }
}

/**
 * Save template (create or update)
 */
function saveTemplate(templateData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let templatesSheet = ss.getSheetByName('templates');

    if (!templatesSheet) {
      initializeSpreadsheet();
      templatesSheet = ss.getSheetByName('templates');
    }

    // Validate required fields
    if (!templateData.inquiryReason || !templateData.topicName || !templateData.caseName || !templateData.templateContent || !templateData.emailSubject) {
      return { success: false, message: 'All required fields must be filled' };
    }

    // Check for duplicate (same inquiry, topic, case) when creating new template
    if (!templateData.templateId) {
      if (checkDuplicateTemplate(templateData.inquiryReason, templateData.topicName, templateData.caseName)) {
        return { success: false, message: 'This template already exists. Please choose a different Case name.' };
      }
    }

    const rowData = [
      templateData.templateId || generateTemplateId(),
      templateData.inquiryReason,
      templateData.topicName,
      templateData.caseName,
      templateData.templateContent,
      templateData.emailSubject,
      templateData.backendLog || '',
      templateData.tasks || ''
    ];

    if (templateData.templateId) {
      // Update existing template
      const existingTemplate = getTemplateById(templateData.templateId);
      if (existingTemplate) {
        templatesSheet.getRange(existingTemplate.rowIndex, 1, 1, 8).setValues([rowData]);
        return { success: true, message: 'Template updated successfully' };
      } else {
        return { success: false, message: 'Template not found for update' };
      }
    } else {
      // Create new template
      templatesSheet.appendRow(rowData);
      return { success: true, message: 'Template created successfully' };
    }
  } catch (error) {
    console.error('Error saving template:', error);
    return { success: false, message: 'Error saving template' };
  }
}

/**
 * Check if template with same inquiry, topic, case already exists
 */
function checkDuplicateTemplate(inquiryReason, topicName, caseName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const templatesSheet = ss.getSheetByName('templates');

  if (!templatesSheet) return false;

  const data = templatesSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === inquiryReason && data[i][2] === topicName && data[i][3] === caseName) {
      return true;
    }
  }

  return false;
}

/**
 * Generate unique template ID
 */
function generateTemplateId() {
  return 'TPL_' + Utilities.getUuid().substring(0, 8).toUpperCase();
}

/**
 * Delete template by ID
 */
function deleteTemplate(templateId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const templatesSheet = ss.getSheetByName('templates');

    if (!templatesSheet) return { success: false, message: 'Templates sheet not found' };

    const data = templatesSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === templateId) {
        templatesSheet.deleteRow(i + 1);
        return { success: true, message: 'Template deleted successfully' };
      }
    }

    return { success: false, message: 'Template not found' };
  } catch (error) {
    console.error('Error deleting template:', error);
    return { success: false, message: 'Error deleting template' };
  }
}

/**
 * Process template content with placeholders
 */
function processTemplate(content, userData) {
  if (!content) return '';

  // Replace automatic placeholders
  let processed = content.replace(/\{\{agent_name\}\}/g, userData.name || '');
  processed = processed.replace(/\{\{agent_division\}\}/g, userData.division || '');

  return processed;
}