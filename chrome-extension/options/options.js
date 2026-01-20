// UniFi Icon Browser - Options Page
// Dependencies: config.js, utils.js, storageManager.js (loaded via options.html)

document.addEventListener('DOMContentLoaded', async () => {
    // ==================== DOM Element References ====================
    const mainContainer = document.getElementById('mainContainer');
    const cacheCount = document.getElementById('cacheCount');
    const customIconCount = document.getElementById('customIconCount');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resetBtn = document.getElementById('resetBtn');
    const fileInput = document.getElementById('fileInput');
    const statusMessage = document.getElementById('statusMessage');
    const versionNumber = document.getElementById('versionNumber');

    // Custom icon elements
    const customIconForm = document.getElementById('customIconForm');
    const editModeIndicator = document.getElementById('editModeIndicator');
    const editingIdSpan = document.getElementById('editingId');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const donorIdInput = document.getElementById('donorIdInput');
    const customIconUrl = document.getElementById('customIconUrl');
    const customIconName = document.getElementById('customIconName');
    const customDeviceName = document.getElementById('customDeviceName');
    const customManufacturer = document.getElementById('customManufacturer');
    const customModel = document.getElementById('customModel');
    const customOS = document.getElementById('customOS');
    const addCustomIconBtn = document.getElementById('addCustomIconBtn');
    const addBtnText = document.getElementById('addBtnText');
    const customIconsList = document.getElementById('customIconsList');
    const exportMappingsBtn = document.getElementById('exportMappingsBtn');
    const importMappingsBtn = document.getElementById('importMappingsBtn');
    const mappingsFileInput = document.getElementById('mappingsFileInput');

    // Tab elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const settingsPanel = document.getElementById('settingsPanel');
    const browserPanel = document.getElementById('browserPanel');

    // Settings sidebar elements
    const settingsNavBtns = document.querySelectorAll('.settings-nav-btn');
    const settingsSections = document.querySelectorAll('.settings-section');
    const customIconBadge = document.getElementById('customIconBadge');
    const cacheBadge = document.getElementById('cacheBadge');

    // Browser elements
    const browserSearchInput = document.getElementById('browserSearchInput');
    const iconSizeSelect = document.getElementById('iconSizeSelect');
    const browserGridContainer = document.getElementById('browserGridContainer');
    const browserGrid = document.getElementById('browserGrid');
    const browserLoading = document.getElementById('browserLoading');
    const browserNoResults = document.getElementById('browserNoResults');
    const browserDeviceCount = document.getElementById('browserDeviceCount');
    const browserResultsCount = document.getElementById('browserResultsCount');
    const browserContextMenu = document.getElementById('browserContextMenu');
    const browserNotification = document.getElementById('browserNotification');

    // ==================== State ====================
    let editingDonorId = null; // Track which mapping is being edited
    let allBrowserDevices = [];
    let currentBrowserIcon = null;
    let browserInitialized = false;

    // Set version number
    versionNumber.textContent = chrome.runtime.getManifest().version;

    // ==================== Tab Navigation ====================
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // ==================== Settings Sidebar Navigation ====================
    settingsNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSettingsSection(section);
        });
    });

    function switchSettingsSection(sectionId) {
        // Update nav button states
        settingsNavBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionId);
        });

        // Update section visibility
        settingsSections.forEach(section => {
            section.classList.toggle('active', section.id === `section-${sectionId}`);
        });
    }

    function switchTab(tab) {
        // Update button states
        tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));

        // Update panel visibility
        settingsPanel.classList.toggle('active', tab === 'settings');
        browserPanel.classList.toggle('active', tab === 'browser');

        // Toggle body class for scroll behavior
        document.body.classList.toggle('browser-active', tab === 'browser');

        // Initialize browser on first view
        if (tab === 'browser' && !browserInitialized) {
            initBrowser();
        }

        // Scroll to top when switching tabs
        window.scrollTo(0, 0);
        if (tab === 'settings') {
            settingsPanel.scrollTop = 0;
        }
    }

    // Load and display cache count
    async function updateCacheCount() {
        const count = await StorageManager.getRegistryCount();
        cacheCount.textContent = count.toLocaleString();
        // Update sidebar badge
        if (cacheBadge) {
            cacheBadge.textContent = count > 0 ? count.toLocaleString() : '0';
        }
    }

    // Show status message
    function showStatus(message, type = 'success') {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.classList.remove('hidden');

        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, Config.TIMEOUTS.STATUS_MESSAGE_DISPLAY);
    }

    // ==================== Custom Icons Management ====================

    // Load and display custom icon count
    async function updateCustomIconCount() {
        const mappings = await StorageManager.getCustomMappings();
        const count = Object.keys(mappings).length;
        customIconCount.textContent = count.toLocaleString();
        // Update sidebar badge
        if (customIconBadge) {
            customIconBadge.textContent = count > 0 ? count.toLocaleString() : '0';
        }
    }

    // Render custom icons list
    async function renderCustomIconsList() {
        const mappings = await StorageManager.getCustomMappings();
        const entries = Object.entries(mappings);

        if (entries.length === 0) {
            customIconsList.innerHTML = '<div class="custom-icons-empty">No custom icon mappings configured</div>';
            return;
        }

        customIconsList.innerHTML = entries.map(([id, data]) => `
            <div class="custom-icon-item" data-id="${id}">
                <img class="custom-icon-preview" src="${escapeHtml(data.iconUrl)}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><rect fill=%22%233a3a3a%22 width=%2224%22 height=%2224%22/><text x=%2212%22 y=%2216%22 text-anchor=%22middle%22 fill=%22%23707070%22 font-size=%228%22>?</text></svg>'">
                <div class="custom-icon-info">
                    <div class="custom-icon-name">${escapeHtml(data.name || 'Unnamed')}</div>
                    <div class="custom-icon-id">ID: ${escapeHtml(id)}</div>
                    <div class="custom-icon-url" title="${escapeHtml(data.iconUrl)}">${escapeHtml(data.iconUrl)}</div>
                </div>
                <div class="custom-icon-actions">
                    <button class="custom-icon-edit" data-id="${id}" title="Edit mapping">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="custom-icon-delete" data-id="${id}" title="Remove mapping">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Add edit handlers
        customIconsList.querySelectorAll('.custom-icon-edit').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await startEditingMapping(id);
            });
        });

        // Add delete handlers
        customIconsList.querySelectorAll('.custom-icon-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm(`Remove custom icon mapping for ID ${id}?`)) {
                    await deleteCustomIcon(id);
                }
            });
        });
    }

    // ==================== Edit Mode Functions ====================

    async function startEditingMapping(id) {
        const mappings = await StorageManager.getCustomMappings();
        const data = mappings[id];

        if (!data) {
            showStatus('Mapping not found', 'error');
            return;
        }

        // Enter edit mode
        editingDonorId = id;
        customIconForm.classList.add('edit-mode');
        editingIdSpan.textContent = id;
        addBtnText.textContent = 'Update Custom Icon Mapping';

        // Disable donor ID field (can't change the ID when editing)
        donorIdInput.value = id;
        donorIdInput.disabled = true;

        // Populate form with existing data
        customIconUrl.value = data.iconUrl || '';
        customIconName.value = data.name || '';
        customDeviceName.value = data.deviceName || '';
        customManufacturer.value = data.manufacturer || '';
        customModel.value = data.model || '';
        customOS.value = data.os || '';

        // Scroll form into view
        customIconForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        customIconUrl.focus();
    }

    function cancelEditing() {
        editingDonorId = null;
        customIconForm.classList.remove('edit-mode');
        addBtnText.textContent = 'Add Custom Icon Mapping';
        donorIdInput.disabled = false;
        clearForm();
    }

    function clearForm() {
        donorIdInput.value = '';
        customIconUrl.value = '';
        customIconName.value = '';
        customDeviceName.value = '';
        customManufacturer.value = '';
        customModel.value = '';
        customOS.value = '';
    }

    // Cancel edit button handler
    cancelEditBtn.addEventListener('click', cancelEditing);

    // Escape HTML to prevent XSS - delegate to Utils
    function escapeHtml(str) {
        return Utils.escapeHtml(str);
    }

    // Notify all UniFi tabs to reload custom icons
    function notifyTabsToReloadIcons() {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'reloadCustomIcons' }).catch(() => {});
            });
        });
    }

    // Add custom icon mapping
    async function addCustomIcon(donorId, iconUrl, name, deviceInfo = {}) {
        const mapping = {
            iconUrl,
            name: name || `Custom (${donorId})`,
            deviceName: deviceInfo.deviceName || '',
            manufacturer: deviceInfo.manufacturer || '',
            model: deviceInfo.model || '',
            os: deviceInfo.os || ''
        };

        await StorageManager.setCustomMapping(donorId, mapping);
        notifyTabsToReloadIcons();
    }

    // Delete custom icon mapping
    async function deleteCustomIcon(donorId) {
        await StorageManager.removeCustomMapping(donorId);

        await updateCustomIconCount();
        await renderCustomIconsList();
        showStatus('Custom icon mapping removed', 'success');

        notifyTabsToReloadIcons();
    }

    // Handle add/update custom icon button
    addCustomIconBtn.addEventListener('click', async () => {
        const donorId = editingDonorId || donorIdInput.value.trim();
        const iconUrl = customIconUrl.value.trim();
        const name = customIconName.value.trim();
        const deviceInfo = {
            deviceName: customDeviceName.value.trim(),
            manufacturer: customManufacturer.value.trim(),
            model: customModel.value.trim(),
            os: customOS.value.trim()
        };

        const isEditing = !!editingDonorId;

        // Validation (skip donor ID validation if editing)
        if (!isEditing) {
            if (!donorId) {
                showStatus('Please enter a donor device ID', 'error');
                donorIdInput.focus();
                return;
            }

            if (!/^\d+$/.test(donorId)) {
                showStatus('Donor ID must be a number', 'error');
                donorIdInput.focus();
                return;
            }
        }

        if (!iconUrl) {
            showStatus('Please enter a custom icon URL', 'error');
            customIconUrl.focus();
            return;
        }

        // Basic URL validation
        try {
            new URL(iconUrl);
        } catch {
            showStatus('Please enter a valid URL', 'error');
            customIconUrl.focus();
            return;
        }

        try {
            await addCustomIcon(donorId, iconUrl, name, deviceInfo);

            if (isEditing) {
                showStatus(`Custom icon mapping updated for ID ${donorId}`, 'success');
                cancelEditing(); // Exit edit mode
            } else {
                showStatus(`Custom icon mapping added for ID ${donorId}`, 'success');
                clearForm();
            }

            // Refresh UI
            await updateCustomIconCount();
            await renderCustomIconsList();
        } catch (error) {
            console.error('Error saving custom icon:', error);
            showStatus('Failed to save custom icon: ' + error.message, 'error');
        }
    });

    // ==================== Custom Mappings Export/Import ====================

    // Export custom icon mappings
    exportMappingsBtn.addEventListener('click', async () => {
        try {
            const mappings = await StorageManager.getCustomMappings();
            const count = Object.keys(mappings).length;

            if (count === 0) {
                showStatus('No custom icon mappings to export', 'warning');
                return;
            }

            const exportData = {
                exportDate: new Date().toISOString(),
                version: chrome.runtime.getManifest().version,
                type: 'custom-icon-mappings',
                mappingCount: count,
                mappings: mappings
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `unifi-custom-mappings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showStatus(`Exported ${count} custom icon mapping(s)`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            showStatus('Failed to export mappings: ' + error.message, 'error');
        }
    });

    // Import custom icon mappings - trigger file picker
    importMappingsBtn.addEventListener('click', () => {
        mappingsFileInput.click();
    });

    // Handle mappings file selection
    mappingsFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate the import data
            if (!data.mappings || typeof data.mappings !== 'object') {
                showStatus('Invalid file format: missing mappings data', 'error');
                return;
            }

            // Check if it's the right type of export
            if (data.type && data.type !== 'custom-icon-mappings') {
                showStatus('Wrong file type: this is not a custom mappings export', 'error');
                return;
            }

            const importCount = Object.keys(data.mappings).length;
            if (importCount === 0) {
                showStatus('No mappings found in file', 'warning');
                return;
            }

            // Get existing mappings and merge
            const existingMappings = await StorageManager.getCustomMappings();
            const mergedMappings = { ...existingMappings, ...data.mappings };

            // Save merged mappings
            await StorageManager.saveCustomMappings(mergedMappings);

            // Refresh UI
            await updateCustomIconCount();
            await renderCustomIconsList();

            // Notify tabs to reload icons
            notifyTabsToReloadIcons();

            const newCount = Object.keys(mergedMappings).length - Object.keys(existingMappings).length;
            if (newCount > 0) {
                showStatus(`Imported ${importCount} mapping(s) (${newCount} new)`, 'success');
            } else {
                showStatus(`Imported ${importCount} mapping(s) (all updated existing)`, 'success');
            }
        } catch (error) {
            console.error('Import error:', error);
            if (error instanceof SyntaxError) {
                showStatus('Invalid JSON file', 'error');
            } else {
                showStatus('Failed to import mappings: ' + error.message, 'error');
            }
        }

        // Reset file input so same file can be selected again
        mappingsFileInput.value = '';
    });

    // ==================== End Custom Icons Management ====================

    // Export JSON
    exportBtn.addEventListener('click', async () => {
        try {
            const registry = await StorageManager.exportRegistry();
            const count = Object.keys(registry).length;

            if (count === 0) {
                showStatus('No cached devices to export', 'warning');
                return;
            }

            const exportData = {
                exportDate: new Date().toISOString(),
                version: chrome.runtime.getManifest().version,
                format: 2, // Format version: 2 = {id: {name, addedAt}}
                deviceCount: count,
                devices: registry
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `unifi-device-cache-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showStatus(`Exported ${count} devices successfully`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            showStatus('Failed to export: ' + error.message, 'error');
        }
    });

    // Import JSON
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Handle both old format (direct registry) and new format (with metadata)
            let devices = data.devices || data;

            // Validate data
            if (typeof devices !== 'object' || Array.isArray(devices)) {
                throw new Error('Invalid JSON format');
            }

            // Import via background script
            const response = await chrome.runtime.sendMessage({
                action: 'importRegistry',
                data: devices
            });

            if (response.success) {
                showStatus(`Imported ${response.newCount} new devices (${response.totalCount} total)`, 'success');
                await updateCacheCount();
            } else {
                throw new Error('Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            showStatus('Failed to import: ' + error.message, 'error');
        }

        // Reset file input
        fileInput.value = '';
    });

    // Clear cache
    clearBtn.addEventListener('click', async () => {
        const count = await StorageManager.getRegistryCount();

        if (count === 0) {
            showStatus('Cache is already empty', 'warning');
            return;
        }

        if (confirm(`Are you sure you want to clear ${count} cached device names?\n\nThis cannot be undone.`)) {
            try {
                const success = await StorageManager.clearRegistry();

                if (success) {
                    showStatus(`Cleared ${count} cached devices`, 'success');
                    await updateCacheCount();
                } else {
                    throw new Error('Clear failed');
                }
            } catch (error) {
                console.error('Clear error:', error);
                showStatus('Failed to clear cache: ' + error.message, 'error');
            }
        }
    });

    // Reset extension
    resetBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to completely reset the extension?\n\nThis will:\n• Clear all cached device names\n• Reset all settings\n• Remove all stored data\n\nThis cannot be undone.')) {
            try {
                // Clear ALL extension storage
                await chrome.storage.local.clear();

                // Re-initialize with default settings using StorageManager keys
                await chrome.storage.local.set({
                    [StorageManager.KEYS.REGISTRY]: {},
                    [StorageManager.KEYS.CUSTOM_MAPPINGS]: {},
                    settings: {
                        sortOrder: 'desc',
                        devicesPerPage: Config.PAGINATION.DEVICES_PER_PAGE,
                        autoExtract: true
                    }
                });

                showStatus('Extension reset to factory state', 'success');
                await updateCacheCount();
                await updateCustomIconCount();
                await renderCustomIconsList();
            } catch (error) {
                console.error('Reset error:', error);
                showStatus('Failed to reset: ' + error.message, 'error');
            }
        }
    });

    // Initial load
    await updateCacheCount();
    await updateCustomIconCount();
    await renderCustomIconsList();

    // Handle URL parameters (e.g., from popup clicking on a custom icon)
    handleUrlParameters();

    // ==================== Icon Browser Functions ====================

    async function initBrowser() {
        browserInitialized = true;
        setupBrowserEventListeners();
        await loadBrowserDevices();
    }

    function setupBrowserEventListeners() {
        // Search input with debounce
        let searchTimeout;
        browserSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterBrowserDevices(browserSearchInput.value.trim());
            }, 300);
        });

        // Icon size selector
        iconSizeSelect.addEventListener('change', () => {
            updateBrowserGridSize();
            renderBrowserGrid(getFilteredDevices());
            // Scroll to top and recheck content after size change
            window.scrollTo(0, 0);
        });

        // Context menu
        document.addEventListener('click', hideBrowserContextMenu);
        browserContextMenu.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('click', handleBrowserContextAction);
        });

        // Infinite scroll - use window scroll since page scrolls now
        window.addEventListener('scroll', handleBrowserScroll);
        window.addEventListener('resize', checkNeedMoreContent);
    }

    async function loadBrowserDevices() {
        browserLoading.style.display = 'flex';
        browserGrid.innerHTML = '';
        browserNoResults.style.display = 'none';

        try {
            // Load bundled database (baseline official entries)
            let bundledDatabase = {};
            let maxBundledId = 0;
            try {
                const dbUrl = chrome.runtime.getURL('data/fingerprint-database.json');
                const response = await fetch(dbUrl);
                if (response.ok) {
                    bundledDatabase = await response.json();
                    // Find max ID in bundled database
                    for (const id of Object.keys(bundledDatabase)) {
                        const numId = parseInt(id);
                        if (!isNaN(numId) && numId > maxBundledId) {
                            maxBundledId = numId;
                        }
                    }
                }
            } catch (e) {
                console.warn('[Icon Browser] Could not load bundled database:', e);
            }

            // Load registry (may contain new official entries from API)
            const registry = await StorageManager.getRegistry();

            const devices = [];
            const bundledIds = new Set(Object.keys(bundledDatabase));

            // First: Add all bundled database entries with official names
            for (const [id, name] of Object.entries(bundledDatabase)) {
                const numericId = parseInt(id);
                if (isNaN(numericId)) continue;

                const officialName = typeof name === 'string' ? name : (name.name || 'Unknown');
                const registryEntry = registry[id];

                devices.push({
                    id: numericId,
                    name: officialName,
                    addedAt: registryEntry ? StorageManager.getDeviceAddedAt(registryEntry) : 0,
                    isNew: false
                });
            }

            // Second: Add NEW entries from registry (IDs not in bundled database)
            // These are likely new official fingerprints from UniFi API updates
            let newCount = 0;
            for (const [id, entry] of Object.entries(registry)) {
                const numericId = parseInt(id);

                // Skip invalid IDs
                if (isNaN(numericId)) continue;

                // Skip if already in bundled database (we used official name above)
                if (bundledIds.has(id)) continue;

                // Only include if ID looks like a valid fingerprint ID
                // (numeric, positive, and reasonably sized)
                if (numericId < 1 || numericId > 99999) continue;

                const name = StorageManager.getDeviceName(entry);

                // Skip entries that look like user device names (contain common patterns)
                // Official fingerprint names are product names like "iPhone 14 Pro"
                const looksLikeUserDevice = Utils.looksLikeUserDeviceName(name);
                if (looksLikeUserDevice) continue;

                devices.push({
                    id: numericId,
                    name: name,
                    addedAt: StorageManager.getDeviceAddedAt(entry),
                    isNew: true
                });
                newCount++;
            }

            // Sort: New entries first (by addedAt desc), then bundled entries (by ID desc)
            devices.sort((a, b) => {
                // New entries always come first
                if (a.isNew && !b.isNew) return -1;
                if (!a.isNew && b.isNew) return 1;

                // Within same category, sort by addedAt (new) or ID (bundled)
                if (a.isNew) {
                    return b.addedAt - a.addedAt; // Newest first
                }
                return b.id - a.id; // Higher IDs first for bundled
            });

            allBrowserDevices = devices;

            // Show count with new indicator
            if (newCount > 0) {
                browserDeviceCount.textContent = `${devices.length.toLocaleString()} devices (+${newCount} new)`;
            } else {
                browserDeviceCount.textContent = `${devices.length.toLocaleString()} devices`;
            }

            browserLoading.style.display = 'none';
            renderBrowserGrid(devices);
        } catch (error) {
            console.error('Error loading browser devices:', error);
            browserLoading.style.display = 'none';
            showBrowserNotification('Failed to load devices', true);
        }
    }

    function getFilteredDevices() {
        const query = browserSearchInput.value.trim().toLowerCase();
        if (!query) return allBrowserDevices;

        return allBrowserDevices.filter(device =>
            device.name.toLowerCase().includes(query) ||
            device.id.toString().includes(query)
        );
    }

    function filterBrowserDevices(query) {
        const filtered = getFilteredDevices();
        renderBrowserGrid(filtered);
    }

    function updateBrowserGridSize() {
        const size = iconSizeSelect.value;
        browserGrid.classList.remove('size-large');
        if (size === '257') {
            browserGrid.classList.add('size-large');
        }
    }

    let browserCurrentPage = 0;
    const BROWSER_PAGE_SIZE = 50;
    let browserIsLoading = false;

    function renderBrowserGrid(devices) {
        browserGrid.innerHTML = '';
        browserCurrentPage = 0;

        if (devices.length === 0) {
            browserNoResults.style.display = 'flex';
            browserResultsCount.textContent = '0 results';
            return;
        }

        browserNoResults.style.display = 'none';
        renderBrowserPage(devices);

        // Check if we need more content to fill the viewport after initial render
        requestAnimationFrame(() => {
            setTimeout(checkNeedMoreContent, 100);
        });
    }

    function renderBrowserPage(devices) {
        const start = browserCurrentPage * BROWSER_PAGE_SIZE;
        const end = start + BROWSER_PAGE_SIZE;
        const pageDevices = devices.slice(start, end);

        if (pageDevices.length === 0) return;

        const size = iconSizeSelect.value;
        const imageSize = size === '257' ? '257x257' : '129x129';
        const sizeClass = size === '257' ? 'size-large' : '';

        pageDevices.forEach(device => {
            const card = createBrowserIconCard(device, imageSize, sizeClass);
            browserGrid.appendChild(card);
        });

        browserResultsCount.textContent = `${Math.min(end, devices.length)} of ${devices.length} results`;
        setupBrowserLazyLoading();
    }

    function createBrowserIconCard(device, imageSize, sizeClass) {
        const card = document.createElement('div');
        card.className = `browser-icon-card ${sizeClass}`;
        card.dataset.id = device.id;
        card.dataset.name = device.name;

        const imageUrl = `${Config.URLS.UNIFI_IMAGE_BASE}${device.id}_${imageSize}.png`;
        const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23141516%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E';
        const errorSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23303436%22 width=%22100%22 height=%22100%22 rx=%228%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%239d9488%22 font-size=%2212%22%3ENo Image%3C/text%3E%3C/svg%3E';

        const img = document.createElement('img');
        img.className = 'browser-icon-image lazy-load';
        img.dataset.src = imageUrl;
        img.src = placeholderSvg;
        img.alt = device.name;
        img.onerror = function() { this.src = errorSvg; };

        const nameDiv = document.createElement('div');
        nameDiv.className = 'browser-icon-name';
        nameDiv.title = device.name;
        nameDiv.textContent = device.name;

        const idDiv = document.createElement('div');
        idDiv.className = 'browser-icon-id';
        idDiv.textContent = `ID: ${device.id}`;

        card.appendChild(img);
        card.appendChild(nameDiv);
        card.appendChild(idDiv);

        card.addEventListener('click', () => copyToClipboard(device.name, 'Device name copied!'));
        card.addEventListener('contextmenu', (e) => showBrowserContextMenu(e, device));

        return card;
    }

    function setupBrowserLazyLoading() {
        const images = browserGrid.querySelectorAll('.lazy-load');
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
        }, { rootMargin: '100px' });

        images.forEach(img => imageObserver.observe(img));
    }

    function handleBrowserScroll() {
        if (browserIsLoading) return;
        if (!document.body.classList.contains('browser-active')) return;

        // Use window scroll metrics
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Load more when user is within 400px of the bottom
        if (scrollTop + windowHeight >= documentHeight - 400) {
            loadBrowserNextPage();
        }
    }

    function checkNeedMoreContent() {
        if (browserIsLoading) return;
        if (!document.body.classList.contains('browser-active')) return;

        // Check if we need to load more to fill the viewport
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // If document doesn't fill the viewport, load more
        if (documentHeight <= windowHeight + 100) {
            loadBrowserNextPage();
        }
    }

    function loadBrowserNextPage() {
        const devices = getFilteredDevices();
        const totalPages = Math.ceil(devices.length / BROWSER_PAGE_SIZE);
        if (browserCurrentPage >= totalPages - 1) return;

        browserIsLoading = true;
        browserCurrentPage++;
        renderBrowserPage(devices);
        browserIsLoading = false;

        // After loading a page, check if we still need more to fill viewport
        requestAnimationFrame(() => {
            setTimeout(checkNeedMoreContent, 100);
        });
    }

    // Browser Context Menu
    function showBrowserContextMenu(e, device) {
        e.preventDefault();
        currentBrowserIcon = device;

        browserContextMenu.style.display = 'block';

        const x = Math.min(e.clientX, window.innerWidth - browserContextMenu.offsetWidth - 10);
        const y = Math.min(e.clientY, window.innerHeight - browserContextMenu.offsetHeight - 10);

        browserContextMenu.style.left = `${x}px`;
        browserContextMenu.style.top = `${y}px`;
    }

    function hideBrowserContextMenu() {
        browserContextMenu.style.display = 'none';
        currentBrowserIcon = null;
    }

    function handleBrowserContextAction(e) {
        if (!currentBrowserIcon) return;

        const action = e.target.closest('.context-item')?.dataset.action;
        const device = currentBrowserIcon;
        const size = iconSizeSelect.value;
        const imageSize = size === '257' ? '257x257' : '129x129';

        switch (action) {
            case 'copyName':
                copyToClipboard(device.name, 'Device name copied!');
                break;
            case 'copyId':
                copyToClipboard(device.id.toString(), 'ID copied!');
                break;
            case 'copyUrl':
                copyToClipboard(`${Config.URLS.UNIFI_IMAGE_BASE}${device.id}_${imageSize}.png`, 'Image URL copied!');
                break;
            case 'openImage':
                window.open(`${Config.URLS.UNIFI_IMAGE_BASE}${device.id}_257x257.png`, '_blank');
                break;
            case 'useAsCustom':
                useAsCustomIcon(device);
                break;
        }

        hideBrowserContextMenu();
    }

    function useAsCustomIcon(device) {
        // Switch to settings tab and populate the form
        switchTab('settings');

        // Wait for tab switch animation
        setTimeout(() => {
            // Auto-fill donor ID with the selected icon's ID
            donorIdInput.value = device.id.toString();
            customIconUrl.value = `${Config.URLS.UNIFI_IMAGE_BASE}${device.id}_129x129.png`;
            customIconName.value = device.name;
            donorIdInput.focus();
            donorIdInput.select();

            showStatus('Form populated with selected icon - modify donor ID if needed', 'success');
            customIconForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // Browser utility functions
    async function copyToClipboard(text, message) {
        try {
            await navigator.clipboard.writeText(text);
            showBrowserNotification(message);
        } catch (error) {
            showBrowserNotification('Failed to copy to clipboard', true);
        }
    }

    function showBrowserNotification(message, isError = false) {
        browserNotification.textContent = message;
        browserNotification.className = `browser-notification visible ${isError ? 'error' : 'success'}`;

        setTimeout(() => {
            browserNotification.className = 'browser-notification';
        }, Config.TIMEOUTS.NOTIFICATION_DISPLAY);
    }

    // ==================== URL Parameter Handling ====================

    function handleUrlParameters() {
        const params = new URLSearchParams(window.location.search);
        const section = params.get('section');
        const editId = params.get('edit');
        const useIconId = params.get('useIcon');
        const iconName = params.get('iconName');

        if (section) {
            // Make sure we're on the settings tab
            switchTab('settings');

            // Switch to the appropriate section
            if (section === 'custom-icons') {
                switchSettingsSection('custom-icons');

                // If an edit ID is provided, start editing that mapping
                if (editId) {
                    setTimeout(async () => {
                        await startEditingMapping(editId);
                    }, 100);
                }
                // If useIcon is provided, pre-fill the form with the icon's data
                else if (useIconId) {
                    setTimeout(() => {
                        // Pre-fill the form with the selected icon as a template
                        donorIdInput.value = useIconId;
                        customIconUrl.value = `${Config.URLS.UNIFI_IMAGE_BASE}${useIconId}_129x129.png`;
                        if (iconName) {
                            customIconName.value = decodeURIComponent(iconName);
                        }
                        donorIdInput.focus();
                        donorIdInput.select();
                        showStatus('Form populated - change the Donor ID to the device you want to customize', 'success');
                        customIconForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            } else if (section === 'data-management') {
                switchSettingsSection('data-management');
            } else if (section === 'danger-zone') {
                switchSettingsSection('danger-zone');
            }

            // Clear URL parameters after handling (optional, keeps URL clean)
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
});
