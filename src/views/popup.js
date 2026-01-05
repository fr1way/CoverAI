/**
 * Popup Main Script
 * Handles UI interactions and coordinates with controllers
 */

import ResumeController from '../controllers/ResumeController.js';
import JobController from '../controllers/JobController.js';
import CoverLetterController from '../controllers/CoverLetterController.js';
import SettingsModel from '../models/SettingsModel.js';

// DOM Elements
const elements = {
    // Resume
    resumeInput: document.getElementById('resumeInput'),
    resumeEmpty: document.getElementById('resumeEmpty'),
    resumeInfo: document.getElementById('resumeInfo'),
    resumeName: document.getElementById('resumeName'),
    resumeEmail: document.getElementById('resumeEmail'),
    resumeStatus: document.getElementById('resumeStatus'),
    clearResumeBtn: document.getElementById('clearResumeBtn'),

    // Job
    jobEmpty: document.getElementById('jobEmpty'),
    jobInfo: document.getElementById('jobInfo'),
    jobTitle: document.getElementById('jobTitle'),
    jobCompany: document.getElementById('jobCompany'),
    jobPreview: document.getElementById('jobPreview'),
    jobStatus: document.getElementById('jobStatus'),
    manualJobBtn: document.getElementById('manualJobBtn'),
    editJobBtn: document.getElementById('editJobBtn'),
    clearJobBtn: document.getElementById('clearJobBtn'),

    // Manual Job Modal
    manualJobModal: document.getElementById('manualJobModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    inputJobTitle: document.getElementById('inputJobTitle'),
    inputCompany: document.getElementById('inputCompany'),
    inputDescription: document.getElementById('inputDescription'),
    cancelJobBtn: document.getElementById('cancelJobBtn'),
    saveJobBtn: document.getElementById('saveJobBtn'),

    // Generate
    generateBtn: document.getElementById('generateBtn'),
    progressSection: document.getElementById('progressSection'),
    progressText: document.getElementById('progressText'),

    // Preview
    previewSection: document.getElementById('previewSection'),
    previewContent: document.getElementById('previewContent'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),

    // Settings
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    toggleApiKey: document.getElementById('toggleApiKey'),
    modelSelect: document.getElementById('modelSelect'),
    toneSelect: document.getElementById('toneSelect'),
    includeDateCheck: document.getElementById('includeDateCheck'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn')
};

// State
let currentCoverLetter = null;

/**
 * Initialize the popup
 */
async function init() {
    await loadResume();
    await loadJob();
    await loadSettings();
    await checkReadiness();
    setupEventListeners();
}

/**
 * Load and display resume info
 */
async function loadResume() {
    const summary = await ResumeController.getResumeSummary();

    if (summary) {
        elements.resumeEmpty.classList.add('hidden');
        elements.resumeInfo.classList.remove('hidden');
        elements.resumeName.textContent = summary.name || 'Resume uploaded';
        elements.resumeEmail.textContent = summary.email || '';
        elements.resumeStatus.textContent = 'Ready';
        elements.resumeStatus.className = 'status-badge status-ready';
    } else {
        elements.resumeEmpty.classList.remove('hidden');
        elements.resumeInfo.classList.add('hidden');
        elements.resumeStatus.textContent = 'Not uploaded';
        elements.resumeStatus.className = 'status-badge status-pending';
    }
}

/**
 * Load and display current job
 */
async function loadJob() {
    const job = await JobController.getCurrentJob();

    if (job && job.description) {
        elements.jobEmpty.classList.add('hidden');
        elements.jobInfo.classList.remove('hidden');
        elements.jobTitle.textContent = job.title || 'Job Position';
        elements.jobCompany.textContent = job.company || 'Company';
        elements.jobPreview.textContent = job.description.slice(0, 200) + '...';
        elements.jobStatus.textContent = job.source === 'manual' ? 'Manual' : 'Detected';
        elements.jobStatus.className = 'status-badge status-ready';
    } else {
        elements.jobEmpty.classList.remove('hidden');
        elements.jobInfo.classList.add('hidden');
        elements.jobStatus.textContent = 'Not detected';
        elements.jobStatus.className = 'status-badge status-pending';
    }
}

/**
 * Load settings
 */
async function loadSettings() {
    const settings = await SettingsModel.get();

    elements.apiKeyInput.value = settings.apiKey || '';
    elements.modelSelect.value = settings.geminiModel || 'gemini-1.5-flash';
    elements.toneSelect.value = settings.coverLetterTone || 'professional';
    elements.includeDateCheck.checked = settings.includeDate !== false;
}

/**
 * Check if ready to generate
 */
async function checkReadiness() {
    const readiness = await CoverLetterController.checkReadiness();
    elements.generateBtn.disabled = !readiness.ready;

    if (!readiness.ready && readiness.missing.length > 0) {
        elements.generateBtn.querySelector('span').textContent =
            `Missing: ${readiness.missing.join(', ')}`;
    } else {
        elements.generateBtn.querySelector('span').textContent = 'Generate Cover Letter';
    }
}

/**
 * Handle resume file upload - PARSES IMMEDIATELY
 */
async function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show processing state immediately
    elements.resumeEmpty.classList.add('hidden');
    elements.resumeInfo.classList.remove('hidden');
    elements.resumeName.textContent = `Parsing ${file.name}...`;
    elements.resumeEmail.textContent = '';
    elements.resumeStatus.textContent = 'Processing';
    elements.resumeStatus.className = 'status-badge status-pending';

    try {
        console.log('[CoverAI] Starting resume parse for:', file.name);
        const startTime = Date.now();

        // Parse the resume immediately
        const resumeData = await ResumeController.uploadResume(file);

        const parseTime = Date.now() - startTime;
        console.log(`[CoverAI] Resume parsed in ${parseTime}ms:`, {
            name: resumeData.name,
            email: resumeData.email,
            skillsCount: resumeData.skills?.length || 0,
            textLength: resumeData.rawText?.length || 0
        });

        // Update UI with parsed data
        elements.resumeName.textContent = resumeData.name || file.name;
        elements.resumeEmail.textContent = resumeData.email ||
            `${resumeData.skills?.length || 0} skills • ${Math.round((resumeData.rawText?.length || 0) / 100) / 10}k chars`;
        elements.resumeStatus.textContent = 'Ready';
        elements.resumeStatus.className = 'status-badge status-ready';

        await checkReadiness();

    } catch (error) {
        console.error('[CoverAI] Resume upload error:', error);
        elements.resumeEmpty.classList.remove('hidden');
        elements.resumeInfo.classList.add('hidden');
        elements.resumeStatus.textContent = 'Error';
        elements.resumeStatus.className = 'status-badge status-error';
        alert('Failed to parse resume: ' + error.message);
    }

    // Reset file input so same file can be re-uploaded if needed
    event.target.value = '';
}

/**
 * Clear resume
 */
async function clearResume() {
    if (confirm('Remove your uploaded resume?')) {
        await ResumeController.clearResume();
        await loadResume();
        await checkReadiness();
    }
}

/**
 * Open manual job modal
 */
function openManualJobModal() {
    elements.manualJobModal.classList.remove('hidden');
}

/**
 * Close manual job modal
 */
function closeManualJobModal() {
    elements.manualJobModal.classList.add('hidden');
    elements.inputJobTitle.value = '';
    elements.inputCompany.value = '';
    elements.inputDescription.value = '';
}

/**
 * Save manual job input
 */
async function saveManualJob() {
    const title = elements.inputJobTitle.value.trim();
    const company = elements.inputCompany.value.trim();
    const description = elements.inputDescription.value.trim();

    if (!description) {
        alert('Please enter a job description');
        return;
    }

    await JobController.saveManualJob(title || 'Job Position', company || 'Company', description);
    closeManualJobModal();
    await loadJob();
    await checkReadiness();
}

/**
 * Edit current job
 */
async function editJob() {
    const job = await JobController.getCurrentJob();
    if (job) {
        elements.inputJobTitle.value = job.title || '';
        elements.inputCompany.value = job.company || '';
        elements.inputDescription.value = job.description || '';
    }
    openManualJobModal();
}

/**
 * Clear current job
 */
async function clearJob() {
    if (confirm('Clear current job description?')) {
        await JobController.clearCurrentJob();
        await loadJob();
        await checkReadiness();
    }
}

/**
 * Generate cover letter
 */
async function generateCoverLetter() {
    try {
        elements.generateBtn.disabled = true;
        elements.progressSection.classList.remove('hidden');
        elements.previewSection.classList.add('hidden');
        elements.progressText.textContent = 'Generating your cover letter...';

        const result = await CoverLetterController.preview();

        currentCoverLetter = result;
        elements.previewContent.textContent = result.text;
        elements.progressSection.classList.add('hidden');
        elements.previewSection.classList.remove('hidden');

    } catch (error) {
        console.error('Generation error:', error);
        elements.progressText.textContent = 'Error: ' + error.message;
        setTimeout(() => {
            elements.progressSection.classList.add('hidden');
        }, 3000);
    } finally {
        elements.generateBtn.disabled = false;
    }
}

/**
 * Copy cover letter to clipboard
 */
async function copyCoverLetter() {
    if (currentCoverLetter?.text) {
        await navigator.clipboard.writeText(currentCoverLetter.text);
        elements.copyBtn.querySelector('svg').style.color = 'var(--success)';
        setTimeout(() => {
            elements.copyBtn.querySelector('svg').style.color = '';
        }, 1000);
    }
}

/**
 * Download cover letter as DOCX
 */
async function downloadCoverLetter() {
    try {
        elements.downloadBtn.disabled = true;
        await CoverLetterController.generateAndDownload();
    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download: ' + error.message);
    } finally {
        elements.downloadBtn.disabled = false;
    }
}

/**
 * Show settings panel
 */
function showSettings() {
    elements.settingsPanel.classList.remove('hidden');
}

/**
 * Hide settings panel
 */
function hideSettings() {
    elements.settingsPanel.classList.add('hidden');
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
    const input = elements.apiKeyInput;
    input.type = input.type === 'password' ? 'text' : 'password';
}

/**
 * Save settings
 */
async function saveSettings() {
    await SettingsModel.save({
        apiKey: elements.apiKeyInput.value.trim(),
        geminiModel: elements.modelSelect.value,
        coverLetterTone: elements.toneSelect.value,
        includeDate: elements.includeDateCheck.checked
    });

    hideSettings();
    await checkReadiness();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Resume
    elements.resumeInput.addEventListener('change', handleResumeUpload);
    elements.clearResumeBtn.addEventListener('click', clearResume);

    // Job
    elements.manualJobBtn.addEventListener('click', openManualJobModal);
    elements.closeModalBtn.addEventListener('click', closeManualJobModal);
    elements.cancelJobBtn.addEventListener('click', closeManualJobModal);
    elements.saveJobBtn.addEventListener('click', saveManualJob);
    elements.editJobBtn.addEventListener('click', editJob);
    elements.clearJobBtn.addEventListener('click', clearJob);

    // Generate
    elements.generateBtn.addEventListener('click', generateCoverLetter);
    elements.copyBtn.addEventListener('click', copyCoverLetter);
    elements.downloadBtn.addEventListener('click', downloadCoverLetter);

    // Settings
    elements.settingsBtn.addEventListener('click', showSettings);
    elements.closeSettingsBtn.addEventListener('click', hideSettings);
    elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);

    // Listen for job updates from content script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'JOB_EXTRACTED') {
            loadJob();
            checkReadiness();
        }
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
