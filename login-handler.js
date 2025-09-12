// Simplified login handler for home.html
import { getSupabase, signIn, getSession, getUserRole, isAdmin } from './auth-core.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if already logged in
  const session = await getSession();
  if (session) {
    // Already logged in, ALL users go to staff.html
    window.location.href = 'staff.html';
    return;
  }
  
  // Handle login form
  const signinForm = document.getElementById('signin-form');
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('auth-error');
      const successDiv = document.getElementById('auth-success');
      
      // Clear previous messages
      if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }
      if (successDiv) {
        successDiv.style.display = 'none';
        successDiv.textContent = '';
      }
      
      try {
        // Sign in
        await signIn(email, password);
        
        // Show success
        if (successDiv) {
          successDiv.textContent = 'Login successful! Redirecting...';
          successDiv.style.display = 'block';
        }
        
        // ALL users go to staff.html after login
        setTimeout(() => {
          window.location.href = 'staff.html';
        }, 500);
        
      } catch (error) {
        console.error('Login error:', error);
        if (errorDiv) {
          errorDiv.textContent = error.message || 'Invalid email or password';
          errorDiv.style.display = 'block';
        }
      }
    });
  }
  
  // Handle forgot password
  window.showForgotPassword = function() {
    document.getElementById('signin-form-container')?.classList.add('hidden');
    document.getElementById('forgot-form-container')?.classList.remove('hidden');
  };
  
  window.showSignIn = function() {
    document.getElementById('forgot-form-container')?.classList.add('hidden');
    document.getElementById('signin-form-container')?.classList.remove('hidden');
  };
  
  // Handle forgot password form
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('reset-email').value;
      const errorDiv = document.getElementById('forgot-error');
      const successDiv = document.getElementById('forgot-success');
      
      try {
        const supabase = await getSupabase();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/set-password.html`
        });
        
        if (error) throw error;
        
        if (successDiv) {
          successDiv.textContent = 'Password reset email sent! Please check your inbox.';
          successDiv.style.display = 'block';
        }
        if (errorDiv) {
          errorDiv.style.display = 'none';
        }
        
      } catch (error) {
        console.error('Password reset error:', error);
        if (errorDiv) {
          errorDiv.textContent = error.message || 'Failed to send reset email';
          errorDiv.style.display = 'block';
        }
        if (successDiv) {
          successDiv.style.display = 'none';
        }
      }
    });
  }
});