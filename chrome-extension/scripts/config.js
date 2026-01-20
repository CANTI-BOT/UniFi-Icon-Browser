/**
 * Configuration Constants Module
 * Centralizes all magic numbers and configuration values for the UniFi Icon Browser extension.
 */

const Config = {
    // ==================== URLs ====================
    URLS: {
        UNIFI_IMAGE_BASE: 'https://static.ui.com/fingerprint/0/',
        STATIC_UI_COM: 'static.ui.com',
        STATIC_UBNT_COM: 'static.ubnt.com'
    },

    // ==================== Pagination ====================
    PAGINATION: {
        DEVICES_PER_PAGE: 50,
        MAX_ELEMENTS_TO_SCAN: 500
    },

    // ==================== Timeouts (in milliseconds) ====================
    TIMEOUTS: {
        NOTIFICATION_DISPLAY: 3000,
        STATUS_MESSAGE_DISPLAY: 4000,
        DOM_EXTRACTION_DELAY: 2000,
        ICON_REPLACEMENT_DELAY: 50,
        PANEL_UPDATE_DELAY: 100,
        MUTATION_OBSERVER_DELAY: 200,
        RESPONSE_WAIT_DELAY: 500,
        EXTRACTION_STOP: 60000
    },

    // ==================== Intervals (in milliseconds) ====================
    INTERVALS: {
        EXTRACTION_CHECK: 2000,
        SCROLL_DEBOUNCE: 500
    },

    // ==================== Validation ====================
    VALIDATION: {
        MIN_DEVICE_ID: 0,
        MAX_DEVICE_ID: 100000,
        MAX_DEVICE_NAME_LENGTH: 100,
        BOLD_FONT_WEIGHT_THRESHOLD: 600
    },

    // ==================== UI Colors ====================
    COLORS: {
        SUCCESS_BADGE: '#208637',
        ERROR_BADGE: '#d93025'
    },

    // ==================== Storage Keys ====================
    STORAGE_KEYS: {
        REGISTRY: 'unifiDeviceRegistry',
        CUSTOM_MAPPINGS: 'customIconMappings',
        LAST_SYNC: 'lastSyncTimestamp',
        LOCAL_MAPPINGS: 'unifi-icon-browser-mappings'
    },

    // ==================== Extension ====================
    EXTENSION: {
        ID: 'unifi-icon-browser',
        UNIFI_CONTROLLER_PORT: 8443
    },

    // ==================== Patterns ====================
    PATTERNS: {
        // Matches fingerprint URLs in various formats
        FINGERPRINT_URL: /(?:static\.ui\.com|static\.ubnt\.com)?\/?\/?fingerprint\/\d+\/(\d+)(?:_\d+x\d+)?\.png/i,
        // Matches device image API endpoints
        DEVICE_IMAGE_API: /\/api\/.*device.*image.*\/(\d+)/i
    },

    // ==================== Selectors ====================
    SELECTORS: {
        // Panel selectors for finding device info panels
        PANELS: [
            '.PROPERTY_PANEL_CLASSNAME',
            '[class*="panel"]',
            '[class*="Panel"]',
            '[class*="sidebar"]',
            '[class*="Sidebar"]',
            '[class*="detail"]',
            '[class*="Detail"]',
            '[class*="drawer"]',
            '[class*="Drawer"]',
            '[class*="info"]',
            '[class*="Info"]',
            '[role="dialog"]',
            '[class*="modal"]',
            '[class*="Modal"]'
        ],
        // UniFi page detection selectors
        UNIFI_ELEMENTS: [
            '[class*="unifi"]',
            '[class*="Unifi"]',
            '[data-testid*="unifi"]'
        ],
        // Grid/list selectors for device extraction
        DEVICE_CONTAINERS: [
            '.Grid',
            '[class*="Grid"]',
            '[class*="modal"]',
            '[role="dialog"]',
            '[class*="container"]'
        ]
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}
