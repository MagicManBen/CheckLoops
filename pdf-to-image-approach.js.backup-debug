// PDF to Image Conversion Approach for Certificate Processing
// This is a cleaner, more reliable alternative to PDF text extraction

// 1. CLIENT-SIDE: Convert PDF to Image
async function convertPdfToImage(pdfFile) {
  console.log('[DEBUG] Converting PDF to image for AI processing');
  
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('PDF.js library required for PDF to image conversion');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Get first page (certificates are usually single page)
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale = better quality
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;
    
    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png', 0.95);
    });
    
  } catch (error) {
    console.error('PDF to image conversion failed:', error);
    throw new Error('Failed to convert PDF to image: ' + error.message);
  }
}

// 2. SIMPLIFIED CERTIFICATE PROCESSOR
async function processCertificateAsImage(file) {
  let imageFile;
  
  try {
    if (file.type === 'application/pdf') {
      console.log('[DEBUG] Converting PDF to image');
      imageFile = await convertPdfToImage(file);
    } else if (file.type.startsWith('image/')) {
      console.log('[DEBUG] Using image file directly');
      imageFile = file;
    } else {
      throw new Error('Unsupported file type');
    }
    
    // Convert to base64 for AI processing
    const base64Image = await convertToBase64(imageFile);
    
    // Send to simplified edge function
    const result = await callImageProcessingFunction(base64Image, file.name);
    
    return result;
    
  } catch (error) {
    console.error('Certificate processing error:', error);
    throw error;
  }
}

// 3. BASE64 CONVERSION HELPER
async function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data:image/png;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 4. CALL SIMPLIFIED EDGE FUNCTION
async function callImageProcessingFunction(base64Image, filename) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${window.supabaseUrl}/functions/v1/analyze-certificate-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Image,
      filename: filename
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

// 5. UPDATED CERTIFICATE UPLOADER INTEGRATION
function initCertificateUploaderWithImageProcessing() {
  const dropzone = document.getElementById('certificate-dropzone');
  const fileInput = document.getElementById('certificate-upload');
  
  async function handleFiles(files) {
    const file = files[0];
    if (!file) return;
    
    console.log('[DEBUG] Processing certificate as image');
    
    try {
      // Show processing indicator
      showProcessingState('Converting certificate to image for AI analysis...');
      
      // Process certificate using image approach
      const result = await processCertificateAsImage(file);
      
      if (result.success) {
        showSuccess('Certificate processed successfully!');
        openConfirmationModal(result.data);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
      
    } catch (error) {
      console.error('[DEBUG] Certificate processing error:', error);
      showError(error.message);
    }
  }
  
  // Attach event listeners
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      handleFiles(fileInput.files);
    }
  });
  
  // Drag and drop support
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length) {
      fileInput.files = files;
      handleFiles(files);
    }
  });
}