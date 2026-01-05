/**
 * Message Handler Utility
 * Cross-component messaging for Chrome extension
 */

// Message types
export const MessageTypes = {
    // Job related
    JOB_DETECTED: 'JOB_DETECTED',
    JOB_EXTRACTED: 'JOB_EXTRACTED',
    GET_CURRENT_JOB: 'GET_CURRENT_JOB',
    CLEAR_JOB: 'CLEAR_JOB',

    // Resume related
    RESUME_UPLOADED: 'RESUME_UPLOADED',
    GET_RESUME: 'GET_RESUME',
    CLEAR_RESUME: 'CLEAR_RESUME',

    // Cover letter
    GENERATE_COVER_LETTER: 'GENERATE_COVER_LETTER',
    COVER_LETTER_READY: 'COVER_LETTER_READY',
    COVER_LETTER_ERROR: 'COVER_LETTER_ERROR',

    // Settings
    GET_SETTINGS: 'GET_SETTINGS',
    SAVE_SETTINGS: 'SAVE_SETTINGS',

    // UI
    SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
    UPDATE_BADGE: 'UPDATE_BADGE',

    // Content script
    EXTRACT_JOB: 'EXTRACT_JOB',
    CHECK_PAGE: 'CHECK_PAGE'
};

/**
 * Send message to background script
 * @param {string} type - Message type
 * @param {Object} payload - Message data
 * @returns {Promise<any>}
 */
export async function sendToBackground(type, payload = {}) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type, payload }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Send message to content script in active tab
 * @param {string} type - Message type
 * @param {Object} payload - Message data
 * @returns {Promise<any>}
 */
export async function sendToContentScript(type, payload = {}) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
        throw new Error('No active tab found');
    }

    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { type, payload }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Send message to specific tab
 * @param {number} tabId
 * @param {string} type
 * @param {Object} payload
 * @returns {Promise<any>}
 */
export async function sendToTab(tabId, type, payload = {}) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { type, payload }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Create a message listener
 * @param {Object} handlers - Object mapping message types to handler functions
 * @returns {Function} Cleanup function to remove listener
 */
export function createMessageListener(handlers) {
    const listener = (message, sender, sendResponse) => {
        const { type, payload } = message;

        if (handlers[type]) {
            const result = handlers[type](payload, sender);

            // Handle async handlers
            if (result instanceof Promise) {
                result.then(sendResponse).catch((error) => {
                    sendResponse({ error: error.message });
                });
                return true; // Keep message channel open for async response
            } else {
                sendResponse(result);
            }
        }

        return false;
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => chrome.runtime.onMessage.removeListener(listener);
}

export default {
    MessageTypes,
    sendToBackground,
    sendToContentScript,
    sendToTab,
    createMessageListener
};
