// Test the certificate viewing functionality
async function testCertificateViewing() {
  try {
    // Define a test certificate URL
    const testCertificateUrl = 'certificates/test-certificate.pdf';
    
    // Try to generate a signed URL for the certificate
    const { data, error } = await supabase.storage
      .from('training_certificates')
      .createSignedUrl(testCertificateUrl, 300);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      alert(`Certificate test failed: ${error.message}`);
      return false;
    }
    
    if (data && data.signedUrl) {
      console.log('Certificate URL generation successful:', data.signedUrl);
      alert('Certificate URL generation successful. View URL in console.');
      return true;
    } else {
      alert('Unable to generate certificate URL.');
      return false;
    }
  } catch (err) {
    console.error('Error in certificate test:', err);
    alert(`Certificate test error: ${err.message}`);
    return false;
  }
}

// Test the SQL function for getting staff with certificates
async function testSqlFunction() {
  try {
    const year = new Date().getFullYear();
    
    // Try the new function
    const { data, error } = await supabase.rpc('get_holidays_by_staff_with_certificates', { p_year: year });
    
    if (error) {
      console.error('SQL function test failed:', error);
      alert(`SQL function test failed: ${error.message}`);
      return false;
    }
    
    console.log('SQL function test successful:', data);
    alert(`SQL function test successful. Found ${data?.length || 0} staff records.`);
    return true;
  } catch (err) {
    console.error('Error in SQL function test:', err);
    alert(`SQL function test error: ${err.message}`);
    return false;
  }
}

// Run tests
window.runCertificateTests = async function() {
  const sqlResult = await testSqlFunction();
  const certResult = await testCertificateViewing();
  
  return {
    sqlFunctionTest: sqlResult,
    certificateViewingTest: certResult
  };
};