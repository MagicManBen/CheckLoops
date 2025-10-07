// Standardized Staff Navigation JavaScript

// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', function() {
      navLinks.classList.toggle('mobile-open');

      // Update toggle icon
      const svg = mobileToggle.querySelector('svg');
      if (navLinks.classList.contains('mobile-open')) {
        svg.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
      } else {
        svg.innerHTML = '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('mobile-open');
        const svg = mobileToggle.querySelector('svg');
        svg.innerHTML = '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
      }
    });

    // Close mobile menu when clicking on a nav link
    const navItems = navLinks.querySelectorAll('.nav-link, .dropdown-item');
    navItems.forEach(item => {
      item.addEventListener('click', function() {
        navLinks.classList.remove('mobile-open');
        const svg = mobileToggle.querySelector('svg');
        svg.innerHTML = '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
      });
    });
  }
});

// Navigation utility function to set active state
function setActiveNavItem(currentPage) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

// Get standardized navigation HTML
function getStandardNavHTML(activePage = 'staff.html') {
  return `
  <nav class="navbar">
    <div class="navbar-container">
      <a href="staff.html" class="navbar-brand">
        <img src="Logo.png" alt="CheckLoops" class="brand-logo">
        <span class="brand-text">CheckLoops</span>
      </a>

      <!-- Mobile menu toggle -->
      <button class="mobile-menu-toggle" id="mobile-menu-toggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <div class="navbar-nav nav-links" id="nav-links">
        <a href="staff.html" class="nav-link ${activePage === 'staff.html' ? 'active' : ''}">Dashboard</a>
        <a href="staff-training.html" class="nav-link ${activePage === 'staff-training.html' ? 'active' : ''}">Training</a>
        <a href="staff-quiz.html" class="nav-link ${activePage === 'staff-quiz.html' ? 'active' : ''}">Quiz</a>
        <a href="staff-calendar.html" class="nav-link ${activePage === 'staff-calendar.html' ? 'active' : ''}">Calendar</a>
        <a href="my-holidays.html" class="nav-link ${activePage === 'my-holidays.html' ? 'active' : ''}">Holidays</a>
        <a href="staff-welcome.html" class="nav-link ${activePage === 'staff-welcome.html' ? 'active' : ''}">Welcome</a>
      </div>

      <div class="navbar-user">
        <a href="admin-dashboard.html" class="admin-portal-btn" id="adminPortalBtn" style="display:none; padding: 0.5rem 1rem; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; border: none; border-radius: var(--radius); font-weight: 600; font-size: 0.875rem; text-decoration: none; transition: var(--transition); box-shadow: var(--shadow-sm);" title="Access Admin Dashboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.25rem; display: inline-block; vertical-align: middle;">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
          </svg>
          Admin Portal
        </a>
        <div class="user-info">
          <div id="navbar-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.875rem;"></div>
          <span class="user-pill" id="email-pill">—</span>
          <span class="user-pill role" id="role-pill">—</span>
        </div>
        <button class="btn-signout" id="logout-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16,17 21,12 16,7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  </nav>
  `;
}

// Render standardized nav into the DOM
function renderStandardStaffNav(activePage = (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : 'staff.html')) {
  try {
    if (document.getElementById('nav-links')) return; // already rendered
    const html = getStandardNavHTML(activePage);
    // Prefer a placeholder if present
    const mount = document.getElementById('navbar-root');
    if (mount) {
      mount.innerHTML = html;
    } else {
      document.body.insertAdjacentHTML('afterbegin', html);
    }

    // Wire mobile menu immediately after insertion
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if (mobileToggle && navLinks) {
      mobileToggle.addEventListener('click', function() {
        navLinks.classList.toggle('mobile-open');
        const svg = mobileToggle.querySelector('svg');
        if (navLinks.classList.contains('mobile-open')) {
          svg.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
        } else {
          svg.innerHTML = '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
        }
      });

      document.addEventListener('click', function(e) {
        if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('mobile-open');
          const svg = mobileToggle.querySelector('svg');
          if (svg) svg.innerHTML = '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
        }
      });

      const navItems = navLinks.querySelectorAll('.nav-link, .dropdown-item');
      navItems.forEach(item => {
        item.addEventListener('click', function() {
          navLinks.classList.remove('mobile-open');
          const svg = mobileToggle.querySelector('svg');
          if (svg) svg.innerHTML = '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
        });
      });
    }

    setActiveNavItem(activePage);
  } catch (e) {
    console.error('[staff-nav] render failed', e);
  }
}

// Auto-initialize navigation if called from a page
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    // Auto-detect current page and set active nav item
    const currentPath = window.location.pathname.split('/').pop();
    setActiveNavItem(currentPath);
  });
}

// Expose render function globally
try { if (typeof window !== 'undefined') window.renderStandardStaffNav = renderStandardStaffNav; } catch(_) {}