/**
 * DOCX Parser Service
 * Uses mammoth.js to extract text from DOCX resumes
 */

let mammoth = null;

/**
 * Initialize mammoth.js library
 */
async function initMammoth() {
    if (mammoth) return;
    mammoth = await import(chrome.runtime.getURL('lib/mammoth.browser.min.js'));
}

/**
 * Extract text from a DOCX file
 * @param {File|ArrayBuffer} file - DOCX file or ArrayBuffer
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromDOCX(file) {
    await initMammoth();

    let arrayBuffer;
    if (file instanceof File) {
        arrayBuffer = await file.arrayBuffer();
    } else {
        arrayBuffer = file;
    }

    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

/**
 * Extract HTML from a DOCX file (preserves some structure)
 * @param {File|ArrayBuffer} file - DOCX file or ArrayBuffer
 * @returns {Promise<string>} Extracted HTML
 */
export async function extractHTMLFromDOCX(file) {
    await initMammoth();

    let arrayBuffer;
    if (file instanceof File) {
        arrayBuffer = await file.arrayBuffer();
    } else {
        arrayBuffer = file;
    }

    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
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

    // Extract name (usually first line)
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
        const firstLine = lines[0].trim();
        if (firstLine.length < 50 && !firstLine.includes('@')) {
            resume.name = firstLine;
        }
    }

    // Extract skills
    const skillsSection = text.match(/skills[:\s]*([\s\S]*?)(?=experience|education|projects|$)/i);
    if (skillsSection) {
        const skillsText = skillsSection[1];
        resume.skills = skillsText
            .split(/[,•|·\n]/)
            .map(s => s.trim())
            .filter(s => s.length > 1 && s.length < 50);
    }

    // Extract summary
    const summarySection = text.match(/(?:summary|objective|profile)[:\s]*([\s\S]*?)(?=experience|education|skills|$)/i);
    if (summarySection) {
        resume.summary = summarySection[1].trim().slice(0, 500);
    }

    return resume;
}

/**
 * Process DOCX file and return structured resume
 * @param {File} file - DOCX file
 * @returns {Promise<Object>} Structured resume data
 */
export async function processDOCXResume(file) {
    const text = await extractTextFromDOCX(file);
    return parseResumeText(text);
}

export default {
    extractTextFromDOCX,
    extractHTMLFromDOCX,
    parseResumeText,
    processDOCXResume
};
