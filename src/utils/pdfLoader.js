/**
 * PDF.js Loader
 * Loads PDF.js library and exposes it as a global
 * This is loaded as an external script to comply with CSP
 */

import * as pdfjsLib from '/lib/pdf.min.mjs';

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdf.worker.min.mjs';

// Expose as global for PDFParserService
window.pdfjsLib = pdfjsLib;

console.log('[CoverAI] PDF.js loaded successfully');
