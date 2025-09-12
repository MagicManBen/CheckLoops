import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const getAllowedOrigin = (req: Request): string => {
  const origin = req.headers.get('origin') || '';
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return origin;
  const allowed = ['https://magicmanben.github.io'];
  return allowed.includes(origin) ? origin : '*';
};

const cors = (req: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
});

interface ReqBody { avatarUrl: string; role?: string; nickname?: string; }

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json(req, { error: 'Missing authorization header' }, 401);
    let body: ReqBody; try { body = await req.json(); } catch { return json(req, { error: 'Invalid JSON body' }, 400); }
    const { avatarUrl, role = 'staff', nickname } = body || {};
    if (!avatarUrl || typeof avatarUrl !== 'string') return json(req, { error: 'avatarUrl required' }, 400);
    const openaiKey = Deno.env.get('CheckLoopsAI'); if (!openaiKey) return json(req, { error: 'AI key not configured' }, 500);
    const supabaseUrl = Deno.env.get('SUPABASE_URL'); const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return json(req, { error: 'Supabase service configuration missing' }, 500);
    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    // Decode JWT for user id
    let userId: string | null = null;
    try { const token = authHeader.replace(/Bearer /i,'').trim(); const payload = JSON.parse(atob(token.split('.')[1] || '')); userId = payload?.sub || null; } catch(_) {}
    if (!userId) return json(req, { error: 'Could not resolve user' }, 401);
    // Summarize dicebear params
    let traitSummary = '';
    try { const u = new URL(avatarUrl); const p = u.searchParams; const list: string[] = []; const add=(l:string,k:string)=>{const v=p.get(k); if(v) list.push(`${l}: ${v}`)}; add('hair','hair'); add('hair color','hairColor'); add('eyes','eyes'); add('mouth','mouth'); add('eyebrows','eyebrows'); add('glasses','glasses'); add('features','features'); add('skin color','skinColor'); traitSummary = list.join(', ');} catch(_) { traitSummary='styled cartoon face avatar'; }
    const rl = role.toLowerCase(); let attire = 'professional office attire';
    if (/(gp|doctor|physician)/.test(rl)) attire = 'modern NHS GP outfit with subtle stethoscope';
    else if (/(nurse)/.test(rl)) attire = 'clean NHS nurse uniform';
    else if (/(reception|admin)/.test(rl)) attire = 'smart casual clinic admin attire';
    else if (/(pharm)/.test(rl)) attire = 'professional pharmacist coat';
    else if (/(manager)/.test(rl)) attire = 'smart practice manager attire';
    const cleanName = nickname ? ` for ${nickname}` : '';
    const prompt = `Full-body, front-facing, centered portrait${cleanName} of the SAME CHARACTER described by: ${traitSummary}. The character is a ${role} wearing ${attire}. Consistent flat vector style matching DiceBear Adventurer aesthetic: bold outlines, minimal gradients, flat bright colors, no background elements. Pure white (#FFFFFF) background, full body visible head to shoes, neutral relaxed confident pose, hands visible. No text, watermark, shadow, border, props, extra characters or logos.`;
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '512x512', quality: 'standard', background: 'white' }) });
    if (!openaiRes.ok) { const t = await openaiRes.text(); return json(req, { error: 'Image generation failed', detail: t }, 502); }
    const imgData = await openaiRes.json(); const genUrl = imgData?.data?.[0]?.url || null; if (!genUrl) return json(req, { error: 'No image URL returned' }, 502);
    const imgFetch = await fetch(genUrl); if (!imgFetch.ok) return json(req, { error: 'Failed to fetch generated image' }, 502);
    const bytes = new Uint8Array(await imgFetch.arrayBuffer());
    const path = `full_avatars/${userId}.png`;
    const { error: upErr } = await admin.storage.from('uploads').upload(path, bytes, { upsert: true, contentType: 'image/png', cacheControl: '3600' });
    if (upErr) return json(req, { error: 'Upload failed', detail: upErr.message }, 500);
    const { data: pub } = admin.storage.from('uploads').getPublicUrl(path); const publicUrl = pub?.publicUrl || null; if (!publicUrl) return json(req, { error: 'Could not resolve public URL' }, 500);
    try { await admin.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', userId); } catch(_) {}
    try { await admin.auth.admin.updateUserById(userId, { user_metadata: { avatar_url: publicUrl } }); } catch(_) {}
    return json(req, { full_body_url: publicUrl, promptUsed: prompt });
  } catch (e) { return json(req, { error: e instanceof Error ? e.message : 'Internal error' }, 500); }
});

function json(req: Request, body: any, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } }); }
