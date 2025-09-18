function downloadCSV(data, filename) {
    if (!data.length) return;
    
    // Create HTML Excel with colors
    const headers = Object.keys(data[0]);
    const isComplaint = filename.includes('complaint');
    const isTraining = filename.includes('training');
    
    // Color schemes
    const headerBg = isComplaint ? '#dc3545' : (isTraining ? '#007bff' : '#28a745');
    
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ';
    html += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
    html += 'xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8" />';
    html += '<style>';
    html += 'table {border-collapse:collapse;}';
    html += 'th {background-color:' + headerBg + ';color:white;font-weight:bold;padding:10px;border:1px solid #ccc;text-align:left;}';
    html += 'td {padding:8px;border:1px solid #ccc;}';
    html += 'tr:nth-child(even) td {background-color:#f2f2f2;}';
    html += '</style></head><body>';
    html += '<table>';
    
    // Header row
    html += '<tr>';
    headers.forEach(h => {
        html += '<th>' + (h || '') + '</th>';
    });
    html += '</tr>';
    
    // Data rows
    data.forEach((row, i) => {
        html += '<tr>';
        headers.forEach(h => {
            let val = row[h];
            if (val === null || val === undefined) val = '';
            html += '<td>' + String(val) + '</td>';
        });
        html += '</tr>';
    });
    
    html += '</table></body></html>';
    
    // Download as .xls file
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a