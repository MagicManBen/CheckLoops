import fs from 'fs';

const content = fs.readFileSync('my-holidays.html', 'utf8');

// Extract just the main script section
const scriptStart = content.indexOf('  <script type="module">');
const scriptEnd = content.indexOf('  </script>', scriptStart);
const script = content.substring(scriptStart, scriptEnd);

let openBraces = 0;
let openParens = 0;
let openBrackets = 0;
let inString = false;
let stringChar = null;
let escaped = false;

for (let i = 0; i < script.length; i++) {
  const char = script[i];
  const prevChar = i > 0 ? script[i-1] : '';

  if (escaped) {
    escaped = false;
    continue;
  }

  if (char === '\\') {
    escaped = true;
    continue;
  }

  // Handle strings
  if ((char === '"' || char === "'" || char === '`') && !inString) {
    inString = true;
    stringChar = char;
  } else if (char === stringChar && inString) {
    inString = false;
    stringChar = null;
  }

  // Count brackets only outside strings
  if (!inString) {
    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '(') openParens++;
    if (char === ')') openParens--;
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;

    if (openBraces < 0 || openParens < 0 || openBrackets < 0) {
      const lineNum = script.substring(0, i).split('\n').length;
      console.log(`Unbalanced at line ~${lineNum}`);
      console.log(`Context: ${script.substring(i-50, i+50)}`);
      break;
    }
  }
}

console.log('Final counts:');
console.log('Braces {}:', openBraces);
console.log('Parens ():', openParens);
console.log('Brackets []:', openBrackets);