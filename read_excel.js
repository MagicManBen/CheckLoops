import XLSX from 'xlsx';
import fs from 'fs';

// Read the Excel file
const workbook = XLSX.readFile('HolidayTransfer.xlsx');

// Get the first sheet name
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Excel Data:');
console.log(JSON.stringify(data, null, 2));

// Also display in a more readable format
console.log('\n\nFormatted Data:');
data.forEach((row, index) => {
  console.log(`\nRow ${index + 1}:`);
  Object.keys(row).forEach(key => {
    console.log(`  ${key}: ${row[key]}`);
  });
});