    function downloadCSV(data, filename) {
        if (!data.length) return;
        
        // Create colorful HTML that Excel can import with formatting
        const headers = Object.keys(data[0]);
        const sheetName = filename.includes('complaint') ? 'Complaints Export' : 
                          filename.includes('training') ? 'Training Matrix' : 
                          filename.includes('PIR') ? 'PIR Documents' : 'Data Export';
        
        // Buil