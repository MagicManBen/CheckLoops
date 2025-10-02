// Training Certificate Viewer functionality
// This script adds certificate viewing buttons to training tables in both admin and staff views

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the certificate buttons once the DOM is fully loaded
  initCertificateButtons();
});

// Function to initialize certificate viewing buttons in training tables
function initCertificateButtons() {
  // Check if we're on the admin dashboard or staff training page
  const isAdminDashboard = document.querySelector('#training-tbody') !== null;
  const isStaffTraining = document.querySelector('#training-table') !== null;
  
  if (!isAdminDashboard && !isStaffTraining) {
    return; // Not on a page with training tables
  }

  console.log('Initializing certificate buttons for training records');
  
  // Add certificate button functionality
  if (isAdminDashboard) {
    addCertificateButtonsToAdminTraining();
  }
  
  if (isStaffTraining) {
    addCertificateButtonsToStaffTraining();
  }
}

// Function to add certificate buttons to the admin dashboard training table
async function addCertificateButtonsToAdminTraining() {
  try {
    // Get all training records with certificates (admin view)
    const { data: allTrainingRecords, error } = await window.supabase
      .rpc('get_training_records_with_certificates');
    
    if (error) {
      console.error('Error fetching all training records with certificates:', error);
      return;
    }
    
    // Find all rows in the training table
    const rows = document.querySelectorAll('#training-tbody tr');
    
    // Create a map to quickly look up records by user ID and training type ID
    const recordMap = {};
    if (allTrainingRecords) {
      allTrainingRecords.forEach(record => {
        const key = `${record.user_id}_${record.training_type_id}`;
        recordMap[key] = record;
      });
    }
    
    rows.forEach(row => {
      const userId = row.dataset.userId;
      const trainingTypeId = row.dataset.trainingTypeId;
      
      if (userId && trainingTypeId) {
        const key = `${userId}_${trainingTypeId}`;
        const record = recordMap[key];
        
        if (record?.certificate_url) {
          // Store certificate URL in dataset
          row.dataset.certificateUrl = record.certificate_url;
          
          // Find the actions cell
          const actionsCell = row.querySelector('td:last-child') || row.querySelector('td:nth-child(5)');
          if (actionsCell) {
            // Add the certificate button
            const certButton = document.createElement('button');
            certButton.className = 'btn btn-sm view-certificate';
            certButton.title = 'View certificate';
            certButton.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              Cert
            `;
            certButton.onclick = (e) => {
              e.stopPropagation(); // Prevent row click handler from firing
              viewCertificate(record.certificate_url);
            };
            actionsCell.appendChild(certButton);
          }
        }
      }
    });
  } catch (err) {
    console.error('Error adding certificate buttons to admin training table:', err);
  }
}

// Function to add certificate buttons to the staff training table
async function addCertificateButtonsToStaffTraining() {
  try {
    // Get current user's training records with certificates
    const { data: userTrainingRecords, error } = await window.supabase
      .rpc('get_training_records_with_certificates', { user_id_param: window.supabase.auth.user()?.id });
    
    if (error) {
      console.error('Error fetching training records with certificates:', error);
      return;
    }
    
    // Find all rows in the training table
    const rows = document.querySelectorAll('#training-table tbody tr');
    
    rows.forEach(row => {
      const trainingId = row.dataset.trainingId;
      if (!trainingId) return;
      
      // Find matching record with certificate
      const record = userTrainingRecords?.find(r => r.training_type_id === parseInt(trainingId, 10));
      if (record?.certificate_url) {
        // Store certificate URL in dataset
        row.dataset.certificateUrl = record.certificate_url;
        
        // Find the last cell in the row
        let actionsCell = row.querySelector('td:last-child');
        if (!actionsCell) {
          // Create a new cell if it doesn't exist
          actionsCell = document.createElement('td');
          row.appendChild(actionsCell);
        }
        
        // Add the certificate button
        const certButton = document.createElement('button');
        certButton.className = 'btn btn-sm view-certificate';
        certButton.title = 'View certificate';
        certButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          Cert
        `;
        certButton.onclick = (e) => {
          e.stopPropagation(); // Prevent row click handler from firing
          viewCertificate(record.certificate_url);
        };
        actionsCell.appendChild(certButton);
      }
    });
  } catch (err) {
    console.error('Error adding certificate buttons to staff training table:', err);
  }
}

// Function to view certificate from Supabase storage
window.viewCertificate = async function(certificateUrl) {
  if (!certificateUrl) {
    alert('No certificate available for this record.');
    return;
  }
  
  try {
    // Check if there's actually a certificate bucket in Supabase
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      alert('Failed to check certificate storage: ' + bucketsError.message);
      return;
    }
    
    // Check if the training_certificates bucket exists
    const trainingBucket = buckets.find(b => b.name === 'training_certificates');
    
    if (!trainingBucket) {
      console.warn('Training certificates bucket not found');
      alert('Certificate system is not fully configured yet. Please contact the administrator.');
      return;
    }
    
    // Create a signed URL that will be valid for 5 minutes
    const { data, error } = await supabase.storage
      .from('training_certificates')
      .createSignedUrl(certificateUrl, 300); // 5 minutes
    
    if (error) {
      console.error('Error creating signed URL:', error);
      alert('Failed to retrieve certificate: ' + error.message);
      return;
    }
    
    if (data && data.signedUrl) {
      // Open the signed URL in a new tab/window
      window.open(data.signedUrl, '_blank');
    } else {
      alert('Unable to retrieve certificate. Please try again.');
    }
  } catch (err) {
    console.error('Error viewing certificate:', err);
    alert('Failed to view certificate: ' + err.message);
  }
};

// Export for use in other scripts
window.initTrainingCertificateButtons = initCertificateButtons;