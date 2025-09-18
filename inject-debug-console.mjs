import { promises as fs } from 'fs';
import { glob } from 'glob';

async function injectDebugConsole() {
    console.log('🚀 INJECTING DEBUG CONSOLE INTO ALL HTML FILES');
    console.log('==============================================\n');

    // Find all HTML files (excluding node_modules)
    const htmlFiles = await glob('**/*.html', {
        ignore: ['node_modules/**']
    });

    console.log(`Found ${htmlFiles.length} HTML files to process\n`);

    let injectedCount = 0;
    let alreadyHasCount = 0;
    let errorCount = 0;

    for (const file of htmlFiles) {
        try {
            // Read the file
            let content = await fs.readFile(file, 'utf-8');

            // Check if debug console is already injected
            if (content.includes('debug-console.js')) {
                console.log(`⏭️  ${file} - Already has debug console`);
                alreadyHasCount++;
                continue;
            }

            // Find the closing body tag
            const bodyCloseIndex = content.lastIndexOf('</body>');

            if (bodyCloseIndex === -1) {
                console.log(`⚠️  ${file} - No </body> tag found`);
                errorCount++;
                continue;
            }

            // Create the script tag to inject
            const debugScriptTag = `
    <!-- Debug Console - Persistent across all pages -->
    <script src="debug-console.js"></script>
`;

            // Insert the script before the closing body tag
            content = content.substring(0, bodyCloseIndex) +
                     debugScriptTag +
                     content.substring(bodyCloseIndex);

            // Write the file back
            await fs.writeFile(file, content, 'utf-8');

            console.log(`✅ ${file} - Debug console injected`);
            injectedCount++;

        } catch (error) {
            console.log(`❌ ${file} - Error: ${error.message}`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 INJECTION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`✅ Injected into: ${injectedCount} files`);
    console.log(`⏭️  Already had console: ${alreadyHasCount} files`);
    console.log(`❌ Errors: ${errorCount} files`);
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Make sure debug-console.js is in the root directory');
    console.log('2. Test by opening any HTML page');
    console.log('3. Click the 🐛 button in bottom right to open console');
    console.log('4. All interactions will be logged persistently');
}

// Run the injection
console.log('Starting debug console injection...\n');
injectDebugConsole().catch(console.error);