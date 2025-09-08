    function downloadCSV(data, filename) {
        if (!data.length) return;
        
        // Create HTML Excel with colors and formatting
        const headers = Object.keys(data[0]);
        
        // Build colorful HTML table that Excel will recognize
        let html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
        html += '<head>';
        html += '<meta charset="UTF-8">';
        html += '