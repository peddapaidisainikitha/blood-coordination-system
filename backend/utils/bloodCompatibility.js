/**
 * Blood Group Compatibility Chart
 * Based on standard ABO/Rh compatibility for whole blood transfusion.
 * NOTE: Actual clinical compatibility requires full cross-matching by medical professionals.
 */

const COMPATIBILITY = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor (whole blood)
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']  // Can only donate to AB+
};

// Who can donate TO a given blood group
const CAN_DONATE_TO = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-']
};

/**
 * Get compatible donor blood groups for a given recipient blood group
 * @param {string} recipientGroup - The blood group that needs blood
 * @returns {string[]} - Array of compatible donor blood groups
 */
const getCompatibleDonors = (recipientGroup) => {
  return CAN_DONATE_TO[recipientGroup] || [recipientGroup];
};

/**
 * Check if a donor's blood group is compatible with recipient
 */
const isCompatible = (donorGroup, recipientGroup) => {
  const donors = CAN_DONATE_TO[recipientGroup] || [];
  return donors.includes(donorGroup);
};

module.exports = { getCompatibleDonors, isCompatible, COMPATIBILITY, CAN_DONATE_TO };
