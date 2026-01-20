/**
 * Storage Manager Module
 * Centralizes all Chrome storage operations for the UniFi Icon Browser extension.
 * Eliminates duplicated registry logic across popup.js, background.js, and options.js.
 */

const StorageManager = {
    // Storage keys
    KEYS: {
        REGISTRY: 'unifiDeviceRegistry',
        CUSTOM_MAPPINGS: 'customIconMappings',
        LAST_SYNC: 'lastSyncTimestamp'
    },

    /**
     * Get the device registry, migrating old format if necessary
     * @returns {Promise<Object>} Registry object with format { id: { name, addedAt } }
     */
    async getRegistry() {
        try {
            const result = await chrome.storage.local.get(this.KEYS.REGISTRY);
            const registry = result[this.KEYS.REGISTRY] || {};

            // Check if migration is needed (old format: { id: "name" })
            const migrated = this._migrateRegistryIfNeeded(registry);

            if (migrated.needsSave) {
                await this.saveRegistry(migrated.registry);
            }

            return migrated.registry;
        } catch (error) {
            console.error('[StorageManager] Failed to get registry:', error);
            return {};
        }
    },

    /**
     * Save the entire registry
     * @param {Object} registry - Registry object to save
     * @returns {Promise<boolean>} Success status
     */
    async saveRegistry(registry) {
        try {
            await chrome.storage.local.set({ [this.KEYS.REGISTRY]: registry });
            return true;
        } catch (error) {
            console.error('[StorageManager] Failed to save registry:', error);
            return false;
        }
    },

    /**
     * Add or update devices in the registry
     * @param {Object} devices - Object with format { id: name } or { id: { name, addedAt } }
     * @returns {Promise<{success: boolean, newCount: number, totalCount: number}>}
     */
    async saveDevicesToRegistry(devices) {
        try {
            const registry = await this.getRegistry();
            const now = Date.now();
            let newCount = 0;

            for (const [id, value] of Object.entries(devices)) {
                if (!registry[id]) {
                    newCount++;
                    registry[id] = this._normalizeEntry(value, now);
                }
            }

            if (newCount > 0) {
                await this.saveRegistry(registry);
            }

            return {
                success: true,
                newCount,
                totalCount: Object.keys(registry).length
            };
        } catch (error) {
            console.error('[StorageManager] Failed to save devices:', error);
            return { success: false, newCount: 0, totalCount: 0 };
        }
    },

    /**
     * Clear the entire registry
     * @returns {Promise<boolean>} Success status
     */
    async clearRegistry() {
        try {
            await chrome.storage.local.remove(this.KEYS.REGISTRY);
            return true;
        } catch (error) {
            console.error('[StorageManager] Failed to clear registry:', error);
            return false;
        }
    },

    /**
     * Get registry count
     * @returns {Promise<number>} Number of devices in registry
     */
    async getRegistryCount() {
        const registry = await this.getRegistry();
        return Object.keys(registry).length;
    },

    /**
     * Import registry from JSON data
     * @param {Object} importData - Registry data to import
     * @param {boolean} merge - If true, merge with existing; if false, replace
     * @returns {Promise<{success: boolean, count: number}>}
     */
    async importRegistry(importData, merge = true) {
        try {
            let registry = merge ? await this.getRegistry() : {};
            const now = Date.now();
            let importCount = 0;

            for (const [id, value] of Object.entries(importData)) {
                if (!merge || !registry[id]) {
                    registry[id] = this._normalizeEntry(value, now);
                    importCount++;
                }
            }

            await this.saveRegistry(registry);
            return { success: true, count: importCount };
        } catch (error) {
            console.error('[StorageManager] Failed to import registry:', error);
            return { success: false, count: 0 };
        }
    },

    /**
     * Export registry as JSON-serializable object
     * @returns {Promise<Object>} Registry data
     */
    async exportRegistry() {
        return await this.getRegistry();
    },

    // ==================== Custom Icon Mappings ====================

    /**
     * Get custom icon mappings
     * @returns {Promise<Object>} Mappings object
     */
    async getCustomMappings() {
        try {
            const result = await chrome.storage.local.get(this.KEYS.CUSTOM_MAPPINGS);
            return result[this.KEYS.CUSTOM_MAPPINGS] || {};
        } catch (error) {
            console.error('[StorageManager] Failed to get custom mappings:', error);
            return {};
        }
    },

    /**
     * Save custom icon mappings
     * @param {Object} mappings - Mappings object to save
     * @returns {Promise<boolean>} Success status
     */
    async saveCustomMappings(mappings) {
        try {
            await chrome.storage.local.set({ [this.KEYS.CUSTOM_MAPPINGS]: mappings });
            return true;
        } catch (error) {
            console.error('[StorageManager] Failed to save custom mappings:', error);
            return false;
        }
    },

    /**
     * Add or update a single custom mapping
     * @param {string} deviceId - Device fingerprint ID
     * @param {Object} mapping - Mapping data (iconUrl, name, deviceName, manufacturer, model, os)
     * @returns {Promise<boolean>} Success status
     */
    async setCustomMapping(deviceId, mapping) {
        try {
            const mappings = await this.getCustomMappings();
            mappings[deviceId] = {
                ...mapping,
                addedAt: mapping.addedAt || Date.now()
            };
            return await this.saveCustomMappings(mappings);
        } catch (error) {
            console.error('[StorageManager] Failed to set custom mapping:', error);
            return false;
        }
    },

    /**
     * Remove a custom mapping
     * @param {string} deviceId - Device fingerprint ID to remove
     * @returns {Promise<boolean>} Success status
     */
    async removeCustomMapping(deviceId) {
        try {
            const mappings = await this.getCustomMappings();
            delete mappings[deviceId];
            return await this.saveCustomMappings(mappings);
        } catch (error) {
            console.error('[StorageManager] Failed to remove custom mapping:', error);
            return false;
        }
    },

    // ==================== Helper Methods ====================

    /**
     * Migrate old registry format to new format
     * @private
     * @param {Object} registry - Registry to check/migrate
     * @returns {{registry: Object, needsSave: boolean}}
     */
    _migrateRegistryIfNeeded(registry) {
        let needsSave = false;
        const migrated = {};

        for (const [id, entry] of Object.entries(registry)) {
            if (typeof entry === 'string') {
                // Old format: just a name string
                migrated[id] = {
                    name: entry,
                    addedAt: Date.now()
                };
                needsSave = true;
            } else if (entry && typeof entry === 'object') {
                // New format or partially migrated
                migrated[id] = {
                    name: entry.name || 'Unknown',
                    addedAt: entry.addedAt || Date.now()
                };
                if (!entry.addedAt) needsSave = true;
            }
        }

        return { registry: migrated, needsSave };
    },

    /**
     * Normalize an entry to the standard format
     * @private
     * @param {string|Object} value - Entry value (name string or object)
     * @param {number} timestamp - Timestamp to use if not present
     * @returns {{name: string, addedAt: number}}
     */
    _normalizeEntry(value, timestamp) {
        if (typeof value === 'string') {
            return { name: value, addedAt: timestamp };
        }
        return {
            name: value?.name || 'Unknown',
            addedAt: value?.addedAt || timestamp
        };
    },

    /**
     * Get device name from entry (handles both old and new format)
     * @param {string|Object} entry - Registry entry
     * @returns {string} Device name
     */
    getDeviceName(entry) {
        if (typeof entry === 'string') return entry;
        return entry?.name || 'Unknown';
    },

    /**
     * Get device addedAt timestamp from entry
     * @param {string|Object} entry - Registry entry
     * @returns {number} Timestamp or 0
     */
    getDeviceAddedAt(entry) {
        if (typeof entry === 'string') return 0;
        return entry?.addedAt || 0;
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
