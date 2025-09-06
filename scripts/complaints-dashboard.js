// complaints-dashboard.js
// Module to handle complaints dashboard interactions: selection, export, bulk-resolve,
// per-row actions, server-backed trend fetching and UI updates.

// NOTE: This file assumes `supabase` and `ctx` are available globally (same as other scripts in the app).

const tb = document.getElementById('complaints-tbody');
const selectAll = document.getElementById('cmp-select-all');
const btnExport = document.getElementById('complaints-export');
const btnBulkExport = document.getElementById('complaints-bulk-export');
const btnBulkResolve = document.getElementById('complaints-mark-resolved');
const trendSvg = document.getElementById('complaints-trend');
const startInput = document.getElementById('complaints-filter-start');
const endInput = document.getElementById('complaints-filter-end');
const catSelect = document.getElementById('complaints-filter-category');
const statusSelect = document.getElementById('complaints-filter-status');
const searchInput = document.getElementById('complaints-search');

function parseDateText(text){ const d = new Date(text); return isNaN(d) ? null : d; }

// Keep a set of selected complaint ids
const selected = new Set();

function rowIdFromTr(tr){ return tr.getAttribute('data-id'); }

function updateSelectAllCheckbox(){
  const rows = Array.from(tb.querySelectorAll('tr[data-id]')).filter(r => r.style.display !== 'none');
  if(rows.length === 0){ selectAll.checked = false; selectAll.indeterminate = false; return; }
  const sel = rows.filter(r => selected.has(rowIdFromTr(r))).length;
  selectAll.checked = sel === rows.length;
  selectAll.indeterminate = sel > 0 && sel < rows.length;
}

function toggleRowSelection(id, checked){ if(checked) selected.add(id); else selected.delete(id); updateSelectAllCheckbox(); }

function attachRowControls(tr){
  const id = rowIdFromTr(tr);
  if(!id) return;
  // add checkbox cell if not present
  if(!tr.querySelector('.cmp-select')){
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'cmp-select'; cb.addEventListener('change', (e)=>{ toggleRowSelection(id, e.target.checked); });
    const td = document.createElement('td'); td.style.width='36px'; td.appendChild(cb);
    tr.insertBefore(td, tr.firstChild);
  }
  // add actions cell
  if(!tr.querySelector('.cmp-actions')){
    const td = document.createElement('td'); td.className = 'cmp-actions'; td.style.whiteSpace='nowrap';
    const viewBtn = document.createElement('button'); viewBtn.className = 'pir-action-btn'; viewBtn.textContent = 'View'; viewBtn.style.marginRight='6px';
    viewBtn.addEventListener('click', ()=>openViewModal(id));
    const attachBtn = document.createElement('button'); attachBtn.className = 'pir-action-btn'; attachBtn.textContent = 'Attach';
    attachBtn.addEventListener('click', ()=>openAttachDialog(id));
    td.appendChild(viewBtn); td.appendChild(attachBtn);
    tr.appendChild(td);
  }
}

function openViewModal(id){
  // reuse existing CRUD view if available, otherwise build simple modal
  if(window.openCRUD){
    openCRUD('complaints','edit', id);
    return;
  }
  alert('View complaint '+id);
}

function openAttachDialog(id){
  // reuse existing upload logic where possible; fallback to file prompt
  const input = document.createElement('input'); input.type='file';
  input.onchange = async(e)=>{
    const f = e.target.files[0]; if(!f) return;
    // attempt to upload using existing storage path logic (same as other complaint attachment code)
    try{
      const safeName = f.name.replace(/[^a-zA-Z0-9.\-_]/g,'_');
      const storagePath = `complaints/${ctx.site_id}/${id}/${safeName}`;
      const { data, error } = await supabase.storage.from('uploads').upload(storagePath, f, { upsert: true });
      if(error) throw error;
      // update complaint row to indicate attachment (best-effort)
      await supabase.from('complaints').update({ file_path: storagePath }).eq('id', id);
      // reload complaints
      if(window.loadComplaints) await loadComplaints();
      alert('File uploaded');
    }catch(err){ console.error(err); alert('Upload failed: '+err.message); }
  };
  input.click();
}

async function exportSelected(){
  if(selected.size === 0){ alert('No rows selected'); return; }
  const ids = Array.from(selected);
  // fetch full rows
  const { data, error } = await supabase.from('complaints').select('*').in('id', ids);
  if(error){ alert('Export failed: '+error.message); return; }
  const csv = toCSV(data);
  downloadBlob(csv, 'complaints-export.csv');
}

function toCSV(rows){
  if(!rows || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const esc = v => '"'+String(v===null||v===undefined?'':v).replace(/"/g,'""')+'"';
  const out = [keys.map(esc).join(',')];
  rows.forEach(r=> out.push(keys.map(k=>esc(r[k])).join(',')));
  return out.join('\n');
}

function downloadBlob(text, filename){
  const blob = new Blob([text], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

async function markSelectedResolved(){
  if(selected.size === 0){ alert('No rows selected'); return; }
  if(!confirm('Mark selected complaints as resolved?')) return;
  const ids = Array.from(selected);
  try{
    const { error } = await supabase.from('complaints').update({ status: 'resolved', resolved_at: new Date().toISOString() }).in('id', ids);
    if(error) throw error;
    if(window.loadComplaints) await loadComplaints();
    selected.clear(); updateSelectAllCheckbox();
  }catch(err){ console.error(err); alert('Failed to mark resolved: '+err.message); }
}

// Wire up select-all
if(selectAll){ selectAll.addEventListener('change', ()=>{
  const checked = selectAll.checked;
  Array.from(tb.querySelectorAll('tr[data-id]')).forEach(r=>{
    if(r.style.display === 'none') return;
    const id = rowIdFromTr(r);
    const cb = r.querySelector('.cmp-select');
    if(cb) cb.checked = checked; else {
      // create if missing
      const ncb = document.createElement('input'); ncb.type='checkbox'; ncb.className='cmp-select'; ncb.checked = checked; ncb.addEventListener('change', (e)=> toggleRowSelection(rowIdFromTr(r), e.target.checked));
      const td = document.createElement('td'); td.style.width='36px'; td.appendChild(ncb);
      r.insertBefore(td, r.firstChild);
    }
    toggleRowSelection(id, checked);
  });
}); }

// Attach controls to rows when they are added
const mo = new MutationObserver((muts)=>{
  muts.forEach(mu=>{
    mu.addedNodes && mu.addedNodes.forEach(n=>{ if(n.nodeType===1 && n.matches('tr[data-id]')) attachRowControls(n); });
  });
});
mo.observe(tb, { childList:true });

// initial attach for existing rows
Array.from(tb.querySelectorAll('tr[data-id]')).forEach(attachRowControls);

// Wire buttons
if(btnBulkExport) btnBulkExport.addEventListener('click', exportSelected);
if(btnExport) btnExport.addEventListener('click', async ()=>{ const { data } = await supabase.from('complaints').select('*').eq('site_id', ctx.site_id); downloadBlob(toCSV(data||[]), 'complaints-all.csv'); });
if(btnBulkResolve) btnBulkResolve.addEventListener('click', markSelectedResolved);

// Filters logic: reuse existing simple client-side approach but moved here
function filterRows(){
  const s = startInput.value ? new Date(startInput.value) : null;
  const e = endInput.value ? new Date(endInput.value) : null;
  const catv = catSelect.value;
  const stv = (statusSelect.value||'').toLowerCase();
  const q = (searchInput.value||'').toLowerCase().trim();
  Array.from(tb.querySelectorAll('tr[data-id]')).forEach(r=>{
    const tds = r.children;
    // note: first cell may now be checkbox
    const dtCellIndex = 1; // after checkbox
    const catIndex = 3;
    const statusIndex = 7;
    const dt = parseDateText(tds[dtCellIndex]?.textContent?.trim());
    const category = (tds[catIndex]?.textContent||'').trim();
    const statusText = (tds[statusIndex]?.textContent||'').trim().toLowerCase();
    const text = (r.textContent||'').toLowerCase();
    let ok = true;
    if(s && (!dt || dt < s)) ok = false;
    if(e && (!dt || dt > new Date(e.getFullYear(), e.getMonth(), e.getDate(),23,59,59))) ok = false;
    if(catv && category !== catv) ok = false;
    if(stv && !statusText.includes(stv)) ok = false;
    if(q && !text.includes(q)) ok = false;
    r.style.display = ok ? '' : 'none';
  });
  updateSelectAllCheckbox();
}
[startInput, endInput, catSelect, statusSelect, searchInput].forEach(el=>el && el.addEventListener('input', filterRows));

// Server-backed trend: fetch counts grouped by day for the last 30 days.
async function fetchTrendData(){
  try{
    const now = new Date();
    const startDate = new Date(now); startDate.setDate(now.getDate()-29);
    // Postgres query via supabase: select date_trunc('day', datetime) as day, count(*) from complaints where site_id=.. and datetime >= startDate group by 1 order by 1
    const sql = `select to_char(date_trunc('day', datetime), 'YYYY-MM-DD') as day, count(*)::int as cnt from complaints where site_id = ${ctx.site_id} and datetime >= '${startDate.toISOString()}' group by 1 order by 1`;
    const { data, error } = await supabase.rpc('sql', { q: sql }).catch(()=>({ error: { message: 'RPC sql not available' } }));
    // fallback: use client-side counts if RPC not available
    if(error || !data){
      // build from DOM
      const countsByDay = {};
      const rows = Array.from(tb.querySelectorAll('tr[data-id]'));
      const cutoff = startDate;
      rows.forEach(r=>{
        const dt = parseDateText(r.children[1]?.textContent?.trim());
        if(dt && dt >= cutoff){ const k = dt.toISOString().slice(0,10); countsByDay[k] = (countsByDay[k]||0)+1; }
      });
      drawTrend(countsByDay);
      return;
    }
    // data expected as array of {day, cnt}
    const countsByDay = {};
    (data||[]).forEach(row=>{ countsByDay[row.day] = row.cnt; });
    drawTrend(countsByDay);
  }catch(err){ console.error('trend fetch failed', err); }
}

function drawTrend(countsByDay){
  const days = [];
  const now = new Date();
  for(let i=29;i>=0;i--){ const d=new Date(now); d.setDate(now.getDate()-i); const key = d.toISOString().slice(0,10); days.push(countsByDay[key]||0); }
  const w=600, h=120; const max = Math.max(1, ...days);
  
  // Create animated gradient and glow effects
  const points = days.map((v,i)=> (i*(w/(days.length-1))) + ',' + (h - (v/max)*(h-20))).join(' ');
  
  trendSvg.setAttribute('viewBox','0 0 '+w+' '+h);
  trendSvg.innerHTML = `
    <defs>
      <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.05" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Area fill -->
    <path fill="url(#areaGradient)" d="M0,${h} L${points.split(' ').map(p => p.replace(',', ' L')).join(' ')} L${w},${h} Z" opacity="0">
      <animate attributeName="opacity" from="0" to="1" dur="1.5s" fill="freeze"/>
    </path>
    
    <!-- Main trend line with glow -->
    <polyline fill="none" stroke="url(#trendGradient)" stroke-width="4" 
              points="${points}" stroke-linejoin="round" stroke-linecap="round"
              filter="url(#glow)" stroke-dasharray="${w*2}" stroke-dashoffset="${w*2}">
      <animate attributeName="stroke-dashoffset" from="${w*2}" to="0" dur="2s" fill="freeze"/>
    </polyline>
    
    <!-- Animated data points -->
    ${days.map((v,i) => {
      const x = i*(w/(days.length-1));
      const y = h - (v/max)*(h-20);
      return `
        <circle cx="${x}" cy="${y}" r="0" fill="#fff" stroke="url(#trendGradient)" stroke-width="2">
          <animate attributeName="r" from="0" to="4" dur="0.5s" begin="${0.1*i}s" fill="freeze"/>
        </circle>
        <circle cx="${x}" cy="${y}" r="0" fill="url(#trendGradient)" opacity="0.3">
          <animate attributeName="r" from="0" to="8" dur="0.8s" begin="${0.1*i}s" fill="freeze"/>
          <animate attributeName="opacity" from="0.5" to="0" dur="2s" begin="${0.1*i}s" repeatCount="indefinite"/>
        </circle>
      `;
    }).join('')}
  `;
}

// Listen for complaints reloads to refresh UI and trend
if(window.loadComplaints){
  const origLoad = window.loadComplaints;
  window.loadComplaints = async function(){
    await origLoad.apply(this, arguments);
    // attach controls to new rows
    Array.from(tb.querySelectorAll('tr[data-id]')).forEach(attachRowControls);
    // run filter and UI refresh
    filterRows();
    await fetchTrendData();
  };
}

// Initial fetch trend and attach existing rows
Array.from(tb.querySelectorAll('tr[data-id]')).forEach(attachRowControls);
fetchTrendData();

export { };
