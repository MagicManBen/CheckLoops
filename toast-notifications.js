/**
 * Toast Notification System
 * Provides attractive, accessible notifications for the application
 */

function showToast(message, type = 'success', duration = 3000) {
  // Remove any existing toasts
  const existingToasts = document.querySelectorAll('.toast-notification');
  existingToasts.forEach(toast => {
    toast.style.animation = 'toastOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  });
  
  // Create toast elements
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  
  // Get appropriate icon
  let iconSvg = '';
  switch (type) {
    case 'success':
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                   <polyline points="22 4 12 14.01 9 11.01"></polyline>
                 </svg>`;
      break;
    case 'warning':
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                   <line x1="12" y1="9" x2="12" y2="13"></line>
                   <line x1="12" y1="17" x2="12.01" y2="17"></line>
                 </svg>`;
      break;
    case 'error':
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <circle cx="12" cy="12" r="10"></circle>
                   <line x1="15" y1="9" x2="9" y2="15"></line>
                   <line x1="9" y1="9" x2="15" y2="15"></line>
                 </svg>`;
      break;
    case 'info':
    default:
      iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <circle cx="12" cy="12" r="10"></circle>
                   <line x1="12" y1="16" x2="12" y2="12"></line>
                   <line x1="12" y1="8" x2="12.01" y2="8"></line>
                 </svg>`;
      break;
  }
  
  // Create toast content
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon ${type}">
        ${iconSvg}
      </div>
      <div class="toast-message">${message}</div>
      <button class="toast-close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="toast-progress"></div>
  `;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Add click handler for close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'toastOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto remove after duration
  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.style.animation = 'toastOut 0.3s forwards';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toast.remove();
        }
      }, 300);
    }
  }, duration);
  
  return toast;
}