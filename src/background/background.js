/**
 * Background Service Worker
 * Central message hub for the extension
 */

import { MessageTypes, createMessageListener } from '../utils/messageHandler.js';
import ResumeModel from '../models/ResumeModel.js';
import JobModel from '../models/JobModel.js';
import SettingsModel from '../models/SettingsModel.js';
import CoverLetterController from '../controllers/CoverLetterController.js';

// Initialize message handlers
const handlers = {
    // Resume handlers
    [MessageTypes.GET_RESUME]: async () => {
        return await ResumeModel.get();
    },

    [MessageTypes.RESUME_UPLOADED]: async (payload) => {
        await ResumeModel.save(payload);
        updateBadge();
        return { success: true };
    },

    [MessageTypes.CLEAR_RESUME]: async () => {
        await ResumeModel.clear();
        updateBadge();
        return { success: true };
    },

    // Job handlers
    [MessageTypes.GET_CURRENT_JOB]: async () => {
        return await JobModel.getCurrent();
    },

    [MessageTypes.JOB_EXTRACTED]: async (payload) => {
        await JobModel.saveCurrent(payload);
        updateBadge();
        showNotification('Job Detected', `Found: ${payload.title || 'Job posting'}`);
        return { success: true };
    },

    [MessageTypes.CLEAR_JOB]: async () => {
        await JobModel.clearCurrent();
        updateBadge();
        return { success: true };
    },

    // Settings handlers
    [MessageTypes.GET_SETTINGS]: async () => {
        return await SettingsModel.get();
    },

    [MessageTypes.SAVE_SETTINGS]: async (payload) => {
        await SettingsModel.save(payload);
        return { success: true };
    },

    // Cover letter handlers
    [MessageTypes.GENERATE_COVER_LETTER]: async (payload) => {
        try {
            const result = await CoverLetterController.generateAndDownload(payload);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Check page for job content
    [MessageTypes.CHECK_PAGE]: async (payload, sender) => {
        // This is called by content script when page loads
        return { shouldExtract: true };
    }
};

// Create message listener
createMessageListener(handlers);

/**
 * Update extension badge based on readiness
 */
async function updateBadge() {
    const readiness = await CoverLetterController.checkReadiness();

    if (readiness.ready) {
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
    } else {
        const missing = readiness.missing.length;
        chrome.action.setBadgeText({ text: missing.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
    }
}

/**
 * Show browser notification
 * @param {string} title
 * @param {string} message
 */
function showNotification(title, message) {
    // Note: Notifications require additional permission
    // For now, we just log
    console.log(`[CoverAI] ${title}: ${message}`);
}

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        console.log('CoverAI extension installed');

        // Initialize default settings
        await SettingsModel.reset();

        // Open onboarding page
        chrome.tabs.create({
            url: chrome.runtime.getURL('src/views/popup.html')
        });
    }

    updateBadge();
});

// Update badge on startup
chrome.runtime.onStartup.addListener(() => {
    updateBadge();
});

// Listen for tab updates to detect job sites
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const jobSites = [
            'linkedin.com/jobs',
            'indeed.com',
            'greenhouse.io',
            'lever.co',
            'myworkdayjobs.com',
            'glassdoor.com/job'
        ];

        const isJobSite = jobSites.some(site => tab.url.includes(site));

        if (isJobSite) {
            // Content script should auto-inject and extract
            console.log('[CoverAI] Job site detected:', tab.url);
        }
    }
});

console.log('[CoverAI] Background service worker initialized');
