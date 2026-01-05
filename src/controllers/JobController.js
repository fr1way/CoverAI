/**
 * Job Controller
 * Handles job description extraction and management
 */

import JobModel from '../models/JobModel.js';

/**
 * Save job description from content script
 * @param {Object} jobData - Extracted job data
 * @returns {Promise<Object>}
 */
export async function saveJobDescription(jobData) {
    return await JobModel.saveCurrent(jobData);
}

/**
 * Get current job description
 * @returns {Promise<Object|null>}
 */
export async function getCurrentJob() {
    return await JobModel.getCurrent();
}

/**
 * Check if there's a current job
 * @returns {Promise<boolean>}
 */
export async function hasCurrentJob() {
    return await JobModel.hasCurrent();
}

/**
 * Clear current job
 * @returns {Promise<void>}
 */
export async function clearCurrentJob() {
    await JobModel.clearCurrent();
}

/**
 * Get job history
 * @returns {Promise<Array>}
 */
export async function getJobHistory() {
    return await JobModel.getHistory();
}

/**
 * Save manual job input
 * @param {string} title - Job title
 * @param {string} company - Company name
 * @param {string} description - Job description
 * @returns {Promise<Object>}
 */
export async function saveManualJob(title, company, description) {
    return await JobModel.saveCurrent({
        title,
        company,
        description,
        source: 'manual',
        url: ''
    });
}

/**
 * Parse and clean job description text
 * @param {string} rawText - Raw job description
 * @returns {Object} Cleaned and parsed job data
 */
export function parseJobDescription(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    let title = '';
    let company = '';
    let description = rawText;

    // Try to extract title (often first line)
    if (lines.length > 0 && lines[0].length < 100) {
        title = lines[0];
    }

    // Try to extract company
    const companyPatterns = [
        /company:\s*(.+)/i,
        /at\s+([A-Z][A-Za-z\s]+)/,
        /^([A-Z][A-Za-z\s]+)\s+is\s+(hiring|looking)/
    ];

    for (const pattern of companyPatterns) {
        const match = rawText.match(pattern);
        if (match) {
            company = match[1].trim();
            break;
        }
    }

    // Clean description - remove excessive whitespace
    description = rawText
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s{2,}/g, ' ')
        .trim();

    return { title, company, description };
}

export default {
    saveJobDescription,
    getCurrentJob,
    hasCurrentJob,
    clearCurrentJob,
    getJobHistory,
    saveManualJob,
    parseJobDescription
};
