/*
  Debug Overlay
  - Floating, toggleable panel that logs:
    * document and page load events
    * resource loads (scripts, stylesheets, images)
    * fetch() and XHR requests
    * console messages (log/info/warn/error)
    * errors and unhandledrejection
  - Persists logs and visibility across navigations via localStorage
  - Zero external deps; inject by adding: <script src="debug-overlay.js"></script>
  - Toggle with keyboard: Ctrl/Cmd + Shift + D
*/
(function(){
  try {
    if (window.__DEBUG_OVERLAY__) return; // prevent double init
    const LS_KEY = 'debugOverlay.logs.v1';
    const LS_VISIBLE = 'debugOverlay.visible.v1';
    const MAX_ENTRIES = 2000; // cap

    const state = {
      visible: (localStorage.getItem(LS_VISIBLE) || 'true') === 'true',
      logs: [],
      start: Date.now(),
      filesUsed: new Set(JSON.parse(localStorage.getItem('debugOverlay.filesUsed.v1')||'[]')),
    };

    // Load prior logs
    try {
      const prev = localStorage.getItem(LS_KEY);
      if (prev) state.logs = JSON.parse(prev);
    } catch(e) {}

    function save() {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state.logs.slice(-MAX_ENTRIES))); } catch(e){}
      try { localStorage.setItem(LS_VISIBLE, state.visible ? 'true':'false'); } catch(e){}
    }

    function ts() {
      const d = new Date();
      return d.toISOString().split('T')[1].replace('Z','');
    }

    function add(type, details){
      const entry = { t: ts(), type, details };
      state.logs.push(entry);
      if (state.logs.length > MAX_ENTRIES) state.logs.shift();
      save();
      if (ui && ui.list) ui.renderEntry(entry);
      // Update filesUsed for known resource-like events
      try {
        const d = String(details||'');
        if (['resource','script','style','image','fetch','xhr','page','nav'].includes(type)) {
          const urlMatch = d.match(/(https?:\/\/[^\s]+|\/[^\s\]]+)/);
          if (urlMatch) {
            const url = urlMatch[1];
            state.filesUsed.add(url);
            localStorage.setItem('debugOverlay.filesUsed.v1', JSON.stringify(Array.from(state.filesUsed)));
            ui.renderFilesUsed(Array.from(state.filesUsed));
          }
        }
      } catch(_) {}
    }

    // UI
    const ui = (function(){
      const wrap = document.createElement('div');
      wrap.id = 'debug-overlay';
      wrap.style.cssText = [
        'position:fixed','z-index:999999','right:10px','bottom:10px','width:36vw','max-width:560px','height:38vh','max-height:420px',
        'background:#0b1020f0','color:#e6f1ff','font:12px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif',
        'border:1px solid #1f2a52','border-radius:8px','box-shadow:0 6px 20px rgba(0,0,0,.35)','display:flex','flex-direction:column'
      ].join(';');

      const header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;background:#101a3a;border-bottom:1px solid #1f2a52;';
      header.innerHTML = '<strong style="letter-spacing:.2px">Debug Overlay</strong>'+
        '<span style="opacity:.75">(Cmd/Ctrl+Shift+D to toggle)</span>';

      const btns = document.createElement('div');
      btns.style.cssText='margin-left:auto;display:flex;gap:6px;';

      function mkBtn(label, title){
        const b=document.createElement('button');
        b.textContent=label; b.title=title;
        b.style.cssText='background:#1a2a5a;color:#e6f1ff;border:1px solid #2a3a7a;border-radius:5px;padding:4px 8px;cursor:pointer;';
        b.onmouseenter=()=>b.style.background='#22346b';
        b.onmouseleave=()=>b.style.background='#1a2a5a';
        return b;
      }

      const clearBtn = mkBtn('Clear','Clear log');
      const dlBtn = mkBtn('Save','Download log as JSON');
      const collapseBtn = mkBtn('Hide','Hide overlay');

      clearBtn.onclick = ()=>{ state.logs.length=0; save(); list.innerHTML=''; };
      dlBtn.onclick = ()=>{
        const blob = new Blob([JSON.stringify(state.logs, null, 2)], {type:'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'debug-overlay-log.json'; a.click();
        setTimeout(()=>URL.revokeObjectURL(a.href), 2500);
      };
      collapseBtn.onclick = ()=>{ api.toggle(false); };

      btns.append(clearBtn, dlBtn, collapseBtn);
      header.appendChild(btns);

      const filterRow = document.createElement('div');
      filterRow.style.cssText='display:flex;gap:8px;align-items:center;padding:6px 10px;background:#0d1533;border-bottom:1px solid #1f2a52;';
      filterRow.innerHTML = '<span style="opacity:.8">Filter:</span>';
      const filterSel = document.createElement('select');
      filterSel.style.cssText='background:#0b1020;color:#e6f1ff;border:1px solid #2a3a7a;border-radius:4px;padding:3px;';
      ;['all','resource','script','style','image','fetch','xhr','console','error','page','nav']
        .forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; filterSel.appendChild(o); });
      filterRow.appendChild(filterSel);

      const tabBtn = document.createElement('button');
      tabBtn.textContent = 'Files';
      tabBtn.title = 'Show unique files used';
      tabBtn.style.cssText='margin-left:8px;background:#1a2a5a;color:#e6f1ff;border:1px solid #2a3a7a;border-radius:5px;padding:4px 8px;cursor:pointer;';
      filterRow.appendChild(tabBtn);

  const body = document.createElement('div');
      body.style.cssText='flex:1;overflow:auto;padding:6px 6px 8px 6px;';

      const list = document.createElement('div');
      list.style.cssText='display:flex;flex-direction:column;gap:2px;';
      body.appendChild(list);

  const filesPanel = document.createElement('div');
  filesPanel.style.cssText='display:none;flex-direction:column;gap:4px;';
  body.appendChild(filesPanel);

      wrap.append(header, filterRow, body);

      function renderEntry(entry){
        if (filterSel.value !== 'all' && entry.type !== filterSel.value) return;
        const row=document.createElement('div');
        const color = {
          error:'#ff6b6b', console:'#a0b4ff', fetch:'#81f0c3', xhr:'#81f0c3', script:'#f3d37a', style:'#7ac7f3', image:'#c7f37a', resource:'#b0f', page:'#ddd', nav:'#ddd'
        }[entry.type] || '#e6f1ff';
        row.style.cssText='display:flex;gap:8px;align-items:flex-start;white-space:nowrap;';
        const time = document.createElement('span'); time.textContent=entry.t; time.style.cssText='opacity:.7;min-width:64px;';
        const type = document.createElement('span'); type.textContent=entry.type; type.style.cssText='color:'+color+';min-width:72px;text-transform:uppercase;';
        const det = document.createElement('span');
        det.textContent= typeof entry.details==='string' ? entry.details : JSON.stringify(entry.details);
        det.style.cssText='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60ch;';
        row.append(time,type,det);
        list.appendChild(row);
        body.scrollTop = body.scrollHeight;
      }

      filterSel.onchange = ()=>{ list.innerHTML=''; filesPanel.style.display='none'; list.style.display='flex'; state.logs.forEach(renderEntry); };

      tabBtn.onclick = ()=>{
        if (filesPanel.style.display === 'none') {
          filesPanel.style.display = 'block';
          list.style.display = 'none';
          renderFilesUsed(Array.from(state.filesUsed));
        } else {
          filesPanel.style.display = 'none';
          list.style.display = 'flex';
        }
      };

      document.addEventListener('keydown', (e)=>{
        const mod = navigator.platform.toLowerCase().includes('mac') ? e.metaKey : e.ctrlKey;
        if (mod && e.shiftKey && (e.key==='D' || e.key==='d')) { api.toggle(); }
      });

      document.body.appendChild(wrap);

      // Load prior
      state.logs.forEach(renderEntry);

      function renderFilesUsed(arr){
        filesPanel.innerHTML='';
        const seen = new Set();
        const ul = document.createElement('ul');
        ul.style.cssText='margin:0;padding-left:18px;line-height:1.4;';
        arr.forEach(u=>{
          if (seen.has(u)) return; seen.add(u);
          const li=document.createElement('li');
          li.textContent=u; li.style.cssText='white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          ul.appendChild(li);
        });
        filesPanel.appendChild(ul);
      }

      return { wrap, list, renderEntry, renderFilesUsed };
    })();

    const api = {
      toggle(force){
        state.visible = typeof force==='boolean' ? force : !state.visible;
        ui.wrap.style.display = state.visible ? 'flex' : 'none';
        save();
      }
    };
    window.__DEBUG_OVERLAY__ = api;

  // initial visibility
    api.toggle(state.visible);

    // Page lifecycle
    add('page', 'DOMContentLoaded pending');
    if (document.readyState === 'complete') add('page','already complete');
    window.addEventListener('DOMContentLoaded', ()=>add('page','DOMContentLoaded'));
    window.addEventListener('load', ()=>add('page','window load'));
    window.addEventListener('pageshow', (e)=>add('nav','pageshow: '+(e.persisted?'bfcache':'fresh')));

    // Performance entries (navigation + resources)
    try {
      if (performance && performance.getEntriesByType) {
        const navs = performance.getEntriesByType('navigation') || [];
        navs.forEach(n => add('nav', `${n.name || location.href} [${Math.round(n.duration)}ms]`));
        const res = performance.getEntriesByType('resource') || [];
        res.forEach(r => add('resource', `${r.initiatorType||'res'}: ${r.name} [${Math.round(r.duration||0)}ms]`));
      }
      if (window.PerformanceObserver) {
        const po = new PerformanceObserver((list)=>{
          list.getEntries().forEach(r => {
            if (r.entryType === 'resource') {
              add('resource', `${r.initiatorType||'res'}: ${r.name} [${Math.round(r.duration||0)}ms]`);
            } else if (r.entryType === 'navigation') {
              add('nav', `${r.name || location.href} [${Math.round(r.duration||0)}ms]`);
            }
          });
        });
        po.observe({ type: 'resource', buffered: true });
        try { po.observe({ type: 'navigation', buffered: true }); } catch(_) {}
      }
    } catch(_) { /* ignore perf errors */ }

    // Error capture
    window.addEventListener('error', (e)=>{
      const msg = (e.message||'error') + (e.filename?(' @ '+e.filename+':'+e.lineno+':'+e.colno):'');
      add('error', msg);
    });
    window.addEventListener('unhandledrejection', (e)=>{
      add('error', 'unhandledrejection: '+(e.reason && (e.reason.stack||e.reason.message||String(e.reason))));
    });

    // Console capture
    ['log','info','warn','error'].forEach(level=>{
      const orig = console[level].bind(console);
      console[level] = function(...args){
        try { add('console', level+': '+args.map(a=> typeof a==='string'?a:JSON.stringify(a)).join(' ')); } catch(e){}
        return orig(...args);
      };
    });

    // Fetch capture
    if (window.fetch) {
      const ofetch = window.fetch.bind(window);
      window.fetch = async function(input, init){
        const url = (typeof input === 'string') ? input : (input && input.url);
        add('fetch', '→ '+url);
        try{
          const res = await ofetch(input, init);
          add('fetch', '← '+url+' ['+res.status+']');
          return res;
        }catch(err){ add('fetch', '× '+url+' ['+(err && err.message||'error')+']'); throw err; }
      }
    }

    // XHR capture
    (function(){
      const O = window.XMLHttpRequest; if (!O) return;
      const open = O.prototype.open, send = O.prototype.send;
      O.prototype.open = function(method, url){ this.__debug_url = url; this.__debug_method=method; return open.apply(this, arguments); };
      O.prototype.send = function(body){
        const url = this.__debug_url; const m = this.__debug_method || 'GET';
        add('xhr', '→ '+m+' '+url);
        this.addEventListener('load', ()=> add('xhr', '← '+m+' '+url+' ['+this.status+']'));
        this.addEventListener('error', ()=> add('xhr', '× '+m+' '+url+' [error]'));
        return send.apply(this, arguments);
      };
    })();

  // Resource list (scripts, links, images, etc.)
    function snapshotResources(){
      const types = [
        ['script','src','script'],
        ['link','href','style'],
        ['img','src','image']
      ];
      types.forEach(([sel, attr, kind])=>{
        document.querySelectorAll(sel+'['+attr+']').forEach(el=>{
          const url = el.getAttribute(attr);
          if (url) add(kind, url);
        });
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', snapshotResources);
    } else {
      snapshotResources();
    }

    // Observe future additions
    const mo = new MutationObserver((mutations)=>{
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes && m.addedNodes.forEach(node=>{
            if (!(node instanceof HTMLElement)) return;
            if (node.tagName === 'SCRIPT' && node.src) add('script', node.src);
            if (node.tagName === 'LINK' && node.href) add('style', node.href);
            if (node.tagName === 'IMG' && node.src) add('image', node.src);
            node.querySelectorAll && node.querySelectorAll('script[src],link[href],img[src]').forEach(el=>{
              if (el.tagName === 'SCRIPT') add('script', el.src);
              if (el.tagName === 'LINK') add('style', el.href);
              if (el.tagName === 'IMG') add('image', el.src);
            });
          });
        }
      }
    });
    mo.observe(document.documentElement, { childList:true, subtree:true });

    // Service Worker registration for 100% capture (requests within scope)
    try {
      if ('serviceWorker' in navigator) {
        const origin = location.origin;
        const swUrl = `${origin}/debug-sw.js`;
        const scope = '/';
        navigator.serviceWorker.register(swUrl, { scope }).then(async reg => {
          add('page','debug-sw registered');
          // Sync current list from SW cache
          try {
            const u = new URL('/__debug__/files.json', location.origin);
            const res = await fetch(u.toString(), { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.files)) {
                data.files.forEach(u => state.filesUsed.add(u));
                localStorage.setItem('debugOverlay.filesUsed.v1', JSON.stringify(Array.from(state.filesUsed)));
                ui.renderFilesUsed(Array.from(state.filesUsed));
              }
            }
          } catch(_) {}
        }).catch(err => add('error','debug-sw register failed: '+(err && err.message||err)));
        navigator.serviceWorker.addEventListener('message', (ev)=>{
          if (ev?.data?.type === 'debug-overlay:list:update' && ev.data.list) {
            const arr = Array.isArray(ev.data.list.files) ? ev.data.list.files : [];
            arr.forEach(u => state.filesUsed.add(u));
            localStorage.setItem('debugOverlay.filesUsed.v1', JSON.stringify(Array.from(state.filesUsed)));
            ui.renderFilesUsed(Array.from(state.filesUsed));
          }
        });
      }
    } catch(_) {}

    add('page','debug-overlay initialized');
  } catch(err) {
    try { console.error('debug-overlay init error', err); } catch(e){}
  }
})();
