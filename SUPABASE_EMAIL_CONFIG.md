# Supabase Email Template Configuration

## Required Changes in Supabase Dashboard

To fix the email invitation templates that currently show GitHub URLs and local addresses, you need to update the email templates in your Supabase project dashboard.

### Steps to Fix:

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project (unveoqnlqnobufhublyw)

2. **Navigate to Email Templates**
   - Go to Authentication → Email Templates
   - You'll need to update the "Invite User" template

3. **Update the Invite User Template**

   Replace any instances of:
   - `https://magicmanben.github.io/CheckLoops/` → `https://checkloops.co.uk`
   - `http://127.0.0.1:XXXXX/` → `https://checkloops.co.uk/`
   - Remove all GitHub references

4. **Suggested Email Template Content**

   ```html
   <h2>Welcome to CheckLoop</h2>
   <p>You've been invited to join CheckLoop - the compliance, training & checks platform for GP practices.</p>

   <p>Please click the link below to set your password and complete your account setup:</p>

   <a href="{{ .ConfirmationURL }}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
     Accept Invitation
   </a>

   <p>Or copy this link: {{ .ConfirmationURL }}</p>

   <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
     <p style="color: #666;">
       This invitation was sent by CheckLoop. If you didn't expect this invitation, you can safely ignore this email.
     </p>
     <p style="color: #999; font-size: 12px;">
       © 2025 CheckLoop • Built for GP surgeries<br>
       <a href="https://checkloops.co.uk">checkloops.co.uk</a>
     </p>
   </div>
   ```

5. **Update Site URL**
   - In Supabase Dashboard → Settings → API
   - Ensure the Site URL is set to: `https://checkloops.co.uk`
   - This will ensure all redirect URLs use the correct domain

6. **Update Redirect URLs**
   - In Authentication → URL Configuration
   - Add `https://checkloops.co.uk/*` to allowed redirect URLs
   - Remove any localhost or GitHub URLs

## Code Changes Already Applied

The following fixes have been implemented in the code:

1. ✅ Fixed `supabase.createClient` error → changed to `window.supabaseCreateClient`
2. ✅ Fixed database column errors when checking for existing users
3. ✅ Changed redirect URL from `window.location.origin` to `https://checkloops.co.uk`
4. ✅ Fixed working hours data type (decimal to integer conversion)
5. ✅ Removed non-existent columns from profile updates
6. ✅ Fixed duplicate constraint on holiday profiles

## Remaining Database Issues to Check

Some tables may need schema adjustments:
- `profiles` table doesn't have individual working hours columns (this is correct - they're stored in `3_staff_working_patterns`)
- `staff_app_welcome` doesn't have a `working_hours` column (removed from code)
- Working pattern hours should be integers, not decimals

## Testing

After updating the email templates in Supabase:
1. Test inviting a new user
2. Verify the email uses checkloops.co.uk URLs
3. Confirm the password reset link works correctly
4. Check that no GitHub references appear in the email