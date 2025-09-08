function downloadCSV(data, filename) {
    if (!data.length) return;
    
    // Create HTML that Excel will import with colors/formatting
    const headers = Object.keys(data[0]);
    
    let html = '<html><head><meta charset="UTF-8"><style>';
    html += 'table { border-collapse: collapse; font-family: Arial; }';
    html += 'th