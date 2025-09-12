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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) throw new Error('NO_SESSION');

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
  const role = profileRow?.role || meta?.role || null;
  // Include 'member' and any role by default for staff-welcome page
  const allowed = ['staff', 'admin', 'owner', 'manager', 'member', 'user'];

  try {
    console.debug('[requireStaffSession]', {
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
  } catch (_) {}

  // Enforce onboarding with single source of truth (database first, then metadata)
  try {
    const locked = (sessionStorage.getItem('forceOnboarding') === '1');
    const isWelcome = /staff-welcome\.html$/i.test(new URL(window.location.href).pathname);
    
    // Check onboarding status from database first, then metadata
    const dbOnboardingComplete = profileRow?.onboarding_complete === true;
    const metaOnboardingRequired = (String(meta.onboarding_required).toLowerCase() === 'true' || String(meta.onboarding_required) === '1');
    const welcomeCompleted = !!meta.welcome_completed_at;

    // Determine if onboarding is needed
    const needsOnboarding = !dbOnboardingComplete && (locked || metaOnboardingRequired || !welcomeCompleted);

    if (dbOnboardingComplete || welcomeCompleted) {
      try { sessionStorage.removeItem('forceOnboarding'); } catch(_) {}
    }

    if (needsOnboarding && !isWelcome) {
      try { sessionStorage.setItem('forceOnboarding', '1'); } catch(_) {}
      window.location.replace('staff-welcome.html?force=1');
      throw new Error('REDIRECT_ONBOARDING');
    }
  } catch (e) {
    if (e.message === 'REDIRECT_ONBOARDING') throw e;
  }

  // For staff-welcome page, allow users without roles to complete setup
  const isWelcomePage = /staff-welcome\.html$/i.test(window.location.pathname);
  if (!isWelcomePage && (!role || !allowed.includes(String(role).toLowerCase()))) {
    throw new Error('NOT_STAFF');
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

    // If user signs in and metadata says onboarding_required, set the client lock
    try {
      const meta = session?.user?.user_metadata || session?.user?.raw_user_meta_data || {};
      if (String(meta.onboarding_required).toLowerCase() === 'true' || String(meta.onboarding_required) === '1') {
        sessionStorage.setItem('forceOnboarding', '1');
      }
      if (meta.welcome_completed_at) {
        sessionStorage.removeItem('forceOnboarding');
      }
    } catch(_) {}
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
  
  // Suppress rendering navigation during forced onboarding (on all pages)
  try {
    const locked = (sessionStorage.getItem('forceOnboarding') === '1');
    if (locked) { 
      navContainer.innerHTML = ''; 
      navContainer.dataset.rendering = 'false';
      return; 
    }
  } catch(_) {}

  const navItems = [
    { page: 'home', href: 'staff.html', label: 'Home' },
    { page: 'welcome', href: 'staff-welcome.html', label: 'Welcome' },
    { page: 'meetings', href: 'staff-meetings.html', label: 'Meetings' },
    { page: 'scans', href: 'staff-scans.html', label: 'My Scans' },
    { page: 'training', href: 'staff-training.html', label: 'My Training' },
    { page: 'achievements', href: 'achievements.html', label: 'Achievements' },
    { page: 'quiz', href: 'staff-quiz.html', label: 'Quiz' },
    // Per navigation rules: Admin Site button must link to admin check page and keep the user logged in
    { page: 'admin', href: 'index.html', label: 'Admin Site', adminOnly: true }
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
    
    // Set classes and visibility
    if (item.page === activePage && item.adminOnly) {
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
    navContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-section]');
      if (!btn) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent double clicks
      if (btn.dataset.clicking === 'true') return;
      btn.dataset.clicking = 'true';
      
      const section = btn.getAttribute('data-section');
      const href = btn.getAttribute('data-href');
      
      console.log('Staff navigation clicked:', section, href);
      
      // Update active states
      navContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Navigate to page
      if (href) {
        window.location.href = href;
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

// Reveal admin-only navigation links if user has admin/owner role
export function revealAdminNav(role){
  try{
    const r = String(role || '').toLowerCase();
    if (r === 'admin' || r === 'owner') {
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = el.classList.contains('nav-link') ? 'block' : 'inline-block';
      });
    }
  }catch(_){ /* ignore */ }
}

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
  const { data, error } = await supabase.from('user_achievements').select('achievement_key, status, progress_percent').eq('kiosk_user_id', kioskUserId);
  if (error) throw error;
  return data || [];
}

export async function upsertAchievement(supabase, kioskUserId, key, status, progress = 0) {
  const { error } = await supabase.rpc('upsert_user_achievement', { p_kiosk_user_id: kioskUserId, p_achievement_key: key, p_status: status, p_progress_percent: progress });
  if (error) throw error;
}
