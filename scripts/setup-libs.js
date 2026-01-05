/**
 * Setup script to copy library files to the lib folder
 * Run: npm run setup
 */

const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, '..', 'lib');

// Create lib directory if it doesn't exist
if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
}

// Files to copy from node_modules
const filesToCopy = [
    {
        src: 'node_modules/pdfjs-dist/build/pdf.min.mjs',
        dest: 'lib/pdf.min.mjs'
    },
    {
        src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
        dest: 'lib/pdf.worker.min.mjs'
    },
    {
        src: 'node_modules/mammoth/mammoth.browser.min.js',
        dest: 'lib/mammoth.browser.min.js'
    },
    {
        src: 'node_modules/docx/build/index.umd.js',
        dest: 'lib/docx.min.js'
    }
];

console.log('Setting up library files...\n');

filesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(__dirname, '..', src);
    const destPath = path.join(__dirname, '..', dest);

    try {
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✓ Copied ${src} -> ${dest}`);
        } else {
            console.log(`✗ File not found: ${src}`);
            console.log(`  Run 'npm install' first`);
        }
    } catch (error) {
        console.log(`✗ Error copying ${src}: ${error.message}`);
    }
});

console.log('\nSetup complete!');
console.log('You can now load the extension in Chrome.');
