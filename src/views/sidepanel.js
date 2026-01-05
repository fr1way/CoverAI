/**
 * Side Panel Script
 * Handles manual job description entry
 */

import JobController from '../controllers/JobController.js';

// DOM Elements
const elements = {
    title: document.getElementById('sidePanelTitle'),
    company: document.getElementById('sidePanelCompany'),
    description: document.getElementById('sidePanelDescription'),
    saveBtn: document.getElementById('sidePanelSaveBtn')
};

/**
 * Save job description
 */
async function saveJobDescription() {
    const title = elements.title.value.trim();
    const company = elements.company.value.trim();
    const description = elements.description.value.trim();

    if (!description) {
        alert('Please enter a job description');
        return;
    }

    try {
        elements.saveBtn.disabled = true;
        elements.saveBtn.querySelector('span')?.textContent || (elements.saveBtn.textContent = 'Saving...');

        await JobController.saveManualJob(
            title || 'Job Position',
            company || 'Company',
            description
        );

        // Notify popup
        chrome.runtime.sendMessage({
            type: 'JOB_EXTRACTED',
            payload: { title, company, description, source: 'sidepanel' }
        });

        // Show success
        elements.saveBtn.textContent = '✓ Saved!';
        elements.saveBtn.style.background = 'var(--success)';

        setTimeout(() => {
            elements.saveBtn.textContent = 'Save Job Description';
            elements.saveBtn.style.background = '';
            elements.saveBtn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Save error:', error);
        alert('Failed to save: ' + error.message);
        elements.saveBtn.disabled = false;
    }
}

/**
 * Load current job if exists
 */
async function loadCurrentJob() {
    const job = await JobController.getCurrentJob();

    if (job) {
        elements.title.value = job.title || '';
        elements.company.value = job.company || '';
        elements.description.value = job.description || '';
    }
}

/**
 * Initialize
 */
async function init() {
    await loadCurrentJob();
    elements.saveBtn.addEventListener('click', saveJobDescription);
}

document.addEventListener('DOMContentLoaded', init);
