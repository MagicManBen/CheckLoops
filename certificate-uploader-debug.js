// Certificate Uploader Debug Utility
const certificateDebugger = {
  debugPanelId: 'certificate-debug-panel',
  logPrefix: '[Certificate Uploader]',
  // Keep logging available but disable UI by default
  debugEnabled: true,
  
  init() {
    // Create debug panel if it doesn't exist
    if (!document.getElementById(this.debugPanelId)) {
      const panel = document.createElement('div');
      panel.id = this.debugPanelId;
      panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        max-height: 300px;
        background: #1e293b;
        color: #f8fafc;
        border-radius: 8px;
        padding: 12px;
        font-family: monospace;
        font-size: 12px;
        overflow-y: auto;
        z-index: 10000;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        /* Hide from view by default; can be shown via window.certificateDebugger.show() */
        display: none;
        flex-direction: column;
      `;
      
      // Add header with controls
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      `;
      
      const title = document.createElement('div');
      title.textContent = 'Certificate Uploader Debug';
      title.style.fontWeight = 'bold';
      
      const controls = document.createElement('div');
      controls.style.cssText = `display: flex; gap: 8px;`;
      
      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy All';
      copyBtn.style.cssText = `
        background: #10b981;
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
      `;
      copyBtn.onclick = () => this.copyAll();

      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Clear';
      clearBtn.style.cssText = `
        background: #475569;
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
      `;
      clearBtn.onclick = () => this.clear();

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.cssText = `
        background: #ef4444;
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
      `;
      closeBtn.onclick = () => this.hide();

      controls.appendChild(copyBtn);
      controls.appendChild(clearBtn);
      controls.appendChild(closeBtn);
      
      header.appendChild(title);
      header.appendChild(controls);
      
      // Add content area
      const content = document.createElement('div');
      content.className = 'debug-content';
      content.style.cssText = `flex-grow: 1; overflow-y: auto;`;
      
      panel.appendChild(header);
      panel.appendChild(content);
      
      document.body.appendChild(panel);
      
      // Still log to console but don't surface panel by default
      try { (console.info || console.log).call(console, this.logPrefix, 'Debug panel initialized (hidden)'); } catch {}
    }
    
    return this;
  },
  
  log(message, type = 'log') {
    if (!this.debugEnabled) return;

    // Safe console logging - fallback to console.log if type doesn't exist
    const logMethod = console[type] || console.log;
    logMethod(this.logPrefix, message);
    
    try {
      const panel = document.getElementById(this.debugPanelId);
      if (panel) {
        const content = panel.querySelector('.debug-content');
        
        const entry = document.createElement('div');
        entry.style.cssText = `
          padding: 4px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          word-break: break-word;
        `;
        
        // Add timestamp
        const time = new Date().toTimeString().split(' ')[0];
        const timeSpan = document.createElement('span');
        timeSpan.textContent = `[${time}] `;
        timeSpan.style.color = '#94a3b8';
        
        // Format message based on type
        const messageSpan = document.createElement('span');
        
        switch (type) {
          case 'error':
            messageSpan.style.color = '#ef4444';
            break;
          case 'warn':
            messageSpan.style.color = '#f59e0b';
            break;
          case 'info':
            messageSpan.style.color = '#3b82f6';
            break;
          case 'success':
            messageSpan.style.color = '#10b981';
            break;
          default:
            messageSpan.style.color = '#f8fafc';
        }
        
        messageSpan.textContent = message;
        
        entry.appendChild(timeSpan);
        entry.appendChild(messageSpan);
        content.appendChild(entry);
        
        // Auto-scroll to bottom
        content.scrollTop = content.scrollHeight;
      }
    } catch (e) {
      console.error('Error logging to debug panel:', e);
    }
  },
  
  error(message) {
    this.log(message, 'error');
  },
  
  warn(message) {
    this.log(message, 'warn');
  },
  
  info(message) {
    this.log(message, 'info');
  },
  
  success(message) {
    this.log(message, 'success');
  },
  
  clear() {
    try {
      const panel = document.getElementById(this.debugPanelId);
      if (panel) {
        const content = panel.querySelector('.debug-content');
        content.innerHTML = '';
      }
    } catch (e) {
      console.error('Error clearing debug panel:', e);
    }
  },

  copyAll() {
    try {
      const panel = document.getElementById(this.debugPanelId);
      if (panel) {
        const content = panel.querySelector('.debug-content');
        const text = content.textContent || content.innerText || '';

        // Add API response if available
        let fullText = text;
        if (window.lastCertificateAPIResponse) {
          fullText += '\n\n=== LAST API RESPONSE ===\n' +
                      JSON.stringify(window.lastCertificateAPIResponse, null, 2);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(fullText).then(() => {
            this.success('Debug log copied to clipboard!');
          }).catch(() => {
            alert('Failed to copy to clipboard');
          });
        } else {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = fullText;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          this.success('Debug log copied to clipboard!');
        }
      }
    } catch (e) {
      console.error('Error copying debug log:', e);
    }
  },
  
  hide() {
    try {
      const panel = document.getElementById(this.debugPanelId);
      if (panel) {
        panel.style.display = 'none';
      }
    } catch (e) {
      console.error('Error hiding debug panel:', e);
    }
  },
  
  show() {
    try {
      const panel = document.getElementById(this.debugPanelId);
      if (panel) {
        panel.style.display = 'flex';
      } else {
        this.init();
      }
    } catch (e) {
      console.error('Error showing debug panel:', e);
    }
  },
  
  toggle() {
    try {
      const panel = document.getElementById(this.debugPanelId);
      if (panel) {
        if (panel.style.display === 'none') {
          this.show();
        } else {
          this.hide();
        }
      } else {
        this.init();
      }
    } catch (e) {
      console.error('Error toggling debug panel:', e);
    }
  }
};

// Initialize on load if script is included
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.certificateDebugger === 'undefined') {
    window.certificateDebugger = certificateDebugger;
  }
});

// Global accessor
window.certificateDebugger = certificateDebugger;