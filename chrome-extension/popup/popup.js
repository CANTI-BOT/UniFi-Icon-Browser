// UniFi Icon Browser - Popup Script
// Dependencies: config.js, utils.js, storageManager.js (loaded via popup.html)

const UNIFI_IMAGE_BASE = Config.URLS.UNIFI_IMAGE_BASE;
const DEVICES_PER_PAGE = Config.PAGINATION.DEVICES_PER_PAGE;

let allDevicesList = [];
let currentPage = 0;
let isLoading = false;
let currentContextIcon = null;
let currentTabId = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const fetchDbBtn = document.getElementById('fetchDbBtn');
const activateBtn = document.getElementById('activateBtn');
const optionsBtn = document.getElementById('optionsBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const deviceCount = document.getElementById('deviceCount');
const lastUpdated = document.getElementById('lastUpdated');
const resultsCount = document.getElementById('resultsCount');
const iconsGrid = document.getElementById('iconsGrid');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const notification = document.getElementById('notification');
const contextMenu = document.getElementById('contextMenu');
const resultsSection = document.getElementById('resultsSection');

// Tab elements
const popupTabBtns = document.querySelectorAll('.popup-tab-btn');
const devicesPanel = document.getElementById('devicesPanel');
const customPanel = document.getElementById('customPanel');
const customIconsList = document.getElementById('customIconsList');
const noCustomIcons = document.getElementById('noCustomIcons');
const customBadge = document.getElementById('customBadge');
const addCustomBtn = document.getElementById('addCustomBtn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadBundledDatabaseIfNeeded();
    await updateDeviceCount();
    await updateLastUpdated();
    await updateCustomIconsBadge();
    await checkCurrentPage();
    setupEventListeners();
    setupTabNavigation();
    setupInfiniteScroll();

    // Auto-load all icons on popup open
    await loadAllDevicesSilently();
});

// Load bundled database on first run (if registry is empty)
async function loadBundledDatabaseIfNeeded() {
    const registry = await getRegistry();
    const count = Object.keys(registry).length;

    // If registry is empty or very small, load the bundled database
    if (count < 100) {
        try {
            const dbUrl = chrome.runtime.getURL('data/fingerprint-database.json');
            const response = await fetch(dbUrl);

            if (response.ok) {
                const bundledData = await response.json();
                const bundledCount = Object.keys(bundledData).length;

                if (bundledCount > count) {
                    // Convert bundled data to new format with timestamps
                    const now = Date.now();
                    const converted = {};
                    let index = 0;
                    for (const [id, name] of Object.entries(bundledData)) {
                        // Stagger timestamps so newer IDs appear first
                        converted[id] = {
                            name: typeof name === 'string' ? name : name.name,
                            addedAt: now - (bundledCount - index)
                        };
                        index++;
                    }

                    // Merge with existing (existing takes precedence)
                    const merged = { ...converted, ...registry };
                    await saveRegistry(merged);

                    const newCount = Object.keys(merged).length - count;
                    console.log(`[UniFi Icon Browser] Loaded ${bundledCount} devices from bundled database (${newCount} new)`);

                    // Save update info
                    await saveUpdateInfo(newCount);
                }
            }
        } catch (error) {
            console.warn('[UniFi Icon Browser] Could not load bundled database:', error.message);
        }
    }
}

// Check if current page is a UniFi page
async function checkCurrentPage() {
    statusIndicator.className = 'status-indicator checking';
    statusText.textContent = 'Checking page...';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTabId = tab.id;

        // Check if URL looks like UniFi
        const isUnifiUrl = tab.url &&
            (tab.url.includes('ui.com') ||
             tab.url.includes('unifi') ||
             tab.url.includes(':8443') ||
             tab.url.includes('/network') ||
             tab.url.includes('/protect'));

        if (isUnifiUrl) {
            // Try to communicate with content script
            chrome.tabs.sendMessage(tab.id, { action: 'isUnifiPage' }, (response) => {
                if (chrome.runtime.lastError || !response) {
                    // Content script not loaded - show activate button
                    statusIndicator.className = 'status-indicator inactive';
                    statusText.textContent = 'UniFi page - click to activate';
                    activateBtn.style.display = 'inline-block';
                } else {
                    // Content script is running
                    statusIndicator.className = 'status-indicator active';
                    statusText.textContent = 'Active on UniFi page';
                    activateBtn.style.display = 'none';
                }
            });
        } else {
            statusIndicator.className = 'status-indicator inactive';
            statusText.textContent = 'Open a UniFi page to sync';
            activateBtn.style.display = 'none';
        }
    } catch (error) {
        statusIndicator.className = 'status-indicator inactive';
        statusText.textContent = 'Could not check page';
    }
}

// Activate content script on current page
async function activateOnPage() {
    if (!currentTabId) return;

    try {
        statusIndicator.className = 'status-indicator checking';
        statusText.textContent = 'Activating...';

        // Request background to inject script
        chrome.runtime.sendMessage({ action: 'injectScript', tabId: currentTabId }, (response) => {
            if (response?.success) {
                statusIndicator.className = 'status-indicator active';
                statusText.textContent = 'Active on UniFi page';
                activateBtn.style.display = 'none';
                showNotification('Activated! Open icon picker to sync new devices.');
            } else {
                statusIndicator.className = 'status-indicator inactive';
                statusText.textContent = 'Could not activate';
                showNotification('Failed to activate: ' + (response?.error || 'Unknown error'), true);
            }
        });
    } catch (error) {
        showNotification('Error activating: ' + error.message, true);
    }
}

// Event Listeners
function setupEventListeners() {
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchIcons();
    });

    // Also search on input change (debounced)
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = searchInput.value.trim();
            if (query.length >= 2 || query === '*') {
                searchIcons();
            } else if (query.length === 0) {
                loadAllDevicesSilently();
            }
        }, 300);
    });

    fetchDbBtn.addEventListener('click', fetchDatabase);
    activateBtn.addEventListener('click', activateOnPage);
    optionsBtn.addEventListener('click', openOptionsPage);
    addCustomBtn.addEventListener('click', () => openOptionsPage('custom-icons'));

    // Context menu
    document.addEventListener('click', () => hideContextMenu());
    document.addEventListener('contextmenu', (e) => {
        if (!e.target.closest('.icon-card')) {
            hideContextMenu();
        }
    });

    contextMenu.querySelectorAll('.context-item').forEach(item => {
        item.addEventListener('click', handleContextAction);
    });
}

// Storage functions - delegating to StorageManager module
async function getRegistry() {
    return await StorageManager.getRegistry();
}

function getDeviceName(entry) {
    return StorageManager.getDeviceName(entry);
}

function getDeviceAddedAt(entry) {
    return StorageManager.getDeviceAddedAt(entry);
}

async function saveRegistry(registry) {
    return await StorageManager.saveRegistry(registry);
}

async function updateDeviceCount() {
    // Load bundled database (baseline)
    let bundledCount = 0;
    let newCount = 0;

    try {
        const dbUrl = chrome.runtime.getURL('data/fingerprint-database.json');
        const response = await fetch(dbUrl);
        if (response.ok) {
            const bundledDatabase = await response.json();
            const bundledIds = new Set(Object.keys(bundledDatabase));
            bundledCount = bundledIds.size;

            // Count new entries from registry (not in bundled database)
            const registry = await getRegistry();
            for (const [id, entry] of Object.entries(registry)) {
                if (bundledIds.has(id)) continue;
                const numericId = parseInt(id);
                if (isNaN(numericId) || numericId < 1 || numericId > 99999) continue;

                const name = getDeviceName(entry);
                const looksLikeUserDevice = Utils.looksLikeUserDeviceName(name);
                if (looksLikeUserDevice) continue;

                newCount++;
            }
        }
    } catch (e) {
        // Fallback to registry count
        const registry = await getRegistry();
        bundledCount = Object.keys(registry).length;
    }

    const totalCount = bundledCount + newCount;
    if (newCount > 0) {
        deviceCount.textContent = `${totalCount.toLocaleString()} devices (+${newCount} new)`;
    } else {
        deviceCount.textContent = `${totalCount.toLocaleString()} devices`;
    }
}

async function updateLastUpdated() {
    const result = await chrome.storage.local.get('unifiUpdateInfo');
    const info = result.unifiUpdateInfo;

    if (info && info.lastUpdated) {
        const date = new Date(info.lastUpdated);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeAgo;
        if (diffMins < 1) {
            timeAgo = 'just now';
        } else if (diffMins < 60) {
            timeAgo = `${diffMins}m ago`;
        } else if (diffHours < 24) {
            timeAgo = `${diffHours}h ago`;
        } else {
            timeAgo = `${diffDays}d ago`;
        }

        // Just show when synced, the "+X new" is already shown in device count
        lastUpdated.textContent = `Synced ${timeAgo}`;
    } else {
        lastUpdated.textContent = '';
    }
}

async function saveUpdateInfo(newDevicesCount) {
    await chrome.storage.local.set({
        unifiUpdateInfo: {
            lastUpdated: new Date().toISOString(),
            newDevices: newDevicesCount
        }
    });
}

// Search functions
async function searchIcons() {
    const query = searchInput.value.trim();

    if (!query) {
        // If empty, reload all devices
        await loadAllDevicesSilently();
        return;
    }

    iconsGrid.innerHTML = '';
    noResults.style.display = 'none';
    loading.style.display = 'flex';

    if (query === '*') {
        await loadAllDevices();
    } else {
        await searchRegistry(query);
    }

    loading.style.display = 'none';
}

async function loadAllDevices() {
    // Load bundled database (baseline)
    let bundledDatabase = {};
    try {
        const dbUrl = chrome.runtime.getURL('data/fingerprint-database.json');
        const response = await fetch(dbUrl);
        if (response.ok) {
            bundledDatabase = await response.json();
        }
    } catch (e) {
        console.warn('[UniFi Icon Browser] Could not load bundled database:', e);
    }

    // Load registry (may have new entries)
    const registry = await getRegistry();

    const devices = [];
    const bundledIds = new Set(Object.keys(bundledDatabase));

    // Bundled entries with official names
    for (const [id, name] of Object.entries(bundledDatabase)) {
        const numericId = parseInt(id);
        if (isNaN(numericId)) continue;

        const officialName = typeof name === 'string' ? name : (name.name || 'Unknown');
        const registryEntry = registry[id];

        devices.push({
            id: numericId,
            name: officialName,
            addedAt: registryEntry ? getDeviceAddedAt(registryEntry) : 0,
            isNew: false
        });
    }

    // New entries from registry
    for (const [id, entry] of Object.entries(registry)) {
        const numericId = parseInt(id);
        if (isNaN(numericId) || bundledIds.has(id)) continue;
        if (numericId < 1 || numericId > 99999) continue;

        const name = getDeviceName(entry);
        const looksLikeUserDevice = Utils.looksLikeUserDeviceName(name);
        if (looksLikeUserDevice) continue;

        devices.push({
            id: numericId,
            name: name,
            addedAt: getDeviceAddedAt(entry),
            isNew: true
        });
    }

    // Sort: New first, then by ID
    devices.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        if (a.isNew) return b.addedAt - a.addedAt;
        return b.id - a.id;
    });

    allDevicesList = devices;
    currentPage = 0;

    displayIconsPaginated();
    setupInfiniteScroll();
}

// Silently load all devices on popup open (no notifications or loading spinner)
// Merges bundled database with new entries from registry
async function loadAllDevicesSilently() {
    // Load bundled database (baseline)
    let bundledDatabase = {};
    try {
        const dbUrl = chrome.runtime.getURL('data/fingerprint-database.json');
        const response = await fetch(dbUrl);
        if (response.ok) {
            bundledDatabase = await response.json();
        }
    } catch (e) {
        console.warn('[UniFi Icon Browser] Could not load bundled database:', e);
    }

    // Load registry (may have new entries from API)
    const registry = await getRegistry();

    const devices = [];
    const bundledIds = new Set(Object.keys(bundledDatabase));

    // First: Bundled database entries with official names
    for (const [id, name] of Object.entries(bundledDatabase)) {
        const numericId = parseInt(id);
        if (isNaN(numericId)) continue;

        const officialName = typeof name === 'string' ? name : (name.name || 'Unknown');
        const registryEntry = registry[id];

        devices.push({
            id: numericId,
            name: officialName,
            addedAt: registryEntry ? getDeviceAddedAt(registryEntry) : 0,
            isNew: false
        });
    }

    // Second: New entries from registry (not in bundled database)
    for (const [id, entry] of Object.entries(registry)) {
        const numericId = parseInt(id);
        if (isNaN(numericId)) continue;
        if (bundledIds.has(id)) continue;
        if (numericId < 1 || numericId > 99999) continue;

        const name = getDeviceName(entry);

        // Skip user device names
        const looksLikeUserDevice = Utils.looksLikeUserDeviceName(name);
        if (looksLikeUserDevice) continue;

        devices.push({
            id: numericId,
            name: name,
            addedAt: getDeviceAddedAt(entry),
            isNew: true
        });
    }

    if (devices.length === 0) {
        noResults.style.display = 'block';
        resultsCount.textContent = '0 results';
        return;
    }

    // Sort: New entries first, then by ID
    devices.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        if (a.isNew) return b.addedAt - a.addedAt;
        return b.id - a.id;
    });

    allDevicesList = devices;
    currentPage = 0;

    displayIconsPaginated();
}

async function searchRegistry(query) {
    // Load bundled database (baseline)
    let bundledDatabase = {};
    try {
        const dbUrl = chrome.runtime.getURL('data/fingerprint-database.json');
        const response = await fetch(dbUrl);
        if (response.ok) {
            bundledDatabase = await response.json();
        }
    } catch (e) {
        console.warn('[UniFi Icon Browser] Could not load bundled database:', e);
    }

    // Load registry (may have new entries)
    const registry = await getRegistry();
    const bundledIds = new Set(Object.keys(bundledDatabase));

    const queryLower = query.toLowerCase();
    const results = [];

    // Search bundled database entries with official names
    for (const [id, entry] of Object.entries(bundledDatabase)) {
        const name = typeof entry === 'string' ? entry : (entry.name || 'Unknown');
        // Match by name or ID
        if (name.toLowerCase().includes(queryLower) || id.includes(query)) {
            const numericId = parseInt(id);
            if (isNaN(numericId)) continue;

            const registryEntry = registry[id];
            results.push({
                id: numericId,
                name: name,
                addedAt: registryEntry ? getDeviceAddedAt(registryEntry) : 0,
                isNew: false
            });
        }
    }

    // Search NEW entries from registry (not in bundled database)
    for (const [id, entry] of Object.entries(registry)) {
        const numericId = parseInt(id);
        if (isNaN(numericId)) continue;
        if (bundledIds.has(id)) continue;
        if (numericId < 1 || numericId > 99999) continue;

        const name = getDeviceName(entry);

        // Skip user device names
        const looksLikeUserDevice = Utils.looksLikeUserDeviceName(name);
        if (looksLikeUserDevice) continue;

        // Match by name or ID
        if (name.toLowerCase().includes(queryLower) || id.includes(query)) {
            results.push({
                id: numericId,
                name: name,
                addedAt: getDeviceAddedAt(entry),
                isNew: true
            });
        }
    }

    // Sort: New entries first, then by ID descending
    results.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        if (a.isNew) return b.addedAt - a.addedAt;
        return b.id - a.id;
    });

    if (results.length === 0) {
        noResults.style.display = 'block';
        resultsCount.textContent = '0 results';
        allDevicesList = [];
    } else {
        allDevicesList = results;
        currentPage = 0;
        iconsGrid.innerHTML = '';
        displayIconsPaginated();
    }
}

// Display functions
function displayIconsPaginated() {
    const start = currentPage * DEVICES_PER_PAGE;
    const end = start + DEVICES_PER_PAGE;
    const pageDevices = allDevicesList.slice(start, end);

    if (pageDevices.length === 0) {
        if (currentPage === 0) {
            noResults.style.display = 'block';
            resultsCount.textContent = '0 results';
        }
        return;
    }

    pageDevices.forEach(icon => {
        iconsGrid.appendChild(createIconCard(icon));
    });

    resultsCount.textContent = `${Math.min(end, allDevicesList.length)} of ${allDevicesList.length} results`;
    setupLazyLoading();
}

function displayIcons(icons) {
    iconsGrid.innerHTML = '';

    icons.forEach(icon => {
        iconsGrid.appendChild(createIconCard(icon));
    });

    resultsCount.textContent = `${icons.length} results`;
    setupLazyLoading();
}

function createIconCard(icon) {
    const card = document.createElement('div');
    card.className = 'icon-card';
    card.dataset.id = icon.id;
    card.dataset.name = icon.name;

    const imageUrl = `${UNIFI_IMAGE_BASE}${icon.id}_129x129.png`;
    const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23141516%22 width=%2260%22 height=%2260%22/%3E%3C/svg%3E';
    const errorSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23303436%22 width=%2260%22 height=%2260%22 rx=%224%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%239d9488%22 font-size=%2210%22%3ENo Image%3C/text%3E%3C/svg%3E';

    // Create image element safely (no innerHTML XSS risk)
    const img = document.createElement('img');
    img.className = 'icon-image lazy-load';
    img.dataset.src = imageUrl;
    img.src = placeholderSvg;
    img.alt = icon.name; // Safe: alt attribute is escaped by the browser
    img.onerror = function() { this.src = errorSvg; };

    // Create name element safely using textContent
    const nameDiv = document.createElement('div');
    nameDiv.className = 'icon-name';
    nameDiv.title = icon.name; // Safe: title attribute is escaped by the browser
    nameDiv.textContent = icon.name; // Safe: textContent escapes HTML

    // Create ID element safely
    const idDiv = document.createElement('div');
    idDiv.className = 'icon-id';
    idDiv.textContent = `ID: ${icon.id}`;

    card.appendChild(img);
    card.appendChild(nameDiv);
    card.appendChild(idDiv);

    card.addEventListener('click', () => copyToClipboard(icon.name, 'Device name copied!'));
    card.addEventListener('contextmenu', (e) => showContextMenu(e, icon));

    return card;
}

// Lazy loading
function setupLazyLoading() {
    const images = document.querySelectorAll('.lazy-load');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-load');
                    imageObserver.unobserve(img);
                }
            }
        });
    }, { rootMargin: '50px' });

    images.forEach(img => imageObserver.observe(img));
}

// Infinite scroll
function setupInfiniteScroll() {
    resultsSection.addEventListener('scroll', () => {
        if (isLoading) return;

        const { scrollTop, scrollHeight, clientHeight } = resultsSection;

        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadNextPage();
        }
    });
}

function loadNextPage() {
    if (isLoading) return;

    const totalPages = Math.ceil(allDevicesList.length / DEVICES_PER_PAGE);
    if (currentPage >= totalPages - 1) return;

    isLoading = true;
    currentPage++;
    displayIconsPaginated();
    isLoading = false;
}

// Fetch complete database from UniFi API (refresh)
async function fetchDatabase() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Get current count before refresh
        const registryBefore = await getRegistry();
        const countBefore = Object.keys(registryBefore).length;

        showNotification('Refreshing device database from UniFi API...');

        // First ensure the script is injected
        chrome.runtime.sendMessage({ action: 'injectScript', tabId: tab.id }, () => {
            // Request database fetch
            setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { action: 'fetchDatabase' }, async (response) => {
                    if (chrome.runtime.lastError) {
                        showNotification('Could not connect to page. Try clicking Activate first.', true);
                        return;
                    }

                    // Wait a moment for the fetch to complete and data to be saved
                    setTimeout(async () => {
                        await updateDeviceCount();
                        const registry = await getRegistry();
                        const count = Object.keys(registry).length;
                        const newDevices = count - countBefore;

                        if (count > 100) {
                            // Save update info
                            await saveUpdateInfo(newDevices > 0 ? newDevices : 0);
                            await updateLastUpdated();

                            if (newDevices > 0) {
                                showNotification(`Database refreshed! +${newDevices} new devices`);
                            } else {
                                showNotification(`Database refreshed! ${count} devices (up to date)`);
                            }
                        } else {
                            showNotification('Database refresh initiated. Check console for status.', true);
                        }
                    }, 2000);
                });
            }, 500);
        });
    } catch (error) {
        showNotification('Error fetching database: ' + error.message, true);
    }
}

// Context menu
function showContextMenu(e, icon) {
    e.preventDefault();
    currentContextIcon = icon;

    contextMenu.style.display = 'block';

    // Position the menu
    const x = Math.min(e.clientX, window.innerWidth - contextMenu.offsetWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - contextMenu.offsetHeight - 10);

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
}

function hideContextMenu() {
    contextMenu.style.display = 'none';
    currentContextIcon = null;
}

function handleContextAction(e) {
    if (!currentContextIcon) return;

    const action = e.target.dataset.action;
    const icon = currentContextIcon;

    switch (action) {
        case 'copyName':
            copyToClipboard(icon.name, 'Device name copied!');
            break;
        case 'copyId':
            copyToClipboard(icon.id.toString(), 'ID copied!');
            break;
        case 'copyUrl':
            copyToClipboard(`${UNIFI_IMAGE_BASE}${icon.id}_129x129.png`, 'Image URL copied!');
            break;
        case 'openImage':
            chrome.tabs.create({ url: `${UNIFI_IMAGE_BASE}${icon.id}_257x257.png` });
            break;
        case 'useAsCustom':
            useAsCustomIcon(icon);
            break;
    }

    hideContextMenu();
}

// Utility functions
async function copyToClipboard(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification(message);
    } catch (error) {
        showNotification('Failed to copy to clipboard', true);
    }
}

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = `notification ${isError ? 'error' : 'success'}`;

    setTimeout(() => {
        notification.className = 'notification';
    }, Config.TIMEOUTS.NOTIFICATION_DISPLAY);
}

// Open options page
function openOptionsPage(section = null, editId = null) {
    let url = chrome.runtime.getURL('options/options.html');
    if (section) {
        url += `?section=${section}`;
        if (editId) {
            url += `&edit=${editId}`;
        }
    }
    chrome.tabs.create({ url });
}

// Tab Navigation
function setupTabNavigation() {
    popupTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tabName) {
    // Update button states
    popupTabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Switch panels
    if (tabName === 'devices') {
        devicesPanel.classList.add('active');
        customPanel.classList.remove('active');
    } else if (tabName === 'custom') {
        devicesPanel.classList.remove('active');
        customPanel.classList.add('active');
        loadCustomIcons();
    }
}

// Custom Icons
async function updateCustomIconsBadge() {
    const customMappings = await getCustomIconMappings();
    const count = Object.keys(customMappings).length;

    if (count > 0) {
        customBadge.textContent = count;
        customBadge.style.display = 'inline';
    } else {
        customBadge.style.display = 'none';
    }
}

async function getCustomIconMappings() {
    const result = await chrome.storage.local.get('customIconMappings');
    return result.customIconMappings || {};
}

async function loadCustomIcons() {
    const customMappings = await getCustomIconMappings();
    const items = Object.entries(customMappings);

    customIconsList.innerHTML = '';

    if (items.length === 0) {
        noCustomIcons.style.display = 'flex';
        return;
    }

    noCustomIcons.style.display = 'none';

    // Sort by name
    items.sort((a, b) => {
        const nameA = a[1].name || a[0];
        const nameB = b[1].name || b[0];
        return nameA.localeCompare(nameB);
    });

    items.forEach(([id, mapping]) => {
        const item = createCustomIconItem(id, mapping);
        customIconsList.appendChild(item);
    });
}

function createCustomIconItem(id, mapping) {
    const item = document.createElement('div');
    item.className = 'custom-icon-item';
    item.dataset.id = id;

    // Image preview
    const img = document.createElement('img');
    img.className = 'custom-icon-preview';
    img.alt = mapping.name || id;

    // Use custom URL if available, otherwise fallback to UniFi image
    if (mapping.iconUrl) {
        img.src = mapping.iconUrl;
    } else {
        const numericId = parseInt(id);
        if (!isNaN(numericId)) {
            img.src = `${UNIFI_IMAGE_BASE}${numericId}_129x129.png`;
        } else {
            img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23303436%22 width=%2248%22 height=%2248%22 rx=%224%22/%3E%3C/svg%3E';
        }
    }
    img.onerror = function() {
        this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23303436%22 width=%2248%22 height=%2248%22 rx=%224%22/%3E%3C/svg%3E';
    };

    // Info section
    const info = document.createElement('div');
    info.className = 'custom-icon-info';

    const name = document.createElement('div');
    name.className = 'custom-icon-name';
    name.textContent = mapping.name || id;

    const idSpan = document.createElement('div');
    idSpan.className = 'custom-icon-id';
    idSpan.textContent = `ID: ${id}`;

    info.appendChild(name);
    info.appendChild(idSpan);

    // Arrow icon
    const arrow = document.createElement('div');
    arrow.className = 'custom-icon-arrow';
    arrow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
    </svg>`;

    item.appendChild(img);
    item.appendChild(info);
    item.appendChild(arrow);

    // Click to open in options page
    item.addEventListener('click', () => {
        openOptionsPage('custom-icons', id);
    });

    return item;
}

// Use a device as a custom icon template - opens options with form pre-filled
function useAsCustomIcon(device) {
    // Open options page with the device info as URL parameters
    let url = chrome.runtime.getURL('options/options.html');
    url += `?section=custom-icons&useIcon=${device.id}&iconName=${encodeURIComponent(device.name)}`;
    chrome.tabs.create({ url });
}
