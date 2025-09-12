// Simplified admin page handler
import { protectPage, getSession, signOut, navigateTo, getSupabase } from './auth-core.js';

// Initialize admin page
export async function initAdminPage() {
  // Protect page - ensure user is admin
  const auth = await protectPage('admin');
  if (!auth) return;
  
  const { session, role } = auth;
  
  // Update UI with user info
  updateAdminDisplay(session, role);
  
  // Setup navigation
  setupAdminNavigation();
  
  // Setup logout
  setupLogout();
  
  // Return auth info for page-specific logic
  return { session, role, supabase: await getSupabase() };
}

// Update admin display
function updateAdminDisplay(session, role) {
  const user = session?.user;
  if (!user) return;
  
  const meta = user.user_metadata || {};
  const fullName = meta.full_name || meta.nickname || user.email.split('@')[0];
  
  // Update user name display
  const userName = document.getElementById('user-name');
  if (userName) {
    userName.textContent = fullName;
  }
  
  // Update user initials
  const userInitials = document.getElementById('user-initials');
  if (userInitials) {
    const nameParts = fullName.split(' ');
    const initials = nameParts.length >= 2 
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : fullName.substring(0, 2).toUpperCase();
    userInitials.textContent = initials;
  }
  
  // Update any other user placeholders
  const namePlaceholders = document.querySelectorAll('[data-user-name]');
  namePlaceholders.forEach(el => {
    el.textContent = fullName;
  });
  
  const emailPlaceholders = document.querySelectorAll('[data-user-email]');
  emailPlaceholders.forEach(el => {
    el.textContent = user.email;
  });
}

// Setup admin navigation
function setupAdminNavigation() {
  // Handle menu clicks for admin pages
  const menuButtons = document.querySelectorAll('[data-section]');
  
  menuButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const section = button.dataset.section;
      
      // Handle navigation to staff site
      if (section === 'staff-site') {
        e.preventDefault();
        navigateTo('staff.html');
        return;
      }
      
      // Handle other sections (show/hide within same page)
      const allViews = document.querySelectorAll('.view-content');
      allViews.forEach(view => {
        view.classList.add('hidden');
      });
      
      const targetView = document.getElementById(`view-${section}`);
      if (targetView) {
        targetView.classList.remove('hidden');
      }
      
      // Update active button state
      menuButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
    });
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