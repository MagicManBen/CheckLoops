function downloadCSV(data, filename) {
    if (!data.length) return;
    
    // For now, keep using SheetJS but in a way that works better
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add autofilter
    const range = XLSX.utils.decode_range(ws['!ref']);
    ws['!autofilter'] = { ref: ws['!ref'] };
    
    // Column widths
    const cols