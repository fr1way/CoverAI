/**
 * Cover Letter Controller
 * Orchestrates cover letter generation and export
 */

import ResumeModel from '../models/ResumeModel.js';
import JobModel from '../models/JobModel.js';
import SettingsModel from '../models/SettingsModel.js';
import { generateCoverLetter } from '../services/AIService.js';
import { generateCoverLetterDOCX, downloadDOCX } from '../services/DOCXGeneratorService.js';

/**
 * Generate cover letter from current resume and job
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated cover letter data
 */
export async function generate(options = {}) {
    // Get resume
    const resume = await ResumeModel.get();
    if (!resume) {
        throw new Error('No resume uploaded. Please upload your resume first.');
    }

    // Get job description
    const job = await JobModel.getCurrent();
    if (!job || !job.description) {
        throw new Error('No job description found. Please capture or enter a job description.');
    }

    // Check API key
    const hasKey = await SettingsModel.hasApiKey();
    if (!hasKey) {
        throw new Error('Gemini API key not configured. Please add your API key in settings.');
    }

    // Generate cover letter text
    const coverLetterText = await generateCoverLetter(resume, job, options);

    return {
        text: coverLetterText,
        resume: {
            name: resume.name,
            email: resume.email,
            phone: resume.phone
        },
        job: {
            title: job.title,
            company: job.company
        },
        generatedAt: new Date().toISOString()
    };
}

/**
 * Generate and download cover letter as DOCX
 * @param {Object} options - Generation options
 * @returns {Promise<Blob>} DOCX blob
 */
export async function generateAndDownload(options = {}) {
    // Generate cover letter text
    const result = await generate(options);

    // Get settings
    const settings = await SettingsModel.get();

    // Create filename
    const sanitizedCompany = (result.job.company || 'Company')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 30);
    const filename = `Cover_Letter_${sanitizedCompany}.docx`;

    // Generate DOCX
    const blob = await generateCoverLetterDOCX({
        applicantName: settings.fullName || result.resume.name,
        applicantEmail: result.resume.email,
        applicantPhone: result.resume.phone,
        companyName: result.job.company,
        jobTitle: result.job.title,
        coverLetterBody: result.text,
        includeDate: settings.includeDate
    });

    // Download
    downloadDOCX(blob, filename);

    return {
        ...result,
        filename,
        blob
    };
}

/**
 * Preview cover letter without downloading
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Preview data
 */
export async function preview(options = {}) {
    return await generate(options);
}

/**
 * Check if ready to generate
 * @returns {Promise<Object>} Readiness status
 */
export async function checkReadiness() {
    const hasResume = await ResumeModel.exists();
    const hasJob = await JobModel.hasCurrent();
    const hasApiKey = await SettingsModel.hasApiKey();

    return {
        ready: hasResume && hasJob && hasApiKey,
        hasResume,
        hasJob,
        hasApiKey,
        missing: [
            !hasResume && 'Resume',
            !hasJob && 'Job Description',
            !hasApiKey && 'API Key'
        ].filter(Boolean)
    };
}

/**
 * Generate and download with custom/edited text
 * @param {string} editedText - The edited cover letter text to download
 * @returns {Promise<Object>}
 */
export async function generateAndDownloadWithText(editedText) {
    // Get resume and job for metadata
    const resume = await ResumeModel.get();
    const job = await JobModel.getCurrent();
    const settings = await SettingsModel.get();

    // Create filename
    const sanitizedCompany = (job?.company || 'Company')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 30);
    const filename = `Cover_Letter_${sanitizedCompany}.docx`;

    // Generate DOCX with edited text
    const blob = await generateCoverLetterDOCX({
        applicantName: settings.fullName || resume?.name || '',
        applicantEmail: resume?.email || '',
        applicantPhone: resume?.phone || '',
        companyName: job?.company || '',
        jobTitle: job?.title || '',
        coverLetterBody: editedText,
        includeDate: settings.includeDate
    });

    // Download
    downloadDOCX(blob, filename);

    return { filename, blob };
}

export default {
    generate,
    generateAndDownload,
    generateAndDownloadWithText,
    preview,
    checkReadiness
};
