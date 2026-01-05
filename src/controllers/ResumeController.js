/**
 * Resume Controller
 * Handles resume upload, parsing, and management
 */

import ResumeModel from '../models/ResumeModel.js';
import { processPDFResume } from '../services/PDFParserService.js';
import { processDOCXResume } from '../services/DOCXParserService.js';
import { parseResumeWithAI } from '../services/AIService.js';
import SettingsModel from '../models/SettingsModel.js';

/**
 * Handle resume file upload
 * @param {File} file - Uploaded file
 * @returns {Promise<Object>} Parsed resume data
 */
export async function uploadResume(file) {
    // Security: Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 10MB limit');
    }

    // Security: Validate MIME type
    const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Only PDF and DOCX files are allowed.');
    }

    const fileName = file.name.toLowerCase();
    let resumeData;

    if (fileName.endsWith('.pdf')) {
        resumeData = await processPDFResume(file);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        resumeData = await processDOCXResume(file);
    } else {
        throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
    }

    // Verify we have raw text
    if (!resumeData.rawText || resumeData.rawText.length < 50) {
        throw new Error('Could not extract text from document. Please try a different file.');
    }

    // Security: Truncate extremely large text to prevent DoS
    const MAX_TEXT_LENGTH = 50000;
    if (resumeData.rawText.length > MAX_TEXT_LENGTH) {
        resumeData.rawText = resumeData.rawText.substring(0, MAX_TEXT_LENGTH);
        console.warn('Resume text truncated to 50,000 characters');
    }

    // Try AI Parsing if API key is available
    try {
        const apiKey = await SettingsModel.getApiKey();
        if (apiKey) {
            console.log('Attempting AI resume parsing...');
            const aiData = await parseResumeWithAI(resumeData.rawText);

            // Merge AI data with basic file metadata
            // AI data takes precedence for parsed fields
            resumeData = {
                ...resumeData,
                ...aiData,
                // Ensure critical metadata is preserved
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                rawText: resumeData.rawText // Keep original text
            };
            console.log('AI parsing successful');
        }
    } catch (error) {
        console.warn('AI parsing failed, falling back to basic parsing:', error);
        // Continue with basic regex-parsed data
    }

    // Add file metadata (redundant if AI succeeded but safe)
    resumeData.fileName = file.name;
    resumeData.fileSize = file.size;
    resumeData.fileType = file.type;

    // Save to storage
    await ResumeModel.save(resumeData);

    return resumeData;
}

/**
 * Get current stored resume
 * @returns {Promise<Object|null>}
 */
export async function getResume() {
    return await ResumeModel.get();
}

/**
 * Get resume summary for display
 * @returns {Promise<Object|null>}
 */
export async function getResumeSummary() {
    return await ResumeModel.getSummary();
}

/**
 * Check if resume exists
 * @returns {Promise<boolean>}
 */
export async function hasResume() {
    return await ResumeModel.exists();
}

/**
 * Clear stored resume
 * @returns {Promise<void>}
 */
export async function clearResume() {
    await ResumeModel.clear();
}

/**
 * Update resume data manually
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateResume(updates) {
    const current = await ResumeModel.get();
    if (!current) {
        throw new Error('No resume found to update');
    }

    const updated = { ...current, ...updates };
    await ResumeModel.save(updated);
    return updated;
}

export default {
    uploadResume,
    getResume,
    getResumeSummary,
    hasResume,
    clearResume,
    updateResume
};
