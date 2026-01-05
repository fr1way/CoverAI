/**
 * Chrome Storage Utility
 * Wrapper for Chrome storage API with convenience methods
 */

export const Storage = {
    /**
     * Get value from local storage
     * @param {string} key
     * @returns {Promise<any>}
     */
    async get(key) {
        const result = await chrome.storage.local.get(key);
        return result[key];
    },

    /**
     * Set value in local storage
     * @param {string} key
     * @param {any} value
     */
    async set(key, value) {
        await chrome.storage.local.set({ [key]: value });
    },

    /**
     * Remove value from local storage
     * @param {string} key
     */
    async remove(key) {
        await chrome.storage.local.remove(key);
    },

    /**
     * Get multiple values
     * @param {string[]} keys
     * @returns {Promise<Object>}
     */
    async getMultiple(keys) {
        return await chrome.storage.local.get(keys);
    },

    /**
     * Clear all storage
     */
    async clear() {
        await chrome.storage.local.clear();
    },

    /**
     * Get storage usage info
     * @returns {Promise<Object>}
     */
    async getUsage() {
        return new Promise((resolve) => {
            chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
                resolve({
                    bytesUsed: bytesInUse,
                    bytesTotal: chrome.storage.local.QUOTA_BYTES,
                    percentUsed: ((bytesInUse / chrome.storage.local.QUOTA_BYTES) * 100).toFixed(2)
                });
            });
        });
    }
};

export default Storage;
