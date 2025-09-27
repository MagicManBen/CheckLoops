// PDF-to-Image Certificate Uploader - Production Ready
// Converts PDFs to images using PDF.js canvas rendering, then sends to AI Vision

function initCertificateUploaderPDFToImage() {
  console.log('[PDF-IMG] Certificate uploader PDF-to-Image version initializing...');
  
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
  debug.info('[PDF-IMG] Certificate uploader with PDF-to-Image support starting');
  
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
  
  // Check if required elements exist
  if (!dropzone || !fileInput) {
    debug.error('[PDF-IMG] Required elements not found');
    return null;
  }
  
  debug.log('[PDF-IMG] All required elements found');
  
  // PDF.js initialization check with event listener
  let pdfJsReady = false;
  
  function onPdfJsReady() {
    pdfJsReady = true;
    debug.success('[PDF-IMG] PDF.js available for PDF-to-image conversion');
    if (typeof pdfjsLib !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use local worker file
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
      debug.info('[PDF-IMG] PDF.js worker configured (local)');
    }
  }
  
  // Check if PDF.js is already ready
  if (typeof pdfjsLib !== 'undefined' || window.pdfJsReady) {
    onPdfJsReady();
  } else {
    // Listen for PDF.js ready event
    window.addEventListener('pdfjs-ready', onPdfJsReady);
    
    // Fallback: check every 500ms for up to 10 seconds
    let attempts = 0;
    const maxAttempts = 20;
    const checkInterval = setInterval(() => {
      attempts++;
      if (typeof pdfjsLib !== 'undefined') {
        clearInterval(checkInterval);
        onPdfJsReady();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        debug.error('[PDF-IMG] PDF.js failed to load after 10 seconds. Please refresh the page.');
      } else {
        debug.warn(`[PDF-IMG] Waiting for PDF.js... (${attempts}/${maxAttempts})`);
      }
    }, 500);
  }
  
  // Event listeners setup
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
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
    debug.info('[PDF-IMG] File drag entered dropzone');
    dropzone.classList.add('dragover');
  }
  
  function unhighlight() {
    debug.info('[PDF-IMG] File drag left dropzone');
    dropzone.classList.remove('dragover');
  }
  
  // Handle file drop
  dropzone.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    debug.info('[PDF-IMG] File dropped on dropzone');
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
      debug.info(`[PDF-IMG] ${files.length} file(s) dropped, processing first: ${files[0].name}`);
      fileInput.files = files;
      handleFiles(files);
    }
  }
  
  // Handle file selection
  fileInput.addEventListener('change', function() {
    if (this.files.length) {
      debug.info(`[PDF-IMG] File selected: ${this.files[0].name}`);
      handleFiles(this.files);
    }
  });
  
  // Click to open file dialog
  dropzone.addEventListener('click', function(e) {
    if (e.target !== fileInput && !e.target.closest('.certificate-preview')) {
      debug.info('[PDF-IMG] Dropzone clicked, opening file dialog');
      fileInput.click();
    }
  });
  
  // Remove button
  if (removeBtn) {
    removeBtn.addEventListener('click', function() {
      debug.info('[PDF-IMG] Remove button clicked');
      resetUploader();
    });
  }
  
  // View button
  if (viewBtn) {
    viewBtn.addEventListener('click', function() {
      if (window.certificateFile) {
        debug.info('[PDF-IMG] View button clicked');
        const url = URL.createObjectURL(window.certificateFile);
        window.open(url, '_blank');
      }
    });
  }
  
  // Modal event listeners
  if (confirmModal) {
    if (closeBtn) closeBtn.addEventListener('click', closeConfirmModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeConfirmModal);
    if (saveBtn) saveBtn.addEventListener('click', saveFromConfirmationModal);
  }
  
  function closeConfirmModal() {
    debug.info('[PDF-IMG] Confirmation modal closed');
    if (confirmModal) confirmModal.classList.remove('active');
  }
  
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }
  
  function resetUploader() {
    debug.info('[PDF-IMG] Resetting uploader state');
    if (fileInput) fileInput.value = '';
    if (preview) preview.classList.remove('active');
    if (processingIndicator) {
      processingIndicator.classList.remove('error', 'success');
      processingIndicator.innerHTML = '<div class="spinner"></div><span>Processing certificate...</span>';
    }
    window.certificateFile = null;
    window.certificateUrl = null;
    window.certificateData = null;
    window.convertedImageFile = null;
  }
  
  function handleFiles(files) {
    const file = files[0];
    
    if (!file) {
      debug.warn('[PDF-IMG] No file provided');
      return;
    }
    
    debug.info(`[PDF-IMG] Processing: ${file.name}, type: ${file.type}, size: ${formatFileSize(file.size)}`);
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      debug.error('[PDF-IMG] File too large');
      showError('File size must be less than 10MB');
      return;
    }
    
    // Accept PDFs and Images
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      debug.error(`[PDF-IMG] Invalid file type: ${file.type}`);
      showError('Only PDF, PNG and JPG files are supported');
      return;
    }
    
    // Save original file
    window.certificateFile = file;
    
    // Update preview
    if (filenameEl) filenameEl.textContent = file.name;
    if (filesizeEl) filesizeEl.textContent = formatFileSize(file.size);
    if (preview) preview.classList.add('active');
    
    // Process the file
    debug.info('[PDF-IMG] Starting certificate processing');
    processCertificate(file);
  }
  
  function showError(message) {
    debug.error(`[PDF-IMG] Error: ${message}`);
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
    debug.success(`[PDF-IMG] Success: ${message}`);
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

  function showProcessingStep(stepName) {
    debug.info(`[PDF-IMG] Processing step: ${stepName}`);
    if (processingIndicator) {
      processingIndicator.classList.remove('error', 'success');
      processingIndicator.innerHTML = `<div class="spinner"></div><span>${stepName}</span>`;
    }
  }
  
  // Core PDF-to-Image conversion function
  async function convertPdfToImage(pdfFile) {
    debug.info('[PDF-IMG] Starting PDF to image conversion');
    
    if (typeof pdfjsLib === 'undefined' || !pdfJsReady) {
      throw new Error('PDF.js library not ready. Please wait a moment and try again.');
    }
    
    showProcessingStep('Converting PDF to image...');
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      debug.info('[PDF-IMG] PDF loaded as ArrayBuffer');
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      debug.info(`[PDF-IMG] PDF has ${pdf.numPages} pages`);
      
      // Get first page (certificates are usually single page)
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 }); // Reduced scale for compatibility
      
      debug.info(`[PDF-IMG] Page viewport: ${viewport.width} x ${viewport.height}`);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      debug.info('[PDF-IMG] Rendering PDF page to canvas...');
      
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;
      
      debug.info('[PDF-IMG] PDF page rendered successfully');
      
      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            debug.success(`[PDF-IMG] PDF converted to image (${formatFileSize(blob.size)})`);
            resolve(blob);
          } else {
            reject(new Error('Failed to convert PDF page to image'));
          }
        }, 'image/png', 1.0); // Use PNG format for better compatibility
      });
      
    } catch (error) {
      debug.error('[PDF-IMG] PDF conversion error:', error);
      throw new Error('Failed to convert PDF to image: ' + error.message);
    }
  }
  
  // Main certificate processing function
  async function processCertificate(file) {
    try {
      debug.info('[PDF-IMG] Starting certificate processing with PDF-to-Image approach');
      
      // Validate dependencies
      if (!window.supabase) {
        throw new Error('Supabase client not available');
      }
      
      if (!window.currentUser || !window.currentUser.siteId) {
        throw new Error('User authentication not available');
      }
      
      let imageFile;
      
      // Step 1: Convert to image if needed
      if (file.type === 'application/pdf') {
        debug.info('[PDF-IMG] PDF detected, converting to image');
        showProcessingStep('Converting PDF to high-quality image...');
        imageFile = await convertPdfToImage(file);
        window.convertedImageFile = imageFile;
      } else {
        debug.info('[PDF-IMG] Image file detected, using directly');
        imageFile = file;
      }
      
      // Step 2: Upload image to storage
      showProcessingStep('Uploading certificate to secure storage...');
      
      const fileExt = file.type === 'application/pdf' ? 'png' : file.name.split('.').pop();
      const fileName = `cert_${Date.now()}.${fileExt}`;
      const filePath = `${window.currentUser.siteId}/training_certificates/${fileName}`;
      
      debug.info(`[PDF-IMG] Uploading to: ${filePath}`);
      
      const { data: uploadData, error: uploadError } = await window.supabase.storage
        .from('training_certificates')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        debug.error('[PDF-IMG] Upload error:', uploadError);
        throw new Error('Failed to upload certificate: ' + uploadError.message);
      }
      
      window.certificateUrl = filePath;
      debug.success('[PDF-IMG] Certificate uploaded successfully');
      
      // Step 3: Create signed URL for AI processing
      showProcessingStep('Preparing certificate for AI analysis...');
      
      const { data: signedUrlData, error: signedUrlError } = await window.supabase.storage
        .from('training_certificates')
        .createSignedUrl(filePath, 300); // 5 minutes
      
      if (signedUrlError || !signedUrlData?.signedUrl) {
        debug.error('[PDF-IMG] Signed URL error:', signedUrlError);
        throw new Error('Failed to prepare certificate for AI analysis');
      }
      
      debug.info('[PDF-IMG] Signed URL created successfully');
      
      // Step 4: Send to AI Vision for analysis
      showProcessingStep('Analyzing certificate with AI Vision...');
      
      const result = await callAIVisionAnalysis(signedUrlData.signedUrl, file.name);
      
      if (!result.success) {
        throw new Error(result.error || 'AI analysis failed');
      }
      
      // Step 5: Save results and show confirmation
      window.certificateData = {
        ...(result.data || {}),
        training_match_status: result.training_match_status
      };
      debug.success('[PDF-IMG] Certificate analysis completed successfully');
      
      showSuccess('Certificate processed successfully! Review the details below.');
      
      // Show confirmation modal after a brief delay
      setTimeout(() => {
        debug.info('[PDF-IMG] Opening confirmation modal');
        openConfirmationModal(window.certificateData);
      }, 1500);
      
    } catch (error) {
      debug.error('[PDF-IMG] Processing error:', error.message);
      showError(error.message || 'Failed to process certificate');
    }
  }
  
  // Call the AI Vision Analysis
  async function callAIVisionAnalysis(signedUrl, originalFilename) {
    debug.info('[PDF-IMG] Calling AI Vision analysis');
    
    const supabaseUrl = window.supabaseUrl || window.CONFIG?.SUPABASE_URL || 'https://unveoqnlqnobufhublyw.supabase.co';
    const apiEndpoint = `${supabaseUrl}/functions/v1/extract-certificate-v2`;
    
    const ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY || 
                     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        signedUrl: signedUrl,
        filename: originalFilename
      })
    });
    
    debug.info(`[PDF-IMG] AI API response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    debug.info('[PDF-IMG] AI analysis result received');
    return result;
  }
  
  // Open confirmation modal with extracted data
  function openConfirmationModal(data) {
    if (!confirmModal) {
      debug.error('[PDF-IMG] Confirmation modal not found');
      alert('Extracted data:\n\n' + JSON.stringify(data, null, 2));
      return;
    }
    
    debug.info('[PDF-IMG] Opening confirmation modal with extracted data');
    
    // Log AI training analysis results
    if (data.raw_training_name) {
      debug.info(`[PDF-IMG] 📋 Raw training extracted: "${data.raw_training_name}"`);
    }
    if (data.training_name_valid && data.training_name) {
      debug.info(`[PDF-IMG] ✅ AI matched training type: "${data.training_name}"`);
    } else if (data.raw_training_name) {
      debug.warn(`[PDF-IMG] ❌ No match found for: "${data.raw_training_name}"`);
    }
    
    // Find and populate form fields
    const fields = {
      'cert-person-name': data.person_name || '',
      'cert-completion-date': data.completion_date || '',
      'cert-expiry-date': data.expiry_date || '',
      'cert-provider': data.provider || '',
      'cert-id': data.certificate_id || ''
    };
    
    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.value = value;
        debug.info(`[PDF-IMG] Set ${id}: ${value}`);
      } else {
        debug.warn(`[PDF-IMG] Field ${id} not found`);
      }
    });
    
    // Set notes
    const notesInput = document.getElementById('cert-notes');
    if (notesInput) {
      let notes = [];
      if (data.provider) notes.push(`Provider: ${data.provider}`);
      if (data.additional_details) notes.push(data.additional_details);
      notesInput.value = notes.join('\\n');
    }
    
    // Populate training types dropdown
    const trainingTypeSelect = document.getElementById('cert-training-type');
    if (trainingTypeSelect && window.trainingTypes) {
      // Clear existing options except first
      while (trainingTypeSelect.options.length > 1) {
        trainingTypeSelect.remove(1);
      }
      
      // Add training type options
      window.trainingTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        trainingTypeSelect.appendChild(option);
      });
      
      // Try to auto-match training name using new intelligent matching
      if (data.training_name && data.training_name_valid) {
        const options = Array.from(trainingTypeSelect.options);
        // Look for exact match first (from AI fuzzy matching)
        let match = options.find(opt => opt.text === data.training_name);
        
        if (match) {
          trainingTypeSelect.value = match.value;
          debug.info(`[PDF-IMG] 🎯 Dropdown auto-selected: "${match.text}"`);
          if (window.certificateData?.training_match_status) {
            const status = window.certificateData.training_match_status;
            debug.info(`[PDF-IMG] 🔍 Match confidence: ${status.confidence || 'N/A'}%`);
            debug.info(`[PDF-IMG] 💭 AI reasoning: ${status.reasoning || 'N/A'}`);
          }
        } else {
          debug.warn(`[PDF-IMG] ⚠️  AI suggested "${data.training_name}" but not found in dropdown options`);
        }
      } else if (data.raw_training_name) {
        debug.warn(`[PDF-IMG] ❌ No fuzzy match found for: "${data.raw_training_name}"`);
        if (window.certificateData?.training_match_status?.reasoning) {
          debug.info(`[PDF-IMG] 💭 Match reasoning: ${window.certificateData.training_match_status.reasoning}`);
        }
      }
    }
    
    // Show modal
    confirmModal.classList.add('active');
    debug.info('[PDF-IMG] Confirmation modal opened');
  }
  
  // Save training record from confirmation modal
  async function saveFromConfirmationModal() {
    debug.info('[PDF-IMG] Saving training record');
    
    try {
      const trainingTypeSelect = document.getElementById('cert-training-type');
      const completionDateInput = document.getElementById('cert-completion-date');
      const expiryDateInput = document.getElementById('cert-expiry-date');
      const notesInput = document.getElementById('cert-notes');
      
      const trainingTypeId = trainingTypeSelect?.value;
      const completionDate = completionDateInput?.value;
      
      if (!trainingTypeId || !completionDate) {
        alert('Please select a training type and completion date');
        return;
      }
      
      const recordData = {
        site_id: window.currentUser.siteId,
        user_id: window.currentUser.id,
        training_type_id: parseInt(trainingTypeId),
        completion_date: completionDate,
        expiry_date: expiryDateInput?.value || null,
        notes: notesInput?.value || null,
        certificate_url: window.certificateUrl
      };
      
      debug.info('[PDF-IMG] Saving record:', recordData);
      
      const { data, error } = await window.supabase
        .from('training_records')
        .insert(recordData);
      
      if (error) {
        debug.error('[PDF-IMG] Database save error:', error);
        throw error;
      }
      
      debug.success('[PDF-IMG] Training record saved successfully');
      
      // Close modal and cleanup
      closeConfirmModal();
      resetUploader();
      
      // Show success notification
      if (typeof window.showToast === 'function') {
        window.showToast('Training record saved successfully!', 'success', 3000);
      } else {
        alert('Training record saved successfully!');
      }
      
      // Refresh training data
      setTimeout(() => {
        if (typeof window.loadTrainingData === 'function') {
          window.loadTrainingData();
        } else {
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      debug.error('[PDF-IMG] Save error:', error);
      alert('Failed to save training record: ' + error.message);
    }
  }
  
  debug.success('[PDF-IMG] Certificate uploader initialized successfully');
  
  return {
    reset: resetUploader,
    processFile: handleFiles,
    convertPdfToImage: convertPdfToImage,
    debug: debug
  };
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[PDF-IMG] DOM loaded, initializing certificate uploader');
    window.certificateUploaderAPI = initCertificateUploaderPDFToImage();
  });
} else {
  console.log('[PDF-IMG] DOM ready, initializing certificate uploader immediately');
  window.certificateUploaderAPI = initCertificateUploaderPDFToImage();
}