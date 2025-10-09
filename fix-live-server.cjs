#!/usr/bin/env node

/**
 * Live Server Fix Script
 * 
 * This script helps diagnose and fix common issues with the Live Server extension
 * for Visual Studio Code that prevent auto-reload from working properly.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function success(message) {
  log('✅ ' + message, colors.green);
}

function warning(message) {
  log('⚠️  ' + message, colors.yellow);
}

function error(message) {
  log('❌ ' + message, colors.red);
}

function title(message) {
  console.log('\n' + colors.bright + colors.blue + '=== ' + message + ' ===' + colors.reset + '\n');
}

// Check if we're in a VS Code workspace
function isVSCodeWorkspace() {
  return fs.existsSync(path.join(process.cwd(), '.vscode'));
}

// Get the path to VS Code settings.json
function getUserSettingsPath() {
  let settingsPath;
  
  if (process.platform === 'win32') {
    settingsPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'settings.json');
  } else if (process.platform === 'darwin') {
    settingsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json');
  } else {
    settingsPath = path.join(os.homedir(), '.config', 'Code', 'User', 'settings.json');
  }
  
  return settingsPath;
}

// Read JSON file safely
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    error(`Failed to read or parse ${filePath}: ${err.message}`);
    return null;
  }
}

// Write JSON file safely
function writeJsonFile(filePath, data) {
  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (err) {
    error(`Failed to write ${filePath}: ${err.message}`);
    return false;
  }
}

// Check and fix Live Server global settings
function checkGlobalSettings() {
  title('Checking Global VS Code Settings');
  
  const settingsPath = getUserSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    warning(`Could not find VS Code user settings at ${settingsPath}`);
    return false;
  }
  
  log(`Found VS Code settings at ${settingsPath}`);
  
  const settings = readJsonFile(settingsPath);
  if (!settings) return false;
  
  let changed = false;
  
  // Check Live Server settings
  if (!settings['liveServer.settings.useLocalIp']) {
    settings['liveServer.settings.useLocalIp'] = true;
    changed = true;
    log('Set liveServer.settings.useLocalIp to true');
  }
  
  if (!settings['liveServer.settings.donotVerifyTags']) {
    settings['liveServer.settings.donotVerifyTags'] = true;
    changed = true;
    log('Set liveServer.settings.donotVerifyTags to true');
  }
  
  if (!settings['liveServer.settings.fullReload']) {
    settings['liveServer.settings.fullReload'] = true;
    changed = true;
    log('Set liveServer.settings.fullReload to true');
  }
  
  if (changed) {
    if (writeJsonFile(settingsPath, settings)) {
      success('Updated global VS Code settings');
    }
  } else {
    success('Global VS Code settings look good');
  }
  
  return true;
}

// Check and fix workspace settings
function checkWorkspaceSettings() {
  title('Checking Workspace Settings');
  
  if (!isVSCodeWorkspace()) {
    warning('No .vscode folder found in current directory. Creating one...');
    try {
      fs.mkdirSync('.vscode');
    } catch (err) {
      if (err.code !== 'EEXIST') {
        error(`Failed to create .vscode directory: ${err.message}`);
        return false;
      }
    }
  }
  
  const workspaceSettingsPath = path.join(process.cwd(), '.vscode', 'settings.json');
  let workspaceSettings = readJsonFile(workspaceSettingsPath) || {};
  
  let changed = false;
  
  // Check and update Live Server settings
  if (!workspaceSettings['liveServer.settings.useWebExt']) {
    workspaceSettings['liveServer.settings.useWebExt'] = true;
    changed = true;
    log('Set liveServer.settings.useWebExt to true');
  }
  
  if (!workspaceSettings['liveServer.settings.fullReload']) {
    workspaceSettings['liveServer.settings.fullReload'] = true;
    changed = true;
    log('Set liveServer.settings.fullReload to true');
  }
  
  if (workspaceSettings['liveServer.settings.wait'] === undefined) {
    workspaceSettings['liveServer.settings.wait'] = 100;
    changed = true;
    log('Set liveServer.settings.wait to 100');
  }
  
  if (workspaceSettings['liveServer.settings.ignoreFiles'] === undefined) {
    workspaceSettings['liveServer.settings.ignoreFiles'] = [
      '.vscode/**',
      '**/*.scss',
      '**/*.sass',
      '**/*.ts'
    ];
    changed = true;
    log('Added liveServer.settings.ignoreFiles configuration');
  }
  
  if (changed) {
    if (writeJsonFile(workspaceSettingsPath, workspaceSettings)) {
      success('Updated workspace settings.json');
    }
  } else {
    success('Workspace settings look good');
  }
  
  return true;
}

// Create test HTML file
function createTestFile() {
  title('Creating Test HTML File');
  
  const testFilePath = path.join(process.cwd(), 'live-server-test.html');
  
  // Check if file already exists
  if (fs.existsSync(testFilePath)) {
    log('Test file already exists, skipping creation');
    return true;
  }
  
  const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Server Test</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .box {
            padding: 20px;
            background: #f5f5f5;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .success { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>Live Server Test</h1>
    
    <div class="box">
        <p>This is a test file to check if Live Server auto-reload is working.</p>
        <p>If you see this page in your browser, Live Server is at least partially working.</p>
        <p>Random number (changes on each load): <strong id="random"></strong></p>
        <p>Current time: <strong id="time"></strong></p>
    </div>
    
    <div class="box">
        <h2>WebSocket Status</h2>
        <p>Live Server uses WebSockets for the auto-reload feature.</p>
        <p>Status: <span id="ws-status" class="error">Checking...</span></p>
    </div>

    <script>
        // Set random number and time
        document.getElementById('random').textContent = Math.random().toString().substring(2, 8);
        
        function updateTime() {
            document.getElementById('time').textContent = new Date().toLocaleTimeString();
        }
        updateTime();
        setInterval(updateTime, 1000);
        
        // Check WebSocket connection
        setTimeout(() => {
            const wsStatus = document.getElementById('ws-status');
            const scripts = document.getElementsByTagName('script');
            
            let liveReloadFound = false;
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].src && scripts[i].src.includes('livereload.js')) {
                    liveReloadFound = true;
                    break;
                }
            }
            
            if (liveReloadFound) {
                wsStatus.textContent = 'Live Server WebSocket detected ✓';
                wsStatus.className = 'success';
            } else {
                wsStatus.textContent = 'Live Server WebSocket NOT detected ✗';
                wsStatus.className = 'error';
            }
        }, 1000);
    </script>
</body>
</html>`;
  
  try {
    fs.writeFileSync(testFilePath, testHtml, 'utf8');
    success(`Created test file at ${testFilePath}`);
    return true;
  } catch (err) {
    error(`Failed to create test file: ${err.message}`);
    return false;
  }
}

// Check firewall and network settings
function checkNetworkSettings() {
  title('Checking Network Settings');
  
  log('Checking if port 5500/5501 is in use...');
  
  try {
    let command;
    let ports = [];
    
    if (process.platform === 'win32') {
      command = 'netstat -ano | findstr "5500 5501"';
    } else {
      command = 'lsof -i:5500,5501';
    }
    
    const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (output.includes('5500') || output.includes('5501')) {
      warning('Ports 5500 or 5501 might be in use by another application.');
      ports = output.includes('5500') ? [...ports, '5500'] : ports;
      ports = output.includes('5501') ? [...ports, '5501'] : ports;
      log(`Ports in use: ${ports.join(', ')}`);
      
      log('This might cause conflicts with Live Server. Consider changing the port in settings.json:');
      log('"liveServer.settings.port": 5502');
    } else {
      success('Ports 5500 and 5501 are available');
    }
  } catch (err) {
    // Command might fail if no ports in use, which is fine
    success('No conflicts detected with ports 5500 and 5501');
  }
  
  return true;
}

// Check browser extensions
function checkBrowserExtensions() {
  title('Browser Extensions Check');
  
  log('Some browser extensions can interfere with Live Server auto-reload:');
  log('- Ad blockers may block WebSockets');
  log('- Privacy extensions might block the auto-reload script');
  log('- CORS or CSP extensions can prevent the WebSocket connection');
  
  log('\nRecommendation: Try disabling browser extensions or open Live Server in an incognito window');
  
  return true;
}

// Create middleware.js file for custom Live Server middleware
function createMiddlewareFile() {
  title('Creating Live Server Middleware');
  
  const middlewarePath = path.join(process.cwd(), 'middleware.js');
  
  const middlewareContent = `// Live Server Middleware
// This file enables custom settings for Live Server
module.exports = function(app, server, path) {
    // Add headers to all responses to disable caching
    app.use(function(req, res, next) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Add permissive CORS headers for WebSocket connections
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        next();
    });
    
    // Log requests for debugging
    app.use(function(req, res, next) {
        if (!req.url.includes('browser-sync')) {
            console.log(\`[Live Server] \${req.method} \${req.url}\`);
        }
        next();
    });
};
`;
  
  try {
    fs.writeFileSync(middlewarePath, middlewareContent, 'utf8');
    success(`Created middleware.js file at ${middlewarePath}`);
    
    // Update workspace settings to use middleware
    const workspaceSettingsPath = path.join(process.cwd(), '.vscode', 'settings.json');
    let workspaceSettings = readJsonFile(workspaceSettingsPath) || {};
    
    workspaceSettings['liveServer.settings.middleware'] = {
      '0': null,
      '1': "./middleware.js"
    };
    
    if (writeJsonFile(workspaceSettingsPath, workspaceSettings)) {
      success('Updated workspace settings to use middleware');
    }
    
    return true;
  } catch (err) {
    error(`Failed to create middleware.js file: ${err.message}`);
    return false;
  }
}

// Check Content Security Policy in HTML files
function checkCSPHeaders() {
  title('Checking Content Security Policy Headers');
  
  const htmlFiles = [];
  
  // Find all HTML files in the current directory
  function findHtmlFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && file.name !== 'node_modules' && !file.name.startsWith('.')) {
        findHtmlFiles(fullPath);
      } else if (file.isFile() && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
        htmlFiles.push(fullPath);
      }
    }
  }
  
  try {
    findHtmlFiles(process.cwd());
    
    if (htmlFiles.length === 0) {
      warning('No HTML files found in the current directory');
      return true;
    }
    
    log(`Found ${htmlFiles.length} HTML files`);
    
    let filesWithCSP = 0;
    let filesWithRestrictiveCSP = 0;
    
    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf8');
      const fileName = path.basename(htmlFile);
      
      if (content.includes('Content-Security-Policy')) {
        filesWithCSP++;
        
        // Check for restrictive CSP that might block WebSockets
        const isRestrictive = content.includes('connect-src') && 
                             !content.includes('connect-src \'self\'') &&
                             !content.includes('connect-src *');
                             
        if (isRestrictive) {
          filesWithRestrictiveCSP++;
          warning(`File ${fileName} has a restrictive Content-Security-Policy that might block WebSockets`);
          log('Consider adding "connect-src \'self\' ws: wss:" to your CSP header');
        }
      }
    }
    
    if (filesWithCSP > 0) {
      if (filesWithRestrictiveCSP === 0) {
        success('Content-Security-Policy headers look good');
      } else {
        warning(`Found ${filesWithRestrictiveCSP} files with potentially restrictive CSP headers`);
      }
    } else {
      success('No Content-Security-Policy headers found that would block WebSockets');
    }
    
  } catch (err) {
    error(`Error checking HTML files: ${err.message}`);
  }
  
  return true;
}

// Main function
function main() {
  title('Live Server Auto-Reload Fix');
  log('This script will help diagnose and fix common Live Server auto-reload issues');
  
  // Run checks
  checkGlobalSettings();
  checkWorkspaceSettings();
  checkNetworkSettings();
  checkBrowserExtensions();
  createMiddlewareFile();
  checkCSPHeaders();
  createTestFile();
  
  title('Next Steps');
  log('1. Restart VS Code completely');
  log('2. Open the newly created test file "live-server-test.html"');
  log('3. Right-click on the file and select "Open with Live Server"');
  log('4. Make a small change to the file and save it to test auto-reload');
  log('5. If auto-reload still doesn\'t work, try opening the browser in incognito mode');
  
  success('\nFix process completed! If issues persist, please check the VS Code extension issues page:');
  log('https://github.com/ritwickdey/vscode-live-server/issues');
}

main();