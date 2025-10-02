// Element-specific Supabase Debug Tool
(function() {
  'use strict';

  // DISABLED: Debug UI is hidden - uncomment the return statement below to re-enable
  return; // Exit early to prevent debug UI from being created

  console.log('🔍 Supabase Debug Tool initializing...');

  // Track queries and associate them with elements
  window.supabaseQueries = [];
  window.elementDataMap = new WeakMap();

  // Wait for Supabase to be available
  function hookSupabase() {
    if (!window.supabase || !window.supabase.from) {
      return false;
    }

    if (window.supabase.from._hooked) {
      return true;
    }

    const originalFrom = window.supabase.from.bind(window.supabase);

    window.supabase.from = function(table) {
      const result = originalFrom(table);
      const queryInfo = {
        table: table,
        timestamp: new Date().toISOString(),
        operation: null,
        columns: null,
        status: 'pending',
        error: null,
        data: null
      };

      // Track methods
      ['select', 'insert', 'update', 'delete', 'upsert'].forEach(method => {
        const original = result[method];
        if (!original) return;

        result[method] = function(...args) {
          queryInfo.operation = method.toUpperCase();

          // For SELECT, track which columns are being fetched
          if (method === 'select' && args[0]) {
            queryInfo.columns = args[0];
          }

          const queryResult = original.apply(this, args);

          // Track the promise resolution
          const originalThen = queryResult.then;
          queryResult.then = function(onFulfilled, onRejected) {
            return originalThen.call(this,
              (response) => {
                // Capture the response
                if (response.error) {
                  queryInfo.status = 'error';
                  queryInfo.error = response.error.message;
                } else {
                  queryInfo.status = 'success';
                  queryInfo.data = response.data;

                  // Try to find and tag related DOM elements
                  tagRelatedElements(queryInfo);
                }

                // Store query
                window.supabaseQueries.push(queryInfo);
                if (window.supabaseQueries.length > 100) {
                  window.supabaseQueries.shift();
                }

                return onFulfilled ? onFulfilled(response) : response;
              },
              onRejected
            );
          };

          return queryResult;
        };
      });

      return result;
    };

    window.supabase.from._hooked = true;
    console.log('✅ Supabase Debug Tool ready! Ctrl+Right-click to inspect.');
    return true;
  }

  // Function to tag DOM elements with their data source
  function tagRelatedElements(queryInfo) {
    // After a successful query, try to find elements that might display this data
    setTimeout(() => {
      // Special handling for known elements
      if (queryInfo.table === 'master_users' && queryInfo.status === 'success' && queryInfo.data) {
        const data = Array.isArray(queryInfo.data) ? queryInfo.data[0] : queryInfo.data;

        // Site pill removed per request

        // Tag role pill
        const rolePill = document.getElementById('role-pill');
        if (rolePill && (data.access_type || data.role)) {
          let elementData = window.elementDataMap.get(rolePill) || {};
          elementData.table = 'master_users';
          elementData.column = data.access_type ? 'access_type' : 'role';
          elementData.value = data.access_type || data.role;
          elementData.query = queryInfo;
          window.elementDataMap.set(rolePill, elementData);
        }

        // Tag email pill
        const emailPill = document.getElementById('email-pill');
        if (emailPill && data.email) {
          let elementData = window.elementDataMap.get(emailPill) || {};
          elementData.table = 'master_users';
          elementData.column = 'email';
          elementData.value = data.email;
          elementData.query = queryInfo;
          window.elementDataMap.set(emailPill, elementData);
        }

        // Tag welcome message
        const welcome = document.getElementById('welcome');
        if (welcome && (data.nickname || data.full_name)) {
          let elementData = window.elementDataMap.get(welcome) || {};
          elementData.table = 'master_users';
          elementData.column = data.nickname ? 'nickname' : 'full_name';
          elementData.value = data.nickname || data.full_name;
          elementData.query = queryInfo;
          window.elementDataMap.set(welcome, elementData);
        }
      }

      // Handle sites table queries
      if (queryInfo.table === 'sites' && queryInfo.status === 'success' && queryInfo.data) {
        // Site pill has been removed per request
      }
    }, 100);
  }

  // Try to hook every 100ms until successful
  let attempts = 0;
  const hookInterval = setInterval(() => {
    attempts++;
    if (hookSupabase() || attempts > 100) {
      clearInterval(hookInterval);
    }
  }, 100);

  // Create element-specific debug popup
  function showDebugPopup(element, x, y) {
    // Remove any existing popup
    const existing = document.getElementById('supabase-debug-popup');
    if (existing) existing.remove();

    // Get element info
    const elementInfo = {
      tag: element.tagName,
      id: element.id || 'none',
      classes: element.className || 'none',
      text: (element.textContent || '').substring(0, 50)
    };

    const pageInfo = {
      url: window.location.href,
      path: window.location.pathname,
      origin: window.location.origin,
      title: document.title || '',
      timestamp: new Date().toISOString()
    };

    // Get data associated with this specific element
    let elementData = window.elementDataMap.get(element) || null;

    // Create popup
    const popup = document.createElement('div');
    popup.id = 'supabase-debug-popup';
    popup.style.cssText = `
      position: fixed;
      left: ${Math.min(x, window.innerWidth - 400)}px;
      top: ${Math.min(y, window.innerHeight - 300)}px;
      width: 380px;
      background: white;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 2147483647;
      font-family: monospace;
      font-size: 12px;
    `;

    let debugInfo = {
      page: pageInfo,
      element: elementInfo,
      dataSource: elementData ? {
        table: elementData.table,
        column: elementData.column,
        value: elementData.value,
        status: elementData.query?.status,
        error: elementData.query?.error
      } : null
    };

    function renderPopupContent(ed){
      const hasData = !!ed;
      return `
      <div style="background: #4CAF50; color: white; padding: 8px 12px; font-weight: bold; border-radius: 6px 6px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <span>🔍 Element Debug Info</span>
        <button onclick="document.getElementById('supabase-debug-popup').remove()" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; padding: 0; margin: 0;">×</button>
      </div>
      <div style="padding: 12px;">
        <div style="margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #333;">PAGE:</div>
          <div style="color: #666; word-break: break-all;">URL: <span style="color: #000;">${pageInfo.url}</span></div>
          <div style="color: #666;">Title: <span style="color: #000;">${pageInfo.title}</span></div>
        </div>

        <div style="margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #333;">ELEMENT:</div>
          <div style="color: #666;">Tag: <span style="color: #000;">${elementInfo.tag}</span></div>
          <div style="color: #666;">ID: <span style="color: #000;">${elementInfo.id}</span></div>
          <div style="color: #666;">Classes: <span style="color: #000;">${elementInfo.classes}</span></div>
          ${elementInfo.text ? `<div style="color: #666;">Text: <span style="color: #000;">"${elementInfo.text}..."</span></div>` : ''}
        </div>

        <div style="margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #333;">DATA SOURCE:</div>
          ${hasData ? `
            <div style="color: #666;">Table: <span style="color: #2196F3; font-weight: bold;">${ed.table}</span></div>
            <div style="color: #666;">Column: <span style="color: #9C27B0; font-weight: bold;">${ed.column}</span></div>
            <div style="color: #666;">Current Value: <span style="color: #000;">${ed.value ?? 'null'}</span></div>
            ${ed.relatedTable ? `
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #ddd;">
                <div style="color: #666;">Related Table: <span style="color: #2196F3; font-weight: bold;">${ed.relatedTable}</span></div>
                <div style="color: #666;">Related Column: <span style="color: #9C27B0; font-weight: bold;">${ed.relatedColumn}</span></div>
                <div style="color: #666;">Related Value: <span style="color: #000;">${ed.relatedValue ?? 'null'}</span></div>
                ${ed.relatedStatus ? `<div style="color: ${ed.relatedStatus === 'success' ? '#4CAF50' : ed.relatedStatus === 'error' ? '#f44336' : '#ff9800'};">Related Status: ${ed.relatedStatus}</div>` : ''}
                ${ed.relatedError ? `<div style=\"color: #f44336;\">Related Error: ${ed.relatedError}</div>` : ''}
              </div>
            ` : ''}
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #ddd;">
              <div style="color: ${ed.query?.status === 'success' ? '#4CAF50' : ed.query?.status === 'error' ? '#f44336' : '#ff9800'};">
                Status: ${ed.query?.status || 'inferred'}
                ${ed.query?.error ? `<br>Error: ${ed.query.error}` : ''}
                ${ed.query?.note ? `<br>Note: ${ed.query.note}` : ''}
              </div>
            </div>
          ` : `
            <div style="color: #999;">No data source detected for this element</div>
            <div style="color: #666; font-size: 10px; margin-top: 4px;">This element may not be populated from Supabase, or the data hasn't loaded yet.</div>
          `}
        </div>

        <button id="debug-copy-btn" style="
          width: 100%;
          padding: 8px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        ">📋 COPY DEBUG INFO</button>
      </div>
    `;
    }

    popup.innerHTML = renderPopupContent(elementData);

    document.body.appendChild(popup);

    // Add copy functionality
    document.getElementById('debug-copy-btn').onclick = function() {
      const lines = [];
      lines.push('=== ELEMENT DEBUG INFO ===');
      lines.push('PAGE:');
      lines.push(`- URL: ${pageInfo.url}`);
      lines.push(`- Title: ${pageInfo.title}`);
      lines.push('');
      lines.push('ELEMENT:');
      lines.push(`- Tag: ${elementInfo.tag}`);
      lines.push(`- ID: ${elementInfo.id}`);
      lines.push(`- Classes: ${elementInfo.classes}`);
      if (elementInfo.selector) lines.push(`- Selector: ${elementInfo.selector}`);
      if (elementInfo.text) lines.push(`- Text: "${elementInfo.text}..."`);
      lines.push('');
      lines.push('DATA SOURCE:');
      if (elementData) {
        lines.push(`- Table: ${elementData.table}`);
        lines.push(`- Column: ${elementData.column}`);
        lines.push(`- Value: ${elementData.value ?? 'null'}`);
        if (elementData.relatedTable) {
          lines.push(`- Related Table: ${elementData.relatedTable}`);
          lines.push(`- Related Column: ${elementData.relatedColumn}`);
          if ('relatedValue' in elementData) lines.push(`- Related Value: ${elementData.relatedValue ?? 'null'}`);
          if (elementData.relatedStatus) lines.push(`- Related Status: ${elementData.relatedStatus}`);
          if (elementData.relatedError) lines.push(`- Related Error: ${elementData.relatedError}`);
        }
        lines.push(`- Status: ${elementData.query?.status || 'unknown'}`);
        if (elementData.query?.error) lines.push(`- Error: ${elementData.query.error}`);
        if (elementData.query?.note) lines.push(`- Note: ${elementData.query.note}`);
      } else {
        lines.push('No data source detected for this element');
      }
      lines.push('');
      lines.push('RAW DATA:');
      lines.push(JSON.stringify(debugInfo, null, 2));
      lines.push('===========================');
      const copyText = lines.join('\n');

      navigator.clipboard.writeText(copyText).then(() => {
        this.textContent = '✓ COPIED!';
        this.style.background = '#4CAF50';
        setTimeout(() => {
          this.textContent = '📋 COPY DEBUG INFO';
        }, 2000);
      }).catch(err => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = copyText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.textContent = '✓ COPIED!';
        setTimeout(() => {
          this.textContent = '📋 COPY DEBUG INFO';
        }, 2000);
      });
    };

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function closePopup(e) {
        if (!popup.contains(e.target)) {
          popup.remove();
          document.removeEventListener('click', closePopup);
        }
      });
    }, 100);

    // If no data was found from captured queries, try to infer it on-demand
    if (!elementData) {
      tryInferElementData(element).then(inferred => {
        if (inferred) {
          elementData = inferred;
          window.elementDataMap.set(element, inferred);
          // Refresh content with newly inferred data
          popup.innerHTML = renderPopupContent(elementData);
          // Re-bind copy handler after rerender
          document.getElementById('debug-copy-btn').onclick = function() {
            const lines = [];
            lines.push('=== ELEMENT DEBUG INFO ===');
            lines.push('PAGE:');
            lines.push(`- URL: ${pageInfo.url}`);
            lines.push(`- Title: ${pageInfo.title}`);
            lines.push('');
            lines.push('ELEMENT:');
            lines.push(`- Tag: ${elementInfo.tag}`);
            lines.push(`- ID: ${elementInfo.id}`);
            lines.push(`- Classes: ${elementInfo.classes}`);
            if (elementInfo.selector) lines.push(`- Selector: ${elementInfo.selector}`);
            if (elementInfo.text) lines.push(`- Text: "${elementInfo.text}..."`);
            lines.push('');
            lines.push('DATA SOURCE:');
            lines.push(`- Table: ${elementData.table}`);
            lines.push(`- Column: ${elementData.column}`);
            lines.push(`- Value: ${elementData.value ?? 'null'}`);
            if (elementData.relatedTable) {
              lines.push(`- Related Table: ${elementData.relatedTable}`);
              lines.push(`- Related Column: ${elementData.relatedColumn}`);
              if ('relatedValue' in elementData) lines.push(`- Related Value: ${elementData.relatedValue ?? 'null'}`);
              if (elementData.relatedStatus) lines.push(`- Related Status: ${elementData.relatedStatus}`);
              if (elementData.relatedError) lines.push(`- Related Error: ${elementData.relatedError}`);
            }
            lines.push(`- Status: ${elementData.query?.status || 'inferred'}`);
            if (elementData.query?.error) lines.push(`- Error: ${elementData.query.error}`);
            if (elementData.query?.note) lines.push(`- Note: ${elementData.query.note}`);
            lines.push('');
            lines.push('RAW DATA:');
            lines.push(JSON.stringify({ page: pageInfo, element: elementInfo, dataSource: elementData }, null, 2));
            lines.push('===========================');
            const copyText = lines.join('\n');
            navigator.clipboard.writeText(copyText).then(()=>{
              const btn = document.getElementById('debug-copy-btn');
              if (btn) { btn.textContent = '✓ COPIED!'; setTimeout(()=> btn.textContent = '📋 COPY DEBUG INFO', 2000); }
            }).catch(()=>{});
          };
        }
      }).catch(()=>{});
    }
  }

  // Add right-click handler
  document.addEventListener('contextmenu', function(e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      showDebugPopup(e.target, e.pageX, e.pageY);
      return false;
    }
  }, true);

  console.log('🔍 Supabase Debug Tool ready!');
  console.log('📌 Ctrl+Right-click (or Cmd+Right-click on Mac) on any element to see its specific data source');
})();

// --- On-demand inference helpers ---
async function tryInferElementData(element){
  try {
    const sb = window.supabase;
    if (!sb) return null;
    const sess = await sb.auth.getSession();
    const user = sess?.data?.session?.user;
    if (!user) return null;

    const id = (element.id || '').toLowerCase();

    // Fetch master profile once
    const { data: mu } = await sb
      .from('master_users')
      .select('auth_user_id, email, site_id, nickname, role, access_type, role_detail, full_name')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    // nickname input
    if (id === 'nickname') {
      const value = mu?.nickname ?? user.user_metadata?.nickname ?? user.raw_user_meta_data?.nickname ?? null;
      return mkElementData('master_users','nickname', value, { status:'inferred' });
    }

    // email pill
    if (id === 'email-pill') {
      return mkElementData('auth.users','email', user.email, { status:'inferred' });
    }

    // role pill
    if (id === 'role-pill') {
      const val = mu?.access_type || mu?.role || user.user_metadata?.role || user.raw_user_meta_data?.role || mu?.role_detail || null;
      return mkElementData(mu?.access_type ? 'master_users' : 'auth.users', mu?.access_type ? 'access_type' : 'role', val, { status:'inferred' });
    }

    // site pill - removed per request
    if (id === 'site-pill') {
      return null;
    }

    // Welcome title label
    if (id === 'welcome-title' || id === 'welcome') {
      const value = mu?.nickname || mu?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || null;
      return mkElementData('master_users', mu?.nickname ? 'nickname' : 'full_name', value, { status:'inferred' });
    }

    // Admin dashboard user info elements
    if (id === 'user-name') {
      const value = mu?.full_name || user.user_metadata?.full_name || user.raw_user_meta_data?.full_name || user.email?.split('@')[0] || null;
      return mkElementData('master_users', 'full_name', value, { status:'inferred' });
    }

    if (id === 'user-role') {
      const val = mu?.access_type || mu?.role || user.user_metadata?.role || user.raw_user_meta_data?.role || null;
      return mkElementData(mu?.access_type ? 'master_users' : 'auth.users', mu?.access_type ? 'access_type' : 'role', val, { status:'inferred' });
    }

    // Staff name fields in admin dashboard
    if (id === 'drawer-staff-name' || id === 'training-edit-staff-name') {
      // These are populated from staff records, not the current user
      const textContent = element.textContent?.trim();
      if (textContent && textContent !== '-' && textContent !== 'User') {
        return mkElementData('master_users', 'full_name', textContent, { status:'inferred', note: 'Staff record display' });
      }
      return mkElementData('master_users', 'full_name', null, { status:'inferred', note: 'Staff record display (not populated)' });
    }

    // Module/type name fields
    if (id === 'drawer-module-name' || id === 'training-edit-type-name') {
      const textContent = element.textContent?.trim();
      if (textContent && textContent !== '-') {
        return mkElementData('training_types', 'name', textContent, { status:'inferred', note: 'Training type display' });
      }
      return mkElementData('training_types', 'name', null, { status:'inferred', note: 'Training type display (not populated)' });
    }

    // Form inputs for adding users
    if (id === 'add-user-name') {
      const value = element.value?.trim() || null;
      return mkElementData('master_users', 'full_name', value, { status:'inferred', note: 'Form input for new user' });
    }

    if (id === 'add-user-email') {
      const value = element.value?.trim() || null;
      return mkElementData('master_users', 'email', value, { status:'inferred', note: 'Form input for new user' });
    }

    if (id === 'add-user-role') {
      const value = element.value?.trim() || null;
      return mkElementData('master_users', 'role_detail', value, { status:'inferred', note: 'Form input for new user role' });
    }

    return null;
  } catch(_) {
    return null;
  }
}

function mkElementData(table, column, value, query){
  return { table, column, value, query };
}