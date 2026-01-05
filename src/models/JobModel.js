/**
 * JobModel - Manages job description data
 * Stores current job information for cover letter generation
 */

const JOB_STORAGE_KEY = 'coverai_current_job';
const JOB_HISTORY_KEY = 'coverai_job_history';

export const JobModel = {
    /**
     * Save current job description
     * @param {Object} jobData - Job information
     */
    async saveCurrent(jobData) {
        const data = {
            title: jobData.title || '',
            company: jobData.company || '',
            description: jobData.description || '',
            requirements: jobData.requirements || '',
            location: jobData.location || '',
            url: jobData.url || '',
            extractedAt: new Date().toISOString(),
            source: jobData.source || 'manual'
        };

        await chrome.storage.local.set({ [JOB_STORAGE_KEY]: data });

        // Add to history
        await this.addToHistory(data);

        return data;
    },

    /**
     * Get current job description
     * @returns {Object|null}
     */
    async getCurrent() {
        const result = await chrome.storage.local.get(JOB_STORAGE_KEY);
        return result[JOB_STORAGE_KEY] || null;
    },

    /**
     * Clear current job
     */
    async clearCurrent() {
        await chrome.storage.local.remove(JOB_STORAGE_KEY);
    },

    /**
     * Add job to history (keeps last 10)
     * @param {Object} jobData
     */
    async addToHistory(jobData) {
        const result = await chrome.storage.local.get(JOB_HISTORY_KEY);
        let history = result[JOB_HISTORY_KEY] || [];

        // Add to beginning
        history.unshift({
            ...jobData,
            id: Date.now()
        });

        // Keep only last 10
        history = history.slice(0, 10);

        await chrome.storage.local.set({ [JOB_HISTORY_KEY]: history });
    },

    /**
     * Get job history
     * @returns {Array}
     */
    async getHistory() {
        const result = await chrome.storage.local.get(JOB_HISTORY_KEY);
        return result[JOB_HISTORY_KEY] || [];
    },

    /**
     * Check if current job exists
     * @returns {boolean}
     */
    async hasCurrent() {
        const job = await this.getCurrent();
        return job !== null && job.description.length > 0;
    }
};

export default JobModel;
