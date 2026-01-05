/**
 * SettingsModel - Manages user settings and preferences
 */

const SETTINGS_STORAGE_KEY = 'coverai_settings';

const DEFAULT_SETTINGS = {
    apiKey: '',
    coverLetterTone: 'professional', // professional, friendly, formal
    includeDate: true,
    defaultSignature: '',
    autoDetectJobs: true,
    showNotifications: true
};

export const SettingsModel = {
    /**
     * Get all settings
     * @returns {Object}
     */
    async get() {
        const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
        return { ...DEFAULT_SETTINGS, ...result[SETTINGS_STORAGE_KEY] };
    },

    /**
     * Save settings
     * @param {Object} settings - Settings to save (merged with existing)
     */
    async save(settings) {
        const current = await this.get();
        const updated = { ...current, ...settings };
        await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: updated });
        return updated;
    },

    /**
     * Get API key
     * @returns {string}
     */
    async getApiKey() {
        const settings = await this.get();
        return settings.apiKey || '';
    },

    /**
     * Save API key
     * @param {string} apiKey
     */
    async saveApiKey(apiKey) {
        await this.save({ apiKey });
    },

    /**
     * Check if API key is configured
     * @returns {boolean}
     */
    async hasApiKey() {
        const apiKey = await this.getApiKey();
        return apiKey.length > 0;
    },

    /**
     * Reset to defaults
     */
    async reset() {
        await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS });
        return DEFAULT_SETTINGS;
    },

    /**
     * Get cover letter tone setting
     * @returns {string}
     */
    async getTone() {
        const settings = await this.get();
        return settings.coverLetterTone;
    }
};

export default SettingsModel;
