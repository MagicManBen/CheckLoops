/**
 * Shared Training Modal Component
 * 
 * This script provides a standardized training record modal that can be used
 * across multiple pages in the CheckLoops application.
 */

class TrainingModal {
  constructor(options = {}) {
    // Default options
    this.options = {
      modalId: 'training-upload-modal',
      formId: 'training-upload-form',
      typeSelectId: 'training-type-select',
      completionDateId: 'training-completion-date',
      expiryPeriodId: 'training-expiry-period',
      certificateId: 'training-certificate',
      notesId: 'training-notes',
      errorId: 'training-upload-error',
      saveButtonId: 'training-save-btn',
      cancelButtonId: 'training-cancel-btn',
      closeButtonId: 'training-modal-close',
      calculatedExpiryId: 'calculated-expiry',
      fileNameId: 'file-name-text',
      onSave: null,
      onClose: null,
      ...options
    };
    
    // Initialize modal when DOM is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }
  
  initialize() {
    this.modal = document.getElementById(this.options.modalId);
    if (!this.modal) {
      console.error(`Training modal with ID ${this.options.modalId} not found`);
      return;
    }
    
    // Get elements
    this.form = document.getElementById(this.options.formId);
    this.typeSelect = document.getElementById(this.options.typeSelectId);
    this.completionDate = document.getElementById(this.options.completionDateId);
    this.expiryPeriod = document.getElementById(this.options.expiryPeriodId);
    this.certificate = document.getElementById(this.options.certificateId);
    this.notes = document.getElementById(this.options.notesId);
    this.errorDiv = document.getElementById(this.options.errorId);
    this.saveBtn = document.getElementById(this.options.saveButtonId);
    this.cancelBtn = document.getElementById(this.options.cancelButtonId);
    this.closeBtn = document.getElementById(this.options.closeButtonId);
    this.calculatedExpiry = document.getElementById(this.options.calculatedExpiryId);
    this.fileName = document.getElementById(this.options.fileNameId);
    this.fileNameContainer = document.getElementById(this.options.fileNameId).parentElement;
    this.fileUploadButton = document.getElementById('file-upload-button');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize file upload UI
    this.initFileUploadUI();
    
    // Initialize step indicator
    this.initStepIndicator();
    
    // Enhance expiry date display
    this.enhanceExpiryDateDisplay();
    
    console.log('Training modal initialized');
  }
  
  setupEventListeners() {
    // Close modal
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    
    // Cancel button
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.close());
    }
    
    // Save button
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof this.options.onSave === 'function') {
          this.options.onSave();
        } else {
          this.defaultSaveHandler();
        }
      });
    }
    
    // File upload
    if (this.certificate) {
      this.certificate.addEventListener('change', (e) => this.handleFileUpload(e));
    }
    
    // Form field changes for step indicator updates
    if (this.typeSelect) {
      this.typeSelect.addEventListener('change', () => {
        this.updateSteps();
        this.updateExpiryBasedOnTrainingType();
      });
    }
    
    if (this.completionDate) {
      this.completionDate.addEventListener('change', () => {
        this.updateSteps();
        this.calculateExpiry();
      });
    }
    
    if (this.expiryPeriod) {
      this.expiryPeriod.addEventListener('change', () => this.calculateExpiry());
    }
  }
  
  // Initialize the file upload UI
  initFileUploadUI() {
    if (!this.certificate || !this.fileName || !this.fileNameContainer || !this.fileUploadButton) return;
    
    this.certificate.addEventListener('change', () => {
      const file = this.certificate.files[0];
      if (file) {
        this.fileName.textContent = file.name;
        this.fileNameContainer.style.display = 'flex';
        this.fileUploadButton.classList.add('has-file');
        this.fileUploadButton.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
          Change file...
        `;
      } else {
        this.fileNameContainer.style.display = 'none';
        this.fileUploadButton.classList.remove('has-file');
        this.fileUploadButton.innerHTML = `
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
  initStepIndicator() {
    const steps = this.modal.querySelectorAll('.step');
    if (!steps.length) return;
    
    this.steps = steps;
    this.updateSteps();
  }
  
  // Update steps when form changes
  updateSteps() {
    if (!this.steps) return;
    
    // Reset all steps
    this.steps.forEach(step => {
      step.classList.remove('active', 'completed');
    });
    
    // Step 1: Training Type
    if (this.typeSelect && this.typeSelect.value) {
      this.steps[0].classList.add('completed');
      
      // Step 2: Completion Date
      if (this.completionDate && this.completionDate.value) {
        this.steps[1].classList.add('completed');
        this.steps[2].classList.add('active');
      } else {
        this.steps[1].classList.add('active');
      }
    } else {
      this.steps[0].classList.add('active');
    }
  }
  
  // Enhanced expiry date calculation
  enhanceExpiryDateDisplay() {
    if (!this.completionDate || !this.expiryPeriod || !this.calculatedExpiry) return;
    
    const updateExpiryDisplay = () => {
      if (!this.completionDate.value || !this.expiryPeriod.value || this.expiryPeriod.value === 'never') {
        this.calculatedExpiry.textContent = 'No expiry';
        window.calculatedExpiryDate = null;
        return;
      }
      
      const completion = new Date(this.completionDate.value);
      const expiry = new Date(completion);
      
      // Calculate based on selected period
      switch(this.expiryPeriod.value) {
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
      this.calculatedExpiry.textContent = expiry.toLocaleDateString(undefined, options);
      
      // Store for saving
      window.calculatedExpiryDate = expiry.toISOString().split('T')[0];
    };
    
    this.completionDate.addEventListener('change', updateExpiryDisplay);
    this.expiryPeriod.addEventListener('change', updateExpiryDisplay);
    
    // Run initially with a slight delay to ensure values are loaded
    setTimeout(updateExpiryDisplay, 100);
  }
  
  // Update expiry period based on training type
  updateExpiryBasedOnTrainingType() {
    if (!this.typeSelect || !this.expiryPeriod) return;
    if (!window.trainingTypes) return;
    
    const selectedTypeId = this.typeSelect.value;
    if (!selectedTypeId) return;
    
    // Find the selected training type
    const selectedType = window.trainingTypes.find(t => t.id == selectedTypeId);
    if (!selectedType) return;
    
    // Set expiry period based on the selected training's validity_months
    if (selectedType.validity_months) {
      if (selectedType.validity_months <= 1) {
        this.expiryPeriod.value = '1month';
      } else if (selectedType.validity_months <= 3) {
        this.expiryPeriod.value = '3months';
      } else if (selectedType.validity_months <= 6) {
        this.expiryPeriod.value = '6months';
      } else if (selectedType.validity_months <= 12) {
        this.expiryPeriod.value = '1year';
      } else if (selectedType.validity_months <= 24) {
        this.expiryPeriod.value = '2years';
      } else {
        this.expiryPeriod.value = '3years';
      }
    } else {
      // If no validity_months, set to no expiry
      this.expiryPeriod.value = 'never';
    }
    
    // Recalculate expiry date
    this.calculateExpiry();
  }
  
  // Calculate expiry date
  calculateExpiry() {
    if (!this.completionDate || !this.expiryPeriod || !this.calculatedExpiry) return;
    
    if (!this.completionDate.value || !this.expiryPeriod.value || this.expiryPeriod.value === 'never') {
      this.calculatedExpiry.textContent = 'No expiry';
      window.calculatedExpiryDate = null;
      return;
    }
    
    const completion = new Date(this.completionDate.value);
    const expiry = new Date(completion);
    
    // Calculate based on selected period
    switch(this.expiryPeriod.value) {
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
    
    // Format date nicely for display
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    this.calculatedExpiry.textContent = expiry.toLocaleDateString(undefined, options);
    
    // Store for saving
    window.calculatedExpiryDate = expiry.toISOString().split('T')[0];
  }
  
  // Improved file handling with validation
  handleFileUpload(event) {
    if (!this.certificate || !this.errorDiv) return;
    
    const file = event.target.files[0];
    this.errorDiv.style.display = 'none';
    
    if (!file) {
      if (this.fileNameContainer) {
        this.fileNameContainer.style.display = 'none';
      }
      window.uploadedFile = null;
      return;
    }
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      this.errorDiv.textContent = 'Invalid file type. Please upload a PDF, JPG or PNG file.';
      this.errorDiv.style.display = 'block';
      this.certificate.value = '';
      if (this.fileNameContainer) {
        this.fileNameContainer.style.display = 'none';
      }
      window.uploadedFile = null;
      return;
    }
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      this.errorDiv.textContent = 'File size must be less than 10MB';
      this.errorDiv.style.display = 'block';
      this.certificate.value = '';
      if (this.fileNameContainer) {
        this.fileNameContainer.style.display = 'none';
      }
      window.uploadedFile = null;
      return;
    }
    
    // Store file for later use
    window.uploadedFile = file;
    
    // Update UI if needed elements exist
    if (this.fileName && this.fileNameContainer) {
      this.fileName.textContent = file.name;
      this.fileNameContainer.style.display = 'flex';
    }
    
    // Update steps
    this.updateSteps();
  }
  
  // Default save handler - can be overridden via options.onSave
  defaultSaveHandler() {
    if (this.errorDiv) {
      this.errorDiv.style.display = 'none';
    }
    
    try {
      // Basic validation
      if (this.typeSelect && !this.typeSelect.value) {
        throw new Error('Please select a training type');
      }
      
      if (this.completionDate && !this.completionDate.value) {
        throw new Error('Please enter a completion date');
      }
      
      // Prepare data for external handlers
      const data = {
        trainingTypeId: this.typeSelect ? parseInt(this.typeSelect.value) : null,
        completionDate: this.completionDate ? this.completionDate.value : null,
        expiryDate: window.calculatedExpiryDate || null,
        notes: this.notes ? this.notes.value : null,
        file: window.uploadedFile || null
      };
      
      // Emit a custom event for external handlers
      const event = new CustomEvent('trainingModalSave', { detail: data });
      document.dispatchEvent(event);
      
      // Close the modal after successful save
      this.close();
      
    } catch (error) {
      if (this.errorDiv) {
        this.errorDiv.textContent = error.message;
        this.errorDiv.style.display = 'block';
      } else {
        console.error('Training modal error:', error);
      }
    }
  }
  
  // Open modal with optional pre-selected training type
  open(preselectedType = null) {
    if (!this.modal) return;
    
    // Reset error state
    if (this.errorDiv) {
      this.errorDiv.style.display = 'none';
    }
    
    // Reset form
    if (this.form) {
      this.form.reset();
    }
    
    // Set default completion date to today
    if (this.completionDate) {
      this.completionDate.value = new Date().toISOString().split('T')[0];
    }
    
    // Set pre-selected type if provided
    if (preselectedType && this.typeSelect) {
      this.typeSelect.value = preselectedType.id;
      this.updateExpiryBasedOnTrainingType();
    }
    
    // Reset file upload
    window.uploadedFile = null;
    if (this.fileNameContainer) {
      this.fileNameContainer.style.display = 'none';
    }
    
    if (this.fileUploadButton) {
      this.fileUploadButton.classList.remove('has-file');
      this.fileUploadButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17,8 12,3 7,8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        Choose file...
      `;
    }
    
    // Update steps
    this.updateSteps();
    
    // Calculate initial expiry
    this.calculateExpiry();
    
    // Show modal with animation
    this.modal.style.display = 'flex';
    if (this.modal.classList) {
      this.modal.classList.add('showing');
      setTimeout(() => {
        this.modal.classList.remove('showing');
      }, 300);
    }
  }
  
  // Close modal
  close() {
    if (!this.modal) return;
    
    // Hide modal with animation
    if (this.modal.classList) {
      this.modal.classList.add('hiding');
      setTimeout(() => {
        this.modal.style.display = 'none';
        this.modal.classList.remove('hiding');
        
        // Call close callback if provided
        if (typeof this.options.onClose === 'function') {
          this.options.onClose();
        }
      }, 300);
    } else {
      this.modal.style.display = 'none';
      
      // Call close callback if provided
      if (typeof this.options.onClose === 'function') {
        this.options.onClose();
      }
    }
    
    // Reset state
    window.uploadedFile = null;
  }
}

// Initialize the modal if this script is loaded on a page with a training modal
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('training-upload-modal')) {
    // Check if there's already an instance to avoid duplication
    if (!window.trainingModal) {
      window.trainingModal = new TrainingModal();
    }
  }
});