function downloadCSV(data, filename) {
    if (!data.length) return;
    
    // Create HTML Excel file with colors and formatting
    const headers = Object.keys(data[0]);
    const isComplaint = filename.includes('complaint');
    const isTraining = filename.includes('training');
    
    // Define color schemes
    const headerBg = isComplaint ? '#dc3545' : isTraining ? '#007bff' : '#28a745';
    const headerColor = '#ffffff';
    const altRowBg = '#f8f9fa';
    
    // Build HTML