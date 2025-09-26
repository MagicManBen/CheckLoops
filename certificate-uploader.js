// Certificate Uploader Implementation with Debug
function initCertificateUploader() {
  // Initialize the debugger if available
  const debug = window.certificateDebugger || {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    success: console.log,
    init: () => {}
  };
  
  debug.init();
  debug.info('Certificate uploader initialization started');
  
  // Get all the elements we need
  const dropzone = document.getElementById('certificate-dropzone');
  const fileInput = document.getElementById('certificate-upload');
  const preview = document.getElementById('certificate-preview');
  const filenameEl = document.getElementById('preview-filename');
  const filesizeEl = document.getElementById('preview-filesize');
  const processingIndicator = document.getElementById('processing-indicator');
  const removeBtn = document.getElementById('remove-certificate-btn');
  const viewBtn = document.getElementById('view-certificate-btn');
  
  // Certificate confirmation modal elements
  const confirmModal = document.getElementById('cert-confirmation-modal');
  const closeBtn = document.getElementById('cert-modal-close');
  const cancelBtn = document.getElementById('cert-cancel-btn');
  const saveBtn = document.getElementById('cert-save-btn');
  
  // Check if all required elements exist
  if (!dropzone) {
    debug.error('Dropzone element not found! ID: certificate-dropzone');
    return;
  }
  
  if (!fileInput) {
    debug.error('File input element not found! ID: certificate-upload');
    return;
  }
  
  debug.log('All required elements found');
  
  // Drag and drop events
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
    debug.info(`Event listener added for ${eventName}`);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    debug.info('File drag entered dropzone');
    dropzone.classList.add('dragover');
  }
  
  function unhighlight() {
    debug.info('File drag left dropzone or file dropped');
    dropzone.classList.remove('dragover');
  }
  
  // Handle file drop
  dropzone.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    debug.info('File dropped on dropzone');
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
      debug.info(`${files.length} file(s) dropped, processing first file: ${files[0].name}`);
      fileInput.files = files;
      handleFiles(files);
    } else {
      debug.warn('No files found in the drop event');
    }
  }
  
  // Handle file selection
  fileInput.addEventListener('change', function() {
    if (this.files.length) {
      debug.info(`File selected via input: ${this.files[0].name}`);
      handleFiles(this.files);
    }
  });
  
  // Add a click event to the dropzone to trigger file input
  dropzone.addEventListener('click', function(e) {
    if (e.target !== fileInput && !e.target.closest('.certificate-preview')) {
      debug.info('Dropzone clicked, triggering file input click');
      fileInput.click();
    }
  });
  
  // Remove button functionality
  if (removeBtn) {
    removeBtn.addEventListener('click', function() {
      debug.info('Remove button clicked, resetting uploader');
      resetUploader();
    });
  } else {
    debug.warn('Remove button not found! ID: remove-certificate-btn');
  }
  
  // View button functionality
  if (viewBtn) {
    viewBtn.addEventListener('click', function() {
      if (window.certificateFile) {
        debug.info('View button clicked, opening certificate in new tab');
        const url = URL.createObjectURL(window.certificateFile);
        window.open(url, '_blank');
      } else {
        debug.warn('View button clicked but no certificate file available');
      }
    });
  } else {
    debug.warn('View button not found! ID: view-certificate-btn');
  }
  
  // Modal close buttons
  if (confirmModal) {
    if (closeBtn) {
      closeBtn.addEventListener('click', closeConfirmModal);
    } else {
      debug.warn('Modal close button not found! ID: cert-modal-close');
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeConfirmModal);
    } else {
      debug.warn('Modal cancel button not found! ID: cert-cancel-btn');
    }
    
    // Save button functionality
    if (saveBtn) {
      saveBtn.addEventListener('click', saveFromConfirmationModal);
    } else {
      debug.warn('Modal save button not found! ID: cert-save-btn');
    }
  } else {
    debug.warn('Certificate confirmation modal not found! ID: cert-confirmation-modal');
  }
  
  function closeConfirmModal() {
    debug.info('Confirmation modal closed');
    confirmModal.classList.remove('active');
  }
  
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }
  
  function resetUploader() {
    debug.info('Resetting uploader state');
    if (fileInput) fileInput.value = '';
    if (preview) preview.classList.remove('active');
    if (processingIndicator) {
      processingIndicator.classList.remove('error', 'success');
      processingIndicator.innerHTML = '<div class="spinner"></div><span>Processing certificate with AI...</span>';
    }
    window.certificateFile = null;
    window.certificateUrl = null;
    window.certificateData = null;
  }
  
  function handleFiles(files) {
    const file = files[0];
    
    // Validate file
    if (!file) {
      debug.warn('No file provided to handleFiles function');
      return;
    }
    
    debug.info(`Processing file: ${file.name}, type: ${file.type}, size: ${formatFileSize(file.size)}`);
    
    if (file.size > 10 * 1024 * 1024) {
      debug.error('File size exceeds 10MB limit');
      showError('File size must be less than 10MB');
      return;
    }
    
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      debug.error(`Invalid file type: ${file.type}. Only PDF, PNG, and JPG are supported.`);
      showError('Only PDF, PNG and JPG files are supported');
      return;
    }
    
    // Save file for later use
    window.certificateFile = file;
    
    // Update preview
    if (filenameEl) filenameEl.textContent = file.name;
    if (filesizeEl) filesizeEl.textContent = formatFileSize(file.size);
    if (preview) preview.classList.add('active');
    
    // Process file
    debug.info('Starting certificate processing');
    processCertificate(file);
  }
  
  function showError(message) {
    debug.error(`Error: ${message}`);
    if (processingIndicator) {
      processingIndicator.classList.add('error');
      processingIndicator.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${message}</span>
      `;
    }
    if (preview) preview.classList.add('active');
  }
  
  function showSuccess(message) {
    debug.success(`Success: ${message}`);
    if (processingIndicator) {
      processingIndicator.classList.add('success');
      processingIndicator.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${message}</span>
      `;
    }
  }
  
  // Process certificate with AI
  async function processCertificate(file) {
    try {
      debug.info('Starting certificate AI processing');
      
      // Check if we have a supabase client
      if (!window.supabase) {
        throw new Error('Supabase client not found. Make sure supabase is initialized before uploading certificates.');
      }
      
      // Check if currentUser is available
      if (!window.currentUser || !window.currentUser.siteId) {
        throw new Error('Current user or site ID not found. Authentication may not be complete.');
      }
      
      // Show processing state
      if (processingIndicator) {
        processingIndicator.classList.remove('error', 'success');
        processingIndicator.innerHTML = '<div class="spinner"></div><span>Processing certificate with AI...</span>';
      }
      
      // First, try to extract text from the file client-side
      let textContent = '';
      let needsServerProcessing = false;

      if (file.type === 'application/pdf') {
        debug.info('PDF file detected');

        // Check if PDF.js is loaded
        if (typeof pdfjsLib !== 'undefined') {
          debug.info('PDF.js is available, extracting text client-side');
          try {
            textContent = await extractTextFromPDF(file);
            debug.info(`Extracted ${textContent.length} characters from PDF`);
          } catch (pdfError) {
            debug.warn('PDF text extraction failed, will use server-side processing:', pdfError.message);
            needsServerProcessing = true;
          }
        } else {
          debug.info('PDF.js not available, will use server-side processing');
          needsServerProcessing = true;
        }
      } else if (file.type === 'image/png' || file.type === 'image/jpeg') {
        debug.info('Image file detected. Text extraction will be performed server-side.');
        needsServerProcessing = true;
      }

      // If we couldn't extract text client-side, mark for server processing
      if (needsServerProcessing) {
        textContent = ''; // Empty text will signal server to process the file
        debug.info('File will be processed server-side using signed URL');
      }
      
      // Get session for authentication
      debug.info('Getting Supabase session');
      const { data: sessionData, error: sessionError } = await window.supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        debug.error('Authentication error:', sessionError);
        throw new Error('Not authenticated. Please log in again.');
      }
      
      const session = sessionData.session;
      
      // Upload file to Supabase
      debug.info('Uploading file to Supabase storage');
      const fileExt = file.name.split('.').pop();
      const fileName = `cert_${Date.now()}.${fileExt}`;
      const filePath = `${window.currentUser.siteId}/training_certificates/${fileName}`;

      debug.info(`Upload bucket: training_certificates`);
      debug.info(`Upload path: ${filePath}`);
      debug.info(`File size: ${formatFileSize(file.size)}`);
      debug.info(`File type: ${file.type}`);

      const { data: uploadData, error: uploadError } = await window.supabase.storage
        .from('training_certificates')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        debug.error('Supabase upload error:', uploadError);
        throw new Error('Failed to upload certificate: ' + uploadError.message);
      }
      
      debug.success('File uploaded successfully to Supabase storage');
      
      // Save the URL for later reference
      window.certificateUrl = filePath;
      
      // Create a signed URL for the file
      debug.info('Creating signed URL for the uploaded file');
      const { data: signedUrlData, error: signedUrlError } = await window.supabase.storage
        .from('training_certificates')
        .createSignedUrl(filePath, 60); // 60 seconds expiry
      
      if (signedUrlError || !signedUrlData) {
        debug.error('Failed to create signed URL:', signedUrlError);
        throw new Error('Failed to create access URL for the file');
      }
      
      const signedUrl = signedUrlData.signedUrl;
      debug.info('Signed URL created successfully');
      
      // Call the Edge Function
      const supabaseUrl = window.supabaseUrl || window.CONFIG?.SUPABASE_URL || 'https://unveoqnlqnobufhublyw.supabase.co';

      // Try v2 endpoint first (handles server-side processing), fallback to v1
      let apiEndpoint = `${supabaseUrl}/functions/v1/extract-certificate-v2`;
      let useV2 = true;

      debug.info(`Calling Edge Function at: ${apiEndpoint}`);
      debug.info(`Text content length: ${textContent.length} characters`);
      debug.info(`Needs server processing: ${needsServerProcessing}`);
      debug.info(`Signed URL provided: ${!!signedUrl}`);
      debug.info(`Authorization token length: ${session.access_token?.length || 0}`);

      const requestBody = {
        text: textContent || '',  // Send empty string if we need server processing
        signedUrl: needsServerProcessing ? signedUrl : undefined  // Only send URL if needed
      };

      debug.info('Request body:', JSON.stringify(requestBody).substring(0, 200) + '...');

      let response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // If v2 endpoint not found, fallback to v1 (but it won't handle server-side PDF processing)
      if (response.status === 404 && useV2) {
        debug.warn('V2 endpoint not found, falling back to V1');
        apiEndpoint = `${supabaseUrl}/functions/v1/extract-certificate`;

        // For v1, we must have text content
        if (!textContent) {
          throw new Error('Cannot process file server-side with V1 endpoint. Please deploy V2 endpoint or ensure PDF.js is loaded.');
        }

        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: textContent,
            signedUrl: signedUrl
          })
        });
      }
      
      // Log the response status
      debug.info(`Edge Function response status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {}
        
        debug.error('Edge Function error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      debug.info('Edge Function result received:', JSON.stringify(result));
      
      if (!result.success) {
        debug.error('AI extraction failed:', result.error);
        throw new Error(result.error || 'AI extraction failed');
      }
      
      // Save extracted data for confirmation
      window.certificateData = result.data || {};
      debug.success('Certificate data extracted:', JSON.stringify(window.certificateData));
      
      // Show success message
      showSuccess('Certificate processed successfully! Click to confirm details.');
      
      // Wait a moment for user to see the success message
      setTimeout(() => {
        // Open confirmation modal
        if (window.certificateData) {
          debug.info('Opening confirmation modal with extracted data');
          openConfirmationModal(window.certificateData);
        }
      }, 1500);
      
    } catch (error) {
      debug.error('Certificate processing error:', error.message);
      showError(error.message || 'Failed to process certificate');
    }
  }
  
  // Extract text from PDF
  async function extractTextFromPDF(file) {
    debug.info('Starting PDF text extraction');
    
    if (typeof pdfjsLib === 'undefined') {
      debug.error('PDF.js not loaded');
      throw new Error('PDF.js not loaded. Please refresh the page and try again.');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      debug.info('PDF file loaded as ArrayBuffer');
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      debug.info(`PDF loaded with ${pdf.numPages} pages`);
      
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        debug.info(`Processing page ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      debug.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF: ' + error.message);
    }
  }
  
  // Open confirmation modal with extracted data
  function openConfirmationModal(data) {
    if (!confirmModal) {
      debug.error('Cannot open confirmation modal - element not found');
      return;
    }
    
    debug.info('Populating confirmation modal with extracted data');
    
    // Find form elements
    const personNameInput = document.getElementById('cert-person-name');
    const trainingTypeSelect = document.getElementById('cert-training-type');
    const completionDateInput = document.getElementById('cert-completion-date');
    const expiryDateInput = document.getElementById('cert-expiry-date');
    const providerInput = document.getElementById('cert-provider');
    const certIdInput = document.getElementById('cert-id');
    const notesInput = document.getElementById('cert-notes');
    
    // Fill form fields with extracted data if elements exist
    if (personNameInput && data.person_name) personNameInput.value = data.person_name;
    if (completionDateInput && data.completion_date) completionDateInput.value = data.completion_date;
    if (expiryDateInput && data.expiry_date) expiryDateInput.value = data.expiry_date;
    if (providerInput && data.provider) providerInput.value = data.provider;
    if (certIdInput && data.certificate_id) certIdInput.value = data.certificate_id;
    
    // Set default notes with additional details
    if (notesInput) {
      let notes = '';
      if (data.additional_details) notes += data.additional_details;
      if (data.provider) notes += `\nProvider: ${data.provider}`;
      notesInput.value = notes.trim();
    }
    
    // Populate training type dropdown if it exists
    if (trainingTypeSelect) {
      // Clear existing options except the first one
      while (trainingTypeSelect.options.length > 1) {
        trainingTypeSelect.remove(1);
      }
      
      // Check if trainingTypes is available globally
      if (window.trainingTypes && Array.isArray(window.trainingTypes)) {
        debug.info(`Populating ${window.trainingTypes.length} training types in dropdown`);
        
        window.trainingTypes.forEach(type => {
          const option = document.createElement('option');
          option.value = type.id;
          option.textContent = type.name;
          trainingTypeSelect.appendChild(option);
        });
        
        // Match training name to training type
        if (data.training_name) {
          debug.info(`Trying to match training name: ${data.training_name}`);
          const trainingOptions = Array.from(trainingTypeSelect.options);
          const matchedOption = trainingOptions.find(option => 
            option.text.toLowerCase().includes(data.training_name.toLowerCase())
          );
          
          if (matchedOption) {
            debug.info(`Matched training name to option: ${matchedOption.text}`);
            trainingTypeSelect.value = matchedOption.value;
          } else {
            debug.warn(`No match found for training name: ${data.training_name}`);
          }
        }
      } else {
        debug.warn('Training types not available for dropdown');
      }
    }
    
    // Open modal
    debug.info('Showing confirmation modal');
    confirmModal.classList.add('active');
  }
  
  // Save from confirmation modal
  async function saveFromConfirmationModal() {
    debug.info('Save button clicked in confirmation modal');
    
    try {
      // Find form elements
      const personNameInput = document.getElementById('cert-person-name');
      const trainingTypeSelect = document.getElementById('cert-training-type');
      const completionDateInput = document.getElementById('cert-completion-date');
      const expiryDateInput = document.getElementById('cert-expiry-date');
      const providerInput = document.getElementById('cert-provider');
      const certIdInput = document.getElementById('cert-id');
      const notesInput = document.getElementById('cert-notes');
      
      // Validate required fields
      const trainingTypeId = trainingTypeSelect ? trainingTypeSelect.value : null;
      const completionDate = completionDateInput ? completionDateInput.value : null;
      
      if (!trainingTypeId || !completionDate) {
        debug.error('Missing required fields for saving');
        alert('Please select a training type and completion date');
        return;
      }
      
      if (!window.currentUser || !window.currentUser.id || !window.currentUser.siteId) {
        debug.error('User information not available');
        alert('User information not available. Please refresh and try again.');
        return;
      }
      
      debug.info('Preparing record data for saving');
      
      // Prepare record data
      const recordData = {
        site_id: window.currentUser.siteId,
        user_id: window.currentUser.id,
        training_type_id: parseInt(trainingTypeId),
        completion_date: completionDate,
        expiry_date: expiryDateInput && expiryDateInput.value ? expiryDateInput.value : null,
        notes: notesInput && notesInput.value ? notesInput.value : null,
        certificate_url: window.certificateUrl
      };
      
      debug.info('Record data:', JSON.stringify(recordData));
      
      // Check if supabase is available
      if (!window.supabase) {
        debug.error('Supabase client not found');
        throw new Error('Database connection not available. Please refresh and try again.');
      }
      
      // Save to database
      debug.info('Saving record to database');
      const { data, error } = await window.supabase
        .from('training_records')
        .insert(recordData);
      
      if (error) {
        debug.error('Database error when saving record:', error);
        throw error;
      }
      
      debug.success('Record saved successfully to database');
      
      // Check for achievement client and unlock achievements
      if (window.achievementClient) {
        debug.info('Processing achievements');
        try {
          await window.achievementClient.ensureUnlocked('first_training_upload', {
            metadata: {
              training_type_id: parseInt(trainingTypeId),
              completion_date: completionDate,
              has_certificate: Boolean(window.certificateUrl)
            }
          });
          
          if (typeof window.refreshTrainingAchievements === 'function') {
            await window.refreshTrainingAchievements({
              training_type_id: parseInt(trainingTypeId),
              completion_date: completionDate,
              has_certificate: Boolean(window.certificateUrl)
            });
          }
          
          debug.info('Achievement processing complete');
        } catch (achievementError) {
          debug.warn('Failed to unlock training achievements:', achievementError);
        }
      }
      
      // Close modal
      closeConfirmModal();
      
      // Reset uploader
      resetUploader();
      
      // Show success notification
      if (typeof window.showToast === 'function') {
        window.showToast('Training record saved successfully!', 'success', 3000);
      } else {
        // Fallback to basic notification
        debug.info('Using fallback toast notification');
        const successDiv = document.createElement('div');
        successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--success); color: white; padding: 0.75rem 1.25rem; border-radius: var(--radius); box-shadow: var(--shadow-lg); z-index: 10000; font-weight: 600;';
        successDiv.textContent = 'Training record saved successfully!';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 2000);
      }
      
      // Refresh training data
      setTimeout(() => {
        debug.info('Refreshing training data');
        
        if (typeof window.loadTrainingData === 'function') {
          window.loadTrainingData();
        } else if (typeof window.refreshTraining === 'function') {
          window.refreshTraining();
        } else if (typeof window.initializeTraining === 'function') {
          window.initializeTraining();
        } else {
          debug.info('No refresh function found, reloading page');
          window.location.reload();
        }
      }, 500);
      
    } catch (error) {
      debug.error('Save error:', error);
      alert('Failed to save training record: ' + error.message);
    }
  }
  
  // Add toggle button for debug panel
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'Debug';
  toggleBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #1e293b;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    z-index: 10000;
  `;
  toggleBtn.onclick = () => window.certificateDebugger && window.certificateDebugger.toggle();
  document.body.appendChild(toggleBtn);
  
  debug.success('Certificate uploader initialized successfully');
  
  return {
    reset: resetUploader,
    processFile: handleFiles,
    debug: debug
  };
}

// Initialize if DOM is already loaded or wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.certificateUploaderAPI = initCertificateUploader();
  });
} else {
  window.certificateUploaderAPI = initCertificateUploader();
}