# UniFi Device Icon Browser - Chrome Extension

See the [main README](../README.md) for full documentation.

## Quick Install

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this `chrome-extension` folder

## File Structure

```
chrome-extension/
├── manifest.json              # Extension configuration (Manifest V3)
├── data/
│   └── fingerprint-database.json  # Pre-loaded device database (~5,500 devices)
├── icons/                     # Extension icons (16, 32, 48, 128px)
├── popup/                     # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/                   # Options/Settings page
│   ├── options.html
│   ├── options.css
│   └── options.js
└── scripts/
    ├── background.js          # Service worker
    ├── content.js             # Content script for UniFi pages
    ├── injected.js            # Page script for React/API interception
    ├── storageManager.js      # Centralized storage operations
    ├── config.js              # Configuration constants
    └── utils.js               # Shared utility functions
```

## Version

Current: **v1.4.0**

See the main README for changelog and full feature list.
