# Contributing to UniFi Icon Browser

Thank you for your interest in contributing to UniFi Icon Browser! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Making Changes](#making-changes)
6. [Testing](#testing)
7. [Submitting Changes](#submitting-changes)
8. [Coding Standards](#coding-standards)
9. [Documentation](#documentation)

---

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributions from everyone regardless of experience level.

---

## Getting Started

### Prerequisites

- **Chrome** or Chromium-based browser (version 88+)
- **Git** for version control
- **Text editor** or IDE (VS Code recommended)
- Basic knowledge of JavaScript, HTML, and CSS

### Types of Contributions

We welcome:

- **Bug fixes** - Fix issues with existing functionality
- **Features** - Add new capabilities
- **Documentation** - Improve docs, add examples
- **Testing** - Add test cases, improve coverage
- **UI/UX** - Enhance the user interface

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/UniFi-Icon-Browser.git
cd UniFi-Icon-Browser
```

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` folder
5. Note the extension ID (you'll need this for testing)

### 3. Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Reload extension in chrome://extensions/ to test

# Commit changes
git add .
git commit -m "Add: description of your changes"

# Push to your fork
git push origin feature/your-feature-name
```

### 4. Hot Reloading (Manual)

After making changes:
1. Go to `chrome://extensions/`
2. Click the refresh icon on the extension card
3. Reload any open UniFi pages to apply changes

---

## Project Structure

```
UniFi-Icon-Browser/
├── chrome-extension/           # Chrome Extension
│   ├── manifest.json          # Extension manifest (v3)
│   ├── data/
│   │   └── fingerprint-database.json  # Pre-loaded device data
│   ├── icons/                 # Extension icons
│   ├── popup/                 # Popup UI
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── options/               # Options/Settings page
│   │   ├── options.html
│   │   ├── options.css
│   │   └── options.js
│   └── scripts/               # JavaScript modules
│       ├── background.js      # Service worker
│       ├── content.js         # Content script
│       ├── injected.js        # Page script
│       ├── config.js          # Configuration
│       ├── utils.js           # Utilities
│       └── storageManager.js  # Storage abstraction
├── docs/                      # Documentation
├── unifi-icon-browser.html    # Standalone HTML version
├── LICENSE
└── README.md
```

### Key Files

| File | Purpose | When to Modify |
|------|---------|----------------|
| `manifest.json` | Extension config | Adding permissions, changing metadata |
| `background.js` | Service worker | Message handling, storage operations |
| `content.js` | Page bridge | Page detection, extension-page communication |
| `injected.js` | Page script | React extraction, DOM manipulation |
| `popup.js` | Popup logic | UI interactions, display logic |
| `options.js` | Settings logic | Custom mapping management |
| `config.js` | Constants | Adding configuration values |
| `utils.js` | Utilities | Adding shared helper functions |
| `storageManager.js` | Storage API | Changing storage schema |

---

## Making Changes

### Adding a New Feature

1. **Discuss first** - Open an issue to discuss the feature
2. **Branch** - Create a feature branch from `main`
3. **Implement** - Make your changes following coding standards
4. **Test** - Verify functionality works as expected
5. **Document** - Update relevant documentation
6. **Submit** - Open a pull request

### Fixing a Bug

1. **Reproduce** - Confirm the bug exists
2. **Branch** - Create a fix branch
3. **Fix** - Make the minimum changes needed
4. **Test** - Verify the fix works
5. **Submit** - Open a pull request with bug details

### Modifying Storage Schema

If you need to change how data is stored:

1. **Update** `storageManager.js` with new methods
2. **Add migration** logic for existing data
3. **Update** `config.js` with new storage keys
4. **Test** migration from old format
5. **Document** schema changes in API.md

---

## Testing

### Manual Testing Checklist

#### Popup UI
- [ ] Opens correctly
- [ ] Icons load and display
- [ ] Search filters results
- [ ] Tab switching works
- [ ] Context menu appears
- [ ] Copy functions work
- [ ] Scroll/pagination works

#### Options Page
- [ ] All sections accessible
- [ ] Custom icon adding works
- [ ] Import/export functions
- [ ] Delete confirmation works
- [ ] Database clear works

#### Page Integration
- [ ] UniFi page detected correctly
- [ ] Icons replaced with custom images
- [ ] Side panel info updated
- [ ] Vendor column updated
- [ ] No console errors

#### Cross-Browser
- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Brave (latest)

### Testing Custom Icons

1. Create a test mapping with known values
2. Navigate to UniFi portal
3. Verify icon replacement
4. Verify side panel updates
5. Verify vendor column updates
6. Remove mapping and verify original restores

---

## Submitting Changes

### Pull Request Process

1. **Update your branch** with latest main
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Push changes** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open Pull Request** on GitHub
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changed and why
   - Include testing steps

### PR Title Format

```
Type: Brief description

Examples:
Add: Custom icon import/export buttons
Fix: Search not finding devices by ID
Update: Improve panel replacement timing
Docs: Add troubleshooting section
```

### PR Template

```markdown
## Description
Brief description of changes.

## Related Issues
Fixes #123

## Changes
- Change 1
- Change 2

## Testing
- [ ] Tested in Chrome
- [ ] Tested custom icon flow
- [ ] No console errors

## Screenshots
(if applicable)
```

---

## Coding Standards

### JavaScript Style

```javascript
// Use const/let, not var
const CONFIG = {};
let counter = 0;

// Use async/await for promises
async function loadData() {
    const result = await fetch(url);
    return result.json();
}

// Use arrow functions for callbacks
items.forEach(item => processItem(item));

// Use template literals
const message = `Found ${count} devices`;

// Use destructuring
const { name, id } = device;

// Document functions with JSDoc
/**
 * Brief description of function
 * @param {string} id - Device ID
 * @returns {Promise<Object>} Device data
 */
async function getDevice(id) {
    // implementation
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `deviceCount` |
| Constants | UPPER_SNAKE_CASE | `MAX_DEVICES` |
| Functions | camelCase | `loadDevices()` |
| Classes | PascalCase | `StorageManager` |
| Files | kebab-case | `storage-manager.js` |
| CSS Classes | kebab-case | `.device-card` |

### HTML/CSS Style

```html
<!-- Use semantic HTML -->
<section class="device-list">
    <header class="device-header">
        <h2>Devices</h2>
    </header>
    <div class="device-grid">
        <!-- items -->
    </div>
</section>
```

```css
/* Organize CSS logically */
.component {
    /* Layout */
    display: flex;
    position: relative;

    /* Box model */
    width: 100%;
    padding: 10px;
    margin: 0;

    /* Typography */
    font-size: 14px;
    color: #fff;

    /* Visual */
    background: #1a1a2e;
    border-radius: 8px;

    /* Animation */
    transition: all 0.2s ease;
}
```

### Error Handling

```javascript
// Always handle errors gracefully
try {
    const result = await riskyOperation();
    return result;
} catch (error) {
    console.error('[ModuleName] Operation failed:', error);
    return fallbackValue;
}

// Check for null/undefined
if (!data?.items?.length) {
    return [];
}
```

### Security

- **Escape HTML** - Always use `Utils.escapeHtml()` for user content
- **Validate URLs** - Check custom icon URLs before use
- **Check origins** - Validate message sources
- **Avoid eval()** - Never use eval or Function()

---

## Documentation

### When to Update Docs

- Adding new features
- Changing existing behavior
- Modifying API/storage schema
- Fixing significant bugs
- Adding configuration options

### Documentation Files

| File | Content |
|------|---------|
| `README.md` | Overview, installation, quick start |
| `docs/ARCHITECTURE.md` | System design, component details |
| `docs/API.md` | Internal APIs, storage schema |
| `docs/USER_GUIDE.md` | End-user documentation |
| `docs/CONTRIBUTING.md` | This file |

### Inline Documentation

```javascript
/**
 * Module: StorageManager
 * Purpose: Centralized Chrome storage operations
 *
 * This module handles all storage interactions for the extension,
 * providing a clean API and handling data migration.
 */

/**
 * Save devices to the registry
 *
 * Merges new devices with existing registry entries.
 * Only adds devices that don't already exist.
 *
 * @param {Object} devices - Map of device ID to name
 * @param {string} devices[].name - Device name
 * @returns {Promise<{success: boolean, newCount: number, totalCount: number}>}
 *
 * @example
 * const result = await saveDevicesToRegistry({
 *     '12345': 'Apple iPhone 14',
 *     '67890': 'Samsung Galaxy S23'
 * });
 * // result: { success: true, newCount: 2, totalCount: 5502 }
 */
async function saveDevicesToRegistry(devices) {
    // implementation
}
```

---

## Questions?

- **Issues** - Open a GitHub issue for bugs or features
- **Discussions** - Use GitHub Discussions for questions
- **Pull Requests** - Reference this guide in your PR

Thank you for contributing!
