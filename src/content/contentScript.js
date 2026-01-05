/**
 * Content Script
 * Runs on job posting pages to extract job descriptions
 * Supports: LinkedIn, Jobright, Indeed, Greenhouse, Lever, Workday, Glassdoor
 */

// Job site selectors for extracting data - multiple selectors for fallback
const SITE_SELECTORS = {
    'linkedin.com': {
        title: [
            '.job-details-jobs-unified-top-card__job-title h1',
            '.job-details-jobs-unified-top-card__job-title',
            '.jobs-unified-top-card__job-title',
            '.t-24.job-details-jobs-unified-top-card__job-title',
            'h1.topcard__title',
            '.jobs-details__main-content h1',
            'h1[class*="job-title"]',
            '.job-view-layout h1'
        ],
        company: [
            '.job-details-jobs-unified-top-card__company-name a',
            '.job-details-jobs-unified-top-card__company-name',
            '.jobs-unified-top-card__company-name a',
            '.jobs-unified-top-card__company-name',
            '.topcard__org-name-link',
            '.jobs-details__main-content a[data-tracking-control-name*="company"]',
            'a[class*="company-name"]',
            '.job-view-layout a[href*="/company/"]'
        ],
        description: [
            '.jobs-description__content',
            '.jobs-box__html-content',
            '.jobs-description',
            '#job-details',
            '.job-view-layout .description',
            '[class*="description__text"]',
            '.jobs-description-content__text'
        ],
        location: [
            '.job-details-jobs-unified-top-card__bullet',
            '.jobs-unified-top-card__bullet',
            '.topcard__flavor--bullet',
            '.job-details-jobs-unified-top-card__primary-description-container span'
        ]
    },
    'jobright.ai': {
        title: [
            'h1[class*="title"]',
            '.job-title',
            '[class*="JobTitle"]',
            'h1',
            '[data-testid="job-title"]',
            '.job-header h1',
            '.job-details h1'
        ],
        company: [
            '[class*="company-name"]',
            '[class*="CompanyName"]',
            '.company-name',
            'a[href*="/company/"]',
            '[data-testid="company-name"]',
            '.job-header [class*="company"]',
            '.employer-name'
        ],
        description: [
            '[class*="description"]',
            '[class*="Description"]',
            '.job-description',
            '#job-description',
            '[data-testid="job-description"]',
            '.job-details [class*="content"]',
            'article',
            '.job-content'
        ],
        location: [
            '[class*="location"]',
            '[class*="Location"]',
            '.job-location',
            '[data-testid="location"]'
        ]
    },
    'indeed.com': {
        title: [
            '.jobsearch-JobInfoHeader-title',
            '[data-testid="jobsearch-JobInfoHeader-title"]',
            'h1.jobsearch-JobInfoHeader-title',
            '.icl-u-xs-mb--xs h1'
        ],
        company: [
            '.jobsearch-InlineCompanyRating-companyHeader a',
            '.jobsearch-InlineCompanyRating-companyHeader',
            '[data-testid="inlineHeader-companyName"]',
            '.jobsearch-CompanyInfoWithoutHeaderImage a'
        ],
        description: [
            '#jobDescriptionText',
            '.jobsearch-jobDescriptionText',
            '[id="jobDescriptionText"]'
        ],
        location: [
            '.jobsearch-JobInfoHeader-subtitle > div',
            '[data-testid="job-location"]',
            '.jobsearch-CompanyInfoWithoutHeaderImage div'
        ]
    },
    'greenhouse.io': {
        title: ['.app-title', 'h1.heading', 'h1'],
        company: ['.company-name', '[class*="company"]'],
        description: ['#content', '.content', '[class*="description"]'],
        location: ['.location', '[class*="location"]']
    },
    'lever.co': {
        title: ['.posting-headline h2', 'h2'],
        company: ['.posting-headline .company-name', '[class*="company"]'],
        description: ['.posting-page .content', '.content', '[class*="description"]'],
        location: ['.posting-categories .location', '.location']
    },
    'myworkdayjobs.com': {
        title: ['h2[data-automation-id="jobPostingHeader"]', 'h2'],
        company: ['[data-automation-id="company"]', '[class*="company"]'],
        description: ['[data-automation-id="jobPostingDescription"]', '[class*="description"]'],
        location: ['[data-automation-id="locations"]', '[class*="location"]']
    },
    'glassdoor.com': {
        title: ['[data-test="job-title"]', 'h1', '[class*="JobTitle"]'],
        company: ['[data-test="employer-name"]', '[class*="employer"]', '[class*="company"]'],
        description: ['.jobDescriptionContent', '[data-test="description"]', '[class*="description"]'],
        location: ['[data-test="location"]', '[class*="location"]']
    }
};

/**
 * Get selectors for current site
 * @returns {Object|null}
 */
function getSiteSelectors() {
    const hostname = window.location.hostname;

    for (const [site, selectors] of Object.entries(SITE_SELECTORS)) {
        // More flexible matching
        const siteName = site.replace('.com', '').replace('.io', '').replace('.co', '').replace('.ai', '');
        if (hostname.includes(siteName)) {
            return selectors;
        }
    }

    return null;
}

/**
 * Extract text from element using multiple selectors
 * @param {string|string[]} selectors - Single selector or array of selectors
 * @returns {string}
 */
function extractText(selectors) {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    for (const selector of selectorList) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.innerText?.trim() || element.textContent?.trim() || '';
                if (text.length > 0) {
                    return text;
                }
            }
        } catch (e) {
            // Invalid selector, skip
        }
    }

    return '';
}

/**
 * Extract job data from current page
 * @returns {Object}
 */
function extractJobData() {
    const selectors = getSiteSelectors();

    if (!selectors) {
        return extractGenericJobData();
    }

    let title = extractText(selectors.title);
    let company = extractText(selectors.company);
    let description = extractText(selectors.description);
    let location = extractText(selectors.location);

    // Clean up extracted data
    title = cleanText(title);
    company = cleanText(company);

    // If company wasn't found, try to extract from URL or page
    if (!company) {
        company = extractCompanyFromPage();
    }

    if (!company) {
        company = extractCompanyFromPage();
    }

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
 * Clean extracted text
 * @param {string} text
 * @returns {string}
 */
function cleanText(text) {
    if (!text) return '';

    return text
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[\s·•\-|]+/, '')
        .replace(/[\s·•\-|]+$/, '')
        .trim();
}

/**
 * Try to extract company name from various page elements
 * @returns {string}
 */
function extractCompanyFromPage() {
    // Try meta tags
    const metaCompany = document.querySelector('meta[property="og:site_name"]')?.content ||
        document.querySelector('meta[name="author"]')?.content ||
        document.querySelector('meta[property="article:author"]')?.content;
    if (metaCompany) return cleanText(metaCompany);

    // Try common patterns
    const companyPatterns = [
        'a[href*="/company/"]',
        '[class*="employer"]',
        '[class*="organization"]',
        '[data-company]',
        '[aria-label*="company"]'
    ];

    for (const pattern of companyPatterns) {
        try {
            const el = document.querySelector(pattern);
            if (el) {
                const text = el.innerText?.trim() || el.getAttribute('data-company') || '';
                if (text.length > 0 && text.length < 100) {
                    return cleanText(text);
                }
            }
        } catch (e) { }
    }

    return '';
}

/**
 * Generic job extraction for unknown sites
 * @returns {Object}
 */
function extractGenericJobData() {
    const titleSelectors = [
        'h1',
        '[class*="job-title"]',
        '[class*="jobtitle"]',
        '[class*="JobTitle"]',
        '[data-testid*="title"]',
        'h2[class*="title"]'
    ];

    const companySelectors = [
        '[class*="company"]',
        '[class*="employer"]',
        '[class*="organization"]',
        'a[href*="/company/"]',
        '[data-testid*="company"]'
    ];

    const descSelectors = [
        '[class*="description"]',
        '[class*="job-desc"]',
        '#job-description',
        'article',
        '.content',
        '[class*="details"]'
    ];

    let title = '';
    let company = '';
    let description = '';

    for (const sel of titleSelectors) {
        try {
            const el = document.querySelector(sel);
            if (el && el.innerText?.length < 200 && el.innerText?.length > 2) {
                title = cleanText(el.innerText);
                break;
            }
        } catch (e) { }
    }

    for (const sel of companySelectors) {
        try {
            const el = document.querySelector(sel);
            if (el && el.innerText?.length < 100 && el.innerText?.length > 1) {
                company = cleanText(el.innerText);
                break;
            }
        } catch (e) { }
    }

    for (const sel of descSelectors) {
        try {
            const el = document.querySelector(sel);
            if (el && el.innerText?.length > 100) {
                description = el.innerText.trim();
                break;
            }
        } catch (e) { }
    }

    // Fallback: get the largest text block on the page
    if (!description) {
        const allParagraphs = document.querySelectorAll('p, div');
        let longestText = '';
        allParagraphs.forEach(el => {
            const text = el.innerText || '';
            if (text.length > longestText.length && text.length < 10000) {
                longestText = text;
            }
        });
        if (longestText.length > 200) {
            description = longestText;
        }
    }

    return {
        title,
        company,
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
 * Send job data to background script
 * @param {Object} data
 */
async function sendJobData(data) {
    try {
        await chrome.runtime.sendMessage({
            type: 'JOB_EXTRACTED',
            payload: data
        });
    } catch (error) {
        console.error('[CoverAI] Failed to send job data:', error);
    }
}

/**
 * Initialize content script
 */
async function init() {
    // Wait for page to load more fully
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract job data
    let jobData = extractJobData();

    // If not valid, wait a bit more and try again (for dynamic pages)
    if (!isValidJobData(jobData)) {
        console.log('[CoverAI] First attempt failed, waiting and retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        jobData = extractJobData();
    }

    if (isValidJobData(jobData)) {
        await sendJobData(jobData);
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

// Also re-run when URL changes (for SPAs like LinkedIn)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(init, 1500);
    }
}).observe(document, { subtree: true, childList: true });
