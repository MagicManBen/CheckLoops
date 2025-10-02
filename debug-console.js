// Debug Console for CheckLoop
// This persists across all pages and logs all interactions

(function() {
    'use strict';

    // Initialize or get existing debug logs from localStorage
    const DEBUG_STORAGE_KEY = 'checkloop_debug_logs';
    const DEBUG_ENABLED_KEY = 'checkloop_debug_enabled';

    let debugLogs = JSON.parse(localStorage.getItem(DEBUG_STORAGE_KEY) || '[]');
    // Default: disabled/off and hidden unless user manually enables
    let isEnabled = false;
    let recording = false;

    // DISABLED: Debug UI is hidden - uncomment the return statement below to re-enable
    return; // Exit early to prevent debug UI from being created

    // Create debug console HTML (HIDDEN BY DEFAULT)
    const consoleHTML = `
        <div id="debug-console-container" style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-width: 500px;
            transition: all 0.3s ease;
            display: block;
        ">
            <!-- Toggle Button -->
            <button id="debug-toggle" style="
                position: absolute;
                bottom: 0;
                right: 0;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 50%;
                color: white;
                cursor: pointer;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                transition: all 0.3s ease;
            " title="Toggle Debug Console">
                🐛
            </button>

            <!-- Console Panel -->
            <div id="debug-panel" style="
                display: none;
                position: absolute;
                bottom: 60px;
                right: 0;
                width: 500px;
                height: 400px;
                background: rgba(20, 20, 30, 0.95);
                border: 1px solid rgba(102, 126, 234, 0.5);
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                backdrop-filter: blur(10px);
                overflow: hidden;
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 10px 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 8px 8px 0 0;
                ">
                    <span style="font-weight: bold;">🐛 Debug Console</span>
                    <div>
                        <span id="debug-log-count" style="margin-right: 8px; opacity: 0.9;">0 logs</span>
                        <button id="debug-start" style="margin-right:6px;background:#10b981;border:none;padding:6px 10px;border-radius:6px;color:white;cursor:pointer;font-size:11px;">Start</button>
                        <button id="debug-stop" style="margin-right:6px;background:#ef4444;border:none;padding:6px 10px;border-radius:6px;color:white;cursor:pointer;font-size:11px;display:none">Stop</button>
                        <button id="debug-save" style="
                            background: rgba(76, 175, 80, 0.3);
                            border: 1px solid rgba(76, 175, 80, 0.5);
                            color: white;
                            padding: 5px 10px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-right: 5px;
                            font-size: 11px;
                        " title="Save logs to file">
                            💾 Save
                        </button>
                        <button id="debug-copy" style="
                            background: rgba(255,255,255,0.2);
                            border: 1px solid rgba(255,255,255,0.3);
                            color: white;
                            padding: 5px 10px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-right: 5px;
                            font-size: 11px;
                        " title="Copy logs to clipboard">
                            📋 Copy
                        </button>
                        <button id="debug-clear" style="
                            background: rgba(255,255,255,0.2);
                            border: 1px solid rgba(255,255,255,0.3);
                            color: white;
                            padding: 5px 10px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-right: 5px;
                            font-size: 11px;
                        " title="Clear all logs">
                            🗑️ Clear
                        </button>
                        <button id="debug-close" style="
                            background: transparent;
                            border: none;
                            color: white;
                            cursor: pointer;
                            font-size: 16px;
                            padding: 0;
                        " title="Close console">
                            ✕
                        </button>
                    </div>
                </div>

                <!-- Filters -->
                <div style="
                    padding: 10px;
                    background: rgba(30, 30, 40, 0.5);
                    border-bottom: 1px solid rgba(102, 126, 234, 0.3);
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                ">
                    <label style="color: #ccc;">
                        <input type="checkbox" id="filter-info" checked> Info
                    </label>
                    <label style="color: #4ade80;">
                        <input type="checkbox" id="filter-success" checked> Success
                    </label>
                    <label style="color: #fbbf24;">
                        <input type="checkbox" id="filter-warning" checked> Warning
                    </label>
                    <label style="color: #f87171;">
                        <input type="checkbox" id="filter-error" checked> Error
                    </label>
                    <label style="color: #60a5fa;">
                        <input type="checkbox" id="filter-api" checked> API
                    </label>
                    <label style="color: #c084fc;">
                        <input type="checkbox" id="filter-nav" checked> Navigation
                    </label>
                </div>

                <!-- Log Content -->
                <div id="debug-logs" style="
                    height: calc(100% - 100px);
                    overflow-y: auto;
                    padding: 10px;
                    color: #e0e0e0;
                    line-height: 1.4;
                ">
                    <!-- Logs will be inserted here -->
                </div>
            </div>
        </div>
    `;

    // Inject console HTML
    function injectConsole() {
        if (document.getElementById('debug-console-container')) return;

        const container = document.createElement('div');
        container.innerHTML = consoleHTML;
        document.body.appendChild(container.firstElementChild);

        // Set up event handlers
        setupEventHandlers();

        // Update log display
        updateLogDisplay();

        // Do not automatically record on load — wait for user to Start
    }

    // Setup event handlers
    function setupEventHandlers() {
    const toggle = document.getElementById('debug-toggle');
        const panel = document.getElementById('debug-panel');
        const close = document.getElementById('debug-close');
        const clear = document.getElementById('debug-clear');
        const copy = document.getElementById('debug-copy');
        const save = document.getElementById('debug-save');
    const startBtn = document.getElementById('debug-start');
    const stopBtn = document.getElementById('debug-stop');

        toggle.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        close.addEventListener('click', () => {
            panel.style.display = 'none';
        });

        clear.addEventListener('click', () => {
            if (confirm('Clear all debug logs?')) {
                debugLogs = [];
                localStorage.setItem(DEBUG_STORAGE_KEY, '[]');
                updateLogDisplay();
                addLog('info', 'Debug logs cleared');
            }
        });

        copy.addEventListener('click', () => {
            const logsText = debugLogs.map(log =>
                `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}\n${log.details ? JSON.stringify(log.details, null, 2) : ''}`
            ).join('\n\n');

            navigator.clipboard.writeText(logsText).then(() => {
                addLog('success', 'Logs copied to clipboard');
            }).catch(err => {
                addLog('error', 'Failed to copy logs', err);
            });
        });

        save.addEventListener('click', () => {
            // Create comprehensive log report
            const reportData = {
                metadata: {
                    generated_at: new Date().toISOString(),
                    page_url: window.location.href,
                    user_agent: navigator.userAgent,
                    total_logs: debugLogs.length,
                    session_start: debugLogs[0]?.timestamp || new Date().toISOString()
                },
                logs: debugLogs
            };

            // Create formatted text content
            const textContent = `
========================================
CHECKLOOP DEBUG LOG REPORT
========================================
Generated: ${new Date().toISOString()}
Page URL: ${window.location.href}
Total Logs: ${debugLogs.length}
Session Start: ${debugLogs[0]?.timestamp || 'N/A'}
========================================

DETAILED LOGS:
========================================

${debugLogs.map((log, index) => `
[${index + 1}] ${log.timestamp}
Type: ${log.type.toUpperCase()}
Page: ${log.page}
Message: ${log.message}
${log.details ? `Details:\n${JSON.stringify(log.details, null, 2)}` : ''}
----------------------------------------`).join('\n')}

========================================
END OF REPORT
========================================

JSON DATA FOR ANALYSIS:
${JSON.stringify(reportData, null, 2)}
`;

            // Create a blob and download
            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Use consistent filename that will be saved to project
            a.download = 'debug-log-latest.txt';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            addLog('success', `Debug logs saved to debug-log-latest.txt`);
        });

        // Filter checkboxes
        ['info', 'success', 'warning', 'error', 'api', 'nav'].forEach(type => {
            const checkbox = document.getElementById(`filter-${type}`);
            if (checkbox) {
                checkbox.addEventListener('change', updateLogDisplay);
            }
        });

        // Start/Stop recording
        if (startBtn && stopBtn) {
            startBtn.addEventListener('click', () => {
                recording = true;
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
                // Hook behaviors
                interceptConsole();
                interceptFetch();
                interceptSupabase();
                trackPageEvents();
                addLog('success', 'Recording started');
                localStorage.setItem(DEBUG_ENABLED_KEY, 'true');
            });

            stopBtn.addEventListener('click', () => {
                recording = false;
                stopBtn.style.display = 'none';
                startBtn.style.display = 'inline-block';
                // Unhook console and fetch by reloading page state (safe fallback)
                try { window.location.reload(); } catch(e) { /* ignore */ }
                localStorage.removeItem(DEBUG_ENABLED_KEY);
            });
        }
    }

    // Add a log entry
    function addLog(type, message, details = null) {
        if (!recording) return; // only collect logs while user has started recording
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, type, message, details, page: window.location.pathname };
        debugLogs.push(logEntry);
        if (debugLogs.length > 500) debugLogs = debugLogs.slice(-500);
        localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(debugLogs));
        updateLogDisplay();
    }

    // Update log display
    function updateLogDisplay() {
        const logsContainer = document.getElementById('debug-logs');
        const logCount = document.getElementById('debug-log-count');

        if (!logsContainer) return;

        // Get active filters
        const activeFilters = ['info', 'success', 'warning', 'error', 'api', 'nav']
            .filter(type => {
                const checkbox = document.getElementById(`filter-${type}`);
                return checkbox ? checkbox.checked : true;
            });

        // Filter logs
        const filteredLogs = debugLogs.filter(log => activeFilters.includes(log.type));

        // Update count
        if (logCount) {
            logCount.textContent = `${filteredLogs.length} logs`;
        }

        // Generate HTML
        const html = filteredLogs.map(log => {
            const colors = {
                info: '#ccc',
                success: '#4ade80',
                warning: '#fbbf24',
                error: '#f87171',
                api: '#60a5fa',
                nav: '#c084fc'
            };

            const icons = {
                info: 'ℹ️',
                success: '✅',
                warning: '⚠️',
                error: '❌',
                api: '🔌',
                nav: '🧭'
            };

            return `
                <div style="
                    margin-bottom: 10px;
                    padding: 8px;
                    background: rgba(255,255,255,0.05);
                    border-left: 3px solid ${colors[log.type]};
                    border-radius: 4px;
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${icons[log.type]}</span>
                        <span style="color: ${colors[log.type]}; font-weight: bold;">
                            ${log.type.toUpperCase()}
                        </span>
                        <span style="color: #888; font-size: 10px;">
                            ${new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span style="color: #666; font-size: 10px;">
                            ${log.page}
                        </span>
                    </div>
                    <div style="margin-top: 4px; color: #e0e0e0;">
                        ${log.message}
                    </div>
                    ${log.details ? `
                        <pre style="
                            margin-top: 4px;
                            padding: 4px;
                            background: rgba(0,0,0,0.3);
                            border-radius: 3px;
                            overflow-x: auto;
                            font-size: 10px;
                            color: #aaa;
                        ">${JSON.stringify(log.details, null, 2)}</pre>
                    ` : ''}
                </div>
            `;
        }).reverse().join(''); // Show newest first

        logsContainer.innerHTML = html || '<div style="text-align: center; color: #666;">No logs to display</div>';
    }

    // Intercept Supabase calls
    function interceptSupabase() {
        if (typeof window.supabase === 'undefined') {
            setTimeout(interceptSupabase, 100);
            return;
        }

        const originalFrom = window.supabase.from;
        window.supabase.from = function(table) {
            const query = originalFrom.call(this, table);

            // Intercept select
            const originalSelect = query.select;
            query.select = function(...args) {
                addLog('api', `SELECT from ${table}`, {
                    table,
                    operation: 'SELECT',
                    columns: args[0]
                });
                return originalSelect.apply(this, args);
            };

            // Intercept insert
            const originalInsert = query.insert;
            query.insert = function(data) {
                addLog('api', `INSERT into ${table}`, {
                    table,
                    operation: 'INSERT',
                    data: Array.isArray(data) ? `${data.length} records` : data
                });
                return originalInsert.call(this, data);
            };

            // Intercept update
            const originalUpdate = query.update;
            query.update = function(data) {
                addLog('api', `UPDATE ${table}`, {
                    table,
                    operation: 'UPDATE',
                    data
                });
                return originalUpdate.call(this, data);
            };

            // Intercept delete
            const originalDelete = query.delete;
            query.delete = function() {
                addLog('api', `DELETE from ${table}`, {
                    table,
                    operation: 'DELETE'
                });
                return originalDelete.call(this);
            };

            return query;
        };

        // Intercept auth operations
        if (window.supabase.auth) {
            const originalSignIn = window.supabase.auth.signInWithPassword;
            if (originalSignIn) {
                window.supabase.auth.signInWithPassword = async function(credentials) {
                    addLog('api', 'Auth: Sign in attempt', {
                        email: credentials.email
                    });
                    try {
                        const result = await originalSignIn.call(this, credentials);
                        if (result.error) {
                            addLog('error', 'Auth: Sign in failed', result.error);
                        } else {
                            addLog('success', 'Auth: Sign in successful', {
                                user: result.data.user?.email
                            });
                        }
                        return result;
                    } catch (error) {
                        addLog('error', 'Auth: Sign in error', error);
                        throw error;
                    }
                };
            }

            const originalSignOut = window.supabase.auth.signOut;
            if (originalSignOut) {
                window.supabase.auth.signOut = async function() {
                    addLog('api', 'Auth: Sign out');
                    return originalSignOut.call(this);
                };
            }
        }
    }

    // Intercept console methods
    function interceptConsole() {
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn
        };

        console.log = function(...args) {
            addLog('info', 'Console.log', args);
            originalConsole.log.apply(console, args);
        };

        console.error = function(...args) {
            addLog('error', 'Console.error', args);
            originalConsole.error.apply(console, args);
        };

        console.warn = function(...args) {
            addLog('warning', 'Console.warn', args);
            originalConsole.warn.apply(console, args);
        };
    }

    // Intercept fetch for API calls
    function interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const [url, options = {}] = args;

            // Log API call
            if (url.includes('supabase')) {
                addLog('api', `Fetch: ${options.method || 'GET'} ${url.split('?')[0]}`, {
                    method: options.method || 'GET',
                    url: url.substring(0, 100),
                    headers: options.headers
                });
            }

            return originalFetch.apply(this, args)
                .then(response => {
                    if (!response.ok && url.includes('supabase')) {
                        addLog('warning', `Fetch failed: ${response.status} ${response.statusText}`, {
                            url: url.substring(0, 100),
                            status: response.status
                        });
                    }
                    return response;
                })
                .catch(error => {
                    addLog('error', 'Fetch error', { url: url.substring(0, 100), error: error.message });
                    throw error;
                });
        };
    }

    // Track page events
    function trackPageEvents() {
        // Form submissions
        document.addEventListener('submit', (e) => {
            addLog('info', `Form submitted: ${e.target.id || 'unknown'}`, {
                formId: e.target.id,
                formAction: e.target.action,
                formMethod: e.target.method
            });
        });

        // Button clicks
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
                const text = e.target.textContent?.trim().substring(0, 50);
                if (text && !e.target.id?.includes('debug-')) {
                    addLog('info', `Clicked: ${text}`, {
                        element: e.target.tagName,
                        id: e.target.id,
                        class: e.target.className
                    });
                }
            }
        });

        // Page unload
        window.addEventListener('beforeunload', () => {
            addLog('nav', `Leaving page: ${window.location.pathname}`);
        });

        // Errors
        window.addEventListener('error', (e) => {
            addLog('error', 'JavaScript error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                col: e.colno
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            addLog('error', 'Unhandled promise rejection', {
                reason: e.reason
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Always inject UI but keep it hidden and do not start recording automatically
        injectConsole();
        updateLogDisplay();

        // Disable auto-start functionality - debug console remains hidden unless manually enabled
        // Clear any previous recording state
        localStorage.removeItem(DEBUG_ENABLED_KEY);
    }

    // Expose debug functions globally
    window.debugConsole = {
        addLog,
        clear: () => {
            debugLogs = [];
            localStorage.setItem(DEBUG_STORAGE_KEY, '[]');
            updateLogDisplay();
        },
        getLogs: () => debugLogs,
        enable: () => {
            isEnabled = true;
            localStorage.setItem(DEBUG_ENABLED_KEY, 'true');
        },
        disable: () => {
            isEnabled = false;
            localStorage.setItem(DEBUG_ENABLED_KEY, 'false');
        },
        show: () => {
            const container = document.getElementById('debug-console-container');
            if (container) {
                container.style.display = 'block';
            }
        },
        hide: () => {
            const container = document.getElementById('debug-console-container');
            if (container) {
                container.style.display = 'none';
            }
        }
    };
})();