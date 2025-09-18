// Shared helpers for Staff pages
// Requires: config.js loaded before this file

export async function initSupabase() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { 
      persistSession: true, 
      autoRefreshToken: true, 
      detectSessionInUrl: true, 
      flowType: 'pkce',
      storage: window.localStorage,
      storageKey: `sb-${CONFIG.SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`
    }
  });
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
}

export async function requireStaffSession(supabase) {
  console.log('[requireStaffSession] Checking session...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('[requireStaffSession] Session error:', sessionError);
    throw new Error('NO_SESSION');
  }

  if (!session || !session.user) {
    console.error('[requireStaffSession] No session found');
    throw new Error('NO_SESSION');
  }

  console.log('[requireStaffSession] Session found for:', session.user.email);

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, site_id, onboarding_complete')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }

  // Try to get role from profile first, then from user metadata
  const meta = session.user?.user_metadata || session.user?.raw_user_meta_data || {};
  // If user has a profile with site_id but no role, default to 'staff'
  const role = profileRow?.role || meta?.role || (profileRow?.site_id ? 'staff' : null);
  // Include 'member' and any role by default for staff-welcome page
  const allowed = ['staff', 'admin', 'owner', 'manager', 'member', 'user'];

  console.log('[requireStaffSession] Debug info:', {
    userId: session.user.id,
    email: session.user.email,
    profileRow: profileRow,
    profileRole: profileRow?.role,
    userMetadata: meta,
    metaRole: meta?.role,
    finalRole: role,
    onboarding_complete: profileRow?.onboarding_complete,
    onboarding_required: meta?.onboarding_required,
    welcome_completed_at: meta?.welcome_completed_at
  });

  // Removed forced onboarding redirect logic per updated navigation requirements
  try { sessionStorage.removeItem('forceOnboarding'); } catch(_) {}

  // For staff-welcome page, allow users without roles to complete setup
  const isWelcomePage = /staff-welcome\.html$/i.test(window.location.pathname);

  // Allow staff-welcome page access for users with any role or no role (for onboarding)
  if (!isWelcomePage && role && !allowed.includes(String(role).toLowerCase())) {
    throw new Error('NOT_STAFF');
  }

  // If no role is set but user has a valid session, allow access (they may need to complete onboarding)
  if (!isWelcomePage && !role) {
    // If they have a profile with a site_id, they're likely staff
    const hasProfile = profileRow && profileRow.site_id;

    // Check if user has onboarding data indicating they are a staff member
    const email = session.user?.email?.toLowerCase() || '';
    const hasStaffEmail = email.includes('@') &&
      (email.includes('.nhs.uk') ||
       email === 'benhowardmagic@hotmail.com' ||
       email === 'ben.howard@stoke.nhs.uk' ||
       session.user.raw_user_meta_data?.role);

    console.log('[requireStaffSession] No role check:', {
      email: email,
      hasProfile: hasProfile,
      site_id: profileRow?.site_id,
      hasStaffEmail: hasStaffEmail,
      isAllowed: hasProfile || hasStaffEmail
    });

    // Allow if they have a profile with site_id OR have a staff email
    if (!hasProfile && !hasStaffEmail) {
      throw new Error('NOT_STAFF');
    }
  }
  return { session, profileRow };
}

export async function getSiteText(supabase, siteId){
  if (!siteId) return null;
  const { data: site } = await supabase.from('sites').select('name, city').eq('id', siteId).maybeSingle();
  return site ? `${site.name}${site.city ? ' • ' + site.city : ''}` : `Site ${siteId}`;
}

export function setTopbar({siteText, email, role}){
  const sitePill = document.getElementById('site-pill');
  if (sitePill && siteText) sitePill.textContent = `Site: ${siteText}`;
  const emailPill = document.getElementById('email-pill');
  if (emailPill && email) emailPill.textContent = email;
  const rolePill = document.getElementById('role-pill');
  if (rolePill && role) rolePill.textContent = role;
  
  // Update navigation to include Admin Portal for admin users
  const navContainer = document.querySelector('.nav.seg-nav');
  if (navContainer) {
    const isAdmin = role && ['admin', 'owner'].includes(role.toLowerCase());
    
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
    if (event === 'SIGNED_OUT' || !session) {
      try { clearAuthData(true); } catch(_) {}
      try { sessionStorage.clear(); } catch(_) {}
      try {
        document.cookie.split(';').forEach(c => {
          document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });
      } catch(_) {}
      window.location.replace('home.html?_=' + Date.now());
      return;
    }

    // Removed onboarding_required client lock logic
  });
}

// Attach a click handler to a #logout-btn that signs the user out
export function attachLogout(supabase){
  const btn = document.getElementById('logout-btn');
  if (!btn) return;
  let loggingOut = false;
  const manualCleanupRedirect = () => {
    try { clearAuthData(true); } catch(_) {}
    try { sessionStorage.clear(); } catch(_) {}
    try { document.cookie.split(';').forEach(c => document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`)); } catch(_) {}
    try { window.location.replace('home.html?_=' + Date.now()); } catch(_) { window.location.href = 'home.html'; }
  };
  btn.addEventListener('click', async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (loggingOut) return;
    loggingOut = true;
    try { await supabase.auth.signOut(); }
    catch(err){ console.error('Sign out failed:', err); }
    finally { setTimeout(manualCleanupRedirect, 600); }
  });
}

// Create and render consistent staff navigation using the working pattern
export function renderStaffNavigation(activePage = 'home') {
  const navContainer = document.querySelector('.nav.seg-nav');
  if (!navContainer) return;
  
  // Prevent multiple simultaneous renders
  if (navContainer.dataset.rendering === 'true') return;
  navContainer.dataset.rendering = 'true';
  
  // Always render navigation; forced onboarding suppression removed

  const navItems = [
    { page: 'home', href: 'staff.html', label: 'Home' },
    { page: 'welcome', href: 'staff-welcome.html', label: 'Welcome' },
    { page: 'holidays', href: 'my-holidays.html', label: 'My Holidays' },
    { page: 'meetings', href: 'staff-meetings.html', label: 'Meetings' },
    { page: 'scans', href: 'staff-scans.html', label: 'My Scans' },
    { page: 'training', href: 'staff-training.html', label: 'My Training' },
    { page: 'achievements', href: 'achievements.html', label: 'Achievements' },
    { page: 'quiz', href: 'staff-quiz.html', label: 'Quiz' }
  ];

  // Clear existing content and event listeners
  navContainer.innerHTML = '';
  
  // Create navigation elements using working pattern (buttons with data-section)
  navItems.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.section = item.page; // Use data-section like working version
    button.dataset.href = item.href; // Store href for navigation
    button.textContent = item.label;
    
    // Add tooltip if specified - use data attribute for better tooltip control
    if (item.tooltip) {
      button.title = item.tooltip;
      button.setAttribute('data-tooltip', item.tooltip);
    }
    
    // Set classes and visibility
    if (item.disabled) {
      button.className = 'disabled-nav-item';
      // Don't actually disable the button so tooltip works and we can handle clicks
      // button.disabled = true;
      button.style.color = '#9ca3af'; // Grey color
      button.style.cursor = 'pointer'; // Allow clicking for PIN prompt
      button.style.opacity = '0.6';
    } else if (item.page === activePage && item.adminOnly) {
      button.className = 'admin-only active';
      button.style.display = 'none';
    } else if (item.page === activePage) {
      button.className = 'active';
    } else if (item.adminOnly) {
      button.className = 'admin-only';
      button.style.display = 'none';
    }
    
    navContainer.appendChild(button);
  });
  
  // Add single click handler using event delegation (like working version)
  if (!navContainer.dataset.hasClickHandler) {
    navContainer.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-section]');
      if (!btn) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent navigation for disabled items
      if (btn.classList.contains('disabled-nav-item')) {
        return;
      }
      
      // Prevent double clicks
      if (btn.dataset.clicking === 'true') return;
      btn.dataset.clicking = 'true';
      
      const section = btn.getAttribute('data-section');
      const href = btn.getAttribute('data-href');
      
      console.log('Staff navigation clicked:', section, href);
      
      // Update active states
      navContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Handle Admin Portal navigation with special logic
      if (section === 'admin-portal') {
        console.log('Admin Portal button clicked - checking authentication state...');
        
        try {
          // Check if we have an active Supabase session
          if (window.supabase && typeof window.supabase.auth.getSession === 'function') {
            const { data: { session }, error } = await window.supabase.auth.getSession();
            
            if (error) {
              console.warn('Error getting session:', error);
            }
            
            if (session && session.user) {
              console.log('Active session found for user:', session.user.email);
              // Session is active, navigate directly to admin-dashboard.html
              window.location.href = href;
              return;
            } else {
              console.log('No active session found');
            }
          }
          
          // If no session, still navigate but let admin-dashboard handle authentication
          console.log('Navigating to admin-dashboard.html - authentication will be handled there');
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
    const expiry = latest.expiry_date || (t.validity_months && completion ? new Date(new Date(completion).setMonth(completion.getMonth()+Number(t.validity_months))) : null);
    if (!expiry) { ok++; return; }
    const days = daysBetween(expiry, now);
    if (days < 0) due++; else ok++;
  });
  const percent = total ? Math.round((ok / total) * 100) : 0;
  return { ok, due, total, percent };
}

export async function getUserAchievements(supabase, kioskUserId) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_key, status, progress_percent, unlocked_at')
    .eq('kiosk_user_id', kioskUserId);

  if (error) {
    console.error('Error loading achievements:', error);
    return [];
  }
  return data || [];
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
