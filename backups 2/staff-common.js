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
  if (!role || String(role).toLowerCase() !== 'staff') throw new Error('NOT_STAFF');
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

export function navActivate(page){
  document.querySelectorAll('.nav a').forEach(a => {
    if (a.getAttribute('data-page') === page) a.classList.add('active');
    else a.classList.remove('active');
  });
}
