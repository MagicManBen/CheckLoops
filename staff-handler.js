// Simplified staff page handler
import { protectPage, getSession, getUserRole, isAdmin, signOut, navigateTo, getSupabase } from './auth-core.js';

// Initialize staff page
export async function initStaffPage() {
  // Protect page - ensure user is logged in
  const auth = await protectPage('staff');
  if (!auth) return;
  
  const { session, role } = auth;
  
  // Update UI with user info
  updateUserDisplay(session, role);
  
  // Setup navigation
  setupNavigation(role);
  
  // Setup logout
  setupLogout();
  
  // Return auth info for page-specific logic
  return { session, role, supabase: await getSupabase() };
}

// Update user display
function updateUserDisplay(session, role) {
  const user = session?.user;
  if (!user) return;
  
  // Update email display
  const emailPill = document.getElementById('email-pill');
  if (emailPill) {
    emailPill.textContent = user.email;
  }
  
  // Update role display
  const rolePill = document.getElementById('role-pill');
  if (rolePill) {
    rolePill.textContent = role;
  }
  
  // Update name/avatar if available
  const meta = user.user_metadata || {};
  const fullName = meta.full_name || meta.nickname || user.email.split('@')[0];
  
  const namePlaceholders = document.querySelectorAll('[data-user-name]');
  namePlaceholders.forEach(el => {
    el.textContent = fullName;
  });
  
  // Update avatar if available
  if (meta.avatar_url) {
    const avatarElements = document.querySelectorAll('[data-user-avatar]');
    avatarElements.forEach(el => {
      if (el.tagName === 'IMG') {
        el.src = meta.avatar_url;
      } else {
        el.style.backgroundImage = `url(${meta.avatar_url})`;
      }
    });
  }
}

// Setup navigation with role-based visibility
async function setupNavigation(role) {
  const navContainer = document.querySelector('.nav.seg-nav');
  if (!navContainer) return;
  
  const isAdminUser = await isAdmin();
  
  const navItems = [
    { page: 'home', href: 'staff.html', label: 'Home' },
    { page: 'welcome', href: 'staff-welcome.html', label: 'Welcome' },
    // { page: 'meetings', href: 'staff-meetings.html', label: 'Meetings' },
    { page: 'scans', href: 'staff-scans.html', label: 'My Scans' },
    { page: 'training', href: 'staff-training.html', label: 'My Training' },
    { page: 'achievements', href: 'achievements.html', label: 'Achievements' },
    { page: 'quiz', href: 'staff-quiz.html', label: 'Quiz' },
    { page: 'admin', href: 'index.html', label: 'Admin Site', visible: isAdminUser }
  ];
  
  // Clear existing nav
  navContainer.innerHTML = '';
  
  // Get current page
  const currentPath = window.location.pathname;
  
  navItems.forEach(item => {
    // Skip hidden items
    if (item.visible === false) return;
    
    const button = document.createElement('button');
    button.className = 'seg-btn';
    button.textContent = item.label;
    
    // Mark active page
    if (currentPath.includes(item.href)) {
      button.classList.add('active');
    }
    
    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.href);
    });
    
    navContainer.appendChild(button);
  });
}

// Setup logout button
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut();
    // Auth-core will handle redirect
  });
}