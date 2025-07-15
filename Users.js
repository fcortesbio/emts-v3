/**
 * Submit signup request
 */
function submitSignup(signupData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let signupSheet = ss.getSheetByName('signup');

    if (!signupSheet) {
      initializeSpreadsheet();
      signupSheet = ss.getSheetByName('signup');
    }

    // Validate EID format
    if (!isValidEID(signupData.eid)) {
      return { success: false, message: `EID must be exactly ${EID_LENGTH} digits` };
    }

    // Check if EID already exists in users or signup
    if (checkEIDExists(signupData.eid)) {
      return { success: false, message: 'EID already exists in the system' };
    }

    // Add to signup sheet
    signupSheet.appendRow([
      signupData.eid,
      signupData.name,
      signupData.email,
      signupData.division || DEFAULT_AGENT_DIVISION,
      DEFAULT_AGENT_ROLE,
      'pending'
    ]);

    return { success: true, message: 'Signup request submitted successfully' };
  } catch (error) {
    console.error('Error submitting signup:', error);
    return { success: false, message: 'Error submitting signup request' };
  }
}

/**
 * Check if EID exists in users or signup sheets
 */
function checkEIDExists(eid) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check users sheet
  const usersSheet = ss.getSheetByName('users');
  if (usersSheet) {
    const usersData = usersSheet.getDataRange().getValues();
    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][0] == eid) return true;
    }
  }

  // Check signup sheet
  const signupSheet = ss.getSheetByName('signup');
  if (signupSheet) {
    const signupData = signupSheet.getDataRange().getValues();
    for (let i = 1; i < signupData.length; i++) {
      if (signupData[i][0] == eid) return true;
    }
  }

  return false;
}

/**
 * Get pending signups for admin review
 */
function getPendingSignups() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const signupSheet = ss.getSheetByName('signup');

    if (!signupSheet) return [];

    const data = signupSheet.getDataRange().getValues();
    const pendingSignups = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][5] === 'pending') {
        pendingSignups.push({
          rowIndex: i + 1,
          eid: data[i][0],
          name: data[i][1],
          email: data[i][2],
          division: data[i][3],
          role: data[i][4]
        });
      }
    }

    return pendingSignups;
  } catch (error) {
    console.error('Error getting pending signups:', error);
    return [];
  }
}

/**
 * Approve or deny signup request
 */
function processSignup(eid, action) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const signupSheet = ss.getSheetByName('signup');
    const usersSheet = ss.getSheetByName('users');

    if (!signupSheet || !usersSheet) {
      return { success: false, message: 'Required sheets not found' };
    }

    const data = signupSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == eid && data[i][5] === 'pending') {
        if (action === 'approve') {
          // Add to users sheet
          usersSheet.appendRow([
            data[i][0], // eid
            data[i][1], // name
            data[i][3], // division
            data[i][4], // role
            data[i][2]  // email
          ]);

          // Update status in signup sheet
          signupSheet.getRange(i + 1, 6).setValue('approved');

          // Send approval email
          sendApprovalEmail(data[i][2], data[i][1]);

          return { success: true, message: 'User approved and added to system' };
        } else if (action === 'deny') {
          // Update status in signup sheet
          signupSheet.getRange(i + 1, 6).setValue('denied');
          return { success: true, message: 'Signup request denied' };
        }
      }
    }

    return { success: false, message: 'Signup request not found' };
  } catch (error) {
    console.error('Error processing signup:', error);
    return { success: false, message: 'Error processing signup request' };
  }
}

/**
 * Send approval email to new user
 */
function sendApprovalEmail(email, name) {
  try {
    const subject = `Welcome to ${COMPANY_NAME} Email Templates System`;
    const body = `
Dear ${name},

Your access to the ${COMPANY_NAME} Email Templates system has been approved!

You can now log in using your Employee ID at: ${ScriptApp.getService().getUrl()}

Best regards,
${COMPANY_NAME} Admin Team
    `;

    GmailApp.sendEmail(email, subject, body);
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
}