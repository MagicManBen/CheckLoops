// Function to view certificate from Supabase storage
window.viewCertificate = async function(certificateUrl) {
  if (!certificateUrl) {
    alert('No certificate available for this staff member.');
    return;
  }
  
  try {
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