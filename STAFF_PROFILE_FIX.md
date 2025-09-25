# Staff Profile Loading Fix

## Issue
The staff.html page and its subpages were not correctly loading user login profile information. This caused the user email, role, and avatar to not display correctly.

## Root Cause
After analyzing the code, we identified several issues:

1. The `getCurrentUserSiteText` function in `staff-common.js` was not properly handling the profile parameter that was passed to it. Instead, it was ignoring it and making a new request to fetch the same information.

2. The `setTopbarSiteForCurrentUser` function was not correctly setting user information in the topbar.

3. Subpages were not consistently loading profile information.

## Fixes Applied

1. Updated `getCurrentUserSiteText` function in `staff-common.js` to properly use the profile parameter passed to it and added better error handling and logging.

2. Updated `setTopbarSiteForCurrentUser` function to properly fetch and set user profile information in the topbar.

3. Created a standalone fix script (`staff-profile-fix.js`) that can be included in all staff subpages to ensure they properly load user profile information.

4. Applied the fix script to all staff subpages using the `apply_staff_fix.sh` script.

5. Fixed a variable redeclaration issue in `staff.html` where the variable `useAvatar` was declared twice.

6. Added test scripts to verify that the fix works properly.

## How to Test
1. Load the staff.html page and verify that the user email, role, and avatar display correctly.
2. Navigate to subpages like staff-training.html, staff-quiz.html, etc. and verify that the user information continues to display correctly.

## Cleanup After Testing
Once you've verified the fix works correctly, you can remove the test scripts from staff.html:
1. Remove the following lines from staff.html:
   ```html
   <!-- Temporary test scripts - remove after verification -->
   <script type="module" src="staff-test-helpers.js"></script>
   <script src="test-staff-profile.js" defer></script>
   <!-- End of temporary test scripts -->
   ```
2. Remove the test files:
   - test-staff-profile.js
   - staff-test-helpers.js

The staff-profile-fix.js file and its inclusion in the HTML files should be kept, as they ensure the user profile information loads correctly on all pages.