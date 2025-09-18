    import { initSupabase, requireStaffSession, handleAuthState, getSiteText, setTopbar, navActivate, attachLogout } from './staff-common.js';
    const supabase = await initSupabase();
    handleAuthState(supabase);
    navActivate('welcome');
    attachLogout(supabase);
    let forceMode = false;
    const url = new URL(window.location.href);
    if (url.searchParams.get('force') === '1') { forceMode = true; sessionStorage.setItem('forceOnboarding','1'); }
    if (sessionStorage.getItem('forceOnboarding') === '1') forceMode = true; else if (forceMode) sessionStorage.setItem('forceOnboarding','1');
    async function step(n){ document.querySelectorAll('main > section').forEach((s,i)=> s.style.display = ((i+1)===n?'':'none')); document.querySelector('.progress .bar').style.width = (n*16.66)+'%'; }
    step(1);
    try {
      const { session, profileRow } = await requireStaffSession(supabase);
      const user = session.user;
      const siteId = profileRow?.site_id || user?.raw_user_meta_data?.site_id || user?.user_metadata?.site_id || null;
      const roleMeta = profileRow?.role_detail || profileRow?.role || user?.raw_user_meta_data?.role || user?.user_metadata?.role || 'Staff';
      setTopbar({ siteText: await getSiteText(supabase, siteId), email: user.email, role: roleMeta });
      // Admin nav removed - separate staff portal
      const fullName = profileRow?.full_name || user?.raw_user_meta_data?.full_name || user?.user_metadata?.full_name || user.email.split('@')[0];
      document.getElementById('welcome-title').textContent = `Welcome, ${fullName}`;
      const nicknameInput = document.getElementById('nickname');
      let nicknameColumnExists = true;
      try {
        const { data, error } = await supabase.from('profiles').select('nickname').eq('user_id', user.id).maybeSingle();
        if (error) {
          if (String(error.code) === '42703') nicknameColumnExists = false; else console.warn('profiles nickname check error', error);
        } else if (data && data.nickname) nicknameInput.value = data.nickname;
      } catch (_) { nicknameColumnExists = false; }
      async function saveNickname(){
        const msg = document.getElementById('nick-msg');
        const val = String(nicknameInput.value || '').trim();
        if (!val) { msg.textContent = 'Enter a name first.'; return; }
        if (!nicknameColumnExists){ msg.innerHTML = 'Add nickname column first:<pre style="text-align:left; background:#f1f5f9; padding:8px; border-radius:6px; border:1px solid #e2e8f0;">ALTER TABLE public.profiles ADD COLUMN nickname text;</pre>'; return; }
        try {
          const { error } = await supabase.from('profiles').update({ nickname: val }).eq('user_id', user.id);
          if (error) { msg.textContent = 'Save failed'; console.warn(error); return; }
          msg.textContent = 'Saved!';
          burstConfetti();
          setTimeout(()=> { step(2); loadRoleStep(); }, 300);
        } catch(e){ msg.textContent = 'Error'; console.warn(e); }
      }
      document.getElementById('save-nickname').addEventListener('click', e=> { e.preventDefault(); saveNickname(); });
      const ROLES_FALLBACK = ['Doctor','Nurse','Pharmacist','Reception','Manager'];
      function roleIcon(name){
        return ({ 'Doctor':'stethoscope','Nurse':'nurse','Pharmacist':'pill','Reception':'customer-support','Manager':'briefcase' })[name] || 'user';
      }
      async function loadRoleStep(){
        const grid = document.getElementById('roles-grid');
        grid.innerHTML = '<div style="grid-column:1/-1; opacity:.6; font-weight:600;">Loading roles…</div>';
        let roles = [];
        try { const { data, error } = await supabase.from('kiosk_roles').select('role'); if (!error && Array.isArray(data) && data.length) roles = data.map(r=>r.role); } catch(_){}
        if (!roles.length) roles = ROLES_FALLBACK;
        const existing = profileRow?.role_detail || profileRow?.role || null;
        grid.innerHTML = roles.map(r => `<div class="role-card${existing===r?' selected':''}" data-role="${r}"><img src="https://img.icons8.com/cute-color/64/${roleIcon(r)}.png" alt="${r}"/><div class="role-label">${r}</div><div class="role-note">${r==='Doctor'?'Clinical lead':'Team '+r}</div></div>`).join('');
        grid.querySelectorAll('.role-card').forEach(el=> el.addEventListener('click', ()=> {
          grid.querySelectorAll('.role-card').forEach(o=> o.classList.remove('selected')); el.classList.add('selected');
        }));
      }
      document.getElementById('role-back').addEventListener('click', ()=> step(1));
      document.getElementById('role-next').addEventListener('click', async ()=> {
        const sel = document.querySelector('.role-card.selected');
        if (!sel){ document.getElementById('role-msg').textContent = 'Please select a role.'; return; }
        window.selectedRole = sel.dataset.role;
        try { await persistRoleTeam(window.selectedRole, null, null); } catch(_){ }
        step(3); loadTeams();
      });
      async function loadTeams(){
        const grid = document.getElementById('teams-grid');
        grid.innerHTML = '<div style="grid-column:1/-1; opacity:.6; font-weight:600;">Loading teams…</div>';
        let teams = [];
        if (siteId){
          try { const { data, error } = await supabase.from('teams').select('id,name').eq('site_id', siteId); if (!error && Array.isArray(data) && data.length) teams = data; } catch(_){}
        }
        if (!teams.length) teams = [ { id:'managers', name:'Managers'}, { id:'reception', name:'Reception'}, { id:'nursing', name:'Nursing'}, { id:'gps', name:'GPs'}, { id:'pharmacy', name:'Pharmacy'} ];
        grid.innerHTML = teams.map(t => `<div class="team-card" data-id="${t.id}" data-name="${t.name}"><img src="Icons/icons8-people-100.png" alt="${t.name}"/><div class="team-label">${t.name}</div></div>`).join('');
        grid.querySelectorAll('.team-card').forEach(el=> el.addEventListener('click', ()=> { grid.querySelectorAll('.team-card').forEach(o=> o.classList.remove('selected')); el.classList.add('selected'); }));
      }
      document.getElementById('team-back').addEventListener('click', ()=> step(2));
      document.getElementById('team-next').addEventListener('click', async ()=> {
        const sel = document.querySelector('.team-card.selected');
        if (sel){ window.selectedTeamId = /^[0-9]+$/.test(sel.dataset.id) ? parseInt(sel.dataset.id,10) : null; window.selectedTeamName = sel.dataset.name || null; try { await persistRoleTeam(window.selectedRole || null, window.selectedTeamId, window.selectedTeamName); } catch(_){ } }
        step(4); initAvatar(fullName);
      });
      function rangeArr(s,e,st=1){ const a=[]; for(let i=s;i<=e;i+=st)a.push(i); return a; }
      function pad2(n){ return String(n).padStart(2,'0'); }
      function buildAvatarUrl(){
        const base = 'https://api.dicebear.com/7.x/adventurer/svg';
        const seed = encodeURIComponent(window.aiSeed || nicknameInput.value.trim() || fullName || 'User');
        const p = new URLSearchParams(); p.set('seed', seed);
        const fields = ['eyes','mouth','eyebrows','glasses','glassesProbability','earrings','earringsProbability','featuresProbability','hair','hairColor','hairProbability','skinColor'];
        fields.forEach(f=>{ const v = document.getElementById('opt-'+f)?.value; if (v) p.set(f,v); });
        const feats = Array.from(document.getElementById('opt-features')?.selectedOptions||[]).map(o=>o.value); feats.forEach(v=> p.append('features', v));
        return `${base}?${p.toString()}`;
      }
      function updateAvatar(){ const img = document.getElementById('avatarPreview'); if (img){ const url = buildAvatarUrl(); window.currentAvatarUrl = url; img.src = url; } }
      async function initAvatar(fullName){
        const controls = document.getElementById('manual-controls');
        controls.innerHTML = '';
        const blocks = [
          { id:'eyes', label:'Eyes', count:26 },
          { id:'mouth', label:'Mouth', count:30 },
          { id:'eyebrows', label:'Brows', count:15 },
          { id:'glasses', label:'Glasses', variants:['','variant01','variant02','variant03','variant04','variant05'] },
          { id:'earrings', label:'Earrings', variants:['','variant01','variant02','variant03','variant04','variant05','variant06'] },
          { id:'hair', label:'Hair', variants:[...Array.from({length:19},(_,i)=>'short'+pad2(i+1)), ...Array.from({length:26},(_,i)=>'long'+pad2(i+1))] },
          { id:'hairColor', label:'Hair Color', variants:['','ac6511','cb6820','ab2a18','e5d7a3','b9a05f','796a45','6a4e35','562306','9e5622','763900','0e0e0e','afafaf','3eac2c','85c2c6','dba3be','592454'] },
          { id:'skinColor', label:'Skin', variants:['','f2d3b1','ecad80','9e5622','763900'] }
        ];
        const probBlocks = [
          { id:'glassesProbability', label:'Glasses Chance', vals: rangeArr(0,100,10) },
          { id:'earringsProbability', label:'Earrings Chance', vals: rangeArr(0,100,10) },
          { id:'featuresProbability', label:'Features Chance', vals: rangeArr(0,100,10) },
          { id:'hairProbability', label:'Hair Chance', vals: rangeArr(0,100,10) }
        ];
        function makeSelect(id, options, withBlank=true){ const sel = document.createElement('select'); sel.id='opt-'+id; if(withBlank){ sel.appendChild(new Option('Default','')); } options.forEach(v=> sel.appendChild(new Option(String(v),String(v)))); sel.addEventListener('change', ()=>{ window.avatarDirty=true; updateAvatar(); }); return sel; }
        blocks.forEach(b=>{ const card=document.createElement('div'); card.className='ctrl-card'; const h=document.createElement('div'); h.className='opt-label'; h.textContent=b.label; card.appendChild(h); const variants=b.variants||Array.from({length:b.count},(_,i)=>'variant'+pad2(i+1)); card.appendChild(makeSelect(b.id, variants, true)); controls.appendChild(card); });
        const featuresCard=document.createElement('div'); featuresCard.className='ctrl-card'; featuresCard.innerHTML='<div class="opt-label">Features</div>'; const multi=document.createElement('select'); multi.id='opt-features'; multi.multiple=true; ['mustache','blush','birthmark','freckles'].forEach(v=> multi.appendChild(new Option(v,v))); multi.addEventListener('change', ()=>{ window.avatarDirty=true; updateAvatar(); }); featuresCard.appendChild(multi); controls.appendChild(featuresCard);
        probBlocks.forEach(pB=>{ const card=document.createElement('div'); card.className='ctrl-card'; const h=document.createElement('div'); h.className='opt-label'; h.textContent=pB.label; card.appendChild(h); card.appendChild(makeSelect(pB.id, pB.vals, true)); controls.appendChild(card); });
        updateAvatar();
        document.getElementById('avatar-randomize').addEventListener('click', ()=>{
          const seedPool=['Nova','Ziggy','Aria','Kai','Milo','Ivy','Atlas','Sage','Skye','Orion','Zoe','Finn','Quinn','Remy'];
          window.aiSeed = seedPool[Math.floor(Math.random()*seedPool.length)] + Math.floor(Math.random()*100); document.getElementById('seedDisplay').textContent = 'Seed: '+window.aiSeed; ['eyes','mouth','eyebrows','glasses','earrings','hair','hairColor','skinColor'].forEach(f=>{ const el=document.getElementById('opt-'+f); if(!el) return; const opts=Array.from(el.options).filter(o=>o.value); const pick=opts[Math.floor(Math.random()*opts.length)]; el.value=pick?.value||''; }); ['glassesProbability','earringsProbability','featuresProbability','hairProbability'].forEach(f=>{ const el=document.getElementById('opt-'+f); if(!el) return; const opts=Array.from(el.options); el.value=opts[Math.floor(Math.random()*opts.length)].value; }); const feats=document.getElementById('opt-features'); Array.from(feats.options).forEach(o=> o.selected=false); const fPool=['mustache','blush','birthmark','freckles']; const count=Math.floor(Math.random()*3); for(let i=0;i<count;i++){ const val=fPool[Math.floor(Math.random()*fPool.length)]; const opt=Array.from(feats.options).find(o=>o.value===val); if(opt) opt.selected=true; } window.avatarDirty=true; updateAvatar(); });
        document.getElementById('avatar-save').addEventListener('click', async ()=> { await saveAvatar(); });
        document.getElementById('ai-generate').addEventListener('click', async ()=> { await runAIGeneration(); });
        try { const { data: existing } = await supabase.from('staff_app_welcome').select('avatar_url, role_detail, team_id, team_name, nickname').eq('user_id', user.id).maybeSingle(); if (existing){ if(existing.avatar_url){ window.currentAvatarUrl=existing.avatar_url; document.getElementById('avatarPreview').src=existing.avatar_url; } if(existing.role_detail) window.selectedRole=existing.role_detail; if(existing.team_id) window.selectedTeamId=existing.team_id; if(existing.team_name) window.selectedTeamName=existing.team_name; if(existing.nickname && !nicknameInput.value) nicknameInput.value=existing.nickname; } } catch(_){ }
      }
      async function saveAvatar(){ const msg=document.getElementById('avatar-save-msg'); try { const url=window.currentAvatarUrl || buildAvatarUrl(); const nick=nicknameInput.value.trim()||null; const meta={ avatar_url:url, nickname:nick, role_detail: window.selectedRole||null}; await supabase.auth.updateUser({ data: meta }); try { await supabase.from('staff_app_welcome').upsert({ user_id:user.id, site_id: siteId, full_name: fullName, nickname:nick, avatar_url:url, role_detail: window.selectedRole||null, team_id: window.selectedTeamId||null, team_name: window.selectedTeamName||null }); } catch(_){ } msg.textContent='Saved!'; window.avatarDirty=false; return true; } catch(e){ console.warn('avatar save failed', e); msg.textContent='Save failed'; return false; } }
      async function runAIGeneration(){ const out=document.getElementById('aiOutput'); const prompt=String(document.getElementById('aiPrompt').value||'').trim(); if(!prompt){ out.textContent='Enter a description first.'; return; } out.textContent='Generating...'; try { const options = { description: prompt, seedHint: nicknameInput.value.trim()||fullName||'User' }; const { data, error } = await supabase.functions.invoke('generate-avatar', { body: options }); if (error) throw error; if (!data || Object.keys(data).length===0) throw new Error('No data'); applyAIResult(data); await saveAvatar(); out.textContent='Applied! Tweak below if you like.'; } catch(e){ console.warn('AI gen failed', e); out.textContent='AI failed: '+(e.message||e); } }
      function applyAIResult(data){ const map = new Map([['eyes','opt-eyes'],['mouth','opt-mouth'],['eyebrows','opt-eyebrows'],['glasses','opt-glasses'],['glassesProbability','opt-glassesProbability'],['earrings','opt-earrings'],['earringsProbability','opt-earringsProbability'],['featuresProbability','opt-featuresProbability'],['hair','opt-hair'],['hairColor','opt-hairColor'],['hairProbability','opt-hairProbability'],['skinColor','opt-skinColor']]); for(const [k,id] of map.entries()){ if(data[k]!=null){ const el=document.getElementById(id); if(el) el.value=String(data[k]); } } if(Array.isArray(data.features)){ const feats=document.getElementById('opt-features'); if(feats){ Array.from(feats.options).forEach(o=> o.selected = data.features.includes(o.value)); } } if (data.seed) window.aiSeed = String(data.seed); updateAvatar(); }
      async function persistRoleTeam(role, teamIdNum, teamName){ try { const nicknameVal = nicknameInput.value.trim()||null; if (siteId){ await supabase.from('staff_app_welcome').upsert({ user_id:user.id, site_id:siteId, full_name:fullName, nickname:nicknameVal, role_detail:role||null, team_id:teamIdNum||null, team_name:teamName||null }); } await supabase.from('profiles').update({ role_detail:role||null, team_id:teamIdNum||null, team_name:teamName||null }).eq('user_id', user.id); } catch(e){ console.warn('persistRoleTeam failed', e); } }
      document.getElementById('avatar-back').addEventListener('click', ()=> step(3));
      document.getElementById('avatar-next').addEventListener('click', async ()=> { if (window.avatarDirty){ const ok = await saveAvatar(); if(!ok) return; } step(5); renderWorkingPattern(); });
      function renderWorkingPattern(){ const c=document.getElementById('working-form'); c.innerHTML=''; const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']; const isGP = (window.selectedRole||'').toLowerCase().includes('doctor') || (window.selectedRole||'').toLowerCase().includes('gp'); c.insertAdjacentHTML('beforeend', `<div class="tiny-note">${isGP ? 'Enter number of sessions (0-2) per day.' : 'Enter hours (HH:MM) — defaults Mon-Fri 7.5h.'}</div>`); days.forEach((d,i)=>{ const id=d.toLowerCase(); const defaultVal = isGP ? '' : (i<5 ? '07:30' : ''); c.insertAdjacentHTML('beforeend', `<div class="working-hour-card"><label for="${id}-val">${d}</label>${isGP ? `<select id="${id}-val"><option value="0">0</option><option value="1">1</option><option value="2" ${i<5?'selected':''}>2</option></select><span class="tiny-note">sessions</span>` : `<input type="time" id="${id}-val" value="${defaultVal}" step="1800" max="12:00"><span class="tiny-note">hours</span>`}</div>`); }); }
      document.getElementById('working-back').addEventListener('click', ()=> step(4));
      document.getElementById('complete-setup').addEventListener('click', async ()=> { 
        const msg=document.getElementById('working-msg'); 
        msg.textContent='Saving...'; 
        const isGP = (window.selectedRole||'').toLowerCase().includes('doctor') || (window.selectedRole||'').toLowerCase().includes('gp'); 
        const days=['monday','tuesday','wednesday','thursday','friday','saturday','sunday']; 
        const patternData={ 
          auth_user_id: user.id, 
          site_id: siteId,
          holiday_year: new Date().getFullYear(),
          weekly_hours: 0,
          weekly_sessions: 0,
          total_hours: 0,
          total_sessions: 0
        }; 
        
        let totalHours=0; 
        let totalSessions=0; 
        
        for(const d of days){
          if(isGP){
            const sessions=parseInt(document.getElementById(`${d}-val`).value||'0'); 
            patternData[`${d}_sessions`]=sessions; 
            patternData[`${d}_hours`]=0; 
            totalSessions+=sessions; 
          } else { 
            const timeValue=document.getElementById(`${d}-val`).value||'00:00'; 
            const [h,m]=timeValue.split(':').map(Number); 
            const decimal=h+(m/60); 
            patternData[`${d}_hours`]=decimal; 
            patternData[`${d}_sessions`]=0; 
            totalHours+=decimal; 
          } 
        } 
        
        // Set totals
        patternData.total_hours = totalHours;
        patternData.total_sessions = totalSessions;
        patternData.weekly_hours = totalHours;
        patternData.weekly_sessions = totalSessions;
        
        // Set holiday entitlement
        patternData.holiday_multiplier = 10;
        if (isGP) {
          patternData.calculated_sessions = totalSessions * 10;
        } else {
          patternData.calculated_hours = totalHours * 10;
        }
        
        try { 
          // Update master_users with working pattern and holiday data
          await supabase.from('master_users').update(patternData).eq('auth_user_id', user.id); 
          
          try { 
            await supabase.auth.updateUser({ data: { welcome_completed_at: new Date().toISOString(), onboarding_required: false } }); 
            await supabase.from('profiles').update({ onboarding_complete: true }).eq('user_id', user.id); 
          } catch(e){ 
            console.warn('completion meta update failed', e); 
          } 
          
          step(6); 
          setTimeout(()=>{ 
            sessionStorage.removeItem('forceOnboarding'); 
            window.location.href='staff.html'; 
          }, 800); 
        } catch(e){ 
          console.warn('pattern save failed', e); 
          msg.textContent='Save failed'; 
        }
      });
      function burstConfetti(){ const conf=document.getElementById('confetti'); if(!conf) return; const colors=['#60a5fa','#a78bfa','#34d399','#f472b6','#fbbf24']; for (let i=0;i<36;i++){ const bit=document.createElement('div'); bit.className='bit'; bit.style.left=(10+Math.random()*80)+'vw'; bit.style.top='-6px'; bit.style.background=colors[Math.floor(Math.random()*colors.length)]; bit.style.animationDelay=(Math.random()*120)+'ms'; conf.appendChild(bit); setTimeout(()=> bit.remove(), 1200); } }
    } catch(e){ if(String(e.message||'').includes('NO_SESSION')){ window.location.replace('home.html'); } else { console.warn('welcome init error', e); } }
    function i8(name, opts={}){ var base='https://img.icons8.com'; var style=opts.style||'cute-color'; var size=opts.size||64; var path=[style,String(size), encodeURIComponent(name)+'.png'].join('/'); return base+'/'+path; }
    function setIcon(el){ var name=el.getAttribute('data-i8'); var size=el.getAttribute('data-i8-size'); var style=el.getAttribute('data-i8-style')||'cute-color'; el.src=i8(name,{style:style,size:size?parseInt(size,10):undefined}); }
    function wireIcons(){ document.querySelectorAll('img[data-i8]').forEach(setIcon); }
    if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', wireIcons); } else { wireIcons(); }
  </script>
</body>
</html>
        function rangeArr(start, end, step=1){ const a=[]; for(let i=start;i<=end;i+=step) a.push(i); return a; }
        function pad2(n){ return String(n).padStart(2,'0'); }

        function buildAvatarUrlFromControls(){
          const base = 'https://api.dicebear.com/7.x/adventurer/svg';
          const seed = encodeURIComponent(
            (window.aiSeed && String(window.aiSeed)) ||
            (document.getElementById('nickname')?.value || '').trim() ||
            (typeof fullName === 'string' && fullName) ||
            'User'
          );
          const params = new URLSearchParams();
          params.set('seed', seed);

          const bgType = document.getElementById('opt-backgroundType').value;
          const bgColor = document.getElementById('opt-backgroundColor').value;
          const bgRot = document.getElementById('opt-backgroundRotation').value;
          const radius = document.getElementById('opt-radius').value;
          const rotate = document.getElementById('opt-rotate').value;
          const scale = document.getElementById('opt-scale').value;
          const flip = document.getElementById('opt-flip').value;
          const clip = document.getElementById('opt-clip').value;
          const tx = document.getElementById('opt-translateX').value;
          const ty = document.getElementById('opt-translateY').value;

          const eyes = document.getElementById('opt-eyes').value;
          const mouth = document.getElementById('opt-mouth').value;
          const eyebrows = document.getElementById('opt-eyebrows').value;
          const glasses = document.getElementById('opt-glasses').value;
          const glassesProbability = document.getElementById('opt-glassesProbability').value;
          const earrings = document.getElementById('opt-earrings').value;
          const earringsProbability = document.getElementById('opt-earringsProbability').value;
          const featuresSel = document.getElementById('opt-features');
          const featuresProbability = document.getElementById('opt-featuresProbability').value;
          const hair = document.getElementById('opt-hair').value;
          const hairColor = document.getElementById('opt-hairColor').value;
          const hairProbability = document.getElementById('opt-hairProbability').value;
          const skinColor = document.getElementById('opt-skinColor').value;

          if (bgType) params.set('backgroundType', bgType);
          if (bgColor) params.append('backgroundColor', bgColor);
          if (bgRot) params.append('backgroundRotation', bgRot);
          if (radius) params.set('radius', radius);
          if (rotate) params.set('rotate', rotate);
          if (scale) params.set('scale', scale);
          if (flip) params.set('flip', flip);
          if (clip) params.set('clip', clip);
          if (tx) params.set('translateX', tx);
          if (ty) params.set('translateY', ty);

          if (eyes) params.set('eyes', eyes);
          if (mouth) params.set('mouth', mouth);
          if (eyebrows) params.set('eyebrows', eyebrows);
          if (glasses) params.set('glasses', glasses);
          if (glassesProbability) params.set('glassesProbability', glassesProbability);
          if (earrings) params.set('earrings', earrings);
          if (earringsProbability) params.set('earringsProbability', earringsProbability);
          if (featuresSel){
            const vals = Array.from(featuresSel.selectedOptions).map(o=>o.value).filter(Boolean);
            vals.forEach(v=> params.append('features', v));
          }
          if (featuresProbability) params.set('featuresProbability', featuresProbability);
          if (hair) params.set('hair', hair);
          if (hairColor) params.set('hairColor', hairColor);
          if (hairProbability) params.set('hairProbability', hairProbability);
          if (skinColor) params.set('skinColor', skinColor);

          return `${base}?${params.toString()}`;
        }

        function updateAvatarPreview(){
          const url = buildAvatarUrlFromControls();
          window.currentAvatarUrl = url;
          const img = document.getElementById('avatarPreview');
          if (img) img.src = url;
        }

        function getAiEndpoint(){
          try{
            const loc = window.location;
            if (loc.hostname === '127.0.0.1' || loc.hostname === 'localhost') return 'http://localhost:8787/generate-avatar';
          }catch(_){ }
          return '/api/generate-avatar';
        }

        function collectDropdownOptions(){
          const ids = ['opt-backgroundType','opt-backgroundColor','opt-backgroundRotation','opt-radius','opt-rotate','opt-scale','opt-flip','opt-clip','opt-translateX','opt-translateY','opt-eyes','opt-mouth','opt-eyebrows','opt-glasses','opt-earrings','opt-features','opt-hair','opt-hairColor','opt-skinColor'];
          const out = {};
          for (const id of ids){
            const el = document.getElementById(id);
            if (!el) continue;
            const opts = Array.from(el.options || []).map(o=>o.value).filter(v=>v!=='' && v!=null);
            out[id] = opts;
          }
          // numeric pickers for probs
          out['opt-glassesProbability'] = Array.from(document.getElementById('opt-glassesProbability')?.options||[]).map(o=>Number(o.value)).filter(v=>!isNaN(v));
          out['opt-earringsProbability'] = Array.from(document.getElementById('opt-earringsProbability')?.options||[]).map(o=>Number(o.value)).filter(v=>!isNaN(v));
          out['opt-featuresProbability'] = Array.from(document.getElementById('opt-featuresProbability')?.options||[]).map(o=>Number(o.value)).filter(v=>!isNaN(v));
          out['opt-hairProbability'] = Array.from(document.getElementById('opt-hairProbability')?.options||[]).map(o=>Number(o.value)).filter(v=>!isNaN(v));
          return out;
        }

        async function aiGenerateFromDescription(){
          const prompt = String(document.getElementById('avatarPrompt')?.value||'').trim();
          if (!prompt) throw new Error('Please enter a description first');
          
          if (!globalSupabase) throw new Error('Supabase not initialized');
          
          const nickVal = String(document.getElementById('nickname')?.value || '').trim();
          const seedHint = nickVal || (typeof fullName === 'string' && fullName) || 'User';
          const options = collectDropdownOptions();
          
          // Always use Supabase Edge Function (authenticated and working)
          console.log('Using Supabase Edge Function for AI generation');
          console.log('Generating avatar for description:', prompt);
          
          // Debug: Check if user is logged in
          const { data: { session } } = await globalSupabase.auth.getSession();
          console.log('Current session:', session ? `User: ${session.user.email}` : 'No session');
          
          if (!session || !session.user) {
            throw new Error('You must be logged in to generate avatars. Please refresh and log in again.');
          }
          
          // Build payload
          const payload = { description: prompt, options, seedHint };

          try {
            console.log('Calling Edge Function with payload:', payload);
            console.log('Using Supabase client:', globalSupabase);
            console.log('Session token:', session.access_token ? 'Present' : 'Missing');
            
            const { data, error } = await globalSupabase.functions.invoke('generate-avatar', { body: payload });

            console.log('Supabase Edge Function response:', { data, error });

            if (error) {
              console.error('Edge Function error details:', error);
              console.error('Error type:', typeof error);
              console.error('Error keys:', Object.keys(error));
              console.error('Full error object:', JSON.stringify(error, null, 2));
              
              // Better error handling
              if (error.message) {
                if (error.message.includes('FunctionsHttpError') || error.message.includes('Failed to send')) {
                  // This is likely a network or CORS issue
                  throw new Error('Failed to connect to avatar generation service. Please check your connection and try again.');
                } else if (error.message.includes('Unauthorized') || error.message.includes('authorization')) {
                  throw new Error('Authentication failed. Please refresh and log in again.');
                } else if (error.message.includes('CheckLoopsAI')) {
                  throw new Error('AI service configuration error. Please contact support.');
                } else {
                  throw new Error(`Avatar generation error: ${error.message}`);
                }
              } else if (error.context && error.context.status === 401) {
                throw new Error('Authentication failed. Please refresh and log in again.');
              }
              throw new Error(`AI generation failed: ${JSON.stringify(error)}`);
            }

            if (!data || Object.keys(data).length === 0) {
              throw new Error('No avatar data returned from AI. Please try a different description.');
            }

            console.log('Successfully generated avatar data:', data);
            applyAiResult(data);
            // Auto-save after applying AI result (guard if helper not yet bound)
            updateAvatarPreview();
            if (window.saveAvatarToSupabase) {
              await window.saveAvatarToSupabase(window.currentAvatarUrl || buildAvatarUrlFromControls());
            }
            const msg = document.getElementById('avatar-ai-msg');
            if (msg) msg.innerHTML = '✅ Avatar generated and saved automatically. You can fine-tune below.';
            return data;
          } catch (supabaseError) {
            // Log error for console only
            console.error('Caught error in Edge Function call:', supabaseError);
            console.error('Error stack:', supabaseError.stack);
            
            // Check for specific error patterns
            const errorStr = String(supabaseError);
            const errorMsg = supabaseError.message || errorStr;
            
            if (errorMsg.includes('Failed to connect') || errorMsg.includes('Failed to send')) {
              // Already handled above, just re-throw
              throw supabaseError;
            } else if (errorStr.includes('Authentication') || errorStr.includes('Unauthorized')) {
              throw new Error('Authentication failed. Please refresh the page and log in again.');
            } else if (errorStr.includes('fetch') || errorStr.includes('NetworkError')) {
              throw new Error('Network error. Please check your connection and try again.');
            } else if (errorStr.includes('timeout')) {
              throw new Error('Request timed out. Please try again with a shorter description.');
            } else if (errorStr.includes('CORS')) {
              throw new Error('Connection blocked. Please check if you are logged in properly.');
            }
            
            // If we get here, throw the original error message if it's clear enough
            if (supabaseError.message && supabaseError.message.length < 200) {
              throw supabaseError;
            } else {
              throw new Error('Avatar generation failed. Please try again or contact support.');
            }
          }
        }

        function applyAiResult(data){
          console.log('Applying AI result:', data);
          
          const setVal = (id, val) => { 
            const el = document.getElementById(id); 
            if (!el) {
              console.warn(`Element not found: ${id}`);
              return; 
            }
            el.value = String(val); 
            console.log(`Set ${id} = ${val}`);
          };
          
          const maybe = (k) => data[k] !== undefined && data[k] !== null && data[k] !== '';
          
          // Handle seed specially (no visible input)
          if (maybe('seed')) {
            try { window.aiSeed = String(data.seed); } catch(_) {}
            const sEl = document.getElementById('opt-seed');
            if (sEl) sEl.value = String(data.seed);
            console.log(`Set seed = ${data.seed}`);
          }
          
          // Map all the standard fields
          const fieldMappings = new Map([
            ['backgroundType','opt-backgroundType'],
            ['backgroundColor','opt-backgroundColor'],
            ['backgroundRotation','opt-backgroundRotation'],
            ['radius','opt-radius'],
            ['rotate','opt-rotate'],
            ['scale','opt-scale'],
            ['flip','opt-flip'],
            ['clip','opt-clip'],
            ['translateX','opt-translateX'],
            ['translateY','opt-translateY'],
            ['eyes','opt-eyes'],
            ['mouth','opt-mouth'],
            ['eyebrows','opt-eyebrows'],
            ['glasses','opt-glasses'],
            ['glassesProbability','opt-glassesProbability'],
            ['earrings','opt-earrings'],
            ['earringsProbability','opt-earringsProbability'],
            ['featuresProbability','opt-featuresProbability'],
            ['hair','opt-hair'],
            ['hairColor','opt-hairColor'],
            ['hairProbability','opt-hairProbability'],
            ['skinColor','opt-skinColor']
          ]);
          
          for (const [dataKey, elementId] of fieldMappings.entries()) { 
            if (maybe(dataKey)) {
              setVal(elementId, data[dataKey]); 
            }
          }

          // Handle features array (multi-select) separately
          if (Array.isArray(data.features) && data.features.length > 0) {
            const featuresEl = document.getElementById('opt-features');
            if (featuresEl) {
              // First clear all selections
              Array.from(featuresEl.options).forEach(option => {
                option.selected = false;
              });
              // Then select the ones from AI
              Array.from(featuresEl.options).forEach(option => {
                if (data.features.includes(option.value)) {
                  option.selected = true;
                  console.log(`Selected feature: ${option.value}`);
                }
              });
            }
          } else if (maybe('features') && typeof data.features === 'string') {
            // Handle single feature as string
            const featuresEl = document.getElementById('opt-features');
            if (featuresEl) {
              Array.from(featuresEl.options).forEach(option => {
                option.selected = (option.value === data.features);
              });
              console.log(`Selected single feature: ${data.features}`);
            }
          }

          // Log what we successfully applied
          const appliedFields = [];
          for (const [dataKey] of fieldMappings.entries()) {
            if (maybe(dataKey)) appliedFields.push(dataKey);
          }
          if (Array.isArray(data.features) || maybe('features')) appliedFields.push('features');
          console.log(`Applied fields: ${appliedFields.join(', ')}`);
          
          // Update the avatar preview with new settings
          updateAvatarPreview();
          
          // Show success feedback
          const msg = document.getElementById('avatar-ai-msg');
          if (msg) {
            const probFields = [];
            if (maybe('hairProbability')) probFields.push('hair probability');
            if (maybe('featuresProbability')) probFields.push('features probability');
            if (maybe('glassesProbability')) probFields.push('glasses probability');
            if (maybe('earringsProbability')) probFields.push('earrings probability');
            
            let feedbackText = `Applied! Generated ${appliedFields.length} avatar settings.`;
            if (probFields.length > 0) {
              feedbackText += ` Including ${probFields.join(', ')}.`;
            }
            feedbackText += ' You can fine-tune with the dropdowns below.';
            msg.textContent = feedbackText;
          }
          
          // No manual save prompt for AI-applied results; we will auto-save elsewhere.
        }

        async function initAvatarBuilder(fullName){
          // Fill dropdowns
          const seedEl = document.getElementById('opt-seed');
          const nickVal = String(document.getElementById('nickname')?.value || '').trim();
          if (seedEl) seedEl.value = nickVal || fullName || 'User';

          const fillOpts = (el, arr, withBlank=false) => {
            el.innerHTML = '';
            if (withBlank) el.appendChild(new Option('Default',''));
            for(const v of arr){ el.appendChild(new Option(String(v), String(v))); }
          };

          // Human‑readable labels for avatar options - analyzed with OpenAI Vision
          const eyeLabels = {
            variant01: 'Eyes: Curious',
            variant02: 'Eyes: Observant',
            variant03: 'Eyes: Inquisitive',
            variant04: 'Eyes: Unimpressed',
            variant05: 'Eyes: Pondering',
            variant06: 'Eyes: Doubtful',
            variant07: 'Eyes: Dispassionate',
            variant08: 'Eyes: Wide-eyed',
            variant09: 'Eyes: Quizzical',
            variant10: 'Eyes: Skeptical',
            variant11: 'Eyes: Mildly Amused',
            variant12: 'Eyes: Mischievous',
            variant13: 'Eyes: Sardonic',
            variant14: 'Eyes: Cynical',
            variant15: 'Eyes: Softly Sorrowful',
            variant16: 'Eyes: Slightly Disenchanted',
            variant17: 'Eyes: Unimpressed gaze',
            variant18: 'Eyes: Nonchalant',
            variant19: 'Eyes: Calmly Satisfied',
            variant20: 'Eyes: Subdued Glow',
            variant21: 'Eyes: Winking Playfulness',
            variant22: 'Eyes: Playfully Squinting',
            variant23: 'Eyes: Slightly Confounded',
            variant24: 'Eyes: Blankly Engaged',
            variant25: 'Eyes: Contemplative',
            variant26: 'Eyes: Slightly Bewildered'
          };
          const mouthLabels = {
            variant01: 'Mouth: Cheerful curve',
            variant02: 'Mouth: Subdued smirk',
            variant03: 'Mouth: Awestruck pout',
            variant04: 'Mouth: Pensive line',
            variant05: 'Mouth: Beaming smile',
            variant06: 'Mouth: Delicate crease',
            variant07: 'Mouth: Shocked oval',
            variant08: 'Mouth: Slight line',
            variant09: 'Mouth: Straight line',
            variant10: 'Mouth: Puffed pout',
            variant11: 'Mouth: Tensed line',
            variant12: 'Mouth: Playful protrusion',
            variant13: 'Mouth: Distorted surprise',
            variant14: 'Mouth: Awkward oval',
            variant15: 'Mouth: Spacious oval',
            variant16: 'Mouth: Playful tongue-out',
            variant17: 'Mouth: Subtle expression',
            variant18: 'Mouth: O-shaped surprise',
            variant19: 'Mouth: Curious line',
            variant20: 'Mouth: Pouty hint',
            variant21: 'Mouth: Tiny tease',
            variant22: 'Mouth: Mischievous twist',
            variant23: 'Mouth: Grinning gap',
            variant24: 'Mouth: Hearted surprise',
            variant25: 'Mouth: Gleeful grin',
            variant26: 'Mouth: Joyful arch',
            variant27: 'Mouth: Excited line',
            variant28: 'Mouth: Joyful beam',
            variant29: 'Mouth: Quirky twist',
            variant30: 'Mouth: Joyful triangle'
          };
          const browLabels = {
            variant01: 'Brows: Boldly Angled',
            variant02: 'Brows: Fiercely Slanted',
            variant03: 'Brows: Subtle Arch',
            variant04: 'Brows: Slightly Curved',
            variant05: 'Brows: Quirky Flick',
            variant06: 'Brows: Playfully Raised',
            variant07: 'Brows: Subdued Lift',
            variant08: 'Brows: Mildly Furrowed',
            variant09: 'Brows: Mildly Arched',
            variant10: 'Brows: Gently Straightened',
            variant11: 'Brows: Slightly Drooped',
            variant12: 'Brows: Softly Straightened',
            variant13: 'Brows: Subtly Defined',
            variant14: 'Brows: Lightly Tapered',
            variant15: 'Brows: Playfully Asymmetrical'
          };
          const glassesLabels = {
            '': 'None',
            variant01: 'Glasses: Round',
            variant02: 'Glasses: Square',
            variant03: 'Glasses: Thin',
            variant04: 'Glasses: Thick',
            variant05: 'Glasses: Cat‑eye'
          };
          const earringsLabels = {
            '': 'None',
            variant01: 'Earrings: Studs',
            variant02: 'Earrings: Hoops',
            variant03: 'Earrings: Drops',
            variant04: 'Earrings: Small Hoops',
            variant05: 'Earrings: Bars',
            variant06: 'Earrings: Stars'
          };
          const hairColorNames = {
            '0e0e0e': 'Black',
            'e5d7a3': 'Blonde',
            '9e5622': 'Brown',
            '763900': 'Dark Brown',
            'cb6820': 'Red',
            'ac6511': 'Copper',
            'b9a05f': 'Sandy',
            '796a45': 'Ash Brown',
            '6a4e35': 'Chestnut',
            '562306': 'Dark Chestnut',
            'afafaf': 'Grey',
            '3eac2c': 'Green',
            '85c2c6': 'Teal',
            'dba3be': 'Pink',
            '592454': 'Plum'
          };
          const skinColorNames = {
            'f2d3b1': 'Fair',
            'ecad80': 'Tan',
            '9e5622': 'Brown',
            '763900': 'Dark Brown'
          };

          function labelFromVariant(prefix, v, map){
            if (map && map[v]) return map[v];
            const sv = String(v);
            if (sv.startsWith('variant')) {
              const n = parseInt(sv.slice(7), 10);
              const num = isNaN(n) ? sv.replace('variant','') : n;
              return `${prefix} Style ${num}`; // e.g., "Mouth Style 9"
            }
            return `${prefix} ${sv}`;
          }
          const hairStyleNames = {
            short01: 'Short: Fluffy layers',
            short02: 'Short: Playful bangs',
            short03: 'Short: Bouncy curls',
            short04: 'Short: Tapered edges',
            short05: 'Short: Top Knot',
            short06: 'Short: Asymmetrical swoop',
            short07: 'Short: Whimsical waves',
            short08: 'Short: Spiraled tufts',
            short09: 'Short: Flared spikes',
            short10: 'Short: Defined bob',
            short11: 'Short: Sleek pompadour',
            short12: 'Short: Bold streak',
            short13: 'Short: Sleek crop',
            short14: 'Short: Bold quiff',
            short15: 'Short: Spiky flair',
            short16: 'Short: Wild spikes',
            short17: 'Short: Textured tufts',
            short18: 'Short: Quirky tufts',
            short19: 'Short: Smoothly cropped',
            long01: 'Long: Sleek sweep',
            long02: 'Long: Playful tousle',
            long03: 'Long: Floral crown',
            long04: 'Long: Angular strands',
            long05: 'Long: Softly rounded',
            long06: 'Long: Lush tendrils',
            long07: 'Long: Choppy fringes',
            long08: 'Long: Floral fringe',
            long09: 'Long: Flowing layers',
            long10: 'Long: Spirited ponytail',
            long11: 'Long: Playful top-knot',
            long12: 'Long: Subtle bob',
            long13: 'Long: Twisted buns',
            long14: 'Long: Double ponytails',
            long15: 'Long: Playful pigtails',
            long16: 'Long: Braided charm',
            long17: 'Long: Playful curls',
            long18: 'Long: Charming waves',
            long19: 'Long: Sleek ponytail',
            long20: 'Long: Angular sweep',
            long21: 'Long: Curved strands',
            long22: 'Long: Lively volume',
            long23: 'Long: Playful buns',
            long24: 'Long: Lively bounce',
            long25: 'Long: Sleek asymmetry',
            long26: 'Long: Vibrant fringes'
          };
          
          function hairLabel(key){
            return hairStyleNames[key] || String(key);
          }
          function fillOptsLabeled(el, values, labeler, withBlank=false){
            el.innerHTML = '';
            if (withBlank) el.appendChild(new Option('Default',''));
            for (const v of values){
              const label = labeler(v);
              const opt = new Option(label, String(v));
              opt.title = label;
              el.appendChild(opt);
            }
          }

          // Fetch optional DB labels so you can manage names without code changes
          async function fetchLabelMap(){
            try {
              const { data, error } = await supabase
                .from('avatar_option_labels')
                .select('option_id,value_key,label');
              if (error || !Array.isArray(data)) return {};
              const map = {};
              for (const r of data) {
                if (!map[r.option_id]) map[r.option_id] = {};
                map[r.option_id][r.value_key] = r.label;
              }
              return map;
            } catch(_) { return {}; }
          }

          const dbLabels = await fetchLabelMap();
          const labelFor = (optId, value, fallback) => {
            const lab = dbLabels?.[optId]?.[String(value)];
            return lab || fallback;
          };

          fillOpts(document.getElementById('opt-backgroundRotation'), rangeArr(0,360,15), true);
          fillOpts(document.getElementById('opt-radius'), rangeArr(0,50,5), true);
          fillOpts(document.getElementById('opt-rotate'), rangeArr(0,360,15), true);
          fillOpts(document.getElementById('opt-translateX'), rangeArr(-50,50,5), true);
          fillOpts(document.getElementById('opt-translateY'), rangeArr(-50,50,5), true);

          // Adventurer variants
          const eyes = Array.from({length:26}, (_,i)=>`variant${pad2(i+1)}`);
          const mouths = Array.from({length:30}, (_,i)=>`variant${pad2(i+1)}`);
          const brows = Array.from({length:15}, (_,i)=>`variant${pad2(i+1)}`);
          const glasses = Array.from({length:5},  (_,i)=>`variant${pad2(i+1)}`);
          const earrings = Array.from({length:6},  (_,i)=>`variant${pad2(i+1)}`);
          const features = ['mustache','blush','birthmark','freckles'];
          const featureLabels = {
            'mustache': 'Facial Hair',
            'blush': 'Rosy Cheeks', 
            'birthmark': 'Beauty Mark',
            'freckles': 'Freckles'
          };
          const hair = [
            ...Array.from({length:19}, (_,i)=>`short${pad2(i+1)}`),
            ...Array.from({length:26}, (_,i)=>`long${pad2(i+1)}`)
          ];
          // Expanded hair color palette to include browns returned by AI
          const hairColors = ['ac6511','cb6820','ab2a18','e5d7a3','b9a05f','796a45','6a4e35','562306','9e5622','763900','0e0e0e','afafaf','3eac2c','85c2c6','dba3be','592454'];
          const skinColors = ['f2d3b1','ecad80','9e5622','763900'];

          fillOptsLabeled(document.getElementById('opt-eyes'), eyes, v=>labelFor('opt-eyes', v, labelFromVariant('Eyes', v, eyeLabels)), true);
          fillOptsLabeled(document.getElementById('opt-mouth'), mouths, v=>labelFor('opt-mouth', v, labelFromVariant('Mouth', v, mouthLabels)), true);
          fillOptsLabeled(document.getElementById('opt-eyebrows'), brows, v=>labelFor('opt-eyebrows', v, labelFromVariant('Brows', v, browLabels)), true);
          fillOptsLabeled(document.getElementById('opt-glasses'), ['','variant01','variant02','variant03','variant04','variant05'], v=>labelFor('opt-glasses', v, (glassesLabels[v] || labelFromVariant('Glasses', v, {}))), false);
          fillOpts(document.getElementById('opt-glassesProbability'), rangeArr(0,100,10), true);
          fillOptsLabeled(document.getElementById('opt-earrings'), ['','variant01','variant02','variant03','variant04','variant05','variant06'], v=>labelFor('opt-earrings', v, (earringsLabels[v] || labelFromVariant('Earrings', v, {}))), false);
          fillOpts(document.getElementById('opt-earringsProbability'), rangeArr(0,100,10), true);
          // features (multi-select)
          const featuresEl = document.getElementById('opt-features');
          if (featuresEl){
            featuresEl.innerHTML = '';
            for (const v of features){ 
              const label = featureLabels[v] || v;
              featuresEl.appendChild(new Option(label, v)); 
            }
          }
          fillOpts(document.getElementById('opt-featuresProbability'), rangeArr(0,100,5), true);
          fillOptsLabeled(document.getElementById('opt-hair'), [''].concat(hair), v=> labelFor('opt-hair', v, (v ? hairLabel(v) : 'Default')), false);
          fillOptsLabeled(document.getElementById('opt-hairColor'), [''].concat(hairColors), hex => labelFor('opt-hairColor', hex, (hex ? ((hairColorNames[hex] ? `${hairColorNames[hex]} (${hex})` : hex)) : 'Default')), false);
          fillOpts(document.getElementById('opt-hairProbability'), rangeArr(0,100,10), true);
          fillOptsLabeled(document.getElementById('opt-skinColor'), [''].concat(skinColors), hex => labelFor('opt-skinColor', hex, (hex ? ((skinColorNames[hex] ? `${skinColorNames[hex]} (${hex})` : hex)) : 'Default')), false);

          // Bind changes
          const ids = [
            'opt-backgroundType','opt-backgroundColor','opt-backgroundRotation','opt-radius','opt-rotate','opt-scale','opt-flip','opt-clip','opt-translateX','opt-translateY','opt-eyes','opt-mouth','opt-eyebrows','opt-glasses','opt-glassesProbability','opt-earrings','opt-earringsProbability','opt-featuresProbability','opt-hair','opt-hairColor','opt-hairProbability','opt-skinColor'
          ];
          ids.forEach(id=>{
            const el = document.getElementById(id);
            if (el && !el.dataset.bound){ 
              el.addEventListener('input', () => {
                updateAvatarPreview();
                // mark that avatar has unsaved manual changes
                window.avatarDirty = true;
                const saveMsg = document.getElementById('avatar-save-msg');
                if (saveMsg) saveMsg.textContent = 'You have unsaved changes — they will be saved when you finish.';
              }); 
              el.dataset.bound='1'; 
            }
          });
          // features (multi-select)
          const featuresMulti = document.getElementById('opt-features');
          if (featuresMulti && !featuresMulti.dataset.bound){ 
            featuresMulti.addEventListener('change', () => {
              updateAvatarPreview();
              window.avatarDirty = true;
              const saveMsg = document.getElementById('avatar-save-msg');
              if (saveMsg) saveMsg.textContent = 'You have unsaved changes — they will be saved when you finish.';
            }); 
            featuresMulti.dataset.bound='1'; 
          }

          // ---------- New: render friendly option buttons for several selects ----------
          const makeOptionButtons = (selectId, opts, renderFn, hideSelect = false) => {
            const sel = document.getElementById(selectId);
            if (!sel) return null;
            // create container after select
            const container = document.createElement('div');
            container.className = 'option-buttons';
            // optionally hide the native select (keep it in DOM for state)
            if (hideSelect) sel.classList.add('select-hidden');
            // For each option create a button
            const values = opts || Array.from(sel.options || []).map(o=> ({ v: o.value, t: o.text }));
            // If opts is provided as array of values, normalize
            const norm = values.map(x => (typeof x === 'string' || typeof x === 'number') ? { v: String(x), t: String(x) } : x);
            norm.forEach(item => {
              // skip empty values (use default behavior)
              if (!item.v || item.v === '') return;
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'option-btn';
              btn.dataset.value = item.v;
              // render content via renderFn or fallback
              if (renderFn) btn.appendChild(renderFn(item)); else btn.textContent = item.t || item.v;
              // click behavior: select corresponding option in native select and trigger input
              btn.addEventListener('click', (e)=>{
                e.preventDefault();
                // handle single vs multi
                if (sel.multiple){
                  const opt = Array.from(sel.options).find(o=>String(o.value)===String(item.v));
                  if (opt) opt.selected = !opt.selected;
                  btn.classList.toggle('selected', !!opt && opt.selected);
                } else {
                  // clear other buttons
                  container.querySelectorAll('.option-btn').forEach(b=> b.classList.remove('selected'));
                  btn.classList.add('selected');
                  // set select value
                  sel.value = item.v;
                }
                // dispatch input event
                sel.dispatchEvent(new Event('input', { bubbles:true }));
                sel.dispatchEvent(new Event('change', { bubbles:true }));
              });
              container.appendChild(btn);
            });
            // insert container after select
            sel.parentNode.insertBefore(container, sel.nextSibling);

            // Initialize selected state from select value(s)
            const syncFromSelect = () => {
              const vals = sel.multiple ? Array.from(sel.selectedOptions).map(o=>String(o.value)) : [String(sel.value)];
              container.querySelectorAll('.option-btn').forEach(b=>{
                const v = String(b.dataset.value);
                b.classList.toggle('selected', vals.includes(v));
              });
            };
            // initial sync
            syncFromSelect();
            // keep in sync if select changes externally
            sel.addEventListener('change', syncFromSelect);
            return container;
          };

          // Helper renderers
          const swatchRenderer = (hex) => {
            const span = document.createElement('span');
            span.className = 'option-swatch';
            span.style.background = `#${hex.v}`;
            span.title = hex.t || hex.v;
            return span;
          };
          const textRenderer = (item) => {
            const span = document.createElement('span');
            span.textContent = item.t || item.v;
            return span;
          };

          // Only render hair color as swatch buttons; keep other options as dropdowns
          try {
            const hairColorOpts = Array.from(document.getElementById('opt-hairColor')?.options||[]).map(o=> ({ v:o.value, t:o.text }));
            makeOptionButtons('opt-hairColor', hairColorOpts, swatchRenderer, true);
          } catch (e) { console.warn('option button render failed', e); }

          // --------------------------------------------------------------------------------

          // Function to mark manual changes and show save button
          function markManualChange() {
            // deprecated: kept for backwards compatibility if other code calls it
            window.avatarDirty = true;
            const saveMsg = document.getElementById('avatar-save-msg');
            if (saveMsg) saveMsg.textContent = 'You have unsaved changes — they will be saved when you finish.';
          }

          // Randomize/reset
          const rnd = document.getElementById('avatar-randomize');
          if (rnd && !rnd.dataset.bound){ rnd.addEventListener('click', ()=>{
            const seeds = ['Nova','Ziggy','Aria','Kai','Milo','Ivy','Atlas','Sage','Skye','Orion','Zoe','Finn','Quinn','Remy'];
            const seed = seeds[Math.floor(Math.random()*seeds.length)] + Math.floor(Math.random()*100);
            try { window.aiSeed = seed; } catch(_) {}
            if (seedEl) seedEl.value = seed;
            const pick = (arr)=> arr[Math.floor(Math.random()*arr.length)];
            document.getElementById('opt-eyes').value = pick(eyes);
            document.getElementById('opt-mouth').value = pick(mouths);
            document.getElementById('opt-eyebrows').value = pick(brows);
            document.getElementById('opt-glasses').value = pick(['','variant01','variant02','variant03','variant04','variant05']);
            document.getElementById('opt-glassesProbability').value = pick(rangeArr(0,100,10));
            document.getElementById('opt-earrings').value = pick(['','variant01','variant02','variant03','variant04','variant05','variant06']);
            document.getElementById('opt-earringsProbability').value = pick(rangeArr(0,100,10));
            document.getElementById('opt-hair').value = pick(hair);
            document.getElementById('opt-hairColor').value = pick(hairColors);
            document.getElementById('opt-hairProbability').value = pick(rangeArr(0,100,10));
            document.getElementById('opt-skinColor').value = pick(skinColors);
            const fEl = document.getElementById('opt-features');
            for (const o of Array.from(fEl.options)) o.selected = false;
            // randomly pick up to 2 features
            const pool = [...features];
            for (let i=0;i<Math.floor(Math.random()*3);i++){
              const idx = Math.floor(Math.random()*pool.length);
              const val = pool.splice(idx,1)[0];
              const opt = Array.from(fEl.options).find(o=>o.value===val); if (opt) opt.selected = true;
            }
            updateAvatarPreview();
            markManualChange(); // Show the save button after randomizing
          }); rnd.dataset.bound='1'; }

          // Save helper used by both AI auto-save and finish/save flow
          // CONSOLIDATED Avatar Save Function - saves to all necessary tables
          async function saveAvatarToSupabase(avatarUrl){
            const saveMsg = document.getElementById('avatar-save-msg');
            console.log('[saveAvatarToSupabase] Starting save with URL:', avatarUrl);
            try {
              const nickVal = String(document.getElementById('nickname')?.value || '').trim() || null;
              const displayName = nickVal || fullName || user?.email?.split('@')[0] || 'Staff';
              if (saveMsg) { saveMsg.textContent = 'Saving avatar...'; }
              console.log('[saveAvatarToSupabase] Nickname:', nickVal, 'Display name:', displayName);

              // 1. Save avatar URL to user metadata
              await supabase.auth.updateUser({
                data: {
                  avatar_url: avatarUrl,
                  nickname: nickVal,
                  role_detail: window.selectedRole || user?.raw_user_meta_data?.role_detail || null,
                  team_id: window.selectedTeamId || null,
                  team_name: window.selectedTeamName || null
                }
              });

              // 2. Save to profiles table (main storage) - CRITICAL FOR HOMEPAGE DISPLAY
              try {
                // First, ensure we have the correct role
                const userRole = window.selectedRole ? window.selectedRole.toLowerCase() : 'staff';

                // Normalize roles to match database constraint
                // Database only allows: admin, staff (other specific roles should default to 'staff')
                let normalizedRole = 'staff';
                if (userRole === 'admin') {
                  normalizedRole = 'admin';
                }
                // All other roles (doctor, nurse, gp, receptionist, etc.) map to 'staff'

                const profileData = {
                  user_id: user.id,
                  avatar_url: avatarUrl,
                  nickname: nickVal,
                  full_name: fullName || displayName,
                  role: normalizedRole
                };
                if (siteId) profileData.site_id = siteId;

                console.log('[saveAvatarToSupabase] Upserting to profiles:', profileData);
                const { data: profileResult, error: profileErr } = await supabase
                  .from('profiles')
                  .upsert(profileData, {
                    onConflict: 'user_id',
                    ignoreDuplicates: false
                  })
                  .select();

                if (profileErr) {
                  console.error('[saveAvatarToSupabase] Profile update error:', profileErr);
                  throw profileErr;
                } else {
                  console.log('[saveAvatarToSupabase] Profile updated successfully:', profileResult);
                }
              } catch (e) {
                console.error('[saveAvatarToSupabase] Profile save exception:', e);
                throw e; // Re-throw to handle upstream
              }

              // 3. Save to staff_app_welcome
              if (siteId) {
                try {
                  const payload = {
                    user_id: user.id,
                    site_id: siteId,
                    full_name: fullName || displayName,
                    nickname: nickVal,
                    avatar_url: avatarUrl,
                    role_detail: window.selectedRole || user?.raw_user_meta_data?.role_detail || null,
                    team_id: window.selectedTeamId || null,
                    team_name: window.selectedTeamName || null
                  };
                  console.log('[saveAvatarToSupabase] Upserting to staff_app_welcome:', payload);
                  await supabase.from('staff_app_welcome').upsert(payload);
                } catch (e) {
                  console.warn('[saveAvatarToSupabase] staff_app_welcome save error:', e);
                  // Non-critical, continue
                }
              }

              // 4. Update master_users with avatar and latest info
              try {
                // First check if profile exists
                const { data: existingProfile } = await supabase
                  .from('master_users')
                  .select('id')
                  .eq('email', user.email)
                  .maybeSingle();

                if (existingProfile) {
                  // Update existing profile with avatar
                  console.log('[saveAvatarToSupabase] Updating master_users with avatar');
                  await supabase
                    .from('master_users')
                    .update({
                      avatar_url: avatarUrl,
                      role: window.selectedRole || user?.raw_user_meta_data?.role || 'Staff',
                      team_name: window.selectedTeamName || null,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', existingProfile.id);
                }
              } catch (e) {
                console.warn('[saveAvatarToSupabase] Holiday profile avatar update error:', e);
                // Non-critical, continue
              }

              window.currentSavedAvatarUrl = avatarUrl;
              window.avatarDirty = false;
              if (saveMsg) saveMsg.innerHTML = '✅ Avatar saved successfully!';
              return true;
            } catch (e) {
              console.error('[saveAvatarToSupabase] Save avatar error:', e);
              if (saveMsg) saveMsg.innerHTML = `❌ Save failed: ${e.message || e}`;
              return false;
            }
          }
          // Expose globally so other handlers (e.g., AI autosave) can call it safely
          try { window.saveAvatarToSupabase = saveAvatarToSupabase; } catch(_) {}

          // Ensure initial dirty state
          window.avatarDirty = false;

          // Back button
          const back = document.getElementById('back-to-step2');
          if (back && !back.dataset.bound){ back.addEventListener('click', ()=>{
            document.getElementById('welcome-step3').style.display = 'none';
            document.getElementById('welcome-step2').style.display = '';
            updateProgressBar(2);
          }); back.dataset.bound='1'; }

          // AI Generate button
          const aiBtn = document.getElementById('avatar-ai-generate');
          if (aiBtn && !aiBtn.dataset.bound){ aiBtn.addEventListener('click', async ()=>{
            const msg = document.getElementById('avatar-ai-msg');
            const originalText = msg.textContent;
            
            // Validate description input
            const prompt = String(document.getElementById('avatarPrompt')?.value||'').trim();
            if (!prompt) {
              msg.textContent = '⚠️ Please enter a description first (e.g., "friendly nurse with brown hair")';
              return;
            }
            
            msg.innerHTML = '🤖 AI is generating your avatar... <span style="opacity:0.7">(this may take a few seconds)</span>';
            aiBtn.disabled = true;
            aiBtn.textContent = 'Generating...';
            
            try{
              const result = await aiGenerateFromDescription();
              msg.innerHTML = `✅ Success! Adjust with settings below.`;
              
              // Auto-focus on preview to draw attention to the result
              const preview = document.getElementById('avatarPreview');
              if (preview) {
                preview.style.transform = 'scale(1.05)';
                setTimeout(() => {
                  preview.style.transform = 'scale(1)';
                  preview.style.transition = 'transform 0.3s ease';
                }, 300);
              }
              
            }catch(e){
              console.error('AI generation error:', e);
              
              // Provide helpful error messages
              let errorMsg = '❌ ';
              if (e.message.includes('Authentication') || e.message.includes('Unauthorized')) {
                errorMsg += 'Please refresh the page and log in again.';
              } else if (e.message.includes('description')) {
                errorMsg += 'Please try a more detailed description.';
              } else if (e.message.includes('Network') || e.message.includes('fetch')) {
                errorMsg += 'Network error. Please check your connection.';
              } else {
                errorMsg += `Generation failed: ${e.message}`;
              }
              
              msg.innerHTML = `${errorMsg} <button onclick="this.parentElement.textContent='${originalText}'" style="margin-left:8px;padding:2px 6px;font-size:11px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;">Dismiss</button>`;
            } finally {
              aiBtn.disabled = false;
              aiBtn.textContent = 'Generate with AI';
            }
          }); aiBtn.dataset.bound='1'; }

          // Continue to working pattern button (renamed from finish button)
          const toWorkingPattern = document.getElementById('to-working-pattern-btn');
          if (toWorkingPattern && !toWorkingPattern.dataset.bound){ toWorkingPattern.addEventListener('click', async ()=>{
            const fm = document.getElementById('finish-avatar-msg');
            fm.textContent = '';

            // Determine current avatar URL
            const avatar = window.currentSavedAvatarUrl || window.currentAvatarUrl || buildAvatarUrlFromControls();

            // If there are unsaved manual changes or avatar not saved yet, save first
            if (window.avatarDirty || !window.currentSavedAvatarUrl) {
              try{
                if (fm) fm.textContent = 'Saving your avatar…';
                const ok = await saveAvatarToSupabase(avatar);
                if (!ok) {
                  if (fm) fm.innerHTML = '❌ Could not save your avatar. Please try again.';
                  return;
                }
              } catch (e) {
                console.error('finish save failed', e);
                if (fm) fm.innerHTML = '❌ Could not save your avatar. Please try again.';
                return;
              }
            }

            try{
              const teamIdNum = (window.selectedTeamId ?? null);
              const role = (window.selectedRole || null);

              // Ensure other selections persist
              try { await persistRoleTeam(role, teamIdNum, (window.selectedTeamName || null), avatar); }
              catch(e){ console.warn('staff_app_welcome sync failed', e); }

              // Update profiles as backup/sync
              try {
                let qp = supabase.from('profiles').update({
                  role_detail: role,
                  avatar_url: avatar,
                  team_id: teamIdNum,
                  team_name: (window.selectedTeamName || null)
                }).eq('user_id', user.id);
                if (siteId) qp = qp.eq('site_id', siteId);
                const { error: upErr } = await qp;
                if (upErr) { console.warn('profiles update failed', upErr); }
              } catch (e) { console.warn('profiles update exception', e); }

              try{ await supabase.auth.updateUser({ data: { role_detail: role, avatar_url: avatar } }); }catch(e){ console.warn('meta update failed', e); }

              try{
                let kioskId = null;
                const { data: ku } = await supabase
                  .from('kiosk_users')
                  .select('id')
                  .eq('site_id', siteId)
                  .eq('full_name', fullName)
                  .maybeSingle();
                kioskId = ku?.id || null;
                if (kioskId){
                  await supabase.from('kiosk_users').update({ role, team_id: teamIdNum, team_name: (window.selectedTeamName || null), active: true }).eq('id', kioskId);
                } else {
                  await supabase.from('kiosk_users').insert({ site_id: siteId, full_name: fullName, role, team_id: teamIdNum, team_name: (window.selectedTeamName || null), active: true });
                }
              } catch(kuErr){ console.info('kiosk_users upsert skipped/failed (policy likely).', kuErr?.message || kuErr); }

              // New: stamp completion in auth metadata and clear onboarding_required
              try {
                const completedAt = new Date().toISOString();
                const { data: { session: freshSession } } = await supabase.auth.getSession();
                const current = freshSession?.user?.user_metadata || freshSession?.user?.raw_user_meta_data || {};
                const newMeta = { ...current, welcome_completed_at: completedAt, onboarding_required: false };
                const upd = await supabase.auth.updateUser({ data: newMeta });
                if (upd.error) console.warn('Could not stamp completion metadata:', upd.error);
              } catch (metaErr) { console.warn('metadata completion update failed', metaErr); }

              // Also update the profiles table to mark onboarding as complete
              try {
                const { error: profileUpdateError } = await supabase
                  .from('profiles')
                  .update({ onboarding_complete: true })
                  .eq('user_id', user.id);
                
                if (profileUpdateError) {
                  console.warn('Could not update onboarding_complete in profiles:', profileUpdateError);
                }
              } catch (e) {
                console.warn('Failed to update profile onboarding status:', e);
              }

              if (fm) fm.textContent = 'Moving to working hours setup…';
              // Go to step 4 (working pattern)
              setTimeout(() => {
                document.getElementById('welcome-step3').style.display = 'none';
                document.getElementById('welcome-step4').style.display = '';
                updateProgressBar(4);
                setupWorkingPatternForm();
              }, 300);
            }catch(err){
              console.error('finish setup error', err);
              if (fm) fm.textContent = 'Could not save your details. Please try again.';
            }
          }); toWorkingPattern.dataset.bound='1'; }

          // Initial render
          updateAvatarPreview();
        }

        // Step 4 - Working Pattern Setup
        let fullBodyAttempted = false;
        async function generateFullBodyAvatarOnce(){
          if (fullBodyAttempted) return; // one-time
            fullBodyAttempted = true;
          try {
            const current = window.currentSavedAvatarUrl || window.currentAvatarUrl || buildAvatarUrlFromControls();
            if (!current) throw new Error('No base avatar URL');
            // Skip if already appears to be full body (heuristic: path contains full_avatars)
            if (/full_avatars\//.test(current)) return;
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('Missing session token');
            const role = (window.selectedRole || session?.user?.raw_user_meta_data?.role_detail || session?.user?.raw_user_meta_data?.role || 'staff');
            const nickname = document.getElementById('nickname')?.value || null;
            const endpoint = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
              ? 'http://127.0.0.1:54321/functions/v1/generate-full-avatar'
              : `${location.origin}/functions/v1/generate-full-avatar`;
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ avatarUrl: current, role, nickname })
            });
            if (!res.ok) throw new Error(`Full body gen failed (${res.status})`);
            const js = await res.json();
            if (js?.full_body_url) {
              // Save to all avatar storage locations for consistency
              console.log('[generateFullBodyAvatarOnce] Saving full body avatar to all tables:', js.full_body_url);
              
              // 1. Update auth metadata
              try { 
                await supabase.auth.updateUser({ data: { avatar_url: js.full_body_url }}); 
              } catch(e) { 
                console.warn('Auth metadata update failed:', e); 
              }
              
              // 2. Update profiles table
              try { 
                await supabase.from('profiles').update({ avatar_url: js.full_body_url }).eq('user_id', session.user.id); 
              } catch(e) { 
                console.warn('Profiles table update failed:', e); 
              }
              
              // 3. Update staff_app_welcome if we have siteId
              if (siteId) {
                try {
                  await supabase.from('staff_app_welcome').update({ avatar_url: js.full_body_url }).eq('user_id', session.user.id);
                } catch(e) {
                  console.warn('staff_app_welcome update failed:', e);
                }
              }
              
              // 4. Update master_users table
              try {
                await supabase
                  .from('master_users')
                  .update({ 
                    avatar_url: js.full_body_url,
                    updated_at: new Date().toISOString()
                  })
                  .eq('email', session.user.email);
              } catch(e) {
                console.warn('master_users table update failed:', e);
              }
              
              window.currentSavedAvatarUrl = js.full_body_url;
            }
          } catch(e){
            console.warn('Full body avatar generation skipped:', e);
          }
        }
        function setupWorkingPatternForm() {
          const container = document.getElementById('pattern-fields-container');
          const roleNote = document.getElementById('role-specific-note');
          const selectedRole = window.selectedRole || '';
          const isGP = selectedRole.toLowerCase().includes('gp');
          
          // Update the role-specific note
          roleNote.textContent = isGP 
            ? 'As a GP, set the number of sessions you work each day (1 or 2 sessions).'
            : 'Set your working hours for each day (in HH:MM format, e.g., 08:00 for 8 hours).';
          
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          
          let fieldsHTML = '<div style="display:grid; gap:12px;">';
          
          days.forEach((day, index) => {
            fieldsHTML += `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:white; border-radius:8px; border:1px solid rgba(15,23,42,0.06);">
                <label style="font-weight:500; color:#374151; min-width:80px;">${dayLabels[index]}</label>
                <div style="display:flex; align-items:center; gap:8px;">
            `;
            
            if (isGP) {
              // For GPs: dropdown with 0, 1, 2 sessions
              const defaultGPSessions = (index >= 0 && index <= 4) ? '2' : '0'; // Monday-Friday default to 2 sessions
              fieldsHTML += `
                <select id="${day}-sessions" style="padding:6px 12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px;">
                  <option value="0" ${defaultGPSessions === '0' ? 'selected' : ''}>0 sessions</option>
                  <option value="1" ${defaultGPSessions === '1' ? 'selected' : ''}>1 session</option>
                  <option value="2" ${defaultGPSessions === '2' ? 'selected' : ''}>2 sessions</option>
                </select>
              `;
            } else {
              // For staff: time input for hours with default 7.5 hours (07:30) Monday-Friday
              const defaultStaffHours = (index >= 0 && index <= 4) ? '07:30' : ''; // Monday-Friday default to 7.5 hours
              fieldsHTML += `
                <input type="time" id="${day}-hours" value="${defaultStaffHours}" style="padding:6px 12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px;" step="1800" max="12:00">
                <span style="color:#6b7280; font-size:14px;">hours</span>
              `;
            }
            
            fieldsHTML += `
                </div>
              </div>
            `;
          });
          
          fieldsHTML += '</div>';
          container.innerHTML = fieldsHTML;
          
          // Attach Complete Setup button event listener here since step 4 is now visible
          setTimeout(() => {
            const finishSetup = document.getElementById('finish-setup-btn');
            if (finishSetup && !finishSetup.dataset.bound) {
              finishSetup.addEventListener('click', async () => {
                const msg = document.getElementById('finish-setup-msg');
                msg.textContent = '';
                
                try {
                  console.log('Complete Setup button clicked!');
                  msg.textContent = 'Saving working pattern...';
                  
                  // Save working pattern to database
                  const success = await saveWorkingPattern();
                  if (!success) {
                    msg.textContent = 'Could not save working pattern. Please try again.';
                    return;
                  }
                  // Generate full body avatar (one-time best effort)
                  msg.textContent = 'Generating full body avatar…';
                  try {
                    await generateFullBodyAvatarOnce();
                    msg.textContent = 'Avatar ready. Completing setup…';
                  } catch(e){
                    console.warn('Full body avatar generation failed (continuing):', e);
                    msg.textContent = 'Completing setup…';
                  }
                  
                  // Mark onboarding as complete (same logic as before but moved here)
                  try {
                    const completedAt = new Date().toISOString();
                    await globalSupabase
                      .from('profiles')
                      .update({ onboarding_completed_at: completedAt })
                      .eq('user_id', globalUser.id);
                  } catch (e) {
                    console.warn('Failed to update profile onboarding status:', e);
                  }
                  
                  msg.textContent = 'All set! Redirecting…';
                  // Force onboarding flag no longer used
                  setTimeout(() => window.location.href = 'staff.html', 600);
                  
                } catch (error) {
                  console.error('Error completing setup:', error);
                  msg.textContent = 'Could not complete setup. Please try again.';
                }
              });
              finishSetup.dataset.bound = '1';
            }
          }, 100);
        }
        
        // Track if we've attempted full body generation to avoid multiple calls
        let fullBodyGenerationAttempted = false;
        
        // Helper to generate full body avatar (one-time only)
        async function generateFullBodyAvatarOnce() {
          if (fullBodyGenerationAttempted) return;
          fullBodyGenerationAttempted = true;
          
          try {
            // Use current saved avatar URL
            const avatarUrl = window.currentSavedAvatarUrl || window.currentAvatarUrl || null;
            if (!avatarUrl) {
              console.warn('No avatar URL available for full body generation');
              return;
            }
            
            // Get current role
            const role = window.selectedRole || user?.raw_user_meta_data?.role_detail || 'staff';
            const nickname = document.getElementById('nickname')?.value || user?.raw_user_meta_data?.nickname || null;
            
            const getEdgeFunctionUrl = () => {
              const loc = window.location;
              if (loc.hostname === '127.0.0.1' || loc.hostname === 'localhost') return 'http://localhost:54321/functions/v1/generate-full-avatar';
              return '/api/generate-full-avatar';
            };
            
            // Call edge function to generate full body image
            const { data, error } = await supabase.functions.invoke('generate-full-avatar', {
              body: { avatarUrl, role, nickname }
            });
            
            if (error) throw new Error(error.message || 'Function call failed');
            if (!data?.full_body_url) throw new Error('No full body avatar URL returned');
            
            console.log('Full body avatar generated successfully');
            
            // No need to save - the edge function updates profiles directly
            return data.full_body_url;
          } catch (e) {
            console.error('Error generating full body avatar:', e);
            throw e;
          }
        }
        
        function updateProgressBar(step) {
          const progressBar = document.querySelector('.progress > .bar');
          if (progressBar) {
            const percentage = (step / 4) * 100;
            progressBar.style.width = `${percentage}%`;
          }
        }

        // Step 4 Navigation Handlers
        document.addEventListener('DOMContentLoaded', () => {
          // Back to step 3
          const backToStep3 = document.getElementById('back-to-step3');
          if (backToStep3) {
            backToStep3.addEventListener('click', () => {
              document.getElementById('welcome-step4').style.display = 'none';
              document.getElementById('welcome-step3').style.display = '';
              updateProgressBar(3);
            });
          }

          // Finish setup button  
          const finishSetup = document.getElementById('finish-setup-btn');
          if (finishSetup) {
            finishSetup.addEventListener('click', async () => {
              const msg = document.getElementById('finish-setup-msg');
              msg.textContent = '';
              
              try {
                // Save working pattern to database
                const success = await saveWorkingPattern();
                if (!success) {
                  msg.textContent = 'Could not save working pattern. Please try again.';
                  return;
                }
                msg.textContent = 'Generating full body avatar…';
                try {
                  await generateFullBodyAvatarOnce();
                  msg.textContent = 'Avatar ready. Completing setup…';
                } catch(e){
                  console.warn('Full body avatar generation failed (continuing):', e);
                  msg.textContent = 'Completing setup…';
                }
                
                // Mark onboarding as complete (same logic as before but moved here)
                try {
                  const completedAt = new Date().toISOString();
                  const { data: { session: freshSession } } = await supabase.auth.getSession();
                  const current = freshSession?.user?.user_metadata || freshSession?.user?.raw_user_meta_data || {};
                  const newMeta = { ...current, welcome_completed_at: completedAt, onboarding_required: false };
                  const upd = await supabase.auth.updateUser({ data: newMeta });
                  if (upd.error) console.warn('Could not stamp completion metadata:', upd.error);
                } catch (metaErr) { console.warn('metadata completion update failed', metaErr); }

                // Also update the profiles table to mark onboarding as complete
                try {
                  const { error: profileUpdateError } = await supabase
                    .from('profiles')
                    .update({ onboarding_complete: true })
                    .eq('user_id', user.id);
                  
                  if (profileUpdateError) {
                    console.warn('Could not update onboarding_complete in profiles:', profileUpdateError);
                  }
                } catch (e) {
                  console.warn('Failed to update profile onboarding status:', e);
                }
                
                msg.textContent = 'All set! Redirecting…';
                // Force onboarding flag removed
                setTimeout(() => window.location.href = 'staff.html', 600);
                
              } catch (error) {
                console.error('Error completing setup:', error);
                msg.textContent = 'Could not complete setup. Please try again.';
              }
            });
          }
        });

        async function saveWorkingPattern() {
          const selectedRole = window.selectedRole || '';
          const isGP = selectedRole.toLowerCase().includes('gp');
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          
          const patternData = {
            user_id: globalUser.id,
            site_id: globalSiteId
          };
          
          // Collect the working pattern data
          let totalHours = 0;
          let totalSessions = 0;
          
          days.forEach(day => {
            if (isGP) {
              const sessions = parseInt(document.getElementById(`${day}-sessions`)?.value || '0');
              patternData[`${day}_sessions`] = sessions;
              patternData[`${day}_hours`] = 0;
              totalSessions += sessions;
            } else {
              const timeValue = document.getElementById(`${day}-hours`)?.value || '00:00';
              const [hours, minutes] = timeValue.split(':').map(Number);
              const decimalHours = hours + (minutes / 60);
              patternData[`${day}_hours`] = decimalHours;
              patternData[`${day}_sessions`] = 0;
              totalHours += decimalHours;
            }
          });
          
          // Set default holiday entitlement based on role
          if (isGP) {
            patternData.total_holiday_entitlement = 20; // 20 sessions for GPs
          } else {
            patternData.total_holiday_entitlement = 25; // 25 days for staff
          }
          
          patternData.approved_holidays_used = 0;
          
          try {
            // Insert or update working pattern in master_users
            const { error } = await globalSupabase
              .from('master_users')
              .update(patternData)
              .eq('auth_user_id', user.id);
            
            if (error) {
              console.error('Error saving working pattern:', error);
              return false;
            }
            
            console.log('Working pattern saved successfully');
            
            // Now populate the master_users table with all the information we have
            try {
              // Get the full name from various sources
              const fullName = globalUserProfile?.full_name || 
                             globalUser?.user_metadata?.full_name || 
                             globalUser?.raw_user_meta_data?.full_name ||
                             globalUser?.email?.split('@')[0] || 
                             'Unknown';
              
              // Get the email
              const email = globalUser?.email || '';
              
              // Get the selected team name (stored when user selected team)
              const teamName = window.selectedTeamName || null;
              
              // Create the holiday profile data
              const holidayProfileData = {
                user_id: globalUser.id,  // Link to auth user
                full_name: fullName,
                role: selectedRole || 'Staff',
                is_gp: isGP,
                email: email,
                team_name: teamName,
                site_id: globalSiteId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              console.log('Creating holiday profile:', holidayProfileData);
              
              // Insert into master_users table
              const { data: profileData, error: profileError } = await globalSupabase
                .from('master_users')
                .update(holidayProfileData)
                .eq('auth_user_id', user.id)
                .select();
              
              if (profileError) {
                console.error('Error creating holiday profile:', profileError);
                // Don't fail the whole process if holiday profile creation fails
                // The working pattern is already saved
              } else {
                console.log('Holiday profile created successfully:', profileData);
                
                // If we got a profile ID back, also create an entitlement record
                if (profileData && profileData[0]?.id) {
                  const currentYear = new Date().getFullYear();
                  const entitlementData = {
                    staff_profile_id: profileData[0].id,
                    year: currentYear,
                    annual_hours: isGP ? null : totalHours * 52, // Annual hours for staff
                    annual_sessions: isGP ? totalSessions * 52 : null, // Annual sessions for GPs
                    annual_education_sessions: isGP ? 10 : null // Default education sessions for GPs
                  };
                  
                  // Entitlement data is now stored directly in master_users - no separate table needed
                  console.log('All holiday data stored in master_users successfully');
                }
              }
            } catch (holidayError) {
              console.error('Exception creating holiday profile:', holidayError);
              // Don't fail the whole process
            }
            
            return true;
            
          } catch (error) {
            console.error('Exception saving working pattern:', error);
            return false;
          }
        }

        function burstConfetti(){
          const conf = document.getElementById('confetti');
          if (!conf) return;
          const colors = ['#60a5fa','#a78bfa','#34d399','#f472b6','#fbbf24'];
          for (let i=0;i<36;i++){
            const bit = document.createElement('div');
            bit.className = 'bit';
            const size = 6 + Math.floor(Math.random()*8);
            bit.style.width = size+'px';
            bit.style.height = size+'px';
            bit.style.left = (10 + Math.random()*80) + 'vw';
            bit.style.top = '-10px';
            bit.style.background = colors[Math.floor(Math.random()*colors.length)];
            bit.style.animationDelay = (Math.random()*120) + 'ms';
            conf.appendChild(bit);
            setTimeout(()=> bit.remove(), 1200);
          }
        }

        async function saveNickname(){
          const input = document.getElementById('nickname');
          const msg = document.getElementById('save-msg');
          msg.textContent = '';
          const val = String(input.value || '').trim();
          if (!val) { msg.textContent = 'Please enter a name to continue.'; return; }

          if (nicknameColumnExists) {
            try{
              let q = supabase.from('profiles').update({ nickname: val }).eq('user_id', user.id);
              if (siteId) q = q.eq('site_id', siteId);
              const { error } = await q;
              if (error && (String(error.code) === '42703' || /column .*nickname/i.test(String(error.message)))) {
                nicknameColumnExists = false; // fall through to guidance
              } else if (error) {
                msg.textContent = 'Could not save nickname. Please try again.';
                console.error('[staff-welcome] update error', error);
                return;
              } else {
                msg.textContent = 'Saved!';
                // Move to step 2
                document.getElementById('welcome-step1').style.display = 'none';
                document.getElementById('welcome-step2').style.display = '';
                updateProgressBar(2);
                await loadDetailsData(siteId, fullName);
                return;
              }
            } catch(e){ nicknameColumnExists = false; }
          }

          // If we reach here, the column likely doesn’t exist — provide SQL guidance
          msg.innerHTML = `
            It looks like the <code>nickname</code> column isn’t in <code>profiles</code> yet.<br>
            Add it in Supabase, then tap Save again:
            <pre style="text-align:left; background:#f9fafb; border:1px solid var(--border-color); border-radius:8px; padding:10px; overflow:auto;">ALTER TABLE public.profiles ADD COLUMN nickname text;</pre>`;
        }

        document.getElementById('save-btn').addEventListener('click', (e)=>{ e.preventDefault(); saveNickname(); });

        // ---- Step 2 helpers ----

        const ROLE_ICON = (name) => ({
          // Using Icons8 Cute Color style (48px). Slugs chosen as reasonable defaults.
          'Doctor': 'https://img.icons8.com/cute-color/48/stethoscope.png',
          'Nurse': 'https://img.icons8.com/cute-color/48/nurse.png',
          'Pharmacist': 'https://img.icons8.com/cute-color/48/pill.png',
          'Reception': 'https://img.icons8.com/cute-color/48/customer-support.png',
          'Manager': 'https://img.icons8.com/cute-color/48/briefcase.png'
        })[name] || 'https://img.icons8.com/cute-color/48/user-male.png';

        // Local fallback icons (in case external hosting is blocked)
        const ROLE_ICON_FALLBACK = (name) => ({
          'Doctor': 'Icons/icons8-stethoscope-100.png',
          'Nurse': 'Icons/icons8-nurse-100.png',
          'Pharmacist': 'Icons/icons8-pharmacist-100.png',
          'Reception': 'Icons/icons8-group-100.png',
          'Manager': 'Icons/icons8-doctors-bag-100.png'
        })[name] || 'Icons/icons8-profile-100.png';

        async function loadDetailsData(siteId, fullName){
          // Load existing welcome data (if any)
          let existing = null;
          try {
            let q = supabase
              .from('staff_app_welcome')
              .select('full_name, nickname, role_detail, team_id, team_name, avatar_url')
              .eq('user_id', user.id)
              .limit(1);
            if (siteId) q = q.eq('site_id', siteId);
            const { data: sawRow, error: sawErr } = await q.maybeSingle();
            if (!sawErr && sawRow) existing = sawRow;
          } catch (_) {}

          // Pre-fill nickname if present
          if (existing) {
            const nn = document.getElementById('nickname');
            if (nn && !nn.value) nn.value = existing.nickname || existing.full_name || nn.value;
            if (existing.avatar_url) {
              window.existingAvatarUrl = existing.avatar_url;
              window.currentSavedAvatarUrl = existing.avatar_url;
            }
          }

          // Build Roles list
          let roles = [];
          try {
            const { data, error } = await supabase.from('kiosk_roles').select('role');
            if (!error && Array.isArray(data) && data.length) roles = data.map(r => r.role);
          } catch(_) {}
          if (!roles.length) roles = ['Doctor','Nurse','Pharmacist','Reception','Manager'];
          // Ensure existing role appears in list
          if (existing && existing.role_detail && !roles.includes(existing.role_detail)) {
            roles = [existing.role_detail, ...roles];
          }
          const rg = document.getElementById('role-grid');
          // expose helper to set fallback src when onerror fires
          window.__roleIconFallback = function(el, role){
            try{ el.onerror = null; el.src = ROLE_ICON_FALLBACK(role); }catch(e){}
          };
          rg.innerHTML = roles.map((r,i)=>{
            const checked = existing && existing.role_detail ? (existing.role_detail === r) : (i===0);
            return `<label class=\"option-pill white-pill\">\n              <input type=\"radio\" name=\"role\" value=\"${r}\" ${checked?'checked':''} />\n              <img src=\"${ROLE_ICON(r)}\" alt=\"${r}\" style=\"width:32px;height:32px;object-fit:contain;\" onerror=\"window.__roleIconFallback(this,'${r}')\"/>\n              <span>${r}</span>\n            </label>`;
          }).join('');

          // Load teams by site (button grid like roles)
          const tg = document.getElementById('team-grid');
          tg.innerHTML = '<div style="opacity:.7; padding:8px 0;">Loading teams…</div>';
          try{
            if (siteId){
              const { data, error } = await supabase.from('teams').select('id,name').eq('site_id', siteId);
              if (error) console.warn('teams load error', error);
              let teams = (data||[]);
              if (!teams.length) {
                teams = [
                  { id: 'managers', name: 'Managers' },
                  { id: 'reception', name: 'Reception' },
                  { id: 'nursing', name: 'Nursing' },
                  { id: 'gps', name: 'GPs' },
                  { id: 'pharmacy', name: 'Pharmacy' },
                ];
              }
              const html = teams.map((t) => {
                const isExisting = existing && ((existing.team_id && String(existing.team_id) === String(t.id)) || (existing.team_name && existing.team_name === t.name));
                return `<label class=\"option-pill white-pill\">\n                  <input type=\"radio\" name=\"team\" value=\"${String(t.id)}\" data-name=\"${t.name}\" ${isExisting ? 'checked' : ''} />\n                  <img src=\"Icons/icons8-people-100.png\" alt=\"${t.name}\" style=\"width:32px;height:32px;object-fit:contain;\"/>\n                  <span>${t.name}</span>\n                </label>`;
              }).join('');
              tg.innerHTML = html || '<div style="opacity:.7; padding:8px 0;">No teams found for this site.</div>';

              // Bind and initialize selection globals
              const onTeamChange = () => {
                const checked = document.querySelector('input[name="team"]:checked');
                if (checked) {
                  window.selectedTeamId = checked.value && /^\\d+$/.test(String(checked.value)) ? parseInt(checked.value, 10) : null;
                  window.selectedTeamName = checked.dataset.name || null;
                } else {
                  window.selectedTeamId = null;
                  window.selectedTeamName = null;
                }
              };
              tg.querySelectorAll('input[name="team"]').forEach(el => el.addEventListener('change', onTeamChange));
              onTeamChange();
            } else {
              tg.innerHTML = '<div style="opacity:.7; padding:8px 0;">No site set</div>';
            }
          }catch(_){ tg.innerHTML = '<div style="opacity:.7; padding:8px 0;">Could not load teams</div>'; }

          // Persist selections helper
          async function persistRoleTeam(role, teamIdNum, teamName, avatarUrl){
            const msgEl = document.getElementById('finish-msg');
            try {
              // 1) Try upsert into new source-of-truth table if it exists
              try {
                const nicknameVal = String(document.getElementById('nickname')?.value || '').trim() || null;
                if (!siteId) {
                  if (msgEl) msgEl.textContent = 'No site detected — saving to profiles only.';
                  throw new Error('NO_SITE_ID');
                }
                const payload = {
                  user_id: user.id,
                  site_id: siteId,
                  full_name: fullName,
                  nickname: nicknameVal,
                  role_detail: role || null,
                  team_id: teamIdNum ?? null,
                  team_name: teamName || null,
                  avatar_url: avatarUrl ?? null
                };
                const { error: sawErr } = await supabase
                  .from('staff_app_welcome')
                  .upsert(payload);
                if (sawErr) {
                  if (msgEl) msgEl.textContent = `Could not save to Staff_App_Welcome (${sawErr.code||''}). Falling back…`;
                  throw sawErr;
                }
              } catch (e) {
                // If table doesn't exist or RLS blocks, continue to profiles fallback
                if (msgEl) msgEl.textContent = 'Saving to profiles…';
              }

              // 2) Also update profiles so existing views stay in sync
              try {
                let qp2 = supabase.from('profiles').update({
                  role_detail: role || null,
                  team_id: teamIdNum ?? null,
                  team_name: teamName || null
                }).eq('user_id', user.id);
                if (siteId) qp2 = qp2.eq('site_id', siteId);
                const { error: pErr } = await qp2;
                if (pErr) { console.warn('[welcome] profiles sync failed', pErr); }
              } catch (e2) {
                console.warn('[welcome] profiles sync exception', e2);
              }
              if (msgEl) msgEl.textContent = 'Saved!';
            } catch (e) {
              console.warn('[welcome] persist selections failed', e);
              if (msgEl) msgEl.textContent = 'Could not save selections (continuing)…';
            }
          }

          // Continue to Step 3 (Avatar Builder)
          const toAvatar = document.getElementById('to-avatar-btn');
          if (toAvatar && !toAvatar.dataset.bound){
            toAvatar.addEventListener('click', async () => {
              const role = (document.querySelector('input[name="role"]:checked')?.value || '').trim();
              const teamRadio = document.querySelector('input[name="team"]:checked');
              const teamVal = teamRadio?.value || '';
              const teamName = teamRadio?.dataset.name || null;

              window.selectedRole = role || null;
              window.selectedTeamId = teamVal && /^\d+$/.test(String(teamVal)) ? parseInt(teamVal, 10) : null;
              window.selectedTeamName = teamName || null;

              // Persist immediately so selections are saved even if user leaves before finishing
              const btn = toAvatar;
              const msgEl = document.getElementById('finish-msg');
              if (msgEl) msgEl.textContent = '';
              btn.disabled = true;
              try {
                await persistRoleTeam(window.selectedRole, window.selectedTeamId, window.selectedTeamName);
              } finally {
                btn.disabled = false;
              }

              document.getElementById('welcome-step2').style.display = 'none';
              document.getElementById('welcome-step3').style.display = '';
              updateProgressBar(3);
              await initAvatarBuilder(fullName);

              // Wire up group toggles (allow collapse/expand)
              try {
                document.querySelectorAll('.group-toggle').forEach(btn => {
                  const target = document.querySelector(btn.dataset.target);
                  if (!target) return;
                  btn.addEventListener('click', () => {
                    const collapsed = target.classList.toggle('collapsed');
                    btn.textContent = collapsed ? 'Show' : 'Hide';
                  });
                });
              } catch (e) { /* non-critical */ }

              // If we have an existing saved avatar, apply it to preview and controls
              try {
                if (window.existingAvatarUrl) {
                  const url = String(window.existingAvatarUrl);
                  window.currentAvatarUrl = url;
                  window.currentSavedAvatarUrl = url;
                  const img = document.getElementById('avatarPreview');
                  if (img) img.src = url;

                  // Parse parameters from DiceBear URL and apply to controls
                  const u = new URL(url);
                  const p = u.searchParams;
                  const map = new Map([
                    ['backgroundType','opt-backgroundType'],
                    ['backgroundColor','opt-backgroundColor'],
                    ['backgroundRotation','opt-backgroundRotation'],
                    ['radius','opt-radius'],
                    ['rotate','opt-rotate'],
                    ['scale','opt-scale'],
                    ['flip','opt-flip'],
                    ['clip','opt-clip'],
                    ['translateX','opt-translateX'],
                    ['translateY','opt-translateY'],
                    ['eyes','opt-eyes'],
                    ['mouth','opt-mouth'],
                    ['eyebrows','opt-eyebrows'],
                    ['glasses','opt-glasses'],
                    ['glassesProbability','opt-glassesProbability'],
                    ['earrings','opt-earrings'],
                    ['earringsProbability','opt-earringsProbability'],
                    ['featuresProbability','opt-featuresProbability'],
                    ['hair','opt-hair'],
                    ['hairColor','opt-hairColor'],
                    ['hairProbability','opt-hairProbability'],
                    ['skinColor','opt-skinColor'],
                  ]);
                  for (const [k,id] of map.entries()){
                    const v = p.get(k);
                    if (v != null && v !== ''){
                      const el = document.getElementById(id);
                      if (el) el.value = v;
                    }
                  }
                  // Handle features (multi)
                  const feats = p.getAll('features');
                  if (feats && feats.length){
                    const fEl = document.getElementById('opt-features');
                    if (fEl){
                      for (const o of Array.from(fEl.options)) o.selected = feats.includes(o.value);
                    }
                  }
                  // Seed
                  const seed = p.get('seed');
                  if (seed) { window.aiSeed = seed; }

                  updateAvatarPreview();
                  // Hide Save button since this avatar is already saved
                  const saveBtn = document.getElementById('avatar-save');
                  if (saveBtn) saveBtn.style.display = 'none';
                }
              } catch (e) { console.info('avatar prefill failed', e); }
            });
            toAvatar.dataset.bound = '1';
          }
        }
      } catch(e){
        if (String(e.message).includes('NO_SESSION')) { 
          console.error('[staff-welcome] No session found, redirecting to login');
          window.location.replace('home.html'); 
          return; 
        }
        // Don't redirect for NOT_STAFF on welcome page - allow profile setup
        if (String(e.message).includes('NOT_STAFF')) { 
          console.warn('[staff-welcome] User role not recognized, allowing profile setup');
          // Continue with basic setup instead of redirecting
          try {
            // Fallback: populate topbar from raw session (non-blocking)
            const { data: { session: raw } = {} } = await supabase.auth.getSession();
            const rUser = raw?.user;
            if (rUser) {
              const meta = rUser.user_metadata || rUser.raw_user_meta_data || {};
              const fallbackSiteId = meta.site_id || null;
              try {
                setTopbar({
                  siteText: fallbackSiteId ? await getSiteText(supabase, fallbackSiteId) : null,
                  email: rUser.email,
                  role: meta.role || meta.role_detail || 'Staff'
                });
              } catch(_) {}
            }
          } catch(_) { /* ignore */ }
        }
        console.error('[staff-welcome] error', e);
      }
    })();
    
    // Icon service functions
    function i8(name, opts = {}) {
      var base  = 'https://img.icons8.com';
      var style = opts.style || 'cute-color';
      var size  = opts.size  || 48;
      // Icons8 OMG-IMG pattern is style/size/name.png
      var path  = [style, String(size), encodeURIComponent(name) + '.png'].join('/');
      return base + '/' + path;
    }
    
    function setIcon(el){
      var name  = el.getAttribute('data-i8');
      var size  = el.getAttribute('data-i8-size');
      var style = el.getAttribute('data-i8-style') || 'fluency';
      var fallback = (el.getAttribute('data-i8-fallback') || '').toLowerCase();
      
      if (fallback === 'auto') {
        var stylesToTry = [style, 'fluency', 'color'];
        var idx = 0;
        function tryNext(){
          if (idx >= stylesToTry.length) { el.onerror = null; return; }
          var url = i8(name, {style: stylesToTry[idx++], size: size ? parseInt(size,10) : undefined});
          if (el.src !== url) el.src = url; else tryNext();
        }
        el.onerror = tryNext;
        tryNext();
      } else {
        el.src = i8(name, {style: style, size: size ? parseInt(size,10) : undefined});
      }
    }
    
    function wireIcons(){
      document.querySelectorAll('img[data-i8]').forEach(setIcon);
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', wireIcons);
    } else {
      wireIcons();
    }
  </script>
</body>
</html>
