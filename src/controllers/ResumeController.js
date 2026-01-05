/**
 * Resume Controller
 * Handles resume upload, parsing, and management
 */

import ResumeModel from '../models/ResumeModel.js';
import { processPDFResume } from '../services/PDFParserService.js';
import { processDOCXResume } from '../services/DOCXParserService.js';

/**
 * Handle resume file upload
 * @param {File} file - Uploaded file
 * @returns {Promise<Object>} Parsed resume data
 */
export async function uploadResume(file) {
    const fileName = file.name.toLowerCase();
    let resumeData;

    if (fileName.endsWith('.pdf')) {
        resumeData = await processPDFResume(file);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        resumeData = await processDOCXResume(file);
    } else {
        throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
    }

    // Add file metadata
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
