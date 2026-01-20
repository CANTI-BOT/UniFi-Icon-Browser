# UniFi Device Icon Browser

A powerful tool for browsing, searching, and customizing UniFi device icons. Available as a **Chrome Extension** (recommended) or a standalone **HTML file**.

![UniFi Icon Browser](https://img.shields.io/badge/UniFi-Icon%20Browser-132889?style=for-the-badge&logo=ubiquiti)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome)
![Version](https://img.shields.io/badge/version-1.4.0-green?style=for-the-badge)

## Why This Exists

As a UniFi admin, I grew frustrated with scrolling through **THOUSANDS** of device icons in a box the size of a postage stamp, looking for the right icon (or at least a close match).

The UniFi portal does have a search box, but it doesn't allow partial name matches - searching "iPhone" shows 0 results, but "**Apple iPhone**" does.

This tool solves that problem and adds the ability to **use custom icons** for devices that don't have official UniFi fingerprints!

## Features

### Core Features
- **🔍 Smart Search** - Search devices by partial name matches instantly
- **📦 Pre-loaded Database** - ~5,500 device icons ready to browse immediately
- **🌐 Works Everywhere** - Supports UniFi Cloud Portal and local/self-hosted controllers
- **📋 Easy Copy** - One-click copy of device names, IDs, or image URLs

### Custom Icon Overrides (Chrome Extension Only)
- **🎨 Replace Device Icons** - Use any image URL for devices without official icons
- **📝 Override Device Info** - Customize Manufacturer, Model, and OS in the side panel
- **📊 Vendor Column Updates** - Your custom manufacturer appears in the device list
- **💾 Import/Export** - Share custom icon configurations with others

---

## 🚀 Chrome Extension (Recommended)

The Chrome Extension is the most powerful and convenient way to use UniFi Icon Browser.

### Installation

1. **Download** this repository (Code → Download ZIP) or clone it
2. **Extract** the ZIP file if downloaded
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable **Developer mode** (toggle in the top right)
5. Click **Load unpacked**
6. Select the `chrome-extension` folder
7. The extension icon should appear in your toolbar

### Quick Start

The extension comes **pre-loaded with ~5,500 device names** - just install and start searching!

1. Click the extension icon in your toolbar
2. Type a device name to search, or browse the grid
3. Click any icon to copy the device name
4. Right-click for more options (copy ID, URL, or open image)

### Using Custom Icon Overrides

Replace icons for devices that use generic "donor" fingerprints:

1. Click the **⚙️ gear icon** in the popup to open Settings
2. Navigate to **Custom Icons** section
3. Enter the **Donor Device ID** (the fingerprint ID assigned in UniFi)
4. Enter a **Custom Icon URL** (direct link to PNG/SVG image)
5. Optionally fill in **Device Info Overrides** (Manufacturer, Model, OS)
6. Click **Add Custom Icon Mapping**

**Finding the Donor Device ID:**
1. In the UniFi portal, click on your device
2. Open the icon picker (Change Icon)
3. Select any device as a "donor" - this assigns that device's fingerprint ID
4. The fingerprint ID is visible in the icon URL, or use the extension's Icon Browser

### Refreshing the Database

To get the latest devices when new UniFi products are released:

1. Navigate to any UniFi portal and log in
2. Open the **icon picker modal** (Change Icon on any device)
3. The extension automatically captures the complete device list
4. The database is replaced with fresh official data

### Extension Screenshots

| Popup Interface | Custom Icons Tab | Settings Page |
|-----------------|------------------|---------------|
| Browse & search all devices | View your custom mappings | Manage custom icon overrides |

---

## 📄 Standalone HTML Version

For users who prefer a simple, portable solution without installing an extension.

### Installation

1. **Download** `unifi-icon-browser.html` to your computer
2. **Open** it in any modern web browser
3. **Follow** the on-page instructions to set up the bookmarklet

### How to Use

#### Step 1: Set Up the Bookmarklet

1. Open `unifi-icon-browser.html` in your browser
2. Drag the **"Extract Devices from UniFi Portal"** link to your bookmarks bar

#### Step 2: Extract Device Names

1. Open a **new tab** and navigate to your UniFi portal
2. Log in to your UniFi dashboard (both local and *.ui.com methods work)
3. Click on any client device
4. Click on the device's icon to open the icon selection modal
5. **While the icon selection modal is open**, click the bookmarklet
6. You'll see a success message with the number of device IDs extracted
7. The JSON data is automatically copied to your clipboard

<img width="713" height="688" alt="Bookmarklet extraction" src="https://github.com/user-attachments/assets/00420bb3-6c20-44f3-bb9d-0945912e438f" />

#### Step 3: Import Device Names

1. Return to the UniFi Icon Browser page
2. Click the **"📋 Paste Import"** button
3. Your device names are now imported and searchable!

#### Step 4: Search and Browse

- Type in the search box to filter devices by name or ID
- Click any icon to copy its device name to clipboard
- Use the action buttons to copy device ID or image URL

### HTML Version Screenshots

| Main Interface | Search Results |
|----------------|----------------|
| <img width="400" alt="Main interface" src="https://github.com/user-attachments/assets/0be9b219-21c7-4032-8674-f5eb8a88599b" /> | <img width="400" alt="Search results" src="https://github.com/user-attachments/assets/807141da-adbe-463d-bb12-8e9dd6fec32e" /> |

---

## 🔧 How It Works

### Chrome Extension

The extension uses multiple methods to collect and display device data:

1. **React Fiber Traversal** - Extracts device data directly from UniFi's React components
2. **Fetch Interception** - Hooks into API calls to transform responses with custom device info
3. **DOM Replacement** - Watches for fingerprint images and replaces them with custom icons
4. **Mutation Observer** - Monitors dynamically loaded content for real-time updates

### HTML Version

- **Bookmarklet Extraction** - Traverses React's internal component tree to find device data
- **LocalStorage Persistence** - Your data stays on your device across sessions
- **No External Dependencies** - Pure vanilla JavaScript, 100% client-side

---

## 🛠️ Compatibility

### Chrome Extension
- ✅ Chrome 88+ (Manifest V3)
- ✅ Microsoft Edge 88+
- ✅ Other Chromium-based browsers (Brave, Opera, Vivaldi)

### HTML Version
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

### UniFi Controllers
- ✅ UniFi Cloud Portal (unifi.ui.com)
- ✅ UniFi Network Application (local)
- ✅ UniFi Dream Machine / Dream Router
- ✅ UniFi Cloud Key
- ✅ Self-hosted UniFi controllers

---

## 🔒 Privacy & Security

- **100% Local** - All data stays on your device
- **No Tracking** - No analytics, no external requests (except loading icons from static.ui.com)
- **No Authentication** - No login required
- **Open Source** - Review the code yourself
- **Minimal Permissions** - Only requests what's necessary

---

## 📁 Project Structure

```
UniFi-Icon-Browser/
├── unifi-icon-browser.html    # Standalone HTML version
├── chrome-extension/          # Chrome Extension
│   ├── manifest.json          # Extension configuration (Manifest V3)
│   ├── data/
│   │   └── fingerprint-database.json  # Pre-loaded device database
│   ├── icons/                 # Extension icons
│   ├── popup/                 # Extension popup UI
│   ├── options/               # Settings page
│   └── scripts/               # Background, content, and injected scripts
├── LICENSE
└── README.md
```

---

## 🐛 Troubleshooting

### Chrome Extension

| Issue | Solution |
|-------|----------|
| "Not on a UniFi page" | Make sure you're on a UniFi controller page with "unifi", "/network", or "/protect" in the URL |
| "UniFi page detected - not activated" | Click the **Activate** button to enable collection |
| No devices found | Open the device icon selection modal to trigger database capture |
| Custom icons not appearing | Verify the Donor Device ID matches, check icon URL accessibility, refresh page |
| Vendor column not updating | Ensure the Manufacturer field is filled in your custom mapping |

### HTML Version

| Issue | Solution |
|-------|----------|
| Bookmarklet not working | Make sure the icon selection modal is open when you click it |
| "0 devices found" | Try scrolling through the icon list first to trigger loading |
| Data not persisting | Check that your browser allows localStorage |

---

## 📜 Changelog

### v1.4.0 (Chrome Extension)
- **NEW:** Custom Icon Overrides - Replace device icons with custom images
- **NEW:** Device Info Overrides - Customize Manufacturer, Model, and OS
- **NEW:** Vendor Column Replacement - Custom manufacturer in device list
- **NEW:** Custom Icons Tab in popup
- **NEW:** Full Options/Settings page
- **NEW:** Import/Export for custom mappings
- Flash prevention for smooth transitions
- Improved security with HTML escaping

### v1.3.0 (Chrome Extension)
- **NEW:** Pre-loaded database with ~5,500 device names
- Works offline immediately after installation

### v1.0.0 (HTML Version)
- Initial release with bookmarklet extraction
- Search and browse functionality
- Import/Export support

---

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This tool is not affiliated with or endorsed by Ubiquiti Inc. It is an independent, community-driven project. Device icons are loaded from Ubiquiti's static CDN (static.ui.com). Use at your own discretion.

---

**Made with ❤️ for the UniFi community**

If you find this tool useful, please consider giving it a ⭐ on GitHub!
