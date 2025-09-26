// Improved Training Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize file upload enhancements
  initFileUploadUI();
  
  // Initialize step indicator
  initStepIndicator();
  
  // Additional event listeners
  document.getElementById('training-completion-date').addEventListener('change', updateSteps);
  document.getElementById('training-type-select').addEventListener('change', updateSteps);
  document.getElementById('training-certificate').addEventListener('change', function(event) {
    handleFileUpload(event);
    updateSteps();
  });
  
  // Enhance expiry date display
  enhanceExpiryDateDisplay();
});

// Initialize the file upload UI
function initFileUploadUI() {
  const fileInput = document.getElementById('training-certificate');
  const fileNameDisplay = document.getElementById('file-name');
  const fileNameText = document.getElementById('file-name-text');
  const fileUploadButton = document.getElementById('file-upload-button');
  
  fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      fileNameText.textContent = file.name;
      fileNameDisplay.style.display = 'flex';
      fileUploadButton.classList.add('has-file');
      fileUploadButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        Change file...
      `;
    } else {
      fileNameDisplay.style.display = 'none';
      fileUploadButton.classList.remove('has-file');
      fileUploadButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17,8 12,3 7,8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        Choose file...
      `;
    }
  });
}

// Initialize and update the step indicator
function initStepIndicator() {
  const steps = document.querySelectorAll('.step');
  const typeSelect = document.getElementById('training-type-select');
  const completionDate = document.getElementById('training-completion-date');
  
  typeSelect.addEventListener('change', function() {
    updateStepProgress();
  });
  
  completionDate.addEventListener('change', function() {
    updateStepProgress();
  });
  
  function updateStepProgress() {
    // Reset all steps
    steps.forEach(step => {
      step.classList.remove('active', 'completed');
    });
    
    // Set appropriate step based on form completion
    if (typeSelect.value) {
      steps[0].classList.add('completed');
      
      if (completionDate.value) {
        steps[1].classList.add('completed');
        steps[2].classList.add('active');
      } else {
        steps[1].classList.add('active');
      }
    } else {
      steps[0].classList.add('active');
    }
  }
  
  // Initial update
  updateStepProgress();
}

// Enhanced expiry date calculation
function enhanceExpiryDateDisplay() {
  const completionDate = document.getElementById('training-completion-date');
  const expiryPeriod = document.getElementById('training-expiry-period');
  const calculatedExpiry = document.getElementById('calculated-expiry');
  
  function updateExpiryDisplay() {
    if (!completionDate.value || !expiryPeriod.value || expiryPeriod.value === 'never') {
      calculatedExpiry.textContent = 'No expiry';
      return;
    }
    
    const completion = new Date(completionDate.value);
    const expiry = new Date(completion);
    
    // Calculate based on selected period
    switch(expiryPeriod.value) {
      case '1week':
        expiry.setDate(expiry.getDate() + 7);
        break;
      case '1month':
        expiry.setMonth(expiry.getMonth() + 1);
        break;
      case '3months':
        expiry.setMonth(expiry.getMonth() + 3);
        break;
      case '6months':
        expiry.setMonth(expiry.getMonth() + 6);
        break;
      case '1year':
        expiry.setFullYear(expiry.getFullYear() + 1);
        break;
      case '2years':
        expiry.setFullYear(expiry.getFullYear() + 2);
        break;
      case '3years':
        expiry.setFullYear(expiry.getFullYear() + 3);
        break;
    }
    
    // Format date nicely
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    calculatedExpiry.textContent = expiry.toLocaleDateString(undefined, options);
    
    // Store for saving
    window.calculatedExpiryDate = expiry.toISOString().split('T')[0];
  }
  
  completionDate.addEventListener('change', updateExpiryDisplay);
  expiryPeriod.addEventListener('change', updateExpiryDisplay);
  
  // Run initially
  setTimeout(updateExpiryDisplay, 100);
}

// Update steps when form changes
function updateSteps() {
  const steps = document.querySelectorAll('.step');
  const typeSelect = document.getElementById('training-type-select');
  const completionDate = document.getElementById('training-completion-date');
  const fileInput = document.getElementById('training-certificate');
  
  // Reset all steps
  steps.forEach(step => {
    step.classList.remove('active', 'completed');
  });
  
  // Step 1: Training Type
  if (typeSelect.value) {
    steps[0].classList.add('completed');
    
    // Step 2: Completion Date
    if (completionDate.value) {
      steps[1].classList.add('completed');
      steps[2].classList.add('active');
    } else {
      steps[1].classList.add('active');
    }
  } else {
    steps[0].classList.add('active');
  }
}

// Improved file handling with validation
function handleFileUpload(event) {
  const file = event.target.files[0];
  const errorDiv = document.getElementById('training-upload-error');
  const fileNameDisplay = document.getElementById('file-name');
  const fileNameText = document.getElementById('file-name-text');
  
  errorDiv.style.display = 'none';
  
  if (!file) {
    fileNameDisplay.style.display = 'none';
    return;
  }
  
  // Validate file type
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    errorDiv.textContent = 'Invalid file type. Please upload a PDF, JPG or PNG file.';
    errorDiv.style.display = 'block';
    event.target.value = '';
    fileNameDisplay.style.display = 'none';
    return;
  }
  
  // Validate file size
  if (file.size > 10 * 1024 * 1024) {
    errorDiv.textContent = 'File size must be less than 10MB';
    errorDiv.style.display = 'block';
    event.target.value = '';
    fileNameDisplay.style.display = 'none';
    return;
  }
  
  // Display file name and set global variable
  fileNameText.textContent = file.name;
  fileNameDisplay.style.display = 'flex';
  window.uploadedFile = file;
}