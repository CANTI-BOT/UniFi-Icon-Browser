// UniFi Icon Browser - Injected Script
// This script runs in the page context to intercept fingerprint data

(function() {
    'use strict';

    const EXTENSION_ID = 'unifi-icon-browser';

    // Store for captured fingerprint data
    let capturedFingerprints = {};
    let fullDatabaseFetched = false;

    // Store for custom icon mappings (received from extension)
    let customIconMappings = {};

    // Load mappings from localStorage synchronously at startup
    // This ensures mappings are available before any fetch calls are made
    try {
        const storedMappings = localStorage.getItem('unifi-icon-browser-mappings');
        if (storedMappings) {
            customIconMappings = JSON.parse(storedMappings);
        }
    } catch (e) {
        // Silent fail - mappings will be loaded via postMessage later
    }

    // ==================== Flash Prevention System ====================
    // Inject CSS to hide device info sections until they're replaced
    // This prevents the "flash" of original values before replacement

    function injectFlashPreventionCSS() {
        if (document.getElementById('unifi-icon-browser-flash-prevention')) return;

        // Get the device IDs we have custom mappings for
        const deviceIds = Object.keys(customIconMappings);
        if (deviceIds.length === 0) return; // No mappings, no need to hide anything

        const style = document.createElement('style');
        style.id = 'unifi-icon-browser-flash-prevention';

        // Build CSS that specifically targets containers with fingerprint images
        // These selectors match common UniFi panel patterns
        style.textContent = `
            /* Animation for smooth reveal after JS processing */
            @keyframes unifi-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            /* Hide elements that are being processed by JS */
            [data-unifi-panel-processing="true"] {
                opacity: 0 !important;
            }

            /* Processed panels show immediately */
            [data-unifi-panel-processed="true"] {
                opacity: 1 !important;
            }

            /* Smooth reveal when JS finishes */
            .unifi-reveal-ready {
                animation: unifi-fade-in 0.15s ease-out forwards !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    // Update the CSS when mappings change
    function updateFlashPreventionCSS() {
        const existingStyle = document.getElementById('unifi-icon-browser-flash-prevention');
        if (existingStyle) {
            existingStyle.remove();
        }
        injectFlashPreventionCSS();
    }

    // Track which panels we've already processed to avoid re-hiding
    const processedPanels = new WeakSet();

    // Mark panel as being processed (hides the entire panel content area)
    function markPanelForProcessing(panel) {
        if (!panel || processedPanels.has(panel)) return false;

        // Only mark if we have custom mappings to apply
        if (Object.keys(customIconMappings).length === 0) return false;

        // Check if this panel contains device info (Manufacturer/Model fields)
        const hasDeviceInfo = panel.textContent?.includes('Manufacturer') ||
                             panel.textContent?.includes('Model') ||
                             panel.querySelector?.('img[src*="fingerprint"]');

        if (hasDeviceInfo) {
            panel.dataset.unifiPanelProcessing = 'true';
            return true;
        }
        return false;
    }

    // Reveal panel after processing is complete
    function revealPanel(panel) {
        if (!panel) return;
        delete panel.dataset.unifiPanelProcessing;
        panel.dataset.unifiPanelProcessed = 'true';
        processedPanels.add(panel);
    }

    // Legacy function names for compatibility
    function markPanelForReplacement(container) {
        markPanelForProcessing(container);
    }

    function revealReplacedContent(container) {
        revealPanel(container);
    }

    // Inject CSS immediately
    injectFlashPreventionCSS();

    // ==================== Click Interception ====================
    // Intercept clicks on device items BEFORE they open the panel
    // This lets us hide the panel area before React renders content

    let clickInterceptionSetup = false;
    function setupClickInterception() {
        if (clickInterceptionSetup) return; // Only setup once
        clickInterceptionSetup = true;

        document.addEventListener('click', (e) => {
            // Skip if no custom mappings
            if (Object.keys(customIconMappings).length === 0) return;
            // Check if click is on or near a fingerprint image (device list item)
            const fingerprintImg = e.target.closest('img[src*="fingerprint"]') ||
                                   e.target.querySelector?.('img[src*="fingerprint"]') ||
                                   e.target.closest('[class*="client"]')?.querySelector('img[src*="fingerprint"]');

            if (fingerprintImg) {
                const deviceId = extractFingerprintId(fingerprintImg.src);
                if (deviceId && customIconMappings[deviceId]) {
                    // Pre-emptively hide panels that might show device details
                    const existingPanels = document.querySelectorAll('[class*="panel"], [class*="Panel"], [class*="detail"], [class*="Detail"], [role="complementary"]');
                    existingPanels.forEach(panel => {
                        if (!panel.dataset.unifiPanelProcessed) {
                            panel.style.opacity = '0';
                            panel.dataset.unifiPanelProcessing = 'true';
                        }
                    });

                    // Schedule immediate replacement after React renders
                    requestAnimationFrame(() => {
                        replaceIconsInDom();
                        replaceDeviceInfoInPanel(deviceId);
                        scanAndReplaceAllPanels();

                        // Reveal with short delay
                        setTimeout(() => {
                            existingPanels.forEach(panel => {
                                panel.style.opacity = '';
                                panel.classList.add('unifi-reveal-ready');
                                panel.dataset.unifiPanelProcessed = 'true';
                                delete panel.dataset.unifiPanelProcessing;
                            });
                        }, 30);
                    });
                }
            }
        }, true); // Use capture phase to run before React handlers
    }

    // Initialize click interception
    if (document.body) {
        setupClickInterception();
    } else {
        document.addEventListener('DOMContentLoaded', setupClickInterception);
    }

    // ==================== Custom Icon URL Replacement ====================

    // Check if a URL is a UniFi fingerprint icon URL and return device ID if so
    function extractFingerprintId(url) {
        if (typeof url !== 'string') return null;

        // Match multiple patterns:
        // - static.ui.com/fingerprint/0/1234_129x129.png
        // - static.ubnt.com/fingerprint/0/1234_257x257.png
        // - /fingerprint/0/1234_129x129.png (relative)
        // - Also match without size suffix: fingerprint/0/1234.png
        let match = url.match(/fingerprint\/\d+\/(\d+)(?:_\d+x\d+)?\.png/);
        if (match) return match[1];

        // Also try matching device IDs in other URL patterns
        // e.g., /api/device/image/1234 or similar
        match = url.match(/\/device\/(?:image|icon)\/(\d+)/);
        if (match) return match[1];

        return null;
    }

    // Get custom icon URL for a device ID if one exists
    function getCustomIconUrl(deviceId) {
        return customIconMappings[deviceId]?.iconUrl || null;
    }

    // Replace fingerprint images in the DOM with custom icons
    function replaceIconsInDom() {
        // Find images by both src and srcset attributes
        document.querySelectorAll('img[src*="fingerprint"], img[srcset*="fingerprint"]').forEach(img => {
            // Try to get device ID from src or srcset
            let deviceId = extractFingerprintId(img.src);
            if (!deviceId && img.srcset) {
                deviceId = extractFingerprintId(img.srcset);
            }

            if (deviceId) {
                const customUrl = getCustomIconUrl(deviceId);
                if (customUrl && !img.dataset.customIconApplied) {
                    // IMMEDIATELY hide the containing panel before doing anything else
                    const containingPanel = img.closest('[class*="panel"], [class*="Panel"], [class*="sidebar"], [class*="Sidebar"], [class*="detail"], [class*="Detail"], [role="complementary"], [role="dialog"]');
                    if (containingPanel && !containingPanel.dataset.unifiPanelProcessed) {
                        containingPanel.style.opacity = '0';
                        containingPanel.dataset.unifiPanelProcessing = 'true';
                    }

                    // Icon replacement happening

                    // Save original values
                    img.dataset.originalSrc = img.src;
                    img.dataset.deviceId = deviceId;
                    if (img.srcset) {
                        img.dataset.originalSrcset = img.srcset;
                    }
                    img.dataset.customIconApplied = 'true';

                    // Replace src
                    img.src = customUrl;

                    // CRITICAL: Clear srcset so browser doesn't use original images
                    if (img.srcset) {
                        img.removeAttribute('srcset');
                    }

                    // Replace vendor in table row (if applicable)
                    const mapping = customIconMappings[deviceId];
                    if (mapping?.manufacturer) {
                        replaceVendorInTableRow(img, mapping.manufacturer, deviceId);
                    }

                    // Replace device info and reveal panel
                    requestAnimationFrame(() => {
                        replaceDeviceInfoInPanel(deviceId);
                        // Reveal the panel after replacement
                        if (containingPanel) {
                            containingPanel.style.opacity = '';
                            containingPanel.dataset.unifiPanelProcessed = 'true';
                            delete containingPanel.dataset.unifiPanelProcessing;
                        }
                    });
                }
            }
        });

        // Also check for already-replaced icons and update their panels and vendor columns
        document.querySelectorAll('img[data-custom-icon-applied="true"]').forEach(img => {
            const deviceId = img.dataset.deviceId;
            if (deviceId && customIconMappings[deviceId]) {
                replaceDeviceInfoInPanel(deviceId);
                // Also update vendor in table row
                const mapping = customIconMappings[deviceId];
                if (mapping?.manufacturer) {
                    replaceVendorInTableRow(img, mapping.manufacturer, deviceId);
                }
            }
        });

        // Also scan all visible panels as a catch-all
        scanAndReplaceAllPanels();
    }

    // Observe DOM for new fingerprint images and replace them
    function setupIconReplacementObserver() {
        // Selectors for panels that might contain device info
        const panelSelectors = '[class*="panel"], [class*="Panel"], [class*="modal"], [class*="Modal"], [class*="sidebar"], [class*="Sidebar"], [class*="detail"], [class*="Detail"], [role="complementary"], [role="dialog"]';

        const observer = new MutationObserver((mutations) => {
            let hasNewImages = false;
            let panelsToProcess = new Set();

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            // Check for new images
                            if (node.tagName === 'IMG' && node.src?.includes('fingerprint')) {
                                hasNewImages = true;
                            }
                            if (node.querySelector?.('img[src*="fingerprint"]')) {
                                hasNewImages = true;
                            }

                            // CRITICAL: Hide any new panel-like element IMMEDIATELY
                            // This must happen before React can paint the content
                            if (Object.keys(customIconMappings).length > 0) {
                                if (node.matches?.(panelSelectors)) {
                                    // Immediately hide - don't wait for anything
                                    if (!node.dataset.unifiPanelProcessed) {
                                        node.style.opacity = '0';
                                        panelsToProcess.add(node);
                                    }
                                }
                                // Also check children
                                const childPanels = node.querySelectorAll?.(panelSelectors);
                                if (childPanels) {
                                    childPanels.forEach(panel => {
                                        if (!panel.dataset.unifiPanelProcessed) {
                                            panel.style.opacity = '0';
                                            panelsToProcess.add(panel);
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
                // Also watch for src attribute changes
                if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    const target = mutation.target;
                    if (target.tagName === 'IMG' && target.src?.includes('fingerprint')) {
                        hasNewImages = true;
                    }
                }
            }

            if (hasNewImages) {
                // Process images quickly
                replaceIconsInDom();
            }

            // Process any panels we hid
            if (panelsToProcess.size > 0) {
                // Use requestAnimationFrame to process after current paint
                requestAnimationFrame(() => {
                    // Replace device info for all our custom devices
                    Object.keys(customIconMappings).forEach(deviceId => {
                        replaceDeviceInfoInPanel(deviceId);
                    });

                    // Also run icon replacement
                    replaceIconsInDom();

                    // Scan all panels as a catch-all
                    scanAndReplaceAllPanels();

                    // Reveal panels after a brief delay to ensure replacement happened
                    setTimeout(() => {
                        panelsToProcess.forEach(panel => {
                            panel.style.opacity = '';
                            panel.dataset.unifiPanelProcessed = 'true';
                        });
                    }, 20);
                });
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src'],
            characterData: true
        });
    }

    // Scan all visible device panels and apply custom replacements based on fingerprint IDs found
    function scanAndReplaceAllPanels() {
        if (Object.keys(customIconMappings).length === 0) return;

        for (const selector of PANEL_SELECTORS) {
            const panels = document.querySelectorAll(selector);
            for (const panel of panels) {
                if (panel.closest('svg')) continue;

                // Check if panel has device info fields
                const hasDeviceInfo = panel.textContent?.includes('Manufacturer') ||
                                     panel.textContent?.includes('Model');
                if (!hasDeviceInfo) continue;

                // Find fingerprint images in this panel and get their device IDs
                const fingerprintImgs = panel.querySelectorAll('img[src*="fingerprint"], img[data-custom-icon-applied]');
                const foundDeviceIds = new Set();

                for (const img of fingerprintImgs) {
                    let deviceId = img.dataset.deviceId;
                    if (!deviceId) {
                        deviceId = extractFingerprintId(img.src);
                    }
                    if (deviceId) {
                        foundDeviceIds.add(deviceId);
                    }
                }

                // Apply replacements for any matching custom mappings
                for (const deviceId of foundDeviceIds) {
                    if (customIconMappings[deviceId]) {
                        const mapping = customIconMappings[deviceId];
                        const hasOverrides = mapping.deviceName || mapping.manufacturer ||
                                           mapping.model || mapping.os;
                        if (hasOverrides) {
                            applyDeviceOverrides(panel, mapping, null, deviceId);
                        }
                    }
                }
            }
        }
    }

    // Additional observer specifically for detecting when device info fields are populated
    function setupDeviceInfoWatcher() {
        // Debounce to avoid excessive calls
        let replaceTimeout = null;

        const infoObserver = new MutationObserver((mutations) => {
            let shouldReplace = false;

            for (const mutation of mutations) {
                // Watch for text content changes (React populating data)
                if (mutation.type === 'characterData') {
                    const parent = mutation.target.parentElement;
                    if (parent) {
                        const parentText = parent.textContent || '';
                        // Check if this is near device info fields
                        const nearbyContainer = parent.closest('[class*="panel"], [class*="Panel"], [class*="sidebar"], [class*="detail"]');
                        if (nearbyContainer && (nearbyContainer.textContent?.includes('Manufacturer') || nearbyContainer.textContent?.includes('Model'))) {
                            shouldReplace = true;
                        }
                    }
                }
                // Also watch for new elements being added that contain device info labels
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && node.textContent) {
                            if (node.textContent.includes('Manufacturer') || node.textContent.includes('Model')) {
                                shouldReplace = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (shouldReplace && Object.keys(customIconMappings).length > 0) {
                // Clear any pending timeout and set a new one with minimal delay
                if (replaceTimeout) clearTimeout(replaceTimeout);
                replaceTimeout = setTimeout(() => {
                    // First, try the targeted approach for each mapping
                    Object.keys(customIconMappings).forEach(deviceId => {
                        replaceDeviceInfoInPanel(deviceId);
                    });
                    // Also scan all visible panels as a catch-all
                    scanAndReplaceAllPanels();
                }, 10); // Very short delay, just enough to batch mutations
            }
        });

        // Start observing when body is available
        if (document.body) {
            infoObserver.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                characterDataOldValue: false
            });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                infoObserver.observe(document.body, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                    characterDataOldValue: false
                });
            });
        }
    }

    // Panel selectors used for finding device info panels
    const PANEL_SELECTORS = [
        '.PROPERTY_PANEL_CLASSNAME',
        '[class*="panel"]', '[class*="Panel"]',
        '[class*="sidebar"]', '[class*="Sidebar"]',
        '[class*="detail"]', '[class*="Detail"]',
        '[class*="modal"]', '[class*="Modal"]',
        '[role="dialog"]', '[role="complementary"]'
    ];

    // Helper: Walk up from an element to find a container with device info fields
    function findContainerWithDeviceInfo(startElement, stopElement, maxLevels = 15) {
        let container = startElement;
        while (container && maxLevels > 0 && container !== stopElement) {
            const textContent = container.textContent || '';
            if (textContent.includes('Manufacturer') || textContent.includes('Model')) {
                return container;
            }
            container = container.parentElement;
            maxLevels--;
        }
        return null;
    }

    // Helper: Find a device icon within panel elements
    function findDeviceIconInPanels(deviceId, mapping) {
        for (const selector of PANEL_SELECTORS) {
            const panels = document.querySelectorAll(selector);
            for (const panel of panels) {
                // Skip if this panel is inside an SVG
                if (panel.closest('svg')) continue;

                // Look for our device icon by data attribute
                const icon = panel.querySelector(`img[data-custom-icon-applied="true"][data-device-id="${deviceId}"]`);
                if (icon) {
                    const container = findContainerWithDeviceInfo(icon.parentElement, panel.parentElement) || panel;
                    return { icon, container };
                }

                // Also try finding by icon URL
                if (mapping.iconUrl) {
                    const iconByUrl = panel.querySelector(`img[src="${mapping.iconUrl}"]`);
                    if (iconByUrl) {
                        return { icon: iconByUrl, container: panel };
                    }
                }
            }
        }
        return null;
    }

    // Helper: Find device icon globally (fallback when not found in panels)
    function findDeviceIconGlobally(deviceId) {
        const globalIcon = document.querySelector(`img[data-custom-icon-applied="true"][data-device-id="${deviceId}"]`);
        if (globalIcon && !globalIcon.closest('svg')) {
            const container = findContainerWithDeviceInfo(globalIcon.parentElement, null);
            if (container) {
                return { icon: globalIcon, container };
            }
        }
        return null;
    }

    // Helper: Find any panel that contains the device's fingerprint image (original or replaced)
    function findPanelWithDeviceFingerprint(deviceId) {
        for (const selector of PANEL_SELECTORS) {
            const panels = document.querySelectorAll(selector);
            for (const panel of panels) {
                if (panel.closest('svg')) continue;

                // Check if panel has Manufacturer/Model fields (device details panel)
                const hasDeviceInfo = panel.textContent?.includes('Manufacturer') &&
                                     panel.textContent?.includes('Model');
                if (!hasDeviceInfo) continue;

                // Look for already-replaced icon
                const replacedIcon = panel.querySelector(`img[data-custom-icon-applied="true"][data-device-id="${deviceId}"]`);
                if (replacedIcon) {
                    return { icon: replacedIcon, container: panel };
                }

                // Look for ORIGINAL fingerprint icon (not yet replaced)
                const fingerprintImgs = panel.querySelectorAll('img[src*="fingerprint"]');
                for (const img of fingerprintImgs) {
                    const imgDeviceId = extractFingerprintId(img.src);
                    if (imgDeviceId === deviceId) {
                        return { icon: img, container: panel };
                    }
                }

                // Also check custom icon URL
                const mapping = customIconMappings[deviceId];
                if (mapping?.iconUrl) {
                    const customImg = panel.querySelector(`img[src="${mapping.iconUrl}"]`);
                    if (customImg) {
                        return { icon: customImg, container: panel };
                    }
                }
            }
        }
        return null;
    }

    // Helper: Apply all device info overrides to a container
    function applyDeviceOverrides(container, mapping, deviceIcon, deviceId) {
        // Applying device info overrides

        if (mapping.manufacturer) {
            replaceInfoField(container, 'Manufacturer', mapping.manufacturer);
        }
        if (mapping.model) {
            replaceInfoField(container, 'Model', mapping.model);
        }
        if (mapping.os) {
            replaceInfoField(container, 'OS', mapping.os);
        }
        if (mapping.deviceName) {
            replaceDeviceName(container, mapping.deviceName, deviceIcon);
        }

        // Reveal any content that was hidden for flash prevention
        revealReplacedContent(container);
    }

    // Replace device info text in side panel (main entry point)
    function replaceDeviceInfoInPanel(deviceId) {
        const mapping = customIconMappings[deviceId];
        if (!mapping) return;

        // Check if this mapping has ANY overrides to apply
        const hasOverrides = mapping.deviceName || mapping.manufacturer ||
                             mapping.model || mapping.os;
        if (!hasOverrides) return;

        // Strategy 1: Find panels with the device's fingerprint (original or replaced)
        let result = findPanelWithDeviceFingerprint(deviceId);

        // Strategy 2: Look for already-replaced icons in panels
        if (!result) {
            result = findDeviceIconInPanels(deviceId, mapping);
        }

        // Strategy 3: Global search but verify it's not in SVG
        if (!result) {
            result = findDeviceIconGlobally(deviceId);
        }

        if (!result?.container) {
            return; // No suitable container found
        }

        applyDeviceOverrides(result.container, mapping, result.icon, deviceId);
    }

    // Helper: Find the innermost element containing only text (no other elements)
    function findInnermostTextElement(el) {
        // If this element has only text nodes (no child elements), return it
        const hasChildElements = Array.from(el.childNodes).some(
            node => node.nodeType === Node.ELEMENT_NODE
        );
        if (!hasChildElements && el.textContent?.trim()) {
            return el;
        }
        // Otherwise, look at children
        for (const child of el.children) {
            const inner = findInnermostTextElement(child);
            if (inner) return inner;
        }
        return null;
    }

    // Helper: Replace text content while preserving element styling
    function replaceTextPreservingStyle(el, newValue) {
        // Find the innermost text-containing element
        const innermost = findInnermostTextElement(el) || el;

        // Save original for restoration
        if (!innermost.dataset.originalText) {
            innermost.dataset.originalText = innermost.textContent;
            innermost.dataset.infoOverridden = 'true';
        }

        // Replace only the text content of the innermost element
        // This preserves any parent structure and styling
        innermost.textContent = newValue;
        return innermost;
    }

    // Helper: Find and replace info field value
    function replaceInfoField(container, fieldLabel, newValue) {
        // Method 1: Look for label/value pairs in spans, divs, etc.
        const allText = container.querySelectorAll('span, div, p, td');
        let foundLabel = false;
        let labelElement = null;

        for (const el of allText) {
            const text = el.textContent?.trim();

            // If we found the label, the next sibling or nearby element is likely the value
            if (foundLabel && labelElement) {
                // Check if this element is a sibling or child and contains different text
                if (el !== labelElement && !el.contains(labelElement) && !labelElement.contains(el)) {
                    const elText = el.textContent?.trim();
                    // Make sure it's not another label
                    if (elText && elText !== fieldLabel && !['Manufacturer', 'Model', 'OS', 'IP Address', 'Hostname'].includes(elText)) {
                        replaceTextPreservingStyle(el, newValue);
                        // Field replaced
                        return;
                    }
                }
            }

            if (text === fieldLabel) {
                foundLabel = true;
                labelElement = el;
            }
        }

        // Method 2: Look for elements that might be structured as key-value
        // e.g., <div><span>Manufacturer</span><span>Sharp Corporation</span></div>
        container.querySelectorAll('div, tr').forEach(row => {
            const children = row.children;
            if (children.length >= 2) {
                for (let i = 0; i < children.length - 1; i++) {
                    if (children[i].textContent?.trim() === fieldLabel) {
                        const valueEl = children[i + 1];
                        replaceTextPreservingStyle(valueEl, newValue);
                        // Field replaced (method 2)
                        return;
                    }
                }
            }
        });
    }

    // Helper: Replace vendor text in table rows
    // Table rows have the icon and vendor cell at similar Y positions
    function replaceVendorInTableRow(iconImg, newVendor, deviceId) {
        if (!iconImg || !newVendor) return;

        const iconRect = iconImg.getBoundingClientRect();
        if (iconRect.y === 0) return; // Icon not visible

        // Find text elements at similar Y position that might be vendor cells
        // Vendor column is typically to the right of the name column
        const candidates = document.querySelectorAll('span, div, p');

        for (const el of candidates) {
            // Skip if already replaced
            if (el.dataset.vendorOverridden === 'true') continue;

            const rect = el.getBoundingClientRect();
            const yDiff = Math.abs(rect.y - iconRect.y);

            // Must be on the same row (within 15px vertically)
            if (yDiff > 15) continue;

            // Must be to the right of the icon (vendor column is after name)
            if (rect.x < iconRect.x + 100) continue;

            // Must be a leaf text node (no child elements with text)
            const hasChildText = Array.from(el.children).some(child => child.textContent?.trim());
            if (hasChildText) continue;

            const text = el.textContent?.trim();
            if (!text || text.length < 1 || text.length > 50) continue;

            // Skip if it looks like an IP address, MAC address, or other data
            if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(text)) continue;
            if (/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(text)) continue;
            if (/^\d+$/.test(text)) continue; // Pure numbers
            if (text.includes('.') && text.includes('/')) continue; // URLs/paths

            // Check if this could be the vendor column
            // It should be well to the right of the icon (at least 200px)
            // but not too far (like IP address columns which are even further right)
            const distFromIcon = rect.x - iconRect.x;
            if (distFromIcon > 200 && distFromIcon < 450) {
                // This is likely the vendor column
                if (!el.dataset.originalVendor) {
                    el.dataset.originalVendor = text;
                }
                el.dataset.vendorOverridden = 'true';
                el.dataset.vendorDeviceId = deviceId;
                el.textContent = newVendor;
                // Vendor replaced in table row
                return; // Only replace one per row
            }
        }
    }

    // Helper: Replace device name/type in panel header
    function replaceDeviceName(container, newName, deviceIcon) {
        // Method 1: Find device type text near the icon (sibling of icon's container)
        // Structure: parent -> [icon-container, info-container with device type]
        if (deviceIcon) {
            const iconContainer = deviceIcon.parentElement;
            const iconGrandparent = iconContainer?.parentElement;

            if (iconGrandparent) {
                // Look for sibling containers that might have the device type
                for (const sibling of iconGrandparent.children) {
                    if (sibling === iconContainer) continue;

                    // Find <p> tags with bold styling (device type display)
                    const pTags = sibling.querySelectorAll('p');
                    for (const p of pTags) {
                        const text = p.textContent?.trim();
                        // Skip if empty, too short, or looks like a MAC address
                        if (!text || text.length < 3) continue;
                        if (/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(text)) continue;
                        // Skip common labels
                        if (['Manufacturer', 'Model', 'OS', 'IP Address', 'Hostname', 'Change Icon'].includes(text)) continue;

                        // Check if it has bold styling (device type usually does)
                        const isBold = p.className?.includes('bold') ||
                                      window.getComputedStyle(p).fontWeight >= 600;

                        if (isBold) {
                            // Use helper to preserve inner element styling
                            const replaced = replaceTextPreservingStyle(p, newName);
                            replaced.dataset.originalDeviceType = replaced.dataset.originalText;
                            replaced.dataset.deviceTypeOverridden = 'true';
                            // Set title attribute to override tooltip on truncated text
                            p.title = newName;
                            // Also try to update parent's title if it exists
                            if (p.parentElement) {
                                p.parentElement.title = newName;
                            }
                            // Device type replaced
                            return;
                        }
                    }
                }
            }
        }

        // Method 2: Look for prominent text elements (h1-h4, title/name/header classes)
        const candidates = container.querySelectorAll('h1, h2, h3, h4, [class*="title"], [class*="name"], [class*="header"] span, [class*="Header"] span');

        for (const el of candidates) {
            const text = el.textContent?.trim();
            if (!text || text.length < 2) continue;
            if (['Manufacturer', 'Model', 'OS', 'IP Address', 'Hostname', 'VLAN', 'Virtual Network', 'Change Icon'].includes(text)) continue;

            const nearIcon = el.closest('div')?.querySelector('img[data-custom-icon-applied]');
            if (nearIcon || el.closest('[class*="header"]') || el.closest('[class*="Header"]')) {
                // Use helper to preserve inner element styling
                const replaced = replaceTextPreservingStyle(el, newName);
                replaced.dataset.originalDeviceName = replaced.dataset.originalText;
                replaced.dataset.deviceNameOverridden = 'true';
                // Device name replaced
                return;
            }
        }
    }

    // ==================== End Custom Icon URL Replacement ====================

    // DISABLED: API endpoints can contain user device data mixed with official fingerprints
    // The ONLY clean source is the icon picker modal's React fiber data
    async function fetchFingerprintDatabase() {
        // No-op - we only use the React fiber extraction from the icon picker modal
        // This ensures we ONLY get official fingerprint IDs, not user device names
        // Database fetch disabled - use icon picker modal for clean data
    }

    // Transform API response data to apply custom device mappings
    function transformResponseData(data) {
        if (!data || typeof data !== 'object') return data;
        if (Object.keys(customIconMappings).length === 0) return data;

        const transform = (obj, keyAsId = null) => {
            if (!obj || typeof obj !== 'object') return obj;

            // Handle arrays
            if (Array.isArray(obj)) {
                return obj.map(item => transform(item));
            }

            // Clone the object to avoid mutating original
            const result = { ...obj };

            // Special handling for dev_ids structure: { "500": { name: "...", ... } }
            // The fingerprint ID is the KEY, not a property
            if (result.dev_ids && typeof result.dev_ids === 'object') {
                const transformedDevIds = {};
                for (const [devId, deviceInfo] of Object.entries(result.dev_ids)) {
                    if (customIconMappings[devId] && deviceInfo && typeof deviceInfo === 'object') {
                        const mapping = customIconMappings[devId];
                        const transformed = { ...deviceInfo };

                        if (mapping.deviceName && transformed.name !== undefined) {
                            transformed.name = mapping.deviceName;
                        }
                        if (mapping.manufacturer && transformed.manufacturer !== undefined) {
                            transformed.manufacturer = mapping.manufacturer;
                        }
                        if (mapping.model && transformed.model !== undefined) {
                            transformed.model = mapping.model;
                        }
                        if (mapping.os) {
                            // OS might be in os_name or os_class
                            if (transformed.os_name !== undefined) transformed.os_name = mapping.os;
                            if (transformed.os_class !== undefined) transformed.os_class = mapping.os;
                        }

                        // Transformed dev_ids entry
                        transformedDevIds[devId] = transformed;
                    } else {
                        transformedDevIds[devId] = deviceInfo;
                    }
                }
                result.dev_ids = transformedDevIds;
                return result;
            }

            // Check if this object has a fingerprint ID we have a mapping for
            const fingerprintId = keyAsId || result.dev_id || result.fingerprint_dev_id ||
                                  result.fingerprint?.id || result.id || result.dev_type_id;

            if (fingerprintId && customIconMappings[fingerprintId]) {
                const mapping = customIconMappings[fingerprintId];

                // Replace device name/type fields
                if (mapping.deviceName) {
                    if (result.name !== undefined) result.name = mapping.deviceName;
                    if (result.display_name !== undefined) result.display_name = mapping.deviceName;
                    if (result.computed_name !== undefined) result.computed_name = mapping.deviceName;
                    if (result.device_name !== undefined) result.device_name = mapping.deviceName;
                }

                // Replace fingerprint/device type info
                if (result.fingerprint && typeof result.fingerprint === 'object') {
                    result.fingerprint = { ...result.fingerprint };
                    if (mapping.deviceName && result.fingerprint.name !== undefined) {
                        result.fingerprint.name = mapping.deviceName;
                    }
                    if (mapping.manufacturer && result.fingerprint.manufacturer !== undefined) {
                        result.fingerprint.manufacturer = mapping.manufacturer;
                    }
                    if (mapping.model && result.fingerprint.model !== undefined) {
                        result.fingerprint.model = mapping.model;
                    }
                    if (mapping.os) {
                        if (result.fingerprint.os !== undefined) result.fingerprint.os = mapping.os;
                        if (result.fingerprint.os_name !== undefined) result.fingerprint.os_name = mapping.os;
                    }
                }

                // Direct fields on the object
                if (mapping.manufacturer && result.manufacturer !== undefined) {
                    result.manufacturer = mapping.manufacturer;
                }
                if (mapping.model && result.model !== undefined) {
                    result.model = mapping.model;
                }
                if (mapping.os) {
                    if (result.os !== undefined) result.os = mapping.os;
                    if (result.os_name !== undefined) result.os_name = mapping.os;
                }

                // Transformed API data
            }

            // Recursively transform nested objects
            for (const key of Object.keys(result)) {
                if (result[key] && typeof result[key] === 'object') {
                    result[key] = transform(result[key]);
                }
            }

            return result;
        };

        return transform(data);
    }

    // Hook into fetch to intercept and transform API responses
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);

        try {
            const url = args[0]?.url || args[0];
            if (typeof url === 'string') {
                // Check if we need to transform for custom icon display
                const needsTransformation = Object.keys(customIconMappings).length > 0 &&
                    (url.includes('fingerprint') ||
                     url.includes('device') ||
                     url.includes('stat/sta') ||
                     url.includes('stat/user') ||
                     url.includes('clients'));

                if (needsTransformation) {
                    // Clone and read the response
                    const cloned = response.clone();
                    try {
                        const data = await cloned.json();

                        // Try to process for fingerprint capture (will only work if 1000+ items)
                        processApiResponse(url, data);

                        // Transform the data with our custom mappings
                        const transformedData = transformResponseData(data);

                        // Create a new response with transformed data
                        const newResponse = new Response(JSON.stringify(transformedData), {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers
                        });

                        return newResponse;
                    } catch (e) {
                        // If JSON parsing fails, return original response
                        return response;
                    }
                }
            }
        } catch (e) {
            // Silently ignore errors
        }

        return response;
    };

    // XHR hook removed - the icon picker modal data is loaded via React internals,
    // not via XHR. We rely on the React fiber extraction method instead.

    // Process intercepted API responses
    // ONLY captures data from the icon picker modal format (1000+ items with id + subtitle)
    // This prevents user device names from being captured
    function processApiResponse(url, data) {
        // Look for icon picker modal data format ONLY
        // Must have: items array with 1000+ entries, each with id and subtitle
        let items = [];

        if (data?.items && Array.isArray(data.items)) {
            items = data.items;
        } else if (data?.data?.items && Array.isArray(data.data.items)) {
            items = data.data.items;
        }

        // ONLY process if we have 1000+ items (icon picker modal has ~5500)
        // This filters out small API responses that might contain user devices
        if (items.length < 1000) {
            return;
        }

        // Extract ONLY items with the official fingerprint structure
        let count = 0;
        items.forEach(item => {
            // Must have: id and subtitle (the official product name)
            if (item && item.id && item.subtitle) {
                capturedFingerprints[item.id] = item.subtitle;
                count++;
            }
        });

        if (count > 1000) {
            // Extracted official fingerprints from icon picker modal
            fullDatabaseFetched = true;

            window.postMessage({
                type: `${EXTENSION_ID}-fingerprints`,
                data: capturedFingerprints,
                replaceRegistry: true,
                source: 'icon-picker-complete'
            }, '*');
        }
    }

    // Extract fingerprints from React fiber - ONLY from icon picker modal
    // This is the ONLY reliable source of clean fingerprint data
    // The icon picker modal has memoizedProps.data.items with 5000+ entries
    function extractFromReact() {
        function findReactFiber(el) {
            for (const key in el) {
                if (key.startsWith('__reactFiber')) return el[key];
            }
            return null;
        }

        const visited = new WeakSet();
        let found = null;

        function search(fiber, depth = 0) {
            if (!fiber || depth > 50 || visited.has(fiber) || found) return;
            visited.add(fiber);

            // ONLY look for the icon picker modal's data structure
            // It has memoizedProps.data.items with 1000+ entries
            // Each item has: id (number), subtitle (official name), image
            if (fiber.memoizedProps?.data?.items?.length > 1000) {
                found = fiber.memoizedProps.data.items;
                return;
            }

            // Traverse fiber tree
            if (fiber.child) search(fiber.child, depth + 1);
            if (fiber.sibling) search(fiber.sibling, depth + 1);
        }

        // Scan all DOM elements for React fiber
        document.querySelectorAll('*').forEach(el => {
            const f = findReactFiber(el);
            if (f && !found) search(f);
        });

        // Extract clean data from found items
        const map = {};
        if (found) {
            found.forEach(item => {
                // ONLY accept items with proper structure:
                // - id: numeric fingerprint ID
                // - subtitle: official product name
                if (item.id && item.subtitle) {
                    map[item.id] = item.subtitle;
                }
            });
            // Found items from icon picker modal
        }

        return map;
    }

    // Periodic extraction from React state (icon picker modal)
    let extractionInterval = null;

    function startPeriodicExtraction() {
        if (extractionInterval) return;

        extractionInterval = setInterval(() => {
            const reactData = extractFromReact();
            const count = Object.keys(reactData).length;

            // ONLY send if we found 1000+ items (icon picker modal has ~5500)
            // This ensures we only capture the clean icon picker data
            if (count > 1000) {
                // Replace entire captured fingerprints with this clean data
                capturedFingerprints = reactData;

                // Periodic extraction found items - replacing registry
                window.postMessage({
                    type: `${EXTENSION_ID}-fingerprints`,
                    data: capturedFingerprints,
                    replaceRegistry: true,
                    source: 'react-complete'
                }, '*');

                // Stop periodic extraction once we have the complete list
                if (extractionInterval) {
                    clearInterval(extractionInterval);
                    extractionInterval = null;
                    // Periodic extraction stopped - complete list obtained
                }
            }
        }, 2000); // Check every 2 seconds

        // Stop after 60 seconds to save resources
        setTimeout(() => {
            if (extractionInterval) {
                clearInterval(extractionInterval);
                extractionInterval = null;
            }
        }, 60000);
    }

    // Listen for messages from content script
    window.addEventListener('message', (event) => {
        if (event.data?.type === `${EXTENSION_ID}-extract`) {
            // Manual extraction triggered - extract from React fiber
            const reactData = extractFromReact();
            const count = Object.keys(reactData).length;

            // ONLY send if we found 1000+ items (clean icon picker data)
            if (count > 1000) {
                capturedFingerprints = reactData;
                // Manual extraction successful
                window.postMessage({
                    type: `${EXTENSION_ID}-fingerprints`,
                    data: capturedFingerprints,
                    replaceRegistry: true,
                    source: 'manual-extract'
                }, '*');
            } else {
                // Not enough items - open icon picker modal for clean data
            }
        }

        if (event.data?.type === `${EXTENSION_ID}-fetch-database`) {
            // Disabled - we only use React fiber extraction
            // Database fetch disabled - use icon picker modal
        }

        // Receive custom icon mappings from content script
        if (event.data?.type === `${EXTENSION_ID}-custom-icons`) {
            const newMappings = event.data.mappings || {};
            const count = Object.keys(newMappings).length;

            if (count > 0) {
                // Received custom icon mappings
                customIconMappings = newMappings;

                // Immediately replace any icons currently in the DOM
                replaceIconsInDom();

                // Also try to apply device info to any already-open panels
                setTimeout(() => {
                    Object.keys(customIconMappings).forEach(deviceId => {
                        replaceDeviceInfoInPanel(deviceId);
                    });
                }, 200);
            } else {
                // Custom icon mappings cleared
                customIconMappings = {};

                // Restore original icons if any were replaced
                document.querySelectorAll('img[data-custom-icon-applied]').forEach(img => {
                    if (img.dataset.originalSrc) {
                        img.src = img.dataset.originalSrc;
                        delete img.dataset.originalSrc;
                    }
                    if (img.dataset.originalSrcset) {
                        img.srcset = img.dataset.originalSrcset;
                        delete img.dataset.originalSrcset;
                    }
                    delete img.dataset.customIconApplied;
                });
            }
        }
    });

    // Start periodic extraction and fetch database when page is ready
    function initialize() {
        // First, try to fetch the complete database
        fetchFingerprintDatabase();

        // Also start periodic extraction as backup
        startPeriodicExtraction();

        // Set up the custom icon replacement observer
        setupIconReplacementObserver();

        // Set up the device info watcher for faster replacement
        setupDeviceInfoWatcher();

        // Request custom icon mappings from content script
        window.postMessage({ type: `${EXTENSION_ID}-request-custom-icons` }, '*');

        // Custom icon replacement enabled
    }

    if (document.readyState === 'complete') {
        initialize();
    } else {
        window.addEventListener('load', initialize);
    }

    // Also extract on scroll (icon modal uses virtual scrolling)
    let scrollTimeout;
    document.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const reactData = extractFromReact();
            const count = Object.keys(reactData).length;

            // ONLY send if we found 1000+ items (clean icon picker data)
            if (count > 1000) {
                capturedFingerprints = reactData;
                window.postMessage({
                    type: `${EXTENSION_ID}-fingerprints`,
                    data: capturedFingerprints,
                    replaceRegistry: true,
                    source: 'scroll-extract'
                }, '*');
            }
        }, 500);
    }, true);

    // Debug function exposed to window for troubleshooting
    window.__unifiIconBrowserDebug = {
        getMappings: () => customIconMappings,
        getFingerprints: () => capturedFingerprints,
        forceReplaceIcons: () => replaceIconsInDom(),
        forceReplaceInfo: (deviceId) => {
            if (deviceId) {
                replaceDeviceInfoInPanel(deviceId);
            } else {
                Object.keys(customIconMappings).forEach(id => replaceDeviceInfoInPanel(id));
            }
        },
        scanAllPanels: () => scanAndReplaceAllPanels(),
        replaceAllVendors: () => {
            document.querySelectorAll('img[data-custom-icon-applied="true"]').forEach(img => {
                const deviceId = img.dataset.deviceId;
                if (deviceId && customIconMappings[deviceId]?.manufacturer) {
                    replaceVendorInTableRow(img, customIconMappings[deviceId].manufacturer, deviceId);
                }
            });
        },
        inspectPanels: () => {
            const panelSelectors = [
                '[class*="panel"]', '[class*="Panel"]',
                '[class*="sidebar"]', '[class*="Sidebar"]',
                '[class*="detail"]', '[class*="Detail"]',
                '[class*="modal"]', '[class*="Modal"]',
                '[class*="drawer"]', '[class*="Drawer"]',
                '[class*="pane"]', '[class*="Pane"]',
                '[role="dialog"]', '[role="complementary"]'
            ];
            const panels = document.querySelectorAll(panelSelectors.join(', '));
            console.log(`[Debug] Found ${panels.length} potential panels`);
            panels.forEach((panel, i) => {
                const imgs = panel.querySelectorAll('img');
                const fingerprintImgs = panel.querySelectorAll('img[src*="fingerprint"]');
                const customImgs = panel.querySelectorAll('img[data-custom-icon-applied]');
                console.log(`[Debug] Panel ${i}: class="${panel.className}", imgs=${imgs.length}, fingerprint=${fingerprintImgs.length}, custom=${customImgs.length}`);
                fingerprintImgs.forEach(img => console.log(`  - fingerprint: ${img.src}`));
                customImgs.forEach(img => console.log(`  - custom: ${img.src}, deviceId=${img.dataset.deviceId}`));
            });
        },
        inspectAllImages: () => {
            const imgs = document.querySelectorAll('img[src*="fingerprint"], img[data-custom-icon-applied]');
            console.log(`[Debug] Found ${imgs.length} fingerprint/custom images`);
            imgs.forEach(img => {
                console.log(`  - src: ${img.src}, custom: ${img.dataset.customIconApplied}, deviceId: ${img.dataset.deviceId}`);
            });
        },
        traceContainer: (deviceId) => {
            const mapping = customIconMappings[deviceId];
            if (!mapping) {
                console.log(`[Debug] No mapping for device ${deviceId}`);
                return;
            }
            console.log(`[Debug] Mapping for ${deviceId}:`, mapping);

            // Find the device icon
            let deviceIcon = document.querySelector(`img[data-custom-icon-applied="true"][data-device-id="${deviceId}"]`);
            if (!deviceIcon && mapping.iconUrl) {
                deviceIcon = document.querySelector(`img[src="${mapping.iconUrl}"]`);
            }

            if (!deviceIcon) {
                console.log(`[Debug] No icon found for device ${deviceId}`);
                return;
            }

            console.log(`[Debug] Found icon:`, deviceIcon);

            // Walk up and show what we find
            let container = deviceIcon.parentElement;
            let level = 0;
            while (container && level < 15) {
                const textContent = container.textContent || '';
                const hasManufacturer = textContent.includes('Manufacturer');
                const hasModel = textContent.includes('Model');
                const hasOS = textContent.includes('OS');
                console.log(`[Debug] Level ${level}: ${container.tagName}.${container.className?.split(' ')[0] || ''} - Manufacturer:${hasManufacturer}, Model:${hasModel}, OS:${hasOS}`);
                if (hasManufacturer && hasModel) {
                    console.log(`[Debug] ^^^ This would be the container`);
                }
                container = container.parentElement;
                level++;
            }
        }
    };
    // Debug functions available: window.__unifiIconBrowserDebug

    // UniFi Icon Browser injected script loaded
})();
