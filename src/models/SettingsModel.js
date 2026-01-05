/**
 * SettingsModel - Manages user settings and preferences
 */

const SETTINGS_STORAGE_KEY = 'coverai_settings';

const DEFAULT_SETTINGS = {
    apiKey: '',
    geminiModel: 'gemini-1.5-flash',
    fullName: '', // Main override for name
    coverLetterTone: 'professional', // professional, friendly, formal
    includeDate: true,
    defaultSignature: '',
    autoDetectJobs: true,
    showNotifications: true,
    developerMode: false
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
     * Get selected Gemini model
     * @returns {string}
     */
    async getModel() {
        const settings = await this.get();
        return settings.geminiModel || 'gemini-1.5-flash';
    },

    /**
     * Save selected model
     * @param {string} model
     */
    async saveModel(model) {
        await this.save({ geminiModel: model });
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
