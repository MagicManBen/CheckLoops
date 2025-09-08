    function downloadCSV(data, filename) {
        if (!data.length) return;
        
        // Create HTML that Excel recognizes with colors
        const headers = Object.keys(data[0]);
        const isComplaint = filename.includes('complaint');
        const isTraining = filename.includes('training');
        
        // Color themes
        const headerBg = isComplaint ? '#ff4444' : (isTraining ? '#4488ff' : '#44ff44');
        
        let html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
        html += '<head><meta http-equiv="content-type" content="text/html; charset=UTF-8">';
        html += '<!--[if gte mso 9]><xml>';
        html += '<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
        html += '<x:Name>Sheet1</x:Name>';
        html += '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>';
        html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>';
        html += '</xml><![endif]-->';
        html += '<style>';
        html += 'table {border-collapse:collapse;width:100%;}';
        html += 'th {background:' + headerBg + ';color:white;font-weight:bold;padding:10px;border:1px solid #999