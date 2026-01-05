/**
 * ResumeModel - Manages resume data storage and retrieval
 * Uses Chrome's local storage API for persistence
 */

const RESUME_STORAGE_KEY = 'coverai_resume';

export const ResumeModel = {
    /**
     * Save parsed resume data to Chrome storage
     * @param {Object} resumeData - Structured resume data
     */
    async save(resumeData) {
        const data = {
            ...resumeData,
            updatedAt: new Date().toISOString()
        };
        
        await chrome.storage.local.set({ [RESUME_STORAGE_KEY]: data });
        return data;
    },

    /**
     * Retrieve stored resume data
     * @returns {Object|null} Resume data or null if not found
     */
    async get() {
        const result = await chrome.storage.local.get(RESUME_STORAGE_KEY);
        return result[RESUME_STORAGE_KEY] || null;
    },

    /**
     * Check if a resume is stored
     * @returns {boolean}
     */
    async exists() {
        const resume = await this.get();
        return resume !== null;
    },

    /**
     * Clear stored resume data
     */
    async clear() {
        await chrome.storage.local.remove(RESUME_STORAGE_KEY);
    },

    /**
     * Get resume summary for display
     * @returns {Object} Summary with name and basic info
     */
    async getSummary() {
        const resume = await this.get();
        if (!resume) return null;
        
        return {
            name: resume.name || 'Unknown',
            email: resume.email || '',
            hasExperience: !!(resume.experience && resume.experience.length > 0),
            hasSkills: !!(resume.skills && resume.skills.length > 0),
            updatedAt: resume.updatedAt
        };
    }
};

export default ResumeModel;
