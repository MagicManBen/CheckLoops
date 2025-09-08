    function downloadCSV(data, filename) {
        if (!data.length) return;
        
        // Create colorful HTML that Excel will open
        const headers = Object.keys(data[0]);
        const isComplaint = filename.includes('complaint');
        const isTraining = filename.includes('training');