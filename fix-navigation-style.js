// Fix for navigation bar styling
(function() {
  // Add a style tag to prevent FOUC (Flash of Unstyled Content)
  const styleTag = document.createElement('style');
  styleTag.id = 'nav-fix-styles';
  styleTag.textContent = `
    /* Pre-styled navigation to prevent flash of unstyled content */
    .topbar.panel {
      background: linear-gradient(145deg, rgba(25, 65, 155, 0.95), rgba(15, 45, 100, 0.95)) !important;
      padding: 10px 20px !important;
      border-radius: 18px !important;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45) !important;
      margin: 20px !important;
      display: flex !important;
      align-items: center !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      overflow: hidden !important;
      position: relative !important;
    }
      .nav.seg-nav {
        display: flex !important;
        gap: 10px !important;
      }
      .nav.seg-nav {
        display: flex !important;
        gap: 10px !important;
        align-items: center !important;
        flex-wrap: wrap !important;
      }
      .nav.seg-nav button {
        background: transparent !important;
        border: none !important;
        color: var(--ink, #0f172a) !important;
        padding: 8px 12px !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: background 0.2s, transform 0.2s !important;
      }
      .nav.seg-nav button:hover { background: rgba(0,0,0,0.06) !important; }
      .nav.seg-nav button.active {
        background: rgba(0, 0, 0, 0.08) !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
      }
      .nav.seg-nav button.disabled-nav-item { color: #9ca3af !important; opacity: 0.6 !important; }
      .nav.seg-nav button.admin-only { background: linear-gradient(135deg, #8b5cf6, #6366f1) !important; color:#fff !important; }
    .topbar .pill {
      background: rgba(255, 255, 255, 0.12) !important;
      padding: 6px 12px !important;
      border-radius: 999px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
    }
    /* Scope logout styling to dark topbar contexts only */
    .topbar.panel #logout-btn,
    header.topbar #logout-btn,
    .topbar #logout-btn {
      background: rgba(255, 255, 255, 0.15) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      color: var(--ink, #ffffff) !important;
      padding: 8px 16px !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
    }
    /* Active button styling on dark topbar */
    .topbar .nav.seg-nav button.active {
      background: rgba(255, 255, 255, 0.15) !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
    }
    /* Disabled items styling */
    .nav.seg-nav button.disabled-nav-item {
      color: #9ca3af !important;
      opacity: 0.6 !important;
    }
    /* Admin-only items */
    .nav.seg-nav button.admin-only {
      background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
    }
  `;
  document.head.appendChild(styleTag);

  // Apply consistent styling to the navigation bar
  function fixNavigationStyling() {
    // Target the topbar panel element
    const topbar = document.querySelector('.topbar.panel');
    if (!topbar) return;
    
    // Apply consistent styling
    topbar.style.background = "linear-gradient(145deg, rgba(25, 65, 155, 0.95), rgba(15, 45, 100, 0.95))";
    topbar.style.padding = "10px 20px";
    topbar.style.borderRadius = "18px";
    topbar.style.boxShadow = "0 12px 35px rgba(0, 0, 0, 0.45)";
    topbar.style.margin = "20px";
    topbar.style.display = "flex";
    topbar.style.alignItems = "center";
    topbar.style.border = "1px solid var(--border-color)";
    topbar.style.overflow = "hidden";
    topbar.style.position = "relative";
    
    // Ensure the halo div is correctly positioned
    const halo = topbar.querySelector('.halo');
    if (halo) {
      halo.style.position = "absolute";
      halo.style.inset = "0";
      halo.style.pointerEvents = "none";
      halo.style.zIndex = "0";
    }
    
    // Style the navigation section
    const navSection = topbar.querySelector('.nav.seg-nav');
    if (navSection) {
      navSection.style.display = "flex";
      navSection.style.gap = "10px";
      navSection.style.position = "relative";
      navSection.style.zIndex = "1";
      
      // Style the buttons within nav
      const buttons = navSection.querySelectorAll('button');
      buttons.forEach(button => {
        if (!button.hasAttribute('data-styled')) {
          button.style.background = "transparent";
          button.style.border = "none";
          button.style.color = "var(--ink, #ffffff)";
          button.style.padding = "8px 12px";
          button.style.borderRadius = "8px";
          button.style.fontWeight = "600";
          button.style.cursor = "pointer";
          button.style.transition = "background 0.2s, transform 0.2s";
          button.style.position = "relative"; // For z-index to work
          button.style.zIndex = "1"; // Above the halo
          
          // Add hover effect
          button.addEventListener('mouseenter', () => {
            if (!button.classList.contains('active')) {
              button.style.background = "rgba(255, 255, 255, 0.1)";
              button.style.transform = "translateY(-1px)";
            }
          });
          
          button.addEventListener('mouseleave', () => {
            if (!button.classList.contains('active')) {
              button.style.background = "transparent";
              button.style.transform = "translateY(0)";
            }
          });
          
          // Mark as styled to avoid duplicate event listeners
          button.setAttribute('data-styled', 'true');
        }
        
        // Apply styles based on classes
        if (button.classList.contains('active')) {
          button.style.background = "rgba(255, 255, 255, 0.15)";
          button.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
        }
        
        if (button.classList.contains('disabled-nav-item')) {
          button.style.color = "#9ca3af";
          button.style.opacity = "0.6";
          button.style.cursor = "pointer"; // Keep cursor as pointer for PIN prompt
        }
        
        if (button.classList.contains('admin-only')) {
          button.style.background = "linear-gradient(135deg, #8b5cf6, #6366f1)";
          button.style.color = "#ffffff";
        }
      });
    }
    
    // Style the spacer
    const spacer = topbar.querySelector('.spacer');
    if (spacer) {
      spacer.style.flex = "1";
    }
    
    // Style the pills
    const pills = topbar.querySelectorAll('.pill');
    pills.forEach(pill => {
      pill.style.background = "rgba(255, 255, 255, 0.12)";
      pill.style.padding = "6px 12px";
      pill.style.borderRadius = "999px";
      pill.style.fontSize = "14px";
      pill.style.fontWeight = "500";
      pill.style.position = "relative"; // For z-index to work
      pill.style.zIndex = "1"; // Above the halo
    });
    
    // Style the logout button
    const logoutBtn = topbar.querySelector('#logout-btn');
    if (logoutBtn) {
      logoutBtn.style.background = "rgba(255, 255, 255, 0.15)";
      logoutBtn.style.border = "1px solid rgba(255, 255, 255, 0.3)";
      logoutBtn.style.color = "var(--ink, #ffffff)";
      logoutBtn.style.padding = "8px 16px";
      logoutBtn.style.borderRadius = "8px";
      logoutBtn.style.fontWeight = "600";
      logoutBtn.style.cursor = "pointer";
      logoutBtn.style.transition = "background 0.2s, transform 0.2s";
      logoutBtn.style.position = "relative"; // For z-index to work
      logoutBtn.style.zIndex = "1"; // Above the halo
      
      if (!logoutBtn.hasAttribute('data-styled')) {
        // Add hover effect for logout button
        logoutBtn.addEventListener('mouseenter', () => {
          logoutBtn.style.background = "rgba(255, 255, 255, 0.25)";
          logoutBtn.style.transform = "translateY(-1px)";
        });
        
        logoutBtn.addEventListener('mouseleave', () => {
          logoutBtn.style.background = "rgba(255, 255, 255, 0.15)";
          logoutBtn.style.transform = "translateY(0)";
        });
        
        logoutBtn.setAttribute('data-styled', 'true');
      }
    }
  }
  
  // Apply styling immediately
  function applyInitialStyling() {
    const topbar = document.querySelector('.topbar.panel');
    if (topbar) {
      fixNavigationStyling();
    }
  }
  
  // Call this after navigation is rendered
  function setupNavigationFix() {
    // Apply styling immediately to reduce flash
    applyInitialStyling();
    
    // Check if navigation has been rendered
    if (document.querySelector('.nav.seg-nav button')) {
      fixNavigationStyling();
    } else {
      // Watch for changes to the DOM and apply styling when navigation is rendered
      const observer = new MutationObserver((mutations) => {
        if (document.querySelector('.nav.seg-nav button')) {
          fixNavigationStyling();
          // Once we find the buttons, disconnect to prevent excessive calls
          if (document.querySelectorAll('.nav.seg-nav button').length >= 5) {
            observer.disconnect();
          }
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Fallback timer
      setTimeout(fixNavigationStyling, 100);
    }
  }
  
  // Run as early as possible
  if (document.readyState === 'loading') {
    // Apply CSS rules immediately
    document.addEventListener('DOMContentLoaded', setupNavigationFix);
  } else {
    setupNavigationFix();
  }
  
  // Expose the function globally so it can be called from staff-common.js
  window.fixNavigationStyling = fixNavigationStyling;
  
  // Also run when navigation might be updated
  const originalNavActivate = window.navActivate;
  if (typeof originalNavActivate === 'function') {
    window.navActivate = function(page) {
      originalNavActivate(page);
      // Apply styling immediately after navigation update
      setTimeout(fixNavigationStyling, 0);
    };
  }
  
  // Apply styling on window load as a final fallback
  window.addEventListener('load', fixNavigationStyling);
  
  // Re-apply styling when the window is resized
  window.addEventListener('resize', () => {
    setTimeout(fixNavigationStyling, 100);
  });
})();