# UniFi Icon Browser - API & Messaging Reference

This document describes the internal messaging APIs and data structures used by the UniFi Icon Browser extension.

## Chrome Runtime Messaging

The extension uses Chrome's messaging API for communication between components.

### Message Format

All messages follow this structure:
```javascript
{
  action: string,      // Action identifier
  ...params           // Action-specific parameters
}
```

### Background Script Actions

#### `getRegistry`
Retrieve the complete device registry.

**Request:**
```javascript
chrome.runtime.sendMessage({ action: 'getRegistry' })
```

**Response:**
```javascript
{
  registry: {
    "12345": { name: "Apple iPhone 14", addedAt: 1704067200000 },
    "67890": { name: "Samsung Galaxy S23", addedAt: 1704067200000 }
  }
}
```

---

#### `saveToRegistry`
Save devices to registry (merge mode - only adds new entries).

**Request:**
```javascript
chrome.runtime.sendMessage({
  action: 'saveToRegistry',
  devices: {
    "12345": "Apple iPhone 14",
    "67890": "Samsung Galaxy S23"
  }
})
```

**Response:**
```javascript
{
  success: true,
  count: 5500  // Total count after merge
}
```

---

#### `replaceRegistry`
Replace entire registry with new data (used for clean database updates).

**Request:**
```javascript
chrome.runtime.sendMessage({
  action: 'replaceRegistry',
  devices: {
    "12345": "Apple iPhone 14",
    "67890": "Samsung Galaxy S23"
  }
})
```

**Response:**
```javascript
{
  success: true,
  count: 5500  // Total count
}
```

---

#### `clearRegistry`
Clear all device data from registry.

**Request:**
```javascript
chrome.runtime.sendMessage({ action: 'clearRegistry' })
```

**Response:**
```javascript
{
  success: true
}
```

---

#### `exportRegistry`
Export registry data for backup.

**Request:**
```javascript
chrome.runtime.sendMessage({ action: 'exportRegistry' })
```

**Response:**
```javascript
{
  registry: {
    "12345": { name: "Apple iPhone 14", addedAt: 1704067200000 }
  }
}
```

---

#### `importRegistry`
Import registry data from backup (merge mode).

**Request:**
```javascript
chrome.runtime.sendMessage({
  action: 'importRegistry',
  data: {
    "12345": "Apple iPhone 14",
    "67890": { name: "Samsung Galaxy S23", addedAt: 1704067200000 }
  }
})
```

**Response:**
```javascript
{
  success: true,
  newCount: 150,
  totalCount: 5650
}
```

---

#### `injectScript`
Manually inject content script into a tab.

**Request:**
```javascript
chrome.runtime.sendMessage({
  action: 'injectScript',
  tabId: 12345
})
```

**Response:**
```javascript
{
  success: true
}
// or
{
  success: false,
  error: "Cannot access this tab"
}
```

---

### Content Script Actions

#### `extractDevices`
Trigger manual device extraction from the page.

**Request:**
```javascript
chrome.tabs.sendMessage(tabId, { action: 'extractDevices' })
```

**Response:**
```javascript
{
  devices: {
    "12345": "Apple iPhone 14",
    "67890": "Samsung Galaxy S23"
  }
}
```

---

#### `getCollectedDevices`
Get devices collected in current session.

**Request:**
```javascript
chrome.tabs.sendMessage(tabId, { action: 'getCollectedDevices' })
```

**Response:**
```javascript
{
  devices: {
    "12345": "Apple iPhone 14"
  }
}
```

---

#### `isUnifiPage`
Check if current page is a UniFi page.

**Request:**
```javascript
chrome.tabs.sendMessage(tabId, { action: 'isUnifiPage' })
```

**Response:**
```javascript
{
  isUnifi: true
}
```

---

#### `reloadCustomIcons`
Reload custom icon mappings (called after options page changes).

**Request:**
```javascript
chrome.tabs.sendMessage(tabId, { action: 'reloadCustomIcons' })
```

**Response:**
```javascript
{
  success: true
}
```

---

## Window PostMessage API

Communication between content script and injected script uses `window.postMessage`.

### Message Types

#### `unifi-icon-browser-fingerprints`
Send extracted fingerprint data from page to extension.

**Message:**
```javascript
window.postMessage({
  type: 'unifi-icon-browser-fingerprints',
  data: {
    "12345": "Apple iPhone 14",
    "67890": "Samsung Galaxy S23"
  },
  replaceRegistry: true,  // Replace instead of merge
  source: 'react-complete' // Source identifier
}, '*')
```

---

#### `unifi-icon-browser-extract`
Request manual extraction from page.

**Message:**
```javascript
window.postMessage({
  type: 'unifi-icon-browser-extract'
}, '*')
```

---

#### `unifi-icon-browser-custom-icons`
Send custom icon mappings to injected script.

**Message:**
```javascript
window.postMessage({
  type: 'unifi-icon-browser-custom-icons',
  mappings: {
    "500": {
      iconUrl: "https://example.com/icon.png",
      deviceName: "My Device",
      manufacturer: "Custom Corp",
      model: "Model X",
      os: "Linux"
    }
  }
}, '*')
```

---

#### `unifi-icon-browser-request-custom-icons`
Request custom icon mappings from content script.

**Message:**
```javascript
window.postMessage({
  type: 'unifi-icon-browser-request-custom-icons'
}, '*')
```

---

## StorageManager API

The `StorageManager` module provides a unified interface for Chrome storage operations.

### Registry Methods

#### `getRegistry()`
Get the complete device registry.

```javascript
const registry = await StorageManager.getRegistry();
// Returns: { "id": { name: "...", addedAt: 123456 }, ... }
```

#### `saveRegistry(registry)`
Save the complete registry.

```javascript
const success = await StorageManager.saveRegistry({
  "12345": { name: "Device", addedAt: Date.now() }
});
// Returns: true/false
```

#### `saveDevicesToRegistry(devices)`
Add devices to registry (merge mode).

```javascript
const result = await StorageManager.saveDevicesToRegistry({
  "12345": "Device Name"
});
// Returns: { success: true, newCount: 5, totalCount: 5505 }
```

#### `clearRegistry()`
Clear all registry data.

```javascript
const success = await StorageManager.clearRegistry();
// Returns: true/false
```

#### `importRegistry(data, merge)`
Import registry data.

```javascript
const result = await StorageManager.importRegistry(data, true);
// Returns: { success: true, count: 150 }
```

#### `exportRegistry()`
Export registry data.

```javascript
const registry = await StorageManager.exportRegistry();
// Returns: { "id": { name: "...", addedAt: 123456 }, ... }
```

### Custom Mappings Methods

#### `getCustomMappings()`
Get all custom icon mappings.

```javascript
const mappings = await StorageManager.getCustomMappings();
// Returns: { "id": { iconUrl: "...", manufacturer: "...", ... }, ... }
```

#### `saveCustomMappings(mappings)`
Save all custom mappings.

```javascript
const success = await StorageManager.saveCustomMappings(mappings);
// Returns: true/false
```

#### `setCustomMapping(deviceId, mapping)`
Add or update a single mapping.

```javascript
const success = await StorageManager.setCustomMapping("500", {
  iconUrl: "https://example.com/icon.png",
  deviceName: "My Device",
  manufacturer: "Custom Corp",
  model: "Model X",
  os: "Linux"
});
// Returns: true/false
```

#### `removeCustomMapping(deviceId)`
Remove a custom mapping.

```javascript
const success = await StorageManager.removeCustomMapping("500");
// Returns: true/false
```

### Helper Methods

#### `getDeviceName(entry)`
Get device name from registry entry.

```javascript
const name = StorageManager.getDeviceName(entry);
// Handles both string and object formats
```

#### `getDeviceAddedAt(entry)`
Get timestamp from registry entry.

```javascript
const timestamp = StorageManager.getDeviceAddedAt(entry);
// Returns: number (timestamp) or 0
```

---

## Data Structures

### Registry Entry
```typescript
interface RegistryEntry {
  name: string;        // Device name
  addedAt: number;     // Unix timestamp (ms)
}

// Legacy format (auto-migrated):
type LegacyEntry = string;  // Just the name
```

### Custom Icon Mapping
```typescript
interface CustomIconMapping {
  iconUrl: string;           // URL to custom icon image
  name?: string;             // Display name in extension
  deviceName?: string;       // Override device name in UniFi
  manufacturer?: string;     // Override manufacturer field
  model?: string;            // Override model field
  os?: string;               // Override OS field
  addedAt: number;           // Unix timestamp (ms)
}
```

### Storage Keys
```javascript
const STORAGE_KEYS = {
  REGISTRY: 'unifiDeviceRegistry',
  CUSTOM_MAPPINGS: 'customIconMappings',
  LAST_SYNC: 'lastSyncTimestamp',
  LOCAL_MAPPINGS: 'unifi-icon-browser-mappings'  // localStorage
};
```

---

## Utils API

### `escapeHtml(str)`
Escape HTML to prevent XSS.

```javascript
const safe = Utils.escapeHtml('<script>alert("xss")</script>');
// Returns: "&lt;script&gt;alert("xss")&lt;/script&gt;"
```

### `formatRelativeTime(timestamp)`
Format timestamp as relative time.

```javascript
const time = Utils.formatRelativeTime(Date.now() - 3600000);
// Returns: "1h ago"
```

### `formatDate(timestamp)`
Format timestamp as readable date.

```javascript
const date = Utils.formatDate(1704067200000);
// Returns: "Jan 1, 2024, 12:00 AM"
```

### `debounce(func, wait)`
Create debounced function.

```javascript
const debouncedSearch = Utils.debounce(search, 300);
```

### `throttle(func, limit)`
Create throttled function.

```javascript
const throttledScroll = Utils.throttle(handleScroll, 100);
```

### `isUnifiUrl(url)`
Check if URL is UniFi-related.

```javascript
const isUnifi = Utils.isUnifiUrl('https://unifi.ui.com/network');
// Returns: true
```

### `extractDeviceIdFromUrl(url)`
Extract device ID from fingerprint URL.

```javascript
const id = Utils.extractDeviceIdFromUrl(
  'https://static.ui.com/fingerprint/0/12345_128x128.png'
);
// Returns: "12345"
```

### `buildFingerprintUrl(deviceId, size)`
Build fingerprint image URL.

```javascript
const url = Utils.buildFingerprintUrl('12345', 128);
// Returns: "https://static.ui.com/fingerprint/0/12345_128x128.png"
```

### `safeJsonParse(str, fallback)`
Safely parse JSON with fallback.

```javascript
const data = Utils.safeJsonParse('{"key": "value"}', {});
// Returns: { key: "value" }
```

### `deepClone(obj)`
Deep clone an object.

```javascript
const clone = Utils.deepClone(original);
```

### `sleep(ms)`
Async sleep function.

```javascript
await Utils.sleep(1000);  // Wait 1 second
```

### `generateId(prefix)`
Generate unique ID.

```javascript
const id = Utils.generateId('device');
// Returns: "device-1704067200000-abc123def"
```

### `looksLikeUserDeviceName(name)`
Check if name looks like a user's custom device name.

```javascript
Utils.looksLikeUserDeviceName("Jeff's Laptop");  // true
Utils.looksLikeUserDeviceName("Apple iPhone 14"); // false
```

---

## Config Constants

### URLs
```javascript
Config.URLS = {
  UNIFI_IMAGE_BASE: 'https://static.ui.com/fingerprint/0/',
  STATIC_UI_COM: 'static.ui.com',
  STATIC_UBNT_COM: 'static.ubnt.com'
};
```

### Pagination
```javascript
Config.PAGINATION = {
  DEVICES_PER_PAGE: 50,
  MAX_ELEMENTS_TO_SCAN: 500
};
```

### Timeouts (ms)
```javascript
Config.TIMEOUTS = {
  NOTIFICATION_DISPLAY: 3000,
  STATUS_MESSAGE_DISPLAY: 4000,
  DOM_EXTRACTION_DELAY: 2000,
  ICON_REPLACEMENT_DELAY: 50,
  PANEL_UPDATE_DELAY: 100,
  MUTATION_OBSERVER_DELAY: 200,
  RESPONSE_WAIT_DELAY: 500,
  EXTRACTION_STOP: 60000
};
```

### Colors
```javascript
Config.COLORS = {
  SUCCESS_BADGE: '#208637',
  ERROR_BADGE: '#d93025'
};
```

### Patterns
```javascript
Config.PATTERNS = {
  FINGERPRINT_URL: /fingerprint\/\d+\/(\d+)(?:_\d+x\d+)?\.png/i,
  DEVICE_IMAGE_API: /\/api\/.*device.*image.*\/(\d+)/i
};
```
