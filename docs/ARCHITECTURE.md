# UniFi Icon Browser - Architecture Documentation

This document describes the technical architecture of the UniFi Icon Browser Chrome Extension.

## System Overview

The UniFi Icon Browser is a Chrome Extension (Manifest V3) that enables browsing, searching, and customizing UniFi device icons. It consists of multiple interconnected components that work together to provide a seamless user experience.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Chrome Extension"
        subgraph "UI Layer"
            Popup[Popup UI<br/>popup.html/js/css]
            Options[Options Page<br/>options.html/js/css]
        end

        subgraph "Service Worker"
            Background[Background Script<br/>background.js]
        end

        subgraph "Content Layer"
            Content[Content Script<br/>content.js]
            Injected[Injected Script<br/>injected.js]
        end

        subgraph "Shared Modules"
            Config[Config<br/>config.js]
            Utils[Utils<br/>utils.js]
            Storage[StorageManager<br/>storageManager.js]
        end

        subgraph "Data"
            Database[(fingerprint-database.json<br/>~5,500 devices)]
            ChromeStorage[(Chrome Storage<br/>Local)]
        end
    end

    subgraph "UniFi Portal"
        UnifiPage[UniFi Web App<br/>React Application]
        ReactFiber[React Fiber Tree]
        FetchAPI[Fetch API<br/>Device Data]
    end

    subgraph "External"
        StaticUI[static.ui.com<br/>Device Icons]
        CustomIcons[Custom Icon URLs<br/>User-provided]
    end

    %% UI connections
    Popup --> Background
    Options --> Background
    Popup --> Storage
    Options --> Storage

    %% Background connections
    Background --> Storage
    Background --> Content
    Background --> Config
    Background --> Utils

    %% Content layer connections
    Content --> Injected
    Content --> Background
    Injected --> ReactFiber
    Injected --> FetchAPI

    %% Data connections
    Storage --> ChromeStorage
    Popup --> Database

    %% External connections
    Popup --> StaticUI
    Injected --> UnifiPage
    Injected --> CustomIcons
```

## Component Architecture

### 1. UI Layer

#### Popup (`popup/`)
The extension popup provides the primary user interface for browsing device icons.

```mermaid
graph LR
    subgraph "Popup Components"
        Header[Header<br/>Title + Options Button]
        Tabs[Tab Navigation<br/>All Devices / Custom Icons]
        Search[Search Input<br/>Real-time filtering]
        Grid[Icon Grid<br/>Infinite scroll]
        Context[Context Menu<br/>Copy actions]
        Status[Status Bar<br/>Device count]
    end

    Header --> Tabs
    Tabs --> Search
    Search --> Grid
    Grid --> Context
    Grid --> Status
```

**Key Features:**
- Tab-based navigation (All Devices / Custom Icons)
- Real-time search filtering
- Infinite scroll with pagination (50 items per page)
- Context menu for quick actions
- Direct link to options page

#### Options Page (`options/`)
Full-page settings interface for managing custom icon mappings.

```mermaid
graph LR
    subgraph "Options Sections"
        Sidebar[Sidebar Navigation]
        Database[Database Section<br/>Import/Export/Clear]
        CustomIcons[Custom Icons Section<br/>Add/Edit/Delete mappings]
        About[About Section<br/>Version info]
    end

    Sidebar --> Database
    Sidebar --> CustomIcons
    Sidebar --> About
```

### 2. Background Service Worker

The background script (`background.js`) serves as the central coordinator for the extension.

```mermaid
sequenceDiagram
    participant P as Popup
    participant B as Background
    participant C as Content Script
    participant S as StorageManager

    P->>B: getRegistry
    B->>S: getRegistry()
    S-->>B: registry data
    B-->>P: { registry }

    C->>B: replaceRegistry
    B->>S: saveRegistry()
    S-->>B: success
    B-->>C: { success, count }

    P->>B: injectScript
    B->>C: executeScript()
    C-->>B: injected
    B-->>P: { success }
```

**Message Actions:**
| Action | Description | Direction |
|--------|-------------|-----------|
| `getRegistry` | Retrieve device registry | Popup → Background |
| `saveToRegistry` | Save devices (merge) | Content → Background |
| `replaceRegistry` | Replace entire registry | Content → Background |
| `clearRegistry` | Clear all device data | Popup → Background |
| `exportRegistry` | Export for backup | Options → Background |
| `importRegistry` | Import from backup | Options → Background |
| `injectScript` | Manual script injection | Popup → Background |

### 3. Content Layer

#### Content Script (`content.js`)
Runs in the context of UniFi web pages, acting as a bridge between the extension and the page.

```mermaid
graph TB
    subgraph "Content Script"
        Detect[Page Detection<br/>isUnifiPage]
        Inject[Script Injection<br/>injected.js]
        Listen[Message Listener<br/>postMessage]
        Bridge[Extension Bridge<br/>chrome.runtime]
    end

    Detect --> Inject
    Inject --> Listen
    Listen --> Bridge
```

**Responsibilities:**
- Detect UniFi pages using URL patterns and DOM elements
- Inject the page script (`injected.js`)
- Bridge communication between injected script and background
- Load and forward custom icon mappings

#### Injected Script (`injected.js`)
Runs in the page context with full access to the page's JavaScript environment.

```mermaid
graph TB
    subgraph "Injected Script Features"
        subgraph "Data Extraction"
            ReactExtract[React Fiber Extraction<br/>Icon picker modal data]
            FetchHook[Fetch Interception<br/>API response transformation]
        end

        subgraph "DOM Manipulation"
            IconReplace[Icon Replacement<br/>Custom icon URLs]
            InfoReplace[Info Replacement<br/>Manufacturer/Model/OS]
            VendorReplace[Vendor Column<br/>Table row updates]
        end

        subgraph "Flash Prevention"
            CSSInject[CSS Injection<br/>Hide panels during replace]
            ClickIntercept[Click Interception<br/>Pre-emptive hiding]
        end
    end

    ReactExtract --> FetchHook
    FetchHook --> IconReplace
    IconReplace --> InfoReplace
    InfoReplace --> VendorReplace
    CSSInject --> ClickIntercept
```

### 4. Shared Modules

#### Config (`config.js`)
Centralized configuration constants.

```javascript
Config = {
    URLS: { ... },           // Base URLs for icon loading
    PAGINATION: { ... },     // Items per page, scan limits
    TIMEOUTS: { ... },       // Various timeout values
    INTERVALS: { ... },      // Polling intervals
    VALIDATION: { ... },     // Input validation rules
    COLORS: { ... },         // UI colors
    STORAGE_KEYS: { ... },   // Chrome storage keys
    PATTERNS: { ... },       // Regex patterns
    SELECTORS: { ... }       // DOM selectors
}
```

#### Utils (`utils.js`)
Shared utility functions.

| Function | Purpose |
|----------|---------|
| `escapeHtml()` | XSS prevention |
| `formatRelativeTime()` | Time display |
| `debounce()` / `throttle()` | Performance optimization |
| `isUnifiUrl()` | URL detection |
| `extractDeviceIdFromUrl()` | Parse fingerprint IDs |
| `buildFingerprintUrl()` | Construct icon URLs |
| `looksLikeUserDeviceName()` | Filter user device names |

#### StorageManager (`storageManager.js`)
Centralized Chrome storage operations.

```mermaid
classDiagram
    class StorageManager {
        +KEYS: Object
        +getRegistry() Promise~Object~
        +saveRegistry(registry) Promise~boolean~
        +saveDevicesToRegistry(devices) Promise~Result~
        +clearRegistry() Promise~boolean~
        +getCustomMappings() Promise~Object~
        +saveCustomMappings(mappings) Promise~boolean~
        +setCustomMapping(deviceId, mapping) Promise~boolean~
        +removeCustomMapping(deviceId) Promise~boolean~
        -_migrateRegistryIfNeeded(registry) MigrationResult
        -_normalizeEntry(value, timestamp) Entry
    }
```

## Data Flow

### Device Database Flow

```mermaid
sequenceDiagram
    participant User
    participant Popup
    participant Background
    participant Content
    participant Injected
    participant UniFi

    User->>UniFi: Opens icon picker modal
    Injected->>UniFi: Extract React Fiber data
    Injected->>Content: postMessage (fingerprints)
    Content->>Background: replaceRegistry
    Background->>Background: Save to Chrome Storage
    User->>Popup: Opens extension
    Popup->>Background: getRegistry
    Background-->>Popup: Device list
    Popup->>User: Display icons
```

### Custom Icon Flow

```mermaid
sequenceDiagram
    participant User
    participant Options
    participant Storage
    participant Content
    participant Injected
    participant UniFi

    User->>Options: Add custom mapping
    Options->>Storage: setCustomMapping()
    Storage->>Content: Notify via storage change
    Content->>Injected: postMessage (mappings)
    User->>UniFi: View device list
    Injected->>UniFi: Replace icons in DOM
    Injected->>UniFi: Transform API responses
    UniFi->>User: Display custom icons
```

## Storage Schema

### Device Registry
```json
{
  "unifiDeviceRegistry": {
    "12345": {
      "name": "Apple iPhone 14 Pro",
      "addedAt": 1704067200000
    },
    "67890": {
      "name": "Samsung Galaxy S23",
      "addedAt": 1704067200000
    }
  }
}
```

### Custom Icon Mappings
```json
{
  "customIconMappings": {
    "500": {
      "name": "My Custom Device",
      "iconUrl": "https://example.com/icon.png",
      "deviceName": "Custom Server",
      "manufacturer": "Custom Corp",
      "model": "Model X",
      "os": "Linux",
      "addedAt": 1704067200000
    }
  }
}
```

## Security Considerations

### XSS Prevention
- All user-provided content is escaped using `Utils.escapeHtml()`
- Custom icon URLs are validated before use
- DOM manipulation uses safe methods

### Permission Minimization
- Only essential permissions requested
- Host permissions scoped to UniFi-related domains
- No broad `<all_urls>` access for content scripts

### Content Security
- Injected script runs in page context (necessary for React access)
- Communication via `postMessage` with origin validation
- No sensitive data transmitted externally

## Performance Optimizations

### Debouncing & Throttling
- Search input debounced to reduce re-renders
- Scroll events throttled for pagination
- Mutation observer callbacks batched

### Lazy Loading
- Device icons loaded on-demand
- Infinite scroll pagination (50 items per page)
- Database loaded only when popup opens

### Flash Prevention
- CSS injection hides panels during replacement
- Click interception pre-emptively hides content
- `requestAnimationFrame` for smooth transitions

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 88+ | Full |
| Edge | 88+ | Full |
| Brave | Latest | Full |
| Opera | Latest | Full |
| Vivaldi | Latest | Full |
| Firefox | - | Not supported (Manifest V3) |
| Safari | - | Not supported |

## File Structure

```
chrome-extension/
├── manifest.json              # Extension manifest (v3)
├── data/
│   └── fingerprint-database.json  # Pre-loaded device database
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
└── scripts/
    ├── background.js          # Service worker
    ├── content.js             # Content script
    ├── injected.js            # Page script
    ├── config.js              # Configuration
    ├── utils.js               # Utilities
    └── storageManager.js      # Storage abstraction
```
