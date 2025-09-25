// Shared helpers for Staff pages
// Requires: config.js loaded before this file

const PROFILE_CACHE_KEY_PREFIX = 'staff-profile:';
const PROFILE_CACHE_STALE_AFTER = 60 * 1000; // 1 minute before we refresh in the background
const PROFILE_CACHE_MAX_AGE = 5 * 60 * 1000; // fully re-fetch after 5 minutes
const SITE_CACHE_KEY_PREFIX = 'staff-site:';
const SITE_CACHE_STALE_AFTER = 10 * 60 * 1000;
const SITE_CACHE_MAX_AGE = 60 * 60 * 1000;

const memoryCache = new Map();
const profileRefreshPromises = new Map();
const siteRefreshPromises = new Map();
let supabaseClientPromise = null;

function manualCleanupRedirectHome() {
  try { clearAuthData(true); } catch(_) {}
  try { const s = getSessionStorageSafe(); s && s.clear && s.clear(); } catch(_) {}
  try {
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
  } catch(_) {}
  try { window.location.replace('home.html?_=' + Date.now()); }
  catch(_) { try { window.location.href = 'home.html'; } catch(__) {} }
}

function getSessionStorageSafe() {
  try {
    return window.sessionStorage;
  } catch (_) {
    return null;
  }
}

function readCacheEntry(key) {
  const storage = getSessionStorageSafe();
  if (storage) {
    try {
      const raw = storage.getItem(key);
      if (raw) {
        const entry = JSON.parse(raw);
        if (entry.expiresAt && entry.expiresAt <= Date.now()) {
          storage.removeItem(key);
          memoryCache.delete(key);
          return null;
        }
        memoryCache.set(key, entry);
        return entry;
      }
    } catch (err) {
      console.warn('[cache] Failed to parse entry for key', key, err);
      try { storage.removeItem(key); } catch (_) {}
    }
  }

  const memoEntry = memoryCache.get(key);
  if (memoEntry && memoEntry.expiresAt && memoEntry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return memoEntry || null;
}

function writeCacheEntry(key, value, ttl) {
  const now = Date.now();
  const entry = { value, cachedAt: now, expiresAt: now + ttl };
  memoryCache.set(key, entry);
  const storage = getSessionStorageSafe();
  if (storage) {
    try { storage.setItem(key, JSON.stringify(entry)); } catch (_) {}
  }
  return entry;
}

function removeCacheEntry(key) {
  memoryCache.delete(key);
  const storage = getSessionStorageSafe();
  if (storage) {
    try { storage.removeItem(key); } catch (_) {}
  }
}

function flushSessionCaches() {
  memoryCache.clear();
  profileRefreshPromises.clear();
  siteRefreshPromises.clear();
  try { delete window.__staffProfileCacheMeta; } catch (_) {}
}

function markGlobalProfile(userId, profileRow, source = 'cache', cachedAt = Date.now()) {
  try {
    window.__staffProfileCacheMeta = { userId, profileRow, cachedAt, source };
  } catch (_) {}
}

function dispatchProfileUpdate(userId, profileRow, source) {
  try {
    window.dispatchEvent(new CustomEvent('staffProfileCacheUpdated', {
      detail: { userId, profile: profileRow, source }
    }));
  } catch (_) {}
}

async function fetchProfileAndCache(supabase, userId, reason = 'fetch') {
  let profile = null;
  let fetchError = null;

  try {
    const { data, error } = await supabase
      .from('master_users')
      .select('id, kiosk_user_id, role, access_type, role_detail, full_name, nickname, site_id, onboarding_complete, avatar_url, team_id, team_name')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (error) {
      // Check for RLS recursion error
      if (error.message && error.message.includes('infinite recursion')) {
        console.warn('[fetchProfile] RLS recursion detected, using bypass');
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email?.toLowerCase();

        // Provide bypass data for known admin
        if (email === 'benhowardmagic@hotmail.com') {
          profile = {
            auth_user_id: userId,
            email: email,
            access_type: 'admin',
            role: 'admin',
            role_detail: 'admin',
            full_name: 'Ben Howard',
            nickname: 'Benjiiiiii',
            site_id: 2
          };
          fetchError = null;
        } else {
          fetchError = error;
        }
      } else {
        fetchError = error;
      }
    } else {
      profile = data;
    }

    if (!fetchError && profile) {
      writeCacheEntry(`${PROFILE_CACHE_KEY_PREFIX}${userId}`, profile, PROFILE_CACHE_MAX_AGE);
      markGlobalProfile(userId, profile, reason);
      dispatchProfileUpdate(userId, profile, reason);
    }
  } catch (e) {
    console.error('[fetchProfile] Exception:', e);
    fetchError = e;
  }

  return { data: profile, error: fetchError };
}

function scheduleProfileRefresh(supabase, userId) {
  if (profileRefreshPromises.has(userId)) {
    return profileRefreshPromises.get(userId);
  }
  const promise = fetchProfileAndCache(supabase, userId, 'refresh')
    .catch(err => {
      console.warn('[requireStaffSession] Background profile refresh failed:', err?.message || err);
      return null;
    })
    .finally(() => profileRefreshPromises.delete(userId));
  profileRefreshPromises.set(userId, promise);
  return promise;
}

async function fetchSiteTextAndCache(supabase, siteId, reason = 'fetch') {
  console.log(`[getSiteText] ${reason === 'refresh' ? 'Refreshing' : 'Fetching'} site info for ID:`, siteId);
  const { data: site, error } = await supabase
    .from('sites')
    .select('name, city')
    .eq('id', siteId)
    .maybeSingle();

  if (!error) {
    const siteText = site ? `${site.name}${site.city ? ' • ' + site.city : ''}` : `Site ${siteId}`;
    writeCacheEntry(`${SITE_CACHE_KEY_PREFIX}${siteId}`, siteText, SITE_CACHE_MAX_AGE);
    return { value: siteText, error: null };
  }

  return { value: null, error };
}

function scheduleSiteRefresh(supabase, siteId) {
  if (siteRefreshPromises.has(siteId)) {
    return siteRefreshPromises.get(siteId);
  }
  const promise = fetchSiteTextAndCache(supabase, siteId, 'refresh')
    .catch(err => {
      console.warn('[getSiteText] Background refresh failed:', err?.message || err);
      return null;
    })
    .finally(() => siteRefreshPromises.delete(siteId));
  siteRefreshPromises.set(siteId, promise);
  return promise;
}

export async function initSupabase() {
  if (window.__supabaseClient && typeof window.__supabaseClient.auth?.getSession === 'function') {
    try { window.supabase = window.__supabaseClient; } catch (_) {}
    return window.__supabaseClient;
  }
  if (window.supabase && typeof window.supabase.auth?.getSession === 'function') {
    window.__supabaseClient = window.supabase;
    return window.supabase;
  }
  if (supabaseClientPromise) return supabaseClientPromise;

  supabaseClientPromise = (async () => {
    // Use local Supabase bundle to avoid CSP issues
    if (typeof supabase === 'undefined') {
      throw new Error('Supabase library not loaded. Make sure supabase-js.js is included.');
    }
    const { createClient } = supabase;
    const client = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: `sb-${CONFIG.SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`
      }
    });
    window.__supabaseClient = client;
    try { window.supabase = client; } catch (_) {}
    return client;
  })();

  return supabaseClientPromise;
}

// Clear auth-related localStorage keys but optionally preserve remember-me fields
export function clearAuthData(preserveRememberMe = false) {
  try {
    const preserveKeys = preserveRememberMe ? ['rememberMe', 'rememberedEmail', 'rememberedUsername', 'rememberedPassword'] : [];
    const keys = Object.keys(localStorage || {});
    keys.forEach(k => {
      try {
        if (preserveKeys.includes(k)) return;
        if (!k.startsWith('sb-') && !k.includes('supabase') && !k.startsWith('auth')) return;
        localStorage.removeItem(k);
      } catch(_) {}
    });
  } catch (_) {}

  try {
    const storage = getSessionStorageSafe();
    if (storage) {
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (!key) continue;
        if (key.startsWith(PROFILE_CACHE_KEY_PREFIX) || key.startsWith(SITE_CACHE_KEY_PREFIX)) {
          storage.removeItem(key);
        }
      }
    }
  } catch (_) {}

  flushSessionCaches();
}

export async function requireStaffSession(supabase, options = {}) {
  console.log('[requireStaffSession] Checking session...');
  let { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Grace period: allow session to initialize after a fresh sign-in
  if (!session && !sessionError) {
    const start = Date.now();
    const timeout = 2000; // up to 2s
    while (!session && (Date.now() - start) < timeout) {
      await new Promise(r => setTimeout(r, 150));
      try {
        const res = await supabase.auth.getSession();
        session = res?.data?.session || null;
      } catch (e) {
        break;
      }
    }
  }

  if (sessionError) {
    console.error('[requireStaffSession] Session error:', sessionError);
    throw new Error('NO_SESSION');
  }

  if (!session || !session.user) {
    console.error('[requireStaffSession] No session found');
    throw new Error('NO_SESSION');
  }

  console.log('[requireStaffSession] Session found for:', session.user.email);

  const userId = session.user.id;
  const cacheKey = `${PROFILE_CACHE_KEY_PREFIX}${userId}`;
  const forceRefresh = options?.forceRefresh === true;
  const cacheEntry = forceRefresh ? null : readCacheEntry(cacheKey);
  const now = Date.now();
  const age = cacheEntry ? now - cacheEntry.cachedAt : Number.POSITIVE_INFINITY;
  const expired = age > PROFILE_CACHE_MAX_AGE;
  const stale = age > PROFILE_CACHE_STALE_AFTER;

  let profileRow = cacheEntry?.value ?? null;
  let profileError = null;

  if (!cacheEntry || forceRefresh || expired) {
    const fetchReason = forceRefresh ? 'force-refresh' : cacheEntry ? 'expired-refresh' : 'initial-fetch';
    const { data, error } = await fetchProfileAndCache(supabase, userId, fetchReason);
    profileRow = data;
    profileError = error;

    if (error && cacheEntry) {
      profileRow = cacheEntry.value;
      markGlobalProfile(userId, profileRow, 'cache-fallback', cacheEntry.cachedAt);
      console.warn('[requireStaffSession] Using cached profile due to fetch error.');
    }
  } else {
    markGlobalProfile(userId, profileRow, 'cache', cacheEntry.cachedAt);
    if (stale) {
      scheduleProfileRefresh(supabase, userId);
    }
  }

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }

  const meta = session.user?.user_metadata || session.user?.raw_user_meta_data || {};
  const role = profileRow?.access_type || profileRow?.role || meta?.role || (profileRow?.site_id ? 'staff' : null);

  if (window.trackMasterUserDebug) {
    window.trackMasterUserDebug({
      auth_user_id: session.user.id,
      email: session.user.email,
      access_type: profileRow?.access_type,
      role: profileRow?.role,
      site_id: profileRow?.site_id,
      full_name: profileRow?.full_name
    });
  }

  const allowed = ['staff', 'admin', 'owner', 'manager', 'member', 'user'];

  console.log('[requireStaffSession] Debug info:', {
    userId: session.user.id,
    email: session.user.email,
    profileRow,
    profileRole: profileRow?.role,
    userMetadata: meta,
    metaRole: meta?.role,
    finalRole: role,
    onboarding_complete: profileRow?.onboarding_complete,
    onboarding_required: meta?.onboarding_required,
    welcome_completed_at: meta?.welcome_completed_at,
    cacheSource: cacheEntry ? (stale ? 'cache-stale' : 'cache-fresh') : 'fresh'
  });

  try { sessionStorage.removeItem('forceOnboarding'); } catch (_) {}

  const isWelcomePage = /staff-welcome\.html$/i.test(window.location.pathname);

  if (!isWelcomePage && role && !allowed.includes(String(role).toLowerCase())) {
    throw new Error('NOT_STAFF');
  }

  if (!isWelcomePage && !role) {
    const hasProfile = profileRow && profileRow.site_id;
    const email = session.user?.email?.toLowerCase() || '';
    const hasStaffEmail = email.includes('@') &&
      (email.includes('.nhs.uk') ||
       email === 'benhowardmagic@hotmail.com' ||
       email === 'ben.howard@stoke.nhs.uk' ||
       session.user.raw_user_meta_data?.role);

    console.log('[requireStaffSession] No role check:', {
      email,
      hasProfile,
      site_id: profileRow?.site_id,
      hasStaffEmail,
      isAllowed: hasProfile || hasStaffEmail
    });

    if (!hasProfile && !hasStaffEmail) {
      throw new Error('NOT_STAFF');
    }
  }

  return { session, profileRow };
}

export async function getSiteText(supabase, siteId, options = {}){
  if (!siteId) return null;

  const forceRefresh = options?.forceRefresh === true;
  const cacheKey = `${SITE_CACHE_KEY_PREFIX}${siteId}`;
  const cacheEntry = forceRefresh ? null : readCacheEntry(cacheKey);
  const now = Date.now();
  const age = cacheEntry ? now - cacheEntry.cachedAt : Number.POSITIVE_INFINITY;
  const expired = age > SITE_CACHE_MAX_AGE;
  const stale = age > SITE_CACHE_STALE_AFTER;

  if (cacheEntry && !forceRefresh && !expired) {
    if (stale) {
      scheduleSiteRefresh(supabase, siteId);
    }
    return cacheEntry.value;
  }

  const { value, error } = await fetchSiteTextAndCache(supabase, siteId, forceRefresh ? 'force-refresh' : cacheEntry ? 'expired-refresh' : 'fetch');
  if (error) {
    console.error('[getSiteText] Error fetching site:', error);
    if (cacheEntry) return cacheEntry.value;
    return `Site ${siteId}`;
  }
  return value;
}

export function invalidateProfileCache(userId) {
  const id = userId || window.__staffProfileCacheMeta?.userId;
  if (!id) return;
  removeCacheEntry(`${PROFILE_CACHE_KEY_PREFIX}${id}`);
}

export function updateProfileCache(userId, profileRow) {
  if (!userId) return;
  writeCacheEntry(`${PROFILE_CACHE_KEY_PREFIX}${userId}`, profileRow ?? null, PROFILE_CACHE_MAX_AGE);
  markGlobalProfile(userId, profileRow ?? null, 'manual-set');
  dispatchProfileUpdate(userId, profileRow ?? null, 'manual-set');
}

export function invalidateSiteCache(siteId) {
  if (!siteId) return;
  removeCacheEntry(`${SITE_CACHE_KEY_PREFIX}${siteId}`);
}

// Simple, explicit: session -> master_users.site_id -> sites.name
export async function getCurrentUserSiteText(supabase) {
  const { data: { session }, error: sessErr } = await supabase.auth.getSession();
  if (sessErr) throw sessErr;
  const userId = session?.user?.id;
  if (!userId) throw new Error('NO_SESSION');

  const { data: profile, error: profErr } = await supabase
    .from('master_users')
    .select('site_id')
    .eq('auth_user_id', userId)
    .maybeSingle();
  if (profErr) throw profErr;
  const siteId = profile?.site_id;
  if (!siteId) return null;
  
  // Try a direct SQL query to bypass any dependencies on other tables
  try {
    // This uses the REST API to make a direct request to sites table
    // without going through any other tables
    const { data, error } = await supabase
      .from('sites')
      .select('name, city')
      .eq('id', siteId)
      .maybeSingle();
    
    console.log('[getCurrentUserSiteText] Direct sites query result:', { data, error });
    
    if (!error && data && data.name) {
      return `${data.name}${data.city ? ' • ' + data.city : ''}`;
    }
  } catch (e) {
    console.warn('[getCurrentUserSiteText] Direct sites query failed:', e);
  }
  
  // Add debugging message to see what's happening at runtime
  console.log('[getCurrentUserSiteText] All site resolution methods failed for siteId:', siteId);
  
  // Return a debug message that makes it clear this is a fallback
  return `Site ${siteId} (DB Query Failed)`;
}

// Convenience: handles setting up the topbar elements in one call
// Site pill has been removed per request
export async function setTopbarSiteForCurrentUser(supabase){
  try {
    // Skip site text resolution since we no longer display it
    setTopbar({ siteText: null }); 
    return null;
  } catch (e) {
    console.warn('[setTopbarSiteForCurrentUser] Failed to set up topbar:', e?.message || e);
    return null;
  }
}

export function setTopbar({siteText, email, role, access_type}){
  // Site pill removed per request
  const emailPill = document.getElementById('email-pill');
  if (emailPill && email) emailPill.textContent = email;
  const rolePill = document.getElementById('role-pill');
  // Always prefer access_type from master_users for display
  const rawEffective = (access_type || role || '').toString();
  const displayRole = rawEffective
    ? rawEffective.charAt(0).toUpperCase() + rawEffective.slice(1).toLowerCase()
    : 'Staff';
  if (rolePill) rolePill.textContent = displayRole;

  // Update navigation to include Admin Portal for admin users
  const navContainer = document.querySelector('.nav.seg-nav');
  if (navContainer) {
    // Check both role and access_type for admin privileges
    const effectiveRole = access_type || role || '';
    const isAdmin = effectiveRole && ['admin', 'owner'].includes(effectiveRole.toLowerCase());

    // Check if Admin Portal button already exists in navigation
    const existingAdminBtn = navContainer.querySelector('button[data-section="admin-portal"]');

    if (isAdmin && !existingAdminBtn) {
      // Add Admin Portal button to navigation
      const adminButton = document.createElement('button');
      adminButton.type = 'button';
      adminButton.dataset.section = 'admin-portal';
  adminButton.dataset.href = 'admin-dashboard.html';
  adminButton.textContent = 'Admin Portal';
      navContainer.appendChild(adminButton);
    } else if (!isAdmin && existingAdminBtn) {
      // Remove Admin Portal button from navigation
      existingAdminBtn.remove();
    }
  }
  
  // Remove the standalone admin portal button logic since it's now in the navigation
}

export function handleAuthState(supabase){
  supabase.auth.onAuthStateChange((event, session) => {
    // Only act on explicit sign-out events to avoid race conditions
    if (event === 'SIGNED_OUT') {
      manualCleanupRedirectHome();
      return;
    }
    // Ignore INITIAL_SESSION or transient null sessions — requireStaffSession handles gating
  });
}

// Attach a click handler to a #logout-btn that signs the user out
export function attachLogout(supabase){
  // Helper to wire up a given button once
  const wireButton = (button) => {
    if (!button || button.dataset.wired === 'true') return button;
    button.dataset.wired = 'true';
    let loggingOut = false;
    button.addEventListener('click', async (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if (loggingOut) return;
      loggingOut = true;
      try {
        if (supabase?.auth?.signOut) {
          await supabase.auth.signOut();
        } else if (typeof window.signOut === 'function') {
          return window.signOut();
        }
      } catch(err){
        console.error('Sign out failed:', err);
      } finally {
        setTimeout(manualCleanupRedirectHome, 300);
      }
    });
    return button;
  };

  // If a logout button already exists (e.g., in the navbar), wire it and return
  let existing = document.getElementById('logout-btn');
  if (existing) { wireButton(existing); return; }

  // Try to place the button in known top areas only (never bottom-right)
  const navbarUser = document.querySelector('.navbar .navbar-user') || document.querySelector('.navbar-user');
  const topbar = document.querySelector('.topbar') || document.querySelector('header.topbar') || document.querySelector('.topbar.panel');

  if (navbarUser || topbar) {
    const host = navbarUser || topbar;
    const btn = document.createElement('button');
    btn.id = 'logout-btn';
    btn.textContent = 'Sign Out';
    btn.className = 'btn-signout';
    try { host.appendChild(btn); } catch(_) { try { document.body.appendChild(btn); } catch(__) {} }
    wireButton(btn);
    return;
  }

  // Otherwise, wait briefly for the navbar to render, then create a small top-right fallback only if still missing
  const observer = new MutationObserver(() => {
    const btnNow = document.getElementById('logout-btn');
    const hostNow = document.querySelector('.navbar .navbar-user') || document.querySelector('.navbar-user') || document.querySelector('.topbar') || document.querySelector('header.topbar') || document.querySelector('.topbar.panel');
    if (btnNow) {
      wireButton(btnNow);
      observer.disconnect();
    } else if (hostNow) {
      const b = document.createElement('button');
      b.id = 'logout-btn';
      b.textContent = 'Sign Out';
      b.className = 'btn-signout';
      try { hostNow.appendChild(b); } catch(_) { try { document.body.appendChild(b); } catch(__) {} }
      wireButton(b);
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

  // Safety timeout: if nothing appears, create a minimal top-right button (not bottom-right)
  setTimeout(() => {
    if (document.getElementById('logout-btn')) return;
    const fallback = document.createElement('button');
    fallback.id = 'logout-btn';
    fallback.textContent = 'Sign Out';
    fallback.className = 'btn btn-signout';
    Object.assign(fallback.style, { position: 'fixed', top: '8px', right: '12px', zIndex: '2147483647' });
    try { document.body.appendChild(fallback); } catch(_) {}
    wireButton(fallback);
  }, 1200);
}

// Auto-wire logout button on pages that import this module
try {
  if (typeof window !== 'undefined' && !window.__autoLogoutWired) {
    window.__autoLogoutWired = true;
    const run = async () => {
      try {
        const sb = (window.__supabaseClient || window.supabase) || await initSupabase();
        attachLogout(sb);
      } catch (e) {
        // As a last resort, add a small top-right sign out button (avoid bottom-right duplicates)
        let btn = document.getElementById('logout-btn');
        if (!btn) {
          btn = document.createElement('button');
          btn.id = 'logout-btn';
          btn.textContent = 'Sign Out';
          btn.className = 'btn btn-signout';
          Object.assign(btn.style, { position: 'fixed', top: '8px', right: '12px', zIndex: '2147483647' });
          try { document.body.appendChild(btn); } catch(_) {}
        }
        if (!btn.dataset.wired) {
          btn.dataset.wired = 'true';
          btn.addEventListener('click', (ev) => { ev?.preventDefault?.(); ev?.stopPropagation?.(); if (window.signOut) window.signOut(); else manualCleanupRedirectHome(); });
        }
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }
} catch(_) {}

// Global sign out for any page (used by staff-nav and others)
if (typeof window !== 'undefined') {
  try {
    window.signOut = async function() {
      try {
        const sb = window.__supabaseClient || window.supabase;
        if (sb && sb.auth && typeof sb.auth.signOut === 'function') {
          try { await sb.auth.signOut(); } catch (e) { console.error('Sign out failed:', e); }
        }
      } finally {
        manualCleanupRedirectHome();
      }
    };
  } catch(_) {}
}

// Create and render consistent staff navigation using the working pattern
export function renderStaffNavigation(activePage = 'home') {
  const navContainer = document.querySelector('.nav.seg-nav');
  if (!navContainer) return;

  // Prevent multiple simultaneous renders
  if (navContainer.dataset.rendering === 'true') return;
  navContainer.dataset.rendering = 'true';

  // Get site settings from localStorage or use defaults
  let siteSettings = { enable_achievements: true, enable_avatars: true };
  try {
    // Get site_id from the current profile
    const profileData = JSON.parse(sessionStorage.getItem('__staffProfile') || '{}');
    const siteId = profileData?.site_id;
    if (siteId) {
      const storedSettings = localStorage.getItem(`site_${siteId}_settings`);
      if (storedSettings) {
        siteSettings = JSON.parse(storedSettings);
      }
    }
  } catch (e) {
    console.warn('Could not load site settings:', e);
  }

  // Standardized navigation items across all pages
  const navItems = [
    { page: 'home', href: 'staff.html', label: 'Home' },
    { page: 'welcome', href: 'staff-welcome.html', label: 'Welcome' },
    { page: 'holidays', href: 'my-holidays.html', label: 'My Holidays' },
    { page: 'meetings', href: 'staff-meetings.html', label: 'Meetings', disabled: true, tooltip: 'Coming Soon!' },
    { page: 'training', href: 'staff-training.html', label: 'My Training' },
    { page: 'quiz', href: 'staff-quiz.html', label: 'Quiz' },
    // Admin Site entry is appended dynamically below for admins
  ];

  // Conditionally add Achievements based on site settings
  if (siteSettings.enable_achievements !== false) {
    navItems.push({ page: 'achievements', href: 'achievements.html', label: 'Achievements' });
  }

  // Clear existing content and event listeners to avoid duplication
  navContainer.innerHTML = '';

  // Create navigation elements using working pattern (buttons with data-section)
  navItems.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.section = item.page; 
    button.dataset.href = item.href;
    button.textContent = item.label;
    
    // Add tooltip if specified
    if (item.tooltip) {
      button.title = item.tooltip;
      button.setAttribute('data-tooltip', item.tooltip);
    }
    
    // Set classes and visibility - simplified class assignment
    let className = '';
    
    if (item.page === activePage) {
      className += ' active';
    }
    
    if (item.disabled) {
      className += ' disabled-nav-item';
    }
    
    if (item.adminOnly) {
      className += ' admin-only';
    }
    
    button.className = className.trim();
    
    navContainer.appendChild(button);
  });
  
  // Conditionally append Admin Site for admins
  try {
    const roleText = document.getElementById('role-pill')?.textContent?.toLowerCase() || '';
    const isAdminUser = /^(admin|owner)$/.test(roleText);
    if (isAdminUser) {
      const adminBtn = document.createElement('button');
      adminBtn.type = 'button';
      adminBtn.dataset.section = 'admin-portal';
      adminBtn.dataset.href = 'index.html';
      adminBtn.textContent = 'Admin Site';
      navContainer.appendChild(adminBtn);
    }
  } catch(_) {}

  // Add single click handler using event delegation
  if (!navContainer.dataset.hasClickHandler) {
    navContainer.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-section]');
      if (!btn) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Handle disabled items - show PIN prompt for meetings
      if (btn.classList.contains('disabled-nav-item')) {
        const section = btn.getAttribute('data-section');
        if (section === 'meetings') {
          const pin = prompt('This feature is coming soon! Enter PIN to access:');
          if (pin === '9021') {
            const href = btn.getAttribute('data-href');
            if (href) {
              window.location.href = href;
            }
          } else if (pin !== null) {
            alert('Incorrect PIN');
          }
        }
        return;
      }
      
      // Prevent double clicks
      if (btn.dataset.clicking === 'true') return;
      btn.dataset.clicking = 'true';
      
      const section = btn.getAttribute('data-section');
      const href = btn.getAttribute('data-href');
      
      // Update active states
      navContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Handle Admin Portal navigation with special logic
      if (section === 'admin-portal') {
        try {
          // Check if we have an active Supabase session
          if (window.supabase && typeof window.supabase.auth.getSession === 'function') {
            const { data: { session }, error } = await window.supabase.auth.getSession();
            
            if (session && session.user) {
              // Session is active, navigate directly to admin-dashboard.html
              window.location.href = href;
              return;
            }
          }
          
          // If no session, still navigate but let admin-dashboard handle authentication
          window.location.href = href;
          
        } catch (error) {
          console.error('Error checking session before admin navigation:', error);
          // Fallback: navigate anyway
          window.location.href = href;
        }
      } else {
        // Regular navigation for non-admin portal items
        if (href) {
          window.location.href = href;
        }
      }
      
      // Reset click flag
      setTimeout(() => {
        btn.dataset.clicking = 'false';
      }, 1000);
    });
    
    navContainer.dataset.hasClickHandler = 'true';
  }
  
  navContainer.dataset.rendering = 'false';
  
  // Trigger navigation styling
  if (typeof window.fixNavigationStyling === 'function') {
    setTimeout(window.fixNavigationStyling, 0);
  }
}

export function navActivate(page){
  renderStaffNavigation(page);
}

// Removed revealAdminNav - staff portal no longer shows admin links

// ---------- UI helpers for redesigned pages ----------
export function animateNumber(el, to, { duration = 800, prefix = '', suffix = '' } = {}){
  if (!el) return;
  const from = Number(String(el.textContent).replace(/[^0-9.-]/g, '')) || 0;
  const start = performance.now();
  function step(now){
    const t = Math.min(1, (now - start) / duration);
    const v = Math.round(from + (to - from) * (1 - Math.cos(t * Math.PI)) / 2); // ease-in-out
    el.textContent = `${prefix}${v}${suffix}`;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function setRing(el, percent){
  if (!el) return;
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const ring = el.querySelector('.ring-progress');
  const label = el.querySelector('.ring-label');
  if (ring) ring.style.background = `conic-gradient(var(--accent) ${p * 3.6}deg, #ffffff24 ${p * 3.6}deg)`;
  if (label) label.textContent = `${Math.round(p)}%`;
}

export function fmtDate(d){
  try { return new Date(d).toLocaleString(undefined, { year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' }); }
  catch(_) { return String(d); }
}

export function daysBetween(a, b){
  try { return Math.ceil((new Date(a).setHours(0,0,0,0) - new Date(b).setHours(0,0,0,0)) / 86400000); }
  catch(_) { return 0; }
}

export function computeCompliance(requiredTypes = [], records = [], now = new Date()){
  let ok = 0; let due = 0; const total = requiredTypes.length;
  requiredTypes.forEach(t => {
    const recs = records.filter(r => r.training_type_id === t.id);
    const latest = recs.sort((a,b)=> new Date(b.expiry_date||b.completion_date||0) - new Date(a.expiry_date||a.completion_date||0))[0];
    if (!latest) { due++; return; }
    const completion = latest.completion_date ? new Date(latest.completion_date) : null;
    const expiry = latest.expiry_date ? new Date(latest.expiry_date) : (t.validity_months && completion ? new Date(new Date(completion).setMonth(completion.getMonth()+Number(t.validity_months))) : null);
    if (!expiry) { ok++; return; }
    const days = daysBetween(expiry, now);
    if (days < 0) due++; else ok++;
  });
  const percent = total ? Math.round((ok / total) * 100) : 0;
  return { ok, due, total, percent };
}

export async function getUserAchievements(supabase, identifiers) {
  if (!supabase) return [];

  const kioskUserId = typeof identifiers === 'object'
    ? identifiers?.kioskUserId ?? identifiers?.kiosk_user_id ?? null
    : identifiers;
  const userId = typeof identifiers === 'object'
    ? identifiers?.userId ?? identifiers?.user_id ?? null
    : null;

  if (kioskUserId == null && !userId) return [];

  try {
    let query = supabase
      .from('user_achievements')
      .select('achievement_key, status, progress_percent, unlocked_at, metadata, kiosk_user_id, user_id')
      .order('unlocked_at', { ascending: true, nullsFirst: true });

    if (kioskUserId != null && userId) {
      query = query.or(`user_id.eq.${userId},kiosk_user_id.eq.${kioskUserId}`);
    } else if (kioskUserId != null) {
      query = query.eq('kiosk_user_id', kioskUserId);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading achievements:', error);
    return [];
  }
}

export async function upsertAchievement(supabase, kioskUserId, key, status, progress = 100) {
  // Direct upsert to user_achievements table
  const { error } = await supabase
    .from('user_achievements')
    .upsert({
      kiosk_user_id: kioskUserId,
      achievement_key: key,
      status: status,
      progress_percent: progress,
      unlocked_at: status === 'unlocked' ? new Date().toISOString() : null
    }, {
      onConflict: 'kiosk_user_id,achievement_key'
    });

  if (error) {
    console.error('Error upserting achievement:', error);
    throw error;
  }
}

export { createAchievementClient } from './achievement-system.js';

// Site Settings Functions
export async function getSiteSettings(supabase, siteId) {
  try {
    // First check localStorage for cached settings
    const cacheKey = `site_${siteId}_settings`;
    const cachedSettings = localStorage.getItem(cacheKey);
    if (cachedSettings) {
      try {
        return JSON.parse(cachedSettings);
      } catch (e) {
        console.warn('Invalid cached settings:', e);
      }
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('site_settings')
      .select('enable_achievements, enable_avatars')
      .eq('site_id', siteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        return {
          enable_achievements: true,
          enable_avatars: true
        };
      }
      console.error('Error fetching site settings:', error);
      return {
        enable_achievements: true,
        enable_avatars: true
      };
    }

    // Process the settings with defaults for missing fields
    const processedSettings = {
      enable_achievements: data?.enable_achievements !== false,
      enable_avatars: data?.enable_avatars !== false
    };

    // Cache the processed settings
    localStorage.setItem(cacheKey, JSON.stringify(processedSettings));

    return processedSettings;
  } catch (error) {
    console.error('Failed to get site settings:', error);
    return {
      enable_achievements: true,
      enable_avatars: true
    };
  }
}

// Avatar Helper Functions
export function getUserInitials(fullName) {
  if (!fullName) return '?';

  const names = fullName.trim().split(/\s+/);
  if (names.length >= 2) {
    // First letter of first name and last name
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  } else if (names.length === 1) {
    // First two letters of single name
    return names[0].substring(0, 2).toUpperCase();
  }
  return '?';
}

export async function renderUserAvatar(element, profile, siteSettings = null) {
  if (!element) return;

  // If siteSettings not provided, try to get from localStorage
  if (!siteSettings) {
    try {
      const siteId = profile?.site_id;
      if (siteId) {
        const cachedSettings = localStorage.getItem(`site_${siteId}_settings`);
        if (cachedSettings) {
          siteSettings = JSON.parse(cachedSettings);
        }
      }
    } catch (e) {
      console.warn('Could not load site settings for avatar:', e);
    }
  }

  // Default to showing avatars if settings not available
  const showAvatars = siteSettings?.enable_avatars !== false;

  // Clear existing content
  element.innerHTML = '';

  if (showAvatars && profile?.avatar_url) {
    // Show avatar image
    const img = document.createElement('img');
    img.src = profile.avatar_url;
    img.alt = profile.full_name || 'User avatar';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    element.appendChild(img);
  } else {
    // Show initials
    const initials = getUserInitials(profile?.full_name || profile?.nickname || '');
    const initialsSpan = document.createElement('span');
    initialsSpan.textContent = initials;
    initialsSpan.style.fontSize = '16px';
    initialsSpan.style.fontWeight = '600';
    initialsSpan.style.color = 'var(--white, #fff)';
    element.appendChild(initialsSpan);

    // Add background if not already styled
    if (!element.style.background) {
      element.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.borderRadius = '50%';
  }
}

// Check if achievements are enabled for the site
export async function areAchievementsEnabled(supabase, siteId) {
  const settings = await getSiteSettings(supabase, siteId);
  return settings.enable_achievements !== false;
}

// Check if avatars are enabled for the site
export async function areAvatarsEnabled(supabase, siteId) {
  const settings = await getSiteSettings(supabase, siteId);
  return settings.enable_avatars !== false;
}
