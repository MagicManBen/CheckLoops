// Expose staff-common.js functions for testing
// This file should be included in the page during testing and removed afterward

import { getCurrentUserSiteText, getSiteText, requireStaffSession } from './staff-common.js';

// Expose functions to window for testing
window.getCurrentUserSiteText = getCurrentUserSiteText;
window.getSiteText = getSiteText;
window.requireStaffSession = requireStaffSession;

console.log('Staff common functions exposed for testing');