    function downloadCSV(data, filename) {
        if (!data.length) return;
        
        // Create colorful HTML that Excel will open
        const headers = Object.keys(data[0]);
        const isComplaint = filename.includes('complaint');
        const isTraining = filename.includes('training');
        
        // Color themes based on export type
        const headerBg = isComplaint ? '#dc3545' : (isTraining ? '#007bff' : '#28a745');
        
        // Build HTML with Excel-compatible formatting
        let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        html += '<head>';
        html += '<meta charset="