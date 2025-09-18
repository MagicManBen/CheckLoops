function downloadCSV(data, filename) {
    if (!data.length) return;
    
    // Create HTML with colors that Excel will recognize
    const headers = Object.keys(data[0]);
    const isComplaint = filename.includes('complaint');
    const isTraining = filename.includes('training');
    
    // Color themes
    const headerBg = isComplaint ? '#dc3545' : (isTraining ? '#007bff' : '#28a745');
    
    // Build HTML table with