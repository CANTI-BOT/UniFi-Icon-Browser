// UniFi Icon Browser - Content Script
// Runs on UniFi portal pages to extract device names

(function() {
    'use strict';

    const EXTENSION_ID = 'unifi-icon-browser';
    let collectedDevices = {};
    let isUnifiPage = false;
    let customIconMappings = {};

    // Detect if we're on a UniFi page (cloud or local)
    function detectUnifiPage() {
        // Check URL patterns
        const url = window.location.href;
        if (url.includes('ui.com') ||
            url.includes('unifi') ||
            url.includes('/network') ||
            url.includes('/protect')) {
            return true;
        }

        // Check for UniFi-specific elements
        if (document.querySelector('[class*="unifi"]') ||
            document.querySelector('[class*="Unifi"]') ||
            document.querySelector('[data-testid*="unifi"]') ||
            document.title.toLowerCase().includes('unifi')) {
            return true;
        }

        // Check for UniFi controller API patterns in the page
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            if (script.src && (script.src.includes('unifi') || script.src.includes('ubnt'))) {
                return true;
            }
        }

        return false;
    }

    // Inject the page script to access React internals
    function injectScript() {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('scripts/injected.js');
        script.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(script);
    }

    // Load custom icon mappings from storage and send to injected script
    async function loadAndSendCustomIcons() {
        try {
            const result = await chrome.storage.local.get('customIconMappings');
            customIconMappings = result.customIconMappings || {};

            // Store in localStorage for synchronous access by injected script
            // This allows the fetch hook to have mappings before any API calls
            try {
                localStorage.setItem('unifi-icon-browser-mappings', JSON.stringify(customIconMappings));
            } catch (e) {
                console.warn('[UniFi Icon Browser] Could not store mappings in localStorage:', e);
            }

            // Send to injected script
            window.postMessage({
                type: `${EXTENSION_ID}-custom-icons`,
                mappings: customIconMappings
            }, '*');

            // Custom icon mappings sent to page
        } catch (error) {
            console.error('[UniFi Icon Browser] Failed to load custom icons:', error);
        }
    }

    // Listen for messages from injected script
    window.addEventListener('message', (event) => {
        if (event.data?.type === `${EXTENSION_ID}-fingerprints`) {
            const newData = event.data.data;
            const source = event.data.source || 'unknown';
            const replaceRegistry = event.data.replaceRegistry || false;

            if (newData && typeof newData === 'object') {
                const totalNew = Object.keys(newData).length;

                // If replaceRegistry is true, this is the complete clean list from icon picker
                // Replace our collected devices entirely and tell background to replace registry
                if (replaceRegistry) {
                    // Received complete fingerprint list - replacing registry
                    collectedDevices = newData;  // Replace, don't merge
                    chrome.runtime.sendMessage({
                        action: 'replaceRegistry',
                        devices: newData
                    });
                } else {
                    const newCount = Object.keys(newData).filter(k => !collectedDevices[k]).length;
                    Object.assign(collectedDevices, newData);

                    if (newCount > 0) {
                        // Collected new devices
                        chrome.runtime.sendMessage({
                            action: 'autoSaveDevices',
                            devices: collectedDevices
                        });
                    }
                }
            }
        }

        // Handle request for custom icon mappings from injected script
        if (event.data?.type === `${EXTENSION_ID}-request-custom-icons`) {
            loadAndSendCustomIcons();
        }
    });

    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractDevices') {
            // Trigger manual extraction
            window.postMessage({ type: `${EXTENSION_ID}-extract` }, '*');

            // Also do DOM extraction
            const domDevices = extractFromDOM();
            Object.assign(collectedDevices, domDevices);

            // Return all collected devices
            setTimeout(() => {
                sendResponse({ devices: collectedDevices });
            }, 500);

            return true;
        }

        if (request.action === 'getCollectedDevices') {
            sendResponse({ devices: collectedDevices });
            return true;
        }

        if (request.action === 'isUnifiPage') {
            sendResponse({ isUnifi: isUnifiPage });
            return true;
        }

        if (request.action === 'fetchDatabase') {
            // Request the injected script to fetch the complete database
            window.postMessage({ type: `${EXTENSION_ID}-fetch-database` }, '*');
            sendResponse({ initiated: true });
            return true;
        }

        if (request.action === 'reloadCustomIcons') {
            // Reload custom icon mappings (triggered from options page)
            loadAndSendCustomIcons();
            sendResponse({ success: true });
            return true;
        }
    });

    // Extract device info from DOM
    function extractFromDOM() {
        const map = {};

        // Method 1: Extract from elements with IDs that look like device IDs
        document.querySelectorAll('[id]').forEach(el => {
            const id = parseInt(el.id);
            if (!isNaN(id) && id > 0 && id < 100000) {
                // Look for name in various places
                const subtitle = el.querySelector('h4.subtitle__ICtDbrLE, h4[class*="subtitle"], .subtitle__ICtDbrLE, [class*="subtitle"]');
                const title = el.querySelector('[class*="title"], h3, h4');
                const name = subtitle?.textContent?.trim() ||
                             title?.textContent?.trim() ||
                             el.querySelector('img')?.alt?.trim();

                if (name && name.length > 0 && name.length < 100) {
                    map[id] = name;
                }
            }
        });

        // Method 2: Extract from fingerprint images
        document.querySelectorAll('img[src*="fingerprint"]').forEach(img => {
            const match = img.src.match(/fingerprint\/\d+\/(\d+)_/);
            if (match) {
                const id = match[1];
                // Look for name near the image
                const card = img.closest('[class*="card"], [class*="Card"], [class*="item"], [class*="Item"]');
                if (card) {
                    const nameEl = card.querySelector('[class*="name"], [class*="title"], [class*="subtitle"], h3, h4, p');
                    const name = nameEl?.textContent?.trim() || img.alt;
                    if (name && name.length > 0) {
                        map[id] = name;
                    }
                } else if (img.alt) {
                    map[id] = img.alt;
                }
            }
        });

        // Method 3: Extract from data attributes
        document.querySelectorAll('[data-device-id], [data-id], [data-fingerprint-id]').forEach(el => {
            const id = el.dataset.deviceId || el.dataset.id || el.dataset.fingerprintId;
            if (id) {
                const name = el.dataset.name ||
                             el.dataset.deviceName ||
                             el.querySelector('[class*="name"]')?.textContent?.trim();
                if (name) {
                    map[id] = name;
                }
            }
        });

        // Method 4: Look for grid/list items with device info
        document.querySelectorAll('[class*="Grid"] > div, [class*="grid"] > div, [role="listitem"]').forEach(item => {
            const img = item.querySelector('img[src*="fingerprint"]');
            if (img) {
                const match = img.src.match(/fingerprint\/\d+\/(\d+)_/);
                if (match) {
                    const id = match[1];
                    const nameEl = item.querySelector('[class*="subtitle"], [class*="name"], h4, p');
                    const name = nameEl?.textContent?.trim() || img.alt;
                    if (name) {
                        map[id] = name;
                    }
                }
            }
        });

        return map;
    }

    // Extract from React fiber tree (backup method)
    function extractFromReact() {
        const map = {};
        const visited = new WeakSet();

        function findReactFiber(el) {
            for (const key in el) {
                if (key.startsWith('__reactFiber') ||
                    key.startsWith('__reactInternalInstance') ||
                    key === '_reactInternalFiber' ||
                    key === '_reactInternalInstance') {
                    return el[key];
                }
            }
            return null;
        }

        function checkFiber(fiber, depth = 0) {
            if (!fiber || depth > 30 || visited.has(fiber)) return false;
            visited.add(fiber);

            // Check memoizedProps first (most likely location)
            if (fiber.memoizedProps?.itemData?.items) {
                const items = fiber.memoizedProps.itemData.items;
                if (Array.isArray(items) && items.length > 0) {
                    items.forEach(item => {
                        if (item.id && item.subtitle) {
                            map[item.id] = item.subtitle;
                        }
                    });
                    return true;
                }
            }

            // Check props
            if (fiber.props?.itemData?.items) {
                const items = fiber.props.itemData.items;
                if (Array.isArray(items) && items.length > 0) {
                    items.forEach(item => {
                        if (item.id && item.subtitle) {
                            map[item.id] = item.subtitle;
                        }
                    });
                    return true;
                }
            }

            // Traverse if we haven't found it yet
            if (depth < 25) {
                if (fiber.child) checkFiber(fiber.child, depth + 1);
                if (fiber.sibling) checkFiber(fiber.sibling, depth + 1);
                if (fiber.return && depth < 10) checkFiber(fiber.return, depth + 1);
            }

            return false;
        }

        // Scan key elements
        const selectors = ['.Grid', '[class*="Grid"]', '[class*="modal"]', '[role="dialog"]', '[class*="container"]'];
        for (const selector of selectors) {
            document.querySelectorAll(selector).forEach(el => {
                const fiber = findReactFiber(el);
                if (fiber) checkFiber(fiber);
            });
        }

        return map;
    }

    // Initialize - runs at document_start, before page scripts
    async function init() {
        isUnifiPage = detectUnifiPage();

        if (isUnifiPage || window.location.href.includes('ui.com')) {
            // Content script initialized on UniFi page

            // CRITICAL: Load mappings and inject script as fast as possible
            // We need to hook fetch BEFORE the page's scripts run

            // Start loading mappings immediately (don't await yet)
            const mappingsPromise = chrome.storage.local.get('customIconMappings');

            // Try to get mappings synchronously if they're already in localStorage
            // (from a previous page load)
            try {
                // Try to get mappings from localStorage for immediate injection
                localStorage.getItem('unifi-icon-browser-mappings');
            } catch (e) {}

            // Inject the script IMMEDIATELY - it will read from localStorage
            injectScript();

            // Now wait for fresh mappings and update localStorage
            try {
                const result = await mappingsPromise;
                const mappings = result.customIconMappings || {};
                localStorage.setItem('unifi-icon-browser-mappings', JSON.stringify(mappings));
            } catch (e) {
                // Could not load mappings
            }

            // Also send via postMessage for any updates (after DOM is ready)
            const setupDomDependentParts = () => {
                setTimeout(loadAndSendCustomIcons, 500);

                // NOTE: DOM extraction is DISABLED because it can capture user device names
                // instead of official fingerprint product names. All fingerprint data should
                // come from the injected.js script which extracts from the clean React
                // data source (memoizedProps.data.items with subtitle field).
                // The injected script will send a 'replaceRegistry' message when it
                // captures the complete clean list from the icon picker modal.
            };

            // Wait for DOM to be ready for the DOM-dependent parts
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupDomDependentParts);
            } else {
                setupDomDependentParts();
            }
        }
    }

    // Run init IMMEDIATELY at document_start - don't wait for DOM
    // The critical part (script injection) doesn't need the DOM
    init();

    // Content script loaded
})();
