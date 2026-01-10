/**
 * PDF Parser Service
 * Uses pdf.js to extract text from PDF resumes
 */

// PDF.js is loaded via script tag in popup.html and exposed as window.pdfjsLib
let pdfjsLib = null;

/**
 * Initialize PDF.js library
 */
async function initPdfJs() {
    if (pdfjsLib) return;

    // Wait for the global pdfjsLib to be available (loaded via script tag in popup.html)
    let attempts = 0;
    while (!window.pdfjsLib && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.pdfjsLib) {
        throw new Error('PDF.js library failed to load. Please refresh the extension.');
    }

    pdfjsLib = window.pdfjsLib;
}

/**
 * Extract text from a PDF file
 * @param {File|ArrayBuffer} file - PDF file or ArrayBuffer
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPDF(file) {
    await initPdfJs();

    let arrayBuffer;
    if (file instanceof File) {
        arrayBuffer = await file.arrayBuffer();
    } else {
        arrayBuffer = file;
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map(item => item.str)
            .join(' ');
        textParts.push(pageText);
    }

    return textParts.join('\n\n');
}

/**
 * Parse resume text into structured data
 * @param {string} text - Raw resume text
 * @returns {Object} Structured resume data
 */
export function parseResumeText(text) {
    const resume = {
        rawText: text,
        name: '',
        email: '',
        phone: '',
        location: '',
        summary: '',
        experience: [],
        education: [],
        skills: []
    };

    // Extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
        resume.email = emailMatch[0];
    }

    // Extract phone
    const phoneMatch = text.match(/(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
        resume.phone = phoneMatch[0];
    }

    // Extract name (usually first line or near email)
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
        // First substantial line is often the name
        const firstLine = lines[0].trim();
        if (firstLine.length < 50 && !firstLine.includes('@')) {
            resume.name = firstLine;
        }
    }

    // Extract skills (look for common patterns)
    const skillsSection = text.match(/skills[:\s]*([\s\S]*?)(?=experience|education|projects|$)/i);
    if (skillsSection) {
        const skillsText = skillsSection[1];
        // Split by common delimiters
        resume.skills = skillsText
            .split(/[,•|·\n]/)
            .map(s => s.trim())
            .filter(s => s.length > 1 && s.length < 50);
    }

    // Extract summary/objective
    const summarySection = text.match(/(?:summary|objective|profile)[:\s]*([\s\S]*?)(?=experience|education|skills|$)/i);
    if (summarySection) {
        resume.summary = summarySection[1].trim().slice(0, 500);
    }

    return resume;
}

/**
 * Process PDF file and return structured resume
 * @param {File} file - PDF file
 * @returns {Promise<Object>} Structured resume data
 */
export async function processPDFResume(file) {
    const text = await extractTextFromPDF(file);
    return parseResumeText(text);
}

export default {
    extractTextFromPDF,
    parseResumeText,
    processPDFResume
};
