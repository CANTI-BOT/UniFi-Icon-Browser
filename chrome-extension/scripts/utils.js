/**
 * Utility Functions Module
 * Shared helper functions for the UniFi Icon Browser extension.
 */

const Utils = {
    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} str - String to escape
     * @returns {string} Escaped HTML string
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Format a relative time string (e.g., "5m ago", "2h ago")
     * @param {number} timestamp - Unix timestamp in milliseconds
     * @returns {string} Formatted relative time string
     */
    formatRelativeTime(timestamp) {
        if (!timestamp) return 'never';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'just now';
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            return `${diffDays}d ago`;
        }
    },

    /**
     * Format a date for display
     * @param {number} timestamp - Unix timestamp in milliseconds
     * @returns {string} Formatted date string
     */
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Debounce a function call
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle a function call
     * @param {Function} func - Function to throttle
     * @param {number} limit - Milliseconds between calls
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Check if a URL is a UniFi-related URL
     * @param {string} url - URL to check
     * @returns {boolean} True if URL is UniFi-related
     */
    isUnifiUrl(url) {
        if (!url) return false;
        return url.includes('ui.com') ||
               url.includes('unifi') ||
               url.includes(':8443') ||
               url.includes('/network') ||
               url.includes('/protect');
    },

    /**
     * Extract device ID from a fingerprint URL
     * @param {string} url - Fingerprint image URL
     * @returns {string|null} Device ID or null if not found
     */
    extractDeviceIdFromUrl(url) {
        if (!url) return null;

        // Match patterns like:
        // - static.ui.com/fingerprint/0/1234_129x129.png
        // - /fingerprint/0/1234.png
        const fingerprintMatch = url.match(/fingerprint\/\d+\/(\d+)(?:_\d+x\d+)?\.png/i);
        if (fingerprintMatch) {
            return fingerprintMatch[1];
        }

        // Match API patterns like /api/device/image/1234
        const apiMatch = url.match(/\/api\/.*device.*image.*\/(\d+)/i);
        if (apiMatch) {
            return apiMatch[1];
        }

        return null;
    },

    /**
     * Build a fingerprint image URL
     * @param {string} deviceId - Device fingerprint ID
     * @param {number} size - Image size (default: 128)
     * @returns {string} Full URL to the fingerprint image
     */
    buildFingerprintUrl(deviceId, size = 128) {
        const baseUrl = 'https://static.ui.com/fingerprint/0/';
        return `${baseUrl}${deviceId}_${size}x${size}.png`;
    },

    /**
     * Safely parse JSON with fallback
     * @param {string} str - JSON string to parse
     * @param {*} fallback - Fallback value if parsing fails
     * @returns {*} Parsed value or fallback
     */
    safeJsonParse(str, fallback = null) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return fallback;
        }
    },

    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;

        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            return obj;
        }
    },

    /**
     * Check if an element is inside an SVG
     * @param {Element} element - DOM element to check
     * @returns {boolean} True if element is inside an SVG
     */
    isInsideSvg(element) {
        return element && element.closest('svg') !== null;
    },

    /**
     * Wait for a specified number of milliseconds
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Create a unique ID
     * @param {string} prefix - Optional prefix for the ID
     * @returns {string} Unique ID string
     */
    generateId(prefix = 'unifi') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Check if a device name looks like a user's personal device name
     * rather than an official fingerprint product name.
     * User device names: "CANTI-PC | PORT 2", "Jeff's Laptop", "My Server"
     * Official names: "Apple iPhone 14 Pro", "Samsung Galaxy S23", "Dell Latitude"
     * @param {string} name - Device name to check
     * @returns {boolean} True if name looks like a user device
     */
    looksLikeUserDeviceName(name) {
        if (!name || typeof name !== 'string') return true;

        // Patterns that indicate user device names:
        const userDevicePatterns = [
            // 1. Any pipe pattern (like "CANTI-PC | PORT 2", "New Laptop | Wi-Fi")
            /\s*\|\s*/,
            // 2. ANY possessive pattern (like "Jeff's Laptop", "Catie's Apple Watch", "Hunter's S21")
            /'s\s+/,
            // 3. Generic prefixes
            /^(My|Home|Office|Work|Guest|Kids|Family|New|Old)\s/i,
            // 4. Windows/Linux hostname patterns
            /^(DESKTOP|WIN|PC|LAPTOP|WORKSTATION|SERVER|HOST|VM|NODE)-[A-Z0-9]+/i,
            // 5. VLAN notation (like "USPOP1RFW01-A (VLAN 211)")
            /\(VLAN\s*\d+\)/i,
            // 6. Hostnames with -AMT, -PC, -VM suffixes
            /^[A-Z0-9]+-?(AMT|PC|VM|NAS|SRV|SVR|WS|AP|SW)$/i,
            // 7. PROXMOX/ProxVE patterns
            /^PROX(VE|MOX)?\d*-?/i,
            // 8. Generic alphanumeric hostnames (all caps with numbers)
            /^[A-Z]{2,}[A-Z0-9]*\d+[A-Z0-9]*$/,
            // 9. MAC address based names or random IDs
            /^[A-F0-9]{2}[:-][A-F0-9]{2}/i,
            // 10. Contains "Strip Lights", "Picture Frame" - IoT device custom names
            /(Strip\s*Lights?|Picture\s*Frame|Door\s*Opener|Thermostat|Smart\s*Plug)/i
        ];

        return userDevicePatterns.some(pattern => pattern.test(name));
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
