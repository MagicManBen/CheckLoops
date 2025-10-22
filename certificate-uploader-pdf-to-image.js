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

  // Global queue for multiple certificate processing
  let certificateQueue = [];
  let currentQueueIndex = 0;
  let isProcessing = false;
  
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
      debug.info(`[PDF-IMG] 📁 ${files.length} file(s) dropped`);
      fileInput.files = files;
      handleFiles(files);
    }
  }
  
  // Handle file selection
  fileInput.addEventListener('change', function() {
    if (this.files.length) {
      debug.info(`[PDF-IMG] 📁 ${this.files.length} file(s) selected`);
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
    if (confirmModal) confirmModal.classList.remove('show');
  }
  
  // Make closeConfirmModal available globally for event handlers
  window.closeConfirmModal = closeConfirmModal;
  
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
  
  // Make resetUploader available globally for event handlers
  window.resetUploader = resetUploader;
  
  function handleFiles(files) {
    if (!files || files.length === 0) {
      debug.warn('[PDF-IMG] No files provided');
      return;
    }
    
    debug.info(`[PDF-IMG] 📋 Processing ${files.length} certificate(s)`);
    
    // Validate and filter files
    const validFiles = [];
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        debug.error(`[PDF-IMG] ❌ File too large: ${file.name} (${formatFileSize(file.size)})`);
        showError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }
      
      // Validate file type
      if (!validTypes.includes(file.type)) {
        debug.error(`[PDF-IMG] ❌ Invalid file type: ${file.name} (${file.type})`);
        showError(`File "${file.name}" is not supported. Only PDF, PNG and JPG files are allowed.`);
        continue;
      }
      
      validFiles.push(file);
      debug.info(`[PDF-IMG] ✅ Valid file: ${file.name} (${formatFileSize(file.size)})`);
    }
    
    if (validFiles.length === 0) {
      debug.warn('[PDF-IMG] ❌ No valid files to process');
      return;
    }
    
    // Show processing modal immediately
    debug.info(`[PDF-IMG] 🚀 Starting batch processing for ${validFiles.length} certificate(s)`);
    showProcessingModal(validFiles.length);
    
    // Start batch processing
    processCertificatesBatch(validFiles);
  }

  // Process multiple certificates in batch
  async function processCertificatesBatch(files) {
    if (isProcessing) {
      debug.warn('[PDF-IMG] ⏳ Already processing certificates, please wait...');
      return;
    }
    
    isProcessing = true;
    certificateQueue = [];
    currentQueueIndex = 0;
    
    // Update UI to show batch processing
    showBatchProgress(0, files.length, 'Preparing certificates...');
    
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        debug.info(`[PDF-IMG] 📋 Processing certificate ${i + 1}/${files.length}: ${file.name}`);
        
        // Update progress step 1: PDF Processing
        updateProgressStep(0, 'active', 'PDF Processing', `Converting ${file.name} to images for AI analysis...`);
        updateProcessingProgress(i, files.length * 3, `Processing file ${i + 1} of ${files.length} - PDF Conversion`);
        
        showBatchProgress(i, files.length, `Processing ${file.name}...`);
        
        try {
          // Small delay to show PDF processing step
          await new Promise(resolve => setTimeout(resolve, 500));
          updateProgressStep(0, 'completed', 'PDF Processed', 'Certificate converted successfully');
          
          // Update progress step 2: AI Analysis  
          updateProgressStep(1, 'active', 'AI Analysis', `Analyzing certificate content with OpenAI Vision...`);
          updateProcessingProgress(i + files.length, files.length * 3, `Processing file ${i + 1} of ${files.length} - AI Analysis`);
          
          const result = await processSingleCertificate(file);
          
          // Small delay to show AI analysis completion
          await new Promise(resolve => setTimeout(resolve, 300));
          updateProgressStep(1, 'completed', 'AI Analysis Complete', 'Content analyzed successfully');
          
          // Update progress step 3: Data Extraction
          updateProgressStep(2, 'active', 'Data Extraction', `Extracting and matching training data...`);
          updateProcessingProgress(i + files.length * 2, files.length * 3, `Processing file ${i + 1} of ${files.length} - Data Extraction`);
          
          // Small delay to show data extraction
          await new Promise(resolve => setTimeout(resolve, 400));
          updateProgressStep(2, 'completed', 'Data Extracted', 'Training data extracted and matched');
          
          certificateQueue.push({
            file: file,
            data: result.data,
            training_match_status: result.training_match_status,
            index: i + 1,
            total: files.length,
            status: 'success'
          });
          
          debug.success(`[PDF-IMG] ✅ Certificate ${i + 1} processed successfully`);
        } catch (error) {
          debug.error(`[PDF-IMG] ❌ Error processing certificate ${i + 1}: ${error.message}`);
          
          // Add failed certificate to queue with error info
          certificateQueue.push({
            file: file,
            data: null,
            training_match_status: null,
            index: i + 1,
            total: files.length,
            status: 'error',
            error: error.message
          });
          
          // Show specific error message
          if (error.message.includes('API key')) {
            debug.error('[PDF-IMG] 🔑 OpenAI API key issue detected');
          }
        }
      }
      
      const successCount = certificateQueue.filter(cert => cert.status === 'success').length;
      const errorCount = certificateQueue.filter(cert => cert.status === 'error').length;
      
      debug.success(`[PDF-IMG] 🎉 Batch processing complete! ${successCount}/${files.length} certificates processed successfully`);
      
      if (errorCount > 0) {
        debug.warn(`[PDF-IMG] ⚠️ ${errorCount} certificate(s) failed processing`);
      }
      
      if (certificateQueue.length > 0) {
        // Update to final step: Confirm Details
        updateProgressStep(3, 'active', 'Confirm Details', 'Processing complete! Review and confirm certificate details...');
        updateProcessingProgress(files.length * 3, files.length * 3, `All ${files.length} certificate(s) processed - Ready for review!`);
        
        const message = successCount > 0 ? 
          `Ready for review! ${successCount} successful, ${errorCount} failed.` :
          `${errorCount} certificates failed processing.`;
          
        showBatchProgress(files.length, files.length, message);
        
        // Transition to confirmation process
        setTimeout(() => {
          startConfirmationQueue();
        }, 2000);
      } else {
        showError('No certificates could be processed successfully.');
      }
      
    } catch (error) {
      debug.error('[PDF-IMG] ❌ Batch processing failed:', error);
      showError('Batch processing failed. Please try again.');
    } finally {
      isProcessing = false;
    }
  }

  // Process a single certificate for batch processing
  async function processSingleCertificate(file) {
    // Set the file for global access
    window.certificateFile = file;
    
    try {
      debug.info('[PDF-IMG] Processing certificate for batch');
      
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
        imageFile = await convertPdfToImage(file);
        window.convertedImageFile = imageFile;
      } else {
        debug.info('[PDF-IMG] Image file detected, using directly');
        imageFile = file;
      }
      
      // Step 2: Upload image to storage
      const fileName = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${imageFile.type === 'image/png' ? 'png' : 'jpg'}`;
      const filePath = `${window.currentUser.siteId}/training_certificates/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await window.supabase.storage
        .from('training_certificates')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // Step 3: Create signed URL
      const { data: signedUrlData, error: urlError } = await window.supabase.storage
        .from('training_certificates')
        .createSignedUrl(filePath, 3600);
      
      if (urlError) {
        throw new Error(`Failed to create signed URL: ${urlError.message}`);
      }
      
      // Store the certificate URL for later saving
      window.certificateUrl = filePath;
      
      // Step 4: AI Vision Analysis
      const result = await callAIVisionAnalysis(signedUrlData.signedUrl, file.name);
      
      if (!result.success) {
        throw new Error(result.error || 'AI analysis failed');
      }
      
      debug.success('[PDF-IMG] Certificate processed successfully for batch');
      
      return {
        data: result.data || {},
        training_match_status: result.training_match_status
      };
      
    } catch (error) {
      debug.error('[PDF-IMG] Batch processing error:', error.message);
      throw error;
    }
  }

  // Show batch processing progress
  function showBatchProgress(current, total, message) {
    if (processingIndicator) {
      processingIndicator.classList.remove('error', 'success');
      processingIndicator.classList.add('active');
      
      const percentage = Math.round((current / total) * 100);
      processingIndicator.innerHTML = `
        <div class="batch-progress">
          <div class="progress-spinner">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="31.416" stroke-dashoffset="${31.416 - (31.416 * current / total)}" style="transition: stroke-dashoffset 0.3s ease;"/>
            </svg>
            <span class="progress-text">${current}/${total}</span>
          </div>
          <div class="progress-message">
            <span>${message}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percentage}%; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
      `;
    }
    
    // Update preview if available
    if (preview) {
      preview.classList.add('active');
      if (filenameEl) filenameEl.textContent = `${current}/${total} certificates`;
      if (filesizeEl) filesizeEl.textContent = message;
    }
  }

  // Start the confirmation queue process
  function startConfirmationQueue() {
    if (certificateQueue.length === 0) {
      debug.warn('[PDF-IMG] No certificates in queue to confirm');
      return;
    }
    
    currentQueueIndex = 0;
    showNextCertificateForConfirmation();
  }

  // Show next certificate in queue for confirmation
  function showNextCertificateForConfirmation() {
    if (currentQueueIndex >= certificateQueue.length) {
      debug.success('[PDF-IMG] 🎉 All certificates processed!');
      showAllCertificatesComplete();
      return;
    }
    
    const cert = certificateQueue[currentQueueIndex];
    
    // Check if this certificate failed
    if (cert.status === 'error') {
      debug.warn(`[PDF-IMG] ⚠️ Certificate ${currentQueueIndex + 1} failed: ${cert.error}`);
      showFailedCertificate(cert);
      return;
    }
    
    debug.info(`[PDF-IMG] 📋 Showing certificate ${currentQueueIndex + 1}/${certificateQueue.length} for confirmation`);
    
    // Set the current certificate data for the modal
    window.certificateData = {
      ...cert.data,
      training_match_status: cert.training_match_status
    };
    
    // Open the confirmation modal with queue info
    openConfirmationModal(window.certificateData, cert.index, cert.total);
  }

  // Show failed certificate with retry option
  function showFailedCertificate(cert) {
    if (!confirmModal) {
      debug.error('[PDF-IMG] Confirmation modal not found for error display');
      // Auto-skip failed certificate
      currentQueueIndex++;
      showNextCertificateForConfirmation();
      return;
    }
    
    // Show error in modal
    confirmModal.innerHTML = `
      <div class="modal-content error-modal">
        <div class="error-header">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Certificate Processing Failed</h3>
        </div>
        <div class="error-details">
          <p><strong>File:</strong> ${cert.file.name}</p>
          <p><strong>Error:</strong> ${cert.error}</p>
          ${cert.error.includes('API key') ? 
            '<p class="error-help">💡 The OpenAI API key may need to be updated in your system settings.</p>' : 
            '<p class="error-help">💡 Please check the certificate file and try again later.</p>'
          }
        </div>
        <div class="error-actions">
          <button type="button" class="btn secondary" onclick="skipFailedCertificate()">Skip This Certificate</button>
          <button type="button" class="btn" onclick="retryFailedCertificate()">Retry Later</button>
        </div>
        <div class="queue-info-small">Certificate ${cert.index} of ${cert.total}</div>
      </div>
    `;
    
    confirmModal.classList.add('active');
    
    // Auto-skip after 10 seconds
    setTimeout(() => {
      if (confirmModal.classList.contains('active')) {
        skipFailedCertificate();
      }
    }, 10000);
  }

  // Skip failed certificate
  window.skipFailedCertificate = function() {
    debug.info('[PDF-IMG] ⏭️ Skipping failed certificate');
    confirmModal.classList.remove('show');
    
    setTimeout(() => {
      handleCertificateConfirmation('skipped');
    }, 300);
  };

  // Retry failed certificate (for now, just skip)
  window.retryFailedCertificate = function() {
    debug.info('[PDF-IMG] 🔄 Marking certificate for retry');
    skipFailedCertificate(); // For now, just skip
  };

  // Handle when user confirms or skips a certificate
  function handleCertificateConfirmation(action) {
    if (action === 'confirmed') {
      debug.success(`[PDF-IMG] ✅ Certificate ${currentQueueIndex + 1} confirmed and saved`);
    } else if (action === 'skipped') {
      debug.info(`[PDF-IMG] ⏭️ Certificate ${currentQueueIndex + 1} skipped`);
    }
    
    // Move to next certificate
    currentQueueIndex++;
    showNextCertificateForConfirmation();
  }

  // Show completion message for all certificates
  function showAllCertificatesComplete() {
    const successCount = certificateQueue.filter(cert => cert.status === 'success').length;
    const errorCount = certificateQueue.filter(cert => cert.status === 'error').length;
    const totalCount = certificateQueue.length;
    
    if (processingIndicator) {
      processingIndicator.classList.remove('error');
      processingIndicator.classList.add('success');
      
      const message = errorCount === 0 ? 
        '🎉 All certificates processed successfully!' :
        `✅ ${successCount}/${totalCount} certificates processed successfully!`;
      
      processingIndicator.innerHTML = `
        <div class="completion-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="success-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>${message}</span>
          ${errorCount > 0 ? `<div class="completion-stats">${errorCount} failed due to processing errors</div>` : ''}
        </div>
      `;
    }
    
    // Show success notification
    if (typeof window.showToast === 'function') {
      window.showToast('All training certificates processed successfully!', 'success', 4000);
    } else {
      alert('All training certificates processed successfully!');
    }
    
    // Reset the uploader
    resetUploader();
    
    // Reset the queue
    certificateQueue = [];
    currentQueueIndex = 0;
    
    // Refresh training data
    setTimeout(() => {
      if (typeof window.loadTrainingData === 'function') {
        window.loadTrainingData();
      } else {
        window.location.reload();
      }
    }, 2000);
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
    
    // Attempt to parse JSON result and provide richer logging
    let result = null;
    try {
      result = await response.json();
      debug.info('[PDF-IMG] AI analysis result received:', result);
    } catch (jsonErr) {
      // If JSON parsing fails, surface raw text for debugging
      try {
        const text = await response.text();
        debug.error('[PDF-IMG] Failed to parse AI JSON response. Raw response:', text);
        throw new Error('Invalid JSON response from AI analysis: ' + text);
      } catch (tErr) {
        debug.error('[PDF-IMG] Failed to read AI response body:', tErr);
        throw new Error('AI analysis returned an unreadable response');
      }
    }

    // Normalize result: some deployments return data without a success flag
    if (typeof result.success === 'undefined') {
      if (result && (result.data || result.training_match_status)) {
        result.success = true;
        debug.warn('[PDF-IMG] AI response missing explicit success flag - treating as success based on presence of data');
      } else {
        result.success = false;
        debug.warn('[PDF-IMG] AI response missing success flag and no data found');
      }
    }

    return result;
  }
  
  // Show processing modal immediately when files are uploaded
  function showProcessingModal(totalFiles) {
    if (!confirmModal) {
      debug.error('[PDF-IMG] Confirmation modal not found');
      return;
    }
    
    debug.info(`[PDF-IMG] 📋 Showing processing modal for ${totalFiles} certificate(s)`);
    
    // Reset all progress steps to initial state
    resetProgressSteps();
    
    // Set up modal with processing state
    setupProcessingModal(totalFiles);
    
    // Show modal (ensure both classes so CSS animations/triggers run)
    confirmModal.classList.add('show');
    confirmModal.classList.add('active');
    confirmModal.setAttribute('aria-hidden', 'false');
    // Make modal keyboard-focusable and focus it so users see it immediately
    try { confirmModal.setAttribute('tabindex', '-1'); confirmModal.focus(); } catch (e) {}

    // Also provide a visible browser alert for immediate feedback in case CSS hides the modal
    if (typeof window.showToast !== 'function') {
      // Use a brief non-blocking alert only when no toast function is available
      console.log('[PDF-IMG] Processing modal shown');
    }
  }
  
  // Reset progress steps to initial state
  function resetProgressSteps() {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
      step.classList.remove('completed', 'active');
      if (index === 0) {
        step.classList.add('active');
      }
    });
  }
  
  // Setup modal for processing state
  function setupProcessingModal(totalFiles) {
    // Update modal content for processing state
    const modalHeader = confirmModal.querySelector('.cert-modal-header h3');
    const modalSubtitle = confirmModal.querySelector('.cert-modal-header p');
    const modalBody = confirmModal.querySelector('.cert-modal-body');
    
    if (modalHeader) {
      modalHeader.textContent = `Processing ${totalFiles} Certificate${totalFiles > 1 ? 's' : ''}`;
    }
    
    if (modalSubtitle) {
      modalSubtitle.textContent = 'Please wait while we process your certificates using AI analysis...';
    }
    
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="processing-display">
          <div class="processing-animation">
            <div class="pulse-ring"></div>
            <div class="pulse-ring delay-1"></div>
            <div class="pulse-ring delay-2"></div>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="processing-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div class="processing-status">
            <h4 id="current-step-title">PDF Processing</h4>
            <p id="current-step-description">Converting certificates to images for AI analysis...</p>
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
            <div class="processing-stats">
              <span id="current-file-info">Processing file 1 of ${totalFiles}</span>
            </div>
          </div>
        </div>
      `;
    }
    
    // Hide footer buttons during processing
    const footer = confirmModal.querySelector('.cert-modal-footer');
    if (footer) {
      footer.style.display = 'none';
    }
  }
  
  // Update progress step with animation
  function updateProgressStep(stepIndex, status, title, description) {
    const steps = document.querySelectorAll('.progress-step');
    const stepTitleEl = document.getElementById('current-step-title');
    const stepDescEl = document.getElementById('current-step-description');
    
    if (stepIndex >= 0 && stepIndex < steps.length) {
      const step = steps[stepIndex];
      
      // Remove previous states
      step.classList.remove('active', 'completed');
      
      // Add new state with animation delay
      setTimeout(() => {
        if (status === 'active') {
          step.classList.add('active');
        } else if (status === 'completed') {
          step.classList.add('completed');
        }
      }, 100);
    }
    
    // Update step information
    if (stepTitleEl && title) {
      stepTitleEl.textContent = title;
    }
    if (stepDescEl && description) {
      stepDescEl.textContent = description;
    }
  }
  
  // Update processing progress
  function updateProcessingProgress(current, total, stepInfo) {
    const progressFill = document.getElementById('progress-fill');
    const fileInfo = document.getElementById('current-file-info');
    
    if (progressFill) {
      const percentage = Math.round((current / total) * 100);
      progressFill.style.width = `${percentage}%`;
    }
    
    if (fileInfo && stepInfo) {
      fileInfo.textContent = stepInfo;
    }
  }
  
  // Transition from processing mode to confirmation mode
  function transitionToConfirmationMode(data, currentIndex, totalCount) {
    const modalHeader = confirmModal.querySelector('.cert-modal-header h3');
    const modalSubtitle = confirmModal.querySelector('.cert-modal-header p');
    const modalBody = confirmModal.querySelector('.cert-modal-body');
    const footer = confirmModal.querySelector('.cert-modal-footer');
    
    // Update header for confirmation mode
    if (modalHeader) {
      modalHeader.textContent = 'Review Training Details';
    }
    
    if (modalSubtitle) {
      modalSubtitle.textContent = 'Please review and confirm the extracted information below.';
    }
    
    // Reset modal body to confirmation form
    if (modalBody) {
      modalBody.innerHTML = `
        <!-- Certificate Details Card -->
        <div class="cert-details-card">
          <div class="card-section certificate-section">
            <div class="section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              <div>
                <h4>Certificate Information</h4>
                <p>Extracted from your certificate</p>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">Uploading as:</div>
              <div class="info-value"><span id="current-user-name" style="font-weight: 600; color: var(--primary);">Loading...</span></div>
            </div>
            <div class="info-row">
              <div class="info-label">Detected Name:</div>
              <div class="info-value"><span id="detected-person-name" style="font-weight: 600; color: var(--gray-900);">-</span></div>
            </div>
            <div class="info-row" id="name-match-status-row" style="display: none;">
              <div class="info-label">Status:</div>
              <div class="info-value" id="name-match-status" style="display: flex; align-items: center; gap: 0.5rem;"></div>
            </div>
          </div>

          <!-- Training Details Card -->
          <div class="card-section training-section">
            <div class="section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              <div>
                <h4>Training Details</h4>
                <p>Review and confirm the training information</p>
              </div>
            </div>
            <div class="form-group">
              <label for="cert-training-type">Training Type</label>
              <select id="cert-training-type">
                <option value="">Select training type...</option>
              </select>
              <div class="ai-match-indicator" id="ai-match-status" style="display: none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4"></path>
                  <circle cx="12" cy="12" r="9"></circle>
                </svg>
                <span>AI matched with <span id="match-confidence">90%</span> confidence</span>
              </div>
            </div>
          </div>

          <!-- Dates Card -->
          <div class="card-section dates-section">
            <div class="section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <div>
                <h4>Validity Period</h4>
                <p>When does this training expire</p>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label for="cert-completion-date">Completion Date</label>
                <input type="date" id="cert-completion-date">
              </div>
              <div class="form-group">
                <label for="cert-validity-years">Valid For</label>
                <select id="cert-validity-years">
                  <option value="">Auto-calculated...</option>
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="3">3 Years</option>
                  <option value="5">5 Years</option>
                  <option value="never">Never Expires</option>
                </select>
              </div>
            </div>
            <div class="expiry-preview" id="expiry-preview" style="margin-top: 1rem;"></div>
          </div>

          <!-- Additional Info Card -->
          <div class="card-section additional-section">
            <div class="section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <div>
                <h4>Additional Information</h4>
                <p>Provider and certificate details</p>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label for="cert-provider">Training Provider</label>
                <input type="text" id="cert-provider" placeholder="e.g. E-Learning for Healthcare">
              </div>
              <div class="form-group">
                <label for="cert-id">Certificate ID</label>
                <input type="text" id="cert-id" placeholder="e.g. CERT-123456">
              </div>
            </div>
            <div class="form-group">
              <label for="cert-notes">Notes</label>
              <textarea id="cert-notes" rows="2" placeholder="Add any additional notes or observations..."></textarea>
            </div>
          </div>
        </div>

        <!-- Hidden staff select field - always set to current user -->
        <select id="cert-staff-select" style="display: none;">
          <option value="">Select staff member...</option>
        </select>
      `;
    }
    
    // Show footer buttons
    if (footer) {
      footer.style.display = 'flex';
    }
    
    // Update final progress step to show confirmation active
    updateProgressStep(3, 'active', 'Confirm Details', `Reviewing certificate ${currentIndex} of ${totalCount}`);
  }
  
  // Function to show name mismatch warning - defined outside openConfirmationModal for better accessibility
  function showNameMismatchWarning(detectedName, currentUserName) {
    if (!confirmModal) {
      debug.error('[PDF-IMG] Confirmation modal not found for name mismatch warning');
      return;
    }
    
    debug.info(`[PDF-IMG] Showing name mismatch warning: "${detectedName}" vs "${currentUserName}"`);
    
    // Create warning overlay
    const warningOverlay = document.createElement('div');
    warningOverlay.className = 'name-mismatch-warning';
    warningOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(11, 79, 179, 0.08), rgba(118, 167, 255, 0.12));
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      backdrop-filter: blur(4px);
    `;
    
    // Create wrapper for centered content
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = `
      background: var(--white);
      border: 2px solid rgba(11, 79, 179, 0.2);
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 48px rgba(11, 79, 179, 0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    `;
    
    // Add title
    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0 0 1.25rem;
      color: var(--gray-900);
      font-size: 1.375rem;
      font-weight: 700;
      font-family: var(--font-display);
      letter-spacing: -0.02em;
    `;
    title.textContent = 'Name Mismatch Detected';
    contentWrapper.appendChild(title);
    
    // Add first paragraph
    const para1 = document.createElement('p');
    para1.style.cssText = `
      margin: 0 0 1.25rem;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--gray-700);
    `;
    para1.innerHTML = `
      The name on this certificate appears to be <strong style="color: var(--gray-900); font-weight: 600;">"${detectedName}"</strong>, but you're logged in as <strong style="color: var(--gray-900); font-weight: 600;">"${currentUserName}"</strong>.
    `;
    contentWrapper.appendChild(para1);
    
    // Add second paragraph
    const para2 = document.createElement('p');
    para2.style.cssText = `
      margin: 0 0 2rem;
      font-size: 0.8125rem;
      line-height: 1.5;
      color: var(--gray-600);
    `;
    para2.textContent = 'This page is intended for uploading your own training certificates. If this certificate belongs to someone else, please cancel and use the admin dashboard to upload it for them.';
    contentWrapper.appendChild(para2);
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 1rem;
      width: 100%;
      justify-content: center;
    `;
    
    // Create "This is my certificate" button
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-secondary';
    confirmBtn.style.cssText = `
      background-color: transparent;
      border: 2px solid var(--primary);
      color: var(--primary);
      cursor: pointer;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      flex: 1;
    `;
    confirmBtn.textContent = 'This is my certificate';
    confirmBtn.addEventListener('mouseover', function() {
      this.style.backgroundColor = 'rgba(11, 79, 179, 0.05)';
    });
    confirmBtn.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'transparent';
    });
    confirmBtn.addEventListener('click', function() {
      document.querySelector('.name-mismatch-warning').remove();
      console.log('Certificate confirmed as own despite name mismatch');
      debug.info('[PDF-IMG] Certificate confirmed as own despite name mismatch');
    });
    buttonContainer.appendChild(confirmBtn);
    
    // Create "Cancel upload" button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.style.cssText = `
      background: linear-gradient(135deg, var(--primary), #4f9cf9);
      color: white;
      cursor: pointer;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      border: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(11, 79, 179, 0.2);
      flex: 1;
    `;
    cancelBtn.textContent = 'Cancel upload';
    cancelBtn.addEventListener('mouseover', function() {
      this.style.boxShadow = '0 8px 24px rgba(11, 79, 179, 0.3)';
      this.style.transform = 'translateY(-2px)';
    });
    cancelBtn.addEventListener('mouseout', function() {
      this.style.boxShadow = '0 4px 12px rgba(11, 79, 179, 0.2)';
      this.style.transform = 'translateY(0)';
    });
    cancelBtn.addEventListener('click', function() {
      if (typeof window.closeConfirmModal === 'function') {
        window.closeConfirmModal();
      } else {
        if (confirmModal) confirmModal.classList.remove('show');
      }
      
      if (typeof window.resetUploader === 'function') {
        window.resetUploader();
      }
      
      console.log('Certificate upload canceled due to name mismatch');
      debug.info('[PDF-IMG] Certificate upload canceled due to name mismatch');
    });
    buttonContainer.appendChild(cancelBtn);
    contentWrapper.appendChild(buttonContainer);
    warningOverlay.appendChild(contentWrapper);
    
    // Add to modal
    const modalContent = confirmModal.querySelector('.cert-modal-content');
    if (modalContent) {
      modalContent.appendChild(warningOverlay);
      debug.info('[PDF-IMG] Name mismatch warning displayed with properly attached event listeners');
    } else {
      debug.error('[PDF-IMG] Modal content not found for name mismatch warning');
    }
  }
  
  // Open confirmation modal with extracted data
  function openConfirmationModal(data, currentIndex = 1, totalCount = 1) {
    if (!confirmModal) {
      debug.error('[PDF-IMG] Confirmation modal not found');
      alert('Extracted data:\n\n' + JSON.stringify(data, null, 2));
      return;
    }

    debug.info(`[PDF-IMG] 📋 Opening confirmation modal for certificate ${currentIndex}/${totalCount}`);

    // Check if we're in admin mode early
    const isAdminMode = window.location.href.includes('admin-dashboard.html') || window.isAdminMode;

    // Ensure training types are loaded - try to load them if not already loaded
    if (!window.trainingTypes || window.trainingTypes.length === 0) {
      debug.warn('[PDF-IMG] Training types not found or empty, attempting to load them');
      
      if (typeof loadTrainingTypes === 'function') {
        debug.info('[PDF-IMG] Calling loadTrainingTypes()');
        try {
          loadTrainingTypes();
        } catch (e) {
          debug.error('[PDF-IMG] Error calling loadTrainingTypes:', e);
        }
      } else if (typeof window.loadTrainingTypes === 'function') {
        debug.info('[PDF-IMG] Calling window.loadTrainingTypes()');
        try {
          window.loadTrainingTypes();
        } catch (e) {
          debug.error('[PDF-IMG] Error calling window.loadTrainingTypes:', e);
        }
      } else if (typeof loadTrainingImport === 'function') {
        debug.info('[PDF-IMG] Calling loadTrainingImport()');
        try {
          loadTrainingImport();
        } catch (e) {
          debug.error('[PDF-IMG] Error calling loadTrainingImport:', e);
        }
      } else if (typeof window.loadTrainingImport === 'function') {
        debug.info('[PDF-IMG] Calling window.loadTrainingImport()');
        try {
          window.loadTrainingImport();
        } catch (e) {
          debug.error('[PDF-IMG] Error calling window.loadTrainingImport:', e);
        }
      } else if (window.supabase && window.ctx && (window.ctx.site_id || window.ctx.siteId)) {
        // Direct fallback - load training types directly from Supabase
        debug.info('[PDF-IMG] Loading training types directly from Supabase');
        const siteId = window.ctx.site_id || window.ctx.siteId;
        
        window.supabase
          .from('training_types')
          .select('id, name')
          .eq('site_id', siteId)
          .eq('active', true)
          .order('name')
          .then(res => {
            if (res.error) {
              debug.error('[PDF-IMG] Error loading training types from Supabase:', res.error);
              return;
            }
            
            debug.success(`[PDF-IMG] Loaded ${res.data.length} training types directly from Supabase`);
            window.trainingTypes = res.data;
            
            // Update the dropdown immediately if it exists
            const select = document.getElementById('cert-training-type');
            if (select) {
              // Clear existing options except first
              while (select.options.length > 1) {
                select.remove(1);
              }
              
              // Add training type options
              window.trainingTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.name;
                select.appendChild(option);
              });
              
              // Try to auto-match with data if available
              if (data && data.training_name && data.training_name_valid) {
                const options = Array.from(select.options);
                let match = options.find(opt => opt.text === data.training_name);
                if (match) {
                  select.value = match.value;
                  debug.info(`[PDF-IMG] Auto-matched training type: "${data.training_name}"`);
                }
              }
            }
          })
          .catch(err => {
            debug.error('[PDF-IMG] Error in Supabase query for training types:', err);
          });
      } else {
        debug.error('[PDF-IMG] No training type loading function found and cannot load directly from Supabase');
      }
    }
    
  // Transition from processing mode to confirmation mode
  transitionToConfirmationMode(data, currentIndex, totalCount);

    // Wait a moment for DOM to be ready after transition
    setTimeout(() => {
      // Log AI training analysis results
      if (data.raw_training_name) {
        debug.info(`[PDF-IMG] 📋 Raw training extracted: "${data.raw_training_name}"`);
      }
      if (data.training_name_valid && data.training_name) {
        debug.info(`[PDF-IMG] ✅ AI matched training type: "${data.training_name}"`);
      } else if (data.raw_training_name) {
        debug.warn(`[PDF-IMG] ❌ No match found for: "${data.raw_training_name}"`);
      }

      // Find and populate form fields - GET FRESH REFERENCES AFTER TRANSITION
      const fields = {
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

      // Get fresh reference to staff select after transition
      const staffSelect = document.getElementById('cert-staff-select');
    if (staffSelect) {
      // Clear existing options except first
      while (staffSelect.options.length > 1) {
        staffSelect.remove(1);
      }

      if (isAdminMode) {
        debug.info('[PDF-IMG] Admin mode - matching certificate to training matrix users');

        // Try to match the detected name to a user in the training matrix
        let matchedUser = null;

        if (data.person_name && window.trainingData && window.trainingData.staff) {
          const detectedNameLower = data.person_name.toLowerCase().trim();

          // Try exact match first
          matchedUser = window.trainingData.staff.find(staff =>
            staff.name && staff.name.toLowerCase().trim() === detectedNameLower
          );

          // If no exact match, try partial matches
          if (!matchedUser) {
            matchedUser = window.trainingData.staff.find(staff =>
              staff.name && (
                staff.name.toLowerCase().includes(detectedNameLower) ||
                detectedNameLower.includes(staff.name.toLowerCase())
              )
            );
          }

          debug.info(`[PDF-IMG] Detected: "${data.person_name}", Matched:`, matchedUser);
        }

        if (matchedUser) {
          // User found - add and select them
          const option = document.createElement('option');
          option.value = JSON.stringify({id: matchedUser.id, user_id: matchedUser.id});
          option.textContent = matchedUser.name;
          option.selected = true;
          staffSelect.appendChild(option);

          // Add other staff members too
          if (window.trainingData && window.trainingData.staff) {
            window.trainingData.staff.forEach(staff => {
              if (staff.id !== matchedUser.id) {
                const opt = document.createElement('option');
                opt.value = JSON.stringify({id: staff.id, user_id: staff.id});
                opt.textContent = staff.name;
                staffSelect.appendChild(opt);
              }
            });
          }

          debug.success(`[PDF-IMG] ✅ Matched certificate to user: ${matchedUser.name}`);
        } else {
          // No user found - create PENDING NEW USER option
          const pendingOption = document.createElement('option');
          const pendingData = {
            id: 'PENDING_NEW_USER',
            user_id: null,
            name: data.person_name || 'Unknown',
            isPending: true
          };
          pendingOption.value = JSON.stringify(pendingData);
          pendingOption.textContent = `⚠️ PENDING NEW USER: ${data.person_name || 'Unknown'}`;
          pendingOption.selected = true;
          pendingOption.style.color = '#f97316';
          staffSelect.appendChild(pendingOption);

          // Add existing staff members as alternatives
          if (window.trainingData && window.trainingData.staff) {
            window.trainingData.staff.forEach(staff => {
              const opt = document.createElement('option');
              opt.value = JSON.stringify({id: staff.id, user_id: staff.id});
              opt.textContent = staff.name;
              staffSelect.appendChild(opt);
            });
          }

          debug.warn(`[PDF-IMG] ⚠️ No matching user for "${data.person_name}" - will be saved as pending`);

          // Show warning message
          const staffGroup = staffSelect.closest('.form-group');
          if (staffGroup) {
            let warningDiv = staffGroup.querySelector('.pending-warning');
            if (!warningDiv) {
              warningDiv = document.createElement('div');
              warningDiv.className = 'pending-warning';
              warningDiv.style.cssText = 'margin-top: 0.5rem; padding: 0.75rem; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px;';
              staffGroup.appendChild(warningDiv);
            }
            warningDiv.innerHTML = `
              <div style="display: flex; align-items: start; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: #92400e; font-size: 0.875rem;">New User Detected</div>
                  <div style="font-size: 0.75rem; color: #78350f;">
                    Certificate will be saved as pending for "${data.person_name}".
                    When this user joins, you can match and apply their training records.
                  </div>
                </div>
              </div>
            `;
          }
        }

        // Show staff selector in admin mode
        const staffGroup = staffSelect.closest('.form-group');
        if (staffGroup) {
          staffGroup.style.display = 'block';
        }
      } else {
        // Staff training mode - original behavior
        if (window.currentUser) {
          debug.info(`[PDF-IMG] Using current user for certificate: ${window.currentUser.displayName}`);

          // Add current user as the only option
          const option = document.createElement('option');
          option.value = JSON.stringify({id: window.currentUser.id, user_id: window.currentUser.id});
          option.textContent = window.currentUser.displayName;
          option.selected = true; // Auto-select the current user
          staffSelect.appendChild(option);

          // Hide staff selector in staff mode
          const staffGroup = staffSelect.closest('.form-group');
          if (staffGroup) {
            staffGroup.style.display = 'none';
          }
        }
      }

      // Show detected name and check if it matches (for staff mode only)
      if (data.person_name && !isAdminMode && window.currentUser) {
        debug.info(`[PDF-IMG] 👤 Detected person name: "${data.person_name}"`);

        // Show detected name info
        const detectedNameInfo = document.getElementById('detected-name-info');
        const detectedNameSpan = document.getElementById('detected-person-name');
        if (detectedNameInfo && detectedNameSpan) {
          detectedNameSpan.textContent = data.person_name;
          detectedNameInfo.style.display = 'inline-flex';
        }

        // Update current user name display
        const currentUserNameEl = document.getElementById('current-user-name');
        if (currentUserNameEl) {
          currentUserNameEl.textContent = window.currentUser.displayName;
        }

        // Check if detected name matches current user
        const currentUserName = window.currentUser.displayName.toLowerCase();
        const detectedName = data.person_name.toLowerCase();
        const isMatch = currentUserName === detectedName ||
                        detectedName.includes(currentUserName) ||
                        currentUserName.includes(detectedName);

        // Update match status display
        const nameMatchStatus = document.getElementById('name-match-status');
        const detectedNameDisplay = document.getElementById('detected-name-display');

        if (nameMatchStatus) {
          if (isMatch) {
            nameMatchStatus.innerHTML = '<span style="color: #059669; display: flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg> Name matches your profile</span>';
            debug.success(`[PDF-IMG] ✅ Detected name "${data.person_name}" matches current user "${window.currentUser.displayName}"`);
          } else {
            nameMatchStatus.innerHTML = '<span style="color: #f97316; display: flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Name mismatch detected</span>';
            debug.warn(`[PDF-IMG] ⚠️ Detected name "${data.person_name}" does not match current user "${window.currentUser.displayName}"`);

            // Show name mismatch warning
            setTimeout(() => {
              showNameMismatchWarning(data.person_name, window.currentUser.displayName);
            }, 500);
          }
        }

        if (detectedNameDisplay) {
          detectedNameDisplay.style.display = 'block';
        }
      } else if (data.person_name && !isAdminMode) {
        debug.warn('[PDF-IMG] Person name detected but current user not available');
      }
      } else {
        debug.error('[PDF-IMG] Staff select element not found in the form');
      }

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
      if (trainingTypeSelect) {
        // Clear existing options except first
        while (trainingTypeSelect.options.length > 1) {
          trainingTypeSelect.remove(1);
        }

        // Add training type options
        if (window.trainingTypes && window.trainingTypes.length > 0) {
          debug.info(`[PDF-IMG] Populating ${window.trainingTypes.length} training types in dropdown`);
          window.trainingTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            trainingTypeSelect.appendChild(option);
          });
        } else {
          debug.warn('[PDF-IMG] No training types available to populate dropdown');

          // Check again after a short delay (in case of async loading)
          setTimeout(() => {
            if (window.trainingTypes && window.trainingTypes.length > 0) {
              debug.info(`[PDF-IMG] Found training types after delay, populating ${window.trainingTypes.length} types`);

              // Clear any existing options except first
              while (trainingTypeSelect.options.length > 1) {
                trainingTypeSelect.remove(1);
              }

              window.trainingTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.name;
                trainingTypeSelect.appendChild(option);
              });

              // Re-try auto-matching if we have training name
              if (data.training_name && data.training_name_valid) {
                const options = Array.from(trainingTypeSelect.options);
                // Look for exact match
                let match = options.find(opt => opt.text === data.training_name);
                if (match) {
                  trainingTypeSelect.value = match.value;
                  debug.info(`[PDF-IMG] Auto-matched training type: "${data.training_name}" (delayed)`);
                }
              }
            }
          }, 1000);
        }

        // Try to auto-match training name using new intelligent matching
        if (data.training_name && data.training_name_valid && window.trainingTypes && window.trainingTypes.length > 0) {
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

      // Add queue information to modal
      addQueueInfoToModal(currentIndex, totalCount);

  // Show popup modal with animation (ensure both classes and focus)
  confirmModal.classList.add('show');
  confirmModal.classList.add('active');
  confirmModal.setAttribute('aria-hidden', 'false');
  try { confirmModal.setAttribute('tabindex', '-1'); confirmModal.focus(); } catch (e) {}

      // Update AI match indicator if there's a match
      updateAIMatchIndicator(data);

      // Setup validity period calculator
      setupValidityCalculator(data);

      debug.info(`[PDF-IMG] 📋 Confirmation modal opened (${currentIndex}/${totalCount})`);
    }, 100); // End of setTimeout
  }

  // Update AI match indicator
  function updateAIMatchIndicator(data) {
    const matchIndicator = document.getElementById('ai-match-status');
    const matchConfidence = document.getElementById('match-confidence');
    
    if (data.training_name_valid && data.training_name && window.certificateData?.training_match_status) {
      const status = window.certificateData.training_match_status;
      if (matchIndicator && matchConfidence) {
        matchConfidence.textContent = (status.confidence || 90) + '%';
        matchIndicator.style.display = 'flex';
      }
    } else if (matchIndicator) {
      matchIndicator.style.display = 'none';
    }
  }

  // Setup validity period calculator
  function setupValidityCalculator(data) {
    const validitySelect = document.getElementById('cert-validity-years');
    const expiryPreview = document.getElementById('expiry-preview');
    const completionInput = document.getElementById('cert-completion-date');
    
    if (!validitySelect || !expiryPreview || !completionInput) return;

    // Function to calculate and show expiry date
    const updateExpiryPreview = () => {
      const completionDate = completionInput.value;
      const validityYears = validitySelect.value;
      
      if (!completionDate) {
        expiryPreview.textContent = 'Please select completion date first';
        expiryPreview.classList.add('show');
        return;
      }

      let expiryText = '';
      let expiryDate = null;

      if (validityYears === 'never') {
        expiryText = 'This certificate never expires';
      } else if (validityYears && validityYears !== '') {
        const completion = new Date(completionDate);
        expiryDate = new Date(completion);
        expiryDate.setFullYear(completion.getFullYear() + parseInt(validityYears));
        
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        expiryText = `Expires on ${expiryDate.toLocaleDateString('en-US', options)}`;
      } else {
        expiryText = 'Validity period will be auto-calculated based on training type';
      }

      expiryPreview.textContent = expiryText;
      expiryPreview.classList.add('show');

      // Update hidden expiry date field if it exists
      const expiryInput = document.getElementById('cert-expiry-date');
      if (expiryInput) {
        if (validityYears === 'never') {
          expiryInput.value = '';
        } else if (expiryDate) {
          expiryInput.value = expiryDate.toISOString().split('T')[0];
        }
      }
    };

    // Auto-calculate validity based on training type
    const trainingTypeSelect = document.getElementById('cert-training-type');
    const autoCalculateValidity = () => {
      if (!trainingTypeSelect || !window.trainingTypes) return;

      const selectedTypeId = trainingTypeSelect.value;
      const trainingType = window.trainingTypes.find(t => t.id == selectedTypeId);
      
      if (trainingType && trainingType.validity_months) {
        const years = Math.round(trainingType.validity_months / 12);
        validitySelect.value = years.toString();
        updateExpiryPreview();
      } else if (trainingType && trainingType.validity_months === null) {
        validitySelect.value = 'never';
        updateExpiryPreview();
      }
    };

    // Event listeners
    validitySelect.addEventListener('change', updateExpiryPreview);
    completionInput.addEventListener('change', updateExpiryPreview);
    
    if (trainingTypeSelect) {
      trainingTypeSelect.addEventListener('change', autoCalculateValidity);
    }

    // Always show expiry preview (even when auto-calculating)
    updateExpiryPreview();
    
    // Auto-calculate validity if training type is already set
    if (trainingTypeSelect && trainingTypeSelect.value) {
      autoCalculateValidity();
    }
  }

  // Add queue information and navigation to modal
  function addQueueInfoToModal(currentIndex, totalCount) {
    // Update the progress steps to show queue information
    const progressSteps = confirmModal.querySelector('.progress-steps');
    if (!progressSteps) return;
    
    // Update the confirmation step to show current progress
    const confirmationStep = progressSteps.querySelector('[data-step="4"]');
    if (confirmationStep && totalCount > 1) {
      const stepLabel = confirmationStep.querySelector('.step-label');
      if (stepLabel) {
        stepLabel.textContent = `Confirmation (${currentIndex} of ${totalCount})`;
      }
    }
    
    // Add skip button if processing multiple certificates
    if (totalCount > 1) {
      let skipContainer = confirmModal.querySelector('.queue-skip-container');
      if (!skipContainer) {
        skipContainer = document.createElement('div');
        skipContainer.className = 'queue-skip-container';
        skipContainer.style.cssText = `
          position: absolute;
          top: 6rem;
          right: 6rem;
          z-index: 1003;
        `;
        
        skipContainer.innerHTML = `
          <button type="button" class="btn btn-secondary btn-skip-queue" onclick="skipCurrentCertificate()" style="padding: 0.75rem 1.25rem; font-size: 0.875rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
            Skip This Certificate
          </button>
        `;
        
        confirmModal.appendChild(skipContainer);
      }
      skipContainer.style.display = 'block';
    } else {
      const skipContainer = confirmModal.querySelector('.queue-skip-container');
      if (skipContainer) {
        skipContainer.style.display = 'none';
      }
    }
  }

  // Skip current certificate in queue
  window.skipCurrentCertificate = function() {
    debug.info('[PDF-IMG] ⏭️ Skipping current certificate');
    confirmModal.classList.remove('show');
    
    setTimeout(() => {
      handleCertificateConfirmation('skipped');
    }, 300);
  };
  
  // Save training record from confirmation modal
  async function saveFromConfirmationModal() {
    debug.info('[PDF-IMG] Saving training record');
    
    try {
      const staffSelect = document.getElementById('cert-staff-select');
      const trainingTypeSelect = document.getElementById('cert-training-type');
      const completionDateInput = document.getElementById('cert-completion-date');
      const validityYearsSelect = document.getElementById('cert-validity-years');
      const notesInput = document.getElementById('cert-notes');
      
      // Check if we're in admin mode
      const isAdminMode = window.location.href.includes('admin-dashboard.html') || window.isAdminMode;

      // For staff-training.html, we use the current user regardless of staff select value
      const staffData = window.location.href.includes('staff-training.html') ?
        { user_id: window.currentUser.id } :
        (staffSelect?.value ? JSON.parse(staffSelect.value) : null);

      const trainingTypeId = trainingTypeSelect?.value;
      const completionDate = completionDateInput?.value;
      const validityYears = validityYearsSelect?.value;
      const providerInput = document.getElementById('cert-provider');
      const certIdInput = document.getElementById('cert-id');

      if (!staffData) {
        alert('User data not available. Please refresh the page and try again.');
        return;
      }

      if (!trainingTypeId || !completionDate) {
        alert('Please select a training type and completion date');
        return;
      }

      // Calculate expiry date based on validity years
      let expiryDate = null;
      if (validityYears && validityYears !== 'never' && validityYears !== '') {
        const completion = new Date(completionDate);
        const expiry = new Date(completion);
        expiry.setFullYear(completion.getFullYear() + parseInt(validityYears));
        expiryDate = expiry.toISOString().split('T')[0];
      }

      // Handle PENDING NEW USER case in admin mode
      if (isAdminMode && staffData.isPending) {
        debug.info(`[PDF-IMG] Saving as PENDING NEW USER: ${staffData.name}`);

        // Save to a pending_training_records table or with special flag
        const pendingData = {
          site_id: window.currentUser.siteId,
          pending_user_name: staffData.name,
          certificate_person_name: window.certificateData?.person_name || staffData.name,
          training_type_id: parseInt(trainingTypeId),
          completion_date: completionDate,
          expiry_date: expiryDate,
          provider: providerInput?.value || null,
          certificate_id: certIdInput?.value || null,
          notes: notesInput?.value || null,
          certificate_url: window.certificateUrl,
          status: 'pending_user',
          created_at: new Date().toISOString(),
          created_by: window.currentUser.id
        };

        console.log('Saving pending training record:', pendingData);
        debug.info('[PDF-IMG] Saving pending record:', pendingData);

        // First, try to save to pending_training_records table if it exists
        let saveResult = await window.supabase
          .from('pending_training_records')
          .insert(pendingData);

        // If pending_training_records table doesn't exist, save to training_records with null user_id
        if (saveResult.error && (
          saveResult.error.message.includes('relation') ||
          saveResult.error.message.includes('schema cache') ||
          saveResult.error.message.includes('Could not find the table')
        )) {
          debug.info('[PDF-IMG] Pending table not found, saving to training_records with null user_id');

          const recordData = {
            site_id: window.currentUser.siteId,
            user_id: null, // NULL for pending users
            training_type_id: parseInt(trainingTypeId),
            completion_date: completionDate,
            expiry_date: expiryDate,
            notes: `PENDING USER: ${staffData.name}\nProvider: ${providerInput?.value || 'Unknown'}\nCertificate ID: ${certIdInput?.value || 'N/A'}\n${notesInput?.value || ''}`,
            certificate_url: window.certificateUrl,
            pending_user_name: staffData.name // Store the name for future matching
          };

          saveResult = await window.supabase
            .from('training_records')
            .insert(recordData);
        }

        if (saveResult.error) {
          debug.error('[PDF-IMG] Database save error for pending user:', saveResult.error);
          throw saveResult.error;
        }

        debug.success(`[PDF-IMG] ✅ Saved as pending for user: ${staffData.name}`);

        // Show special notification for pending user
        if (typeof window.showToast === 'function') {
          window.showToast(`Certificate saved as PENDING for "${staffData.name}". Will be applied when user joins.`, 'warning', 5000);
        }

      } else {
        // Normal save with user_id
        if (window.location.href.includes('staff-training.html')) {
          console.log('Saving certificate for current user:', window.currentUser.displayName);
          debug.info(`[PDF-IMG] Saving certificate for current user: ${window.currentUser.displayName}`);
        } else {
          console.log('Saving certificate for staff member:', staffData);
        }

        const recordData = {
          site_id: window.currentUser.siteId,
          user_id: staffData.user_id, // Use current user's ID or selected staff member's ID
          training_type_id: parseInt(trainingTypeId),
          completion_date: completionDate,
          expiry_date: expiryDate,
          notes: notesInput?.value || null,
          certificate_url: window.certificateUrl
        };

        console.log('Training record data to save:', recordData);
        debug.info('[PDF-IMG] Saving record:', recordData);

        const { data, error } = await window.supabase
          .from('training_records')
          .insert(recordData);

        if (error) {
          debug.error('[PDF-IMG] Database save error:', error);
          throw error;
        }
      }
      
      debug.success('[PDF-IMG] ✅ Training record saved successfully');
      
      // Check if we're in queue mode
      if (certificateQueue.length > 0 && currentQueueIndex < certificateQueue.length) {
        // Show success animation in modal
        showSaveSuccess();
        
        // Close modal with animation and move to next
        setTimeout(() => {
          confirmModal.classList.remove('show');
          setTimeout(() => {
            handleCertificateConfirmation('confirmed');
          }, 300);
        }, 1500);
        
      } else {
        // Single certificate mode - traditional behavior
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
      }
      
    } catch (error) {
      debug.error('[PDF-IMG] Save error:', error);
      alert('Failed to save training record: ' + error.message);
    }
  }

  // Show success animation in modal
  function showSaveSuccess() {
    // Create success overlay
    const successOverlay = document.createElement('div');
    successOverlay.className = 'save-success-overlay';
    successOverlay.innerHTML = `
      <div class="success-animation">
        <div class="success-checkmark">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="success-text">
          <h3>Certificate Saved!</h3>
          <p>Moving to next certificate...</p>
        </div>
      </div>
    `;
    
    // Add to modal
    confirmModal.appendChild(successOverlay);
    
    // Trigger animation
    setTimeout(() => {
      successOverlay.classList.add('show');
    }, 50);
    
    // Remove overlay after animation
    setTimeout(() => {
      successOverlay.remove();
    }, 1500);
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