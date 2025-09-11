// Debug test for extract-complaint function to see what environment variables are available
async function debugExtractComplaint() {
  console.log('🔍 Debugging extract-complaint function...\n');
  
  try {
    const payload = {
      text: "I'm really unhappy with the long wait time at the clinic. Had to wait 2 hours."
    };

    const response = await fetch('http://127.0.0.1:54321/functions/v1/extract-complaint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.text();
    console.log('Raw response:', result);
    
    try {
      const parsed = JSON.parse(result);
      console.log('Parsed response:', parsed);
    } catch (e) {
      console.log('Could not parse as JSON');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugExtractComplaint();