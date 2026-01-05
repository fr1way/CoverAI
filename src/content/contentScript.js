/**
 * Content Script
 * Runs on job posting pages to extract job descriptions
 */

// Job site selectors for extracting data
const SITE_SELECTORS = {
    'linkedin.com': {
        title: '.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title',
        company: '.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name',
        description: '.jobs-description__content, .jobs-box__html-content',
        location: '.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet'
    },
    'indeed.com': {
        title: '.jobsearch-JobInfoHeader-title, [data-testid="jobsearch-JobInfoHeader-title"]',
        company: '.jobsearch-InlineCompanyRating-companyHeader, [data-testid="inlineHeader-companyName"]',
        description: '#jobDescriptionText, .jobsearch-jobDescriptionText',
        location: '.jobsearch-JobInfoHeader-subtitle > div'
    },
    'greenhouse.io': {
        title: '.app-title, h1.heading',
        company: '.company-name',
        description: '#content, .content',
        location: '.location'
    },
    'lever.co': {
        title: '.posting-headline h2',
        company: '.posting-headline .company-name',
        description: '.posting-page .content',
        location: '.posting-categories .location'
    },
    'myworkdayjobs.com': {
        title: 'h2[data-automation-id="jobPostingHeader"]',
        company: '[data-automation-id="company"]',
        description: '[data-automation-id="jobPostingDescription"]',
        location: '[data-automation-id="locations"]'
    },
    'glassdoor.com': {
        title: '[data-test="job-title"]',
        company: '[data-test="employer-name"]',
        description: '.jobDescriptionContent, [data-test="description"]',
        location: '[data-test="location"]'
    }
};

/**
 * Get selectors for current site
 * @returns {Object|null}
 */
function getSiteSelectors() {
    const hostname = window.location.hostname;

    for (const [site, selectors] of Object.entries(SITE_SELECTORS)) {
        if (hostname.includes(site.replace('.com', '').replace('.io', '').replace('.co', ''))) {
            return selectors;
        }
    }

    return null;
}

/**
 * Extract text from element
 * @param {string} selector
 * @returns {string}
 */
function extractText(selector) {
    const element = document.querySelector(selector);
    if (!element) return '';
    return element.innerText?.trim() || element.textContent?.trim() || '';
}

/**
 * Extract job data from current page
 * @returns {Object}
 */
function extractJobData() {
    const selectors = getSiteSelectors();

    if (!selectors) {
        // Fallback: try to extract from common patterns
        return extractGenericJobData();
    }

    const title = extractText(selectors.title);
    const company = extractText(selectors.company);
    const description = extractText(selectors.description);
    const location = extractText(selectors.location);

    return {
        title,
        company,
        description,
        location,
        url: window.location.href,
        source: 'auto'
    };
}

/**
 * Generic job extraction for unknown sites
 * @returns {Object}
 */
function extractGenericJobData() {
    // Try common selectors
    const titleSelectors = ['h1', '[class*="title"]', '[class*="job-title"]'];
    const descSelectors = ['[class*="description"]', '[class*="job-desc"]', 'article', '.content'];

    let title = '';
    let description = '';

    for (const sel of titleSelectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText?.length < 200) {
            title = el.innerText.trim();
            break;
        }
    }

    for (const sel of descSelectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText?.length > 100) {
            description = el.innerText.trim();
            break;
        }
    }

    return {
        title,
        company: '',
        description,
        location: '',
        url: window.location.href,
        source: 'auto-generic'
    };
}

/**
 * Check if job data is valid
 * @param {Object} data
 * @returns {boolean}
 */
function isValidJobData(data) {
    return data.description && data.description.length > 50;
}

/**
 * Detect file upload inputs that might be for cover letters
 * @returns {HTMLElement|null}
 */
function detectCoverLetterUpload() {
    const inputs = document.querySelectorAll('input[type="file"]');

    for (const input of inputs) {
        const label = input.closest('label')?.innerText || '';
        const nearby = input.parentElement?.innerText || '';
        const ariaLabel = input.getAttribute('aria-label') || '';

        const text = `${label} ${nearby} ${ariaLabel}`.toLowerCase();

        if (text.includes('cover') || text.includes('letter') ||
            text.includes('motivation') || text.includes('additional')) {
            return input;
        }
    }

    return null;
}

/**
 * Send job data to background script
 * @param {Object} data
 */
async function sendJobData(data) {
    try {
        await chrome.runtime.sendMessage({
            type: 'JOB_EXTRACTED',
            payload: data
        });
        console.log('[CoverAI] Job data sent to extension');
    } catch (error) {
        console.error('[CoverAI] Failed to send job data:', error);
    }
}

/**
 * Initialize content script
 */
async function init() {
    console.log('[CoverAI] Content script initialized on:', window.location.href);

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Extract job data
    const jobData = extractJobData();

    if (isValidJobData(jobData)) {
        console.log('[CoverAI] Job data extracted:', jobData.title || 'Untitled');
        await sendJobData(jobData);
    } else {
        console.log('[CoverAI] No valid job data found on this page');
    }

    // Check for cover letter upload field
    const coverLetterInput = detectCoverLetterUpload();
    if (coverLetterInput) {
        console.log('[CoverAI] Cover letter upload field detected');
        // Could add visual indicator or prompt here
    }
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_JOB') {
        const jobData = extractJobData();
        sendResponse(jobData);
    }
    return false;
});

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
