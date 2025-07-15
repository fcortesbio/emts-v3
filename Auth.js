/**
 * Validate EID and return user data if found
 */
function validateEID(eid) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName('users');

    if (!usersSheet) {
      initializeSpreadsheet();
      return { success: false, message: 'User database not found' };
    }

    const data = usersSheet.getDataRange().getValues();

    // Skip header row and search for EID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == eid) {
        const fullName = data[i][1];
        const firstName = extractFirstName(fullName);

        return {
          success: true,
          user: {
            eid: data[i][0],
            name: firstName,
            fullName: fullName,
            division: data[i][2],
            role: data[i][3],
            email: data[i][4]
          }
        };
      }
    }

    return { success: false, message: 'EID not found' };
  } catch (error) {
    console.error('Error validating EID:', error);
    return { success: false, message: 'Error validating EID' };
  }
}

/**
 * Extract first name from "Last, First" format
 */
function extractFirstName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';

  const parts = fullName.split(',');
  if (parts.length >= 2) {
    return parts[1].trim();
  }

  // Fallback: return the full name if format is unexpected
  return fullName.trim();
}

/**
 * Check if EID format is valid
 */
function isValidEID(eid) {
  if (!eid) return false;

  const eidStr = eid.toString();
  return eidStr.length === EID_LENGTH && /^\d+$/.test(eidStr);
}