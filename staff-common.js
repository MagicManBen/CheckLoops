// Shared helpers for Staff pages
// Requires: config.js loaded before this file
export async function initSupabase() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  });
}

export async function requireStaffSession(supabase) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) throw new Error('NO_SESSION');
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role, full_name, site_id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  const role = profileRow?.role || session.user?.raw_user_meta_data?.role || null;
  // treat admin/owner/manager as staff for access to staff pages
  const allowed = ['staff', 'admin', 'owner', 'manager'];
  // debug output to help trace session/profile resolution in the browser console
  try{
    console.debug('[requireStaffSession] userId=', session.user.id, 'email=', session.user.email, 'profileRole=', profileRow?.role, 'rawRole=', session.user?.raw_user_meta_data?.role);
  } catch(e) { /* ignore */ }
  if (!role || !allowed.includes(String(role).toLowerCase())) throw new Error('NOT_STAFF');
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
      try { localStorage.clear(); } catch(_) {}
      try { sessionStorage.clear(); } catch(_) {}
      try { document.cookie.split(';').forEach(c => document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`)); } catch(_) {}
      window.location.replace('Home.html?_=' + Date.now());
    }
  });
}

// Attach a click handler to a #logout-btn that signs the user out
export function attachLogout(supabase){
  const btn = document.getElementById('logout-btn');
  if (!btn) return;
  let loggingOut = false;
  const manualCleanupRedirect = () => {
    try { localStorage.clear(); } catch(_) {}
    try { sessionStorage.clear(); } catch(_) {}
    try { document.cookie.split(';').forEach(c => document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`)); } catch(_) {}
    try { window.location.replace('Home.html?_=' + Date.now()); } catch(_) { window.location.href = 'Home.html'; }
  };
  btn.addEventListener('click', async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (loggingOut) return;
    loggingOut = true;
    try {
      await supabase.auth.signOut();
    } catch(err){
      console.error('Sign out failed:', err);
    } finally {
      // Fallback in case onAuthStateChange doesn't fire promptly
      setTimeout(manualCleanupRedirect, 600);
    }
  });
}

export function navActivate(page){
  document.querySelectorAll('.nav a').forEach(a => {
    if (a.getAttribute('data-page') === page) a.classList.add('active');
    else a.classList.remove('active');
  });
}

// Reveal admin-only navigation links if user has admin/owner role
export function revealAdminNav(role){
  try{
    const r = String(role || '').toLowerCase();
    if (r === 'admin' || r === 'owner') {
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'inline-block';
        // Mark navigation so index.html can show "Back to Staff" reliably.
        // We store a timestamp so index can ignore stale flags when user opens index directly.
        el.addEventListener('click', () => {
          try { sessionStorage.setItem('cameFromStaffAt', String(Date.now())); } catch(_) {}
        }, { once:true });
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
