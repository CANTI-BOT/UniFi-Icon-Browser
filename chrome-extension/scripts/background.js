// UniFi Icon Browser - Background Service Worker

// Import shared modules
importScripts('config.js', 'utils.js', 'storageManager.js');

// Install handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('UniFi Icon Browser installed');

        // Initialize storage with empty registry
        chrome.storage.local.set({
            unifiDeviceRegistry: {},
            settings: {
                sortOrder: 'desc',
                devicesPerPage: 50,
                autoExtract: true
            }
        });
    } else if (details.reason === 'update') {
        console.log('UniFi Icon Browser updated to version', chrome.runtime.getManifest().version);
    }

});

// Inject content script manually (for local controllers not matching URL patterns)
async function injectContentScript(tab) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['scripts/content.js']
        });

        // Also inject the page script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const script = document.createElement('script');
                script.src = chrome.runtime.getURL('scripts/injected.js');
                script.onload = function() { this.remove(); };
                (document.head || document.documentElement).appendChild(script);
            }
        });

        showBadge(tab.id, '✓', Config.COLORS.SUCCESS_BADGE);
        console.log('Content script injected into tab', tab.id);
    } catch (error) {
        console.error('Failed to inject content script:', error);
        showBadge(tab.id, '!', Config.COLORS.ERROR_BADGE);
    }
}

// Trigger extraction from context menu
async function triggerExtraction(tab) {
    try {
        // First try to inject the script in case it's not already there
        await injectContentScript(tab);

        // Then request extraction
        setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'extractDevices' }, async (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Could not extract devices:', chrome.runtime.lastError.message);
                    showBadge(tab.id, '!', Config.COLORS.ERROR_BADGE);
                    return;
                }

                if (response && response.devices) {
                    await saveDevicesToRegistry(response.devices, tab.id);
                }
            });
        }, 500);
    } catch (error) {
        console.error('Extraction error:', error);
    }
}

// Save devices to registry with timestamps - delegating to StorageManager
async function saveDevicesToRegistry(devices, tabId = null) {
    const result = await StorageManager.saveDevicesToRegistry(devices);

    const count = Object.keys(devices).length;
    console.log(`Saved ${count} devices (${result.newCount} new) to registry. Total: ${result.totalCount}`);

    // Show badge
    if (tabId) {
        showBadge(tabId, count.toString(), Config.COLORS.SUCCESS_BADGE);
    }

    return { newCount: result.newCount, totalCount: result.totalCount };
}

// Show badge on extension icon
function showBadge(tabId, text, color) {
    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });

    // Clear badge after timeout
    setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId });
    }, Config.TIMEOUTS.NOTIFICATION_DISPLAY);
}

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'replaceRegistry':
            // REPLACE entire registry with clean data (from complete icon picker list)
            (async () => {
                const devices = request.devices;
                const count = Object.keys(devices).length;
                console.log(`[UniFi Icon Browser] REPLACING registry with ${count} clean fingerprints`);

                // Convert to registry format with timestamps
                const now = Date.now();
                const registry = {};
                for (const [id, name] of Object.entries(devices)) {
                    registry[id] = { name, addedAt: now };
                }

                // Replace entire registry
                const success = await StorageManager.saveRegistry(registry);

                if (success && sender.tab?.id) {
                    showBadge(sender.tab.id, count.toString(), Config.COLORS.SUCCESS_BADGE);
                }

                sendResponse({ success, count });
            })();
            return true;

        case 'autoSaveDevices':
            // Auto-save from content script (merge mode)
            saveDevicesToRegistry(request.devices, sender.tab?.id).then(result => {
                sendResponse(result);
            });
            return true;

        case 'getRegistry':
            StorageManager.getRegistry().then(registry => {
                sendResponse({ registry });
            });
            return true;

        case 'saveToRegistry':
            StorageManager.saveDevicesToRegistry(request.devices).then(result => {
                sendResponse({ success: result.success, count: result.totalCount });
            });
            return true;

        case 'clearRegistry':
            StorageManager.clearRegistry().then(success => {
                sendResponse({ success });
            });
            return true;

        case 'exportRegistry':
            StorageManager.exportRegistry().then(registry => {
                sendResponse({ registry });
            });
            return true;

        case 'importRegistry':
            StorageManager.importRegistry(request.data, true).then(result => {
                sendResponse({ success: result.success, newCount: result.count, totalCount: result.count });
            });
            return true;

        case 'injectScript':
            // Request to inject content script into a specific tab
            if (request.tabId) {
                injectContentScript({ id: request.tabId }).then(() => {
                    sendResponse({ success: true });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
            }
            return true;
    }
});

// Listen for tab updates to auto-detect UniFi pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Check if this looks like a UniFi page
        if (Utils.isUnifiUrl(tab.url)) {
            // Try to inject the content script
            try {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['scripts/content.js']
                });
                console.log('Auto-injected content script into UniFi page:', tab.url);
            } catch (e) {
                // Script may already be injected or page doesn't allow it
            }
        }
    }
});

console.log('UniFi Icon Browser: Background service worker started');
