// Certificate Uploader Debug Utility
const certificateDebugger = {
  debugPanelId: 'certificate-debug-panel',
  logPrefix: '[Certificate Uploader]',
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
        display: flex;
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
      
      // Welcome message
      this.log('Debug panel initialized', 'info');
    }
    
    return this;
  },
  
  log(message, type = 'log') {
    if (!this.debugEnabled) return;
    
    console[type](this.logPrefix, message);
    
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