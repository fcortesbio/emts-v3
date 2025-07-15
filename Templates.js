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
    console.log('getTemplateById called with ID:', templateId);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const templatesSheet = ss.getSheetByName('templates');

    if (!templatesSheet) {
      console.log('Templates sheet not found');
      return null;
    }

    const data = templatesSheet.getDataRange().getValues();
    console.log('Templates sheet has', data.length - 1, 'templates');

    for (let i = 1; i < data.length; i++) {
      console.log('Checking row', i, 'ID:', data[i][0], 'vs search ID:', templateId);
      if (data[i][0] == templateId) {
        console.log('Found matching template at row', i + 1);
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

    console.log('No matching template found for ID:', templateId);
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
    console.log('saveTemplate called with:', templateData);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let templatesSheet = ss.getSheetByName('templates');

    if (!templatesSheet) {
      console.log('Templates sheet not found, initializing...');
      initializeSpreadsheet();
      templatesSheet = ss.getSheetByName('templates');
    }

    // Validate required fields
    if (!templateData.inquiryReason || !templateData.topicName || !templateData.caseName || !templateData.templateContent || !templateData.emailSubject) {
      console.log('Validation failed - missing required fields');
      return { success: false, message: 'All required fields must be filled' };
    }

    const isUpdate = templateData.templateId && templateData.templateId.toString().trim() !== '';
    console.log('Is update operation:', isUpdate, 'Template ID:', templateData.templateId);

    // Check for duplicate (same inquiry, topic, case) when creating new template
    if (!isUpdate && checkDuplicateTemplate(templateData.inquiryReason, templateData.topicName, templateData.caseName)) {
      console.log('Checking for duplicate template...');
      console.log('Duplicate template found');
      return { success: false, message: 'This template already exists. Please choose a different Case name.' };
    }

    // Generate new template ID for create operations
    const templateId = isUpdate ? templateData.templateId : generateTemplateId();
    console.log('Using template ID:', templateId);

    const rowData = [
      templateId,
      templateData.inquiryReason,
      templateData.topicName,
      templateData.caseName,
      templateData.templateContent,
      templateData.emailSubject,
      templateData.backendLog || '',
      templateData.tasks || ''
    ];

    console.log('Row data to save:', rowData);
    if (isUpdate) {
      // Update existing template
      console.log('Updating existing template...');
      const data = templatesSheet.getDataRange().getValues();
      console.log('Sheet has', data.length - 1, 'rows of data');
      let found = false;

      for (let i = 1; i < data.length; i++) {
        console.log('Checking row', i, 'ID:', data[i][0], 'vs template ID:', templateData.templateId);
        if (data[i][0].toString() == templateData.templateId.toString()) {
          console.log('Found matching row, updating...');
          templatesSheet.getRange(i + 1, 1, 1, 8).setValues([rowData]);
          found = true;
          break;
        }
      }

      if (found) {
        console.log('Template updated successfully');
        return { success: true, message: 'Template updated successfully' };
      } else {
        console.log('Template not found for update');
        return { success: false, message: 'Template not found for update' };
      }
    } else {
      // Create new template
      console.log('Creating new template...');
      templatesSheet.appendRow(rowData);
      console.log('New template created successfully');
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
    if (data[i][1] == inquiryReason && data[i][2] == topicName && data[i][3] == caseName) {
      return true;
    }
  }

  return false;
}

/**
 * Generates a unique numeric template ID of a specified length.
 * The ID will consist of random digits and will always have the length
 * defined by TEMPLATE_ID_LENGTH.
 *
 * @returns {string} The generated numeric template ID.
 */
function generateTemplateId() {
  if (!TEMPLATE_ID_LENGTH) return { success: false, message: 'TEMPLATE_ID_LENGTH not defined' };
  const length = TEMPLATE_ID_LENGTH;
  // Calculate the minimum value for a number with TEMPLATE_ID_LENGTH digits.
  // For example, if length is 6, min is 100000 (10^(6-1)).
  const min = Math.pow(10, length - 1);

  // Calculate the maximum value for a number with TEMPLATE_ID_LENGTH digits.
  // For example, if length is 6, max is 999999 (10^6 - 1).
  const max = Math.pow(10, length) - 1;

  // Generate a random number between min (inclusive) and max (inclusive).
  // Math.random() generates a number between 0 (inclusive) and 1 (exclusive).
  // We scale it to our desired range and then floor it to get an integer.
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  // Convert the number to a string. This ensures it can be used as an ID
  // and maintains any leading zeros if the generation method were different
  // (though for this method, leading zeros won't occur as it generates
  // numbers within the exact range).
  return randomNumber.toString();
}

/**
 * Delete template by ID
 */
function deleteTemplate(templateId) {
  try {
    console.log('deleteTemplate called with ID:', templateId);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const templatesSheet = ss.getSheetByName('templates');

    if (!templatesSheet) {
      console.log('Templates sheet not found');
      return { success: false, message: 'Templates sheet not found' };
    }

    const data = templatesSheet.getDataRange().getValues();
    console.log('Sheet has', data.length - 1, 'rows of data');

    for (let i = 1; i < data.length; i++) {
      console.log('Checking row', i, 'ID:', data[i][0], 'vs template ID:', templateId);
      if (data[i][0] == templateId) {
        console.log('Found matching template, deleting row', i + 1);
        templatesSheet.deleteRow(i + 1);
        console.log('Template deleted successfully');
        return { success: true, message: 'Template deleted successfully' };
      }
    }

    console.log('Template not found for deletion');
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