/**
 * Training Tracker Accessibility Improvements
 * This script enhances the readability of the Training Matrix table by adjusting
 * contrast and hover effects.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Function to enhance training matrix cells when the training section is shown
  function enhanceTrainingMatrixAccessibility() {
    // Target the training matrix once it becomes visible
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          if (mutation.target.style.display !== 'none') {
            applyAccessibilityImprovements();
            // No need to continue observing once we've applied improvements
            observer.disconnect();
          }
        }
      }
    });
    
    // Get the training section
    const trainingSection = document.getElementById('section-training');
    if (trainingSection) {
      // Start observing the display property
      observer.observe(trainingSection, { 
        attributes: true, 
        attributeFilter: ['style'] 
      });
      
      // Also check immediately in case it's already visible
      if (trainingSection.style.display !== 'none') {
        applyAccessibilityImprovements();
        observer.disconnect();
      }
    }
  }

  // Function to apply accessibility improvements to cells
  function applyAccessibilityImprovements() {
    // Get the table element
    const matrixTable = document.getElementById('training-matrix-table');
    if (!matrixTable) return;
    
    // Add a border to each cell to improve visual separation
    const cells = matrixTable.querySelectorAll('td');
    cells.forEach(cell => {
      // Add a subtle box shadow for depth
      cell.style.boxShadow = 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)';
      
      // Improve hover state
      cell.addEventListener('mouseenter', () => {
        if (cell.classList.contains('training-cell')) {
          cell.style.transform = 'scale(1.05)';
          cell.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.3)';
          cell.style.zIndex = '4';
        }
      });
      
      cell.addEventListener('mouseleave', () => {
        if (cell.classList.contains('training-cell')) {
          cell.style.transform = '';
          cell.style.boxShadow = 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)';
          cell.style.zIndex = '';
        }
      });
    });
    
    // Improve header cells
    const headers = matrixTable.querySelectorAll('th');
    headers.forEach(header => {
      header.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';
      header.style.boxShadow = 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)';
    });
    
    // Add a subtle background to rows on hover
    const rows = matrixTable.querySelectorAll('tr');
    rows.forEach(row => {
      row.addEventListener('mouseenter', () => {
        row.style.background = 'rgba(255, 255, 255, 0.03)';
      });
      
      row.addEventListener('mouseleave', () => {
        row.style.background = '';
      });
    });
  }

  // Wait for any navigation events that might show the training section
  document.addEventListener('click', function(event) {
    if (event.target.closest('button[data-section="training"]')) {
      // Wait a moment for the section to become visible
      setTimeout(enhanceTrainingMatrixAccessibility, 300);
    }
  });

  // Initial check in case the training section is already visible
  enhanceTrainingMatrixAccessibility();
});