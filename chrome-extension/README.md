# UniFi Device Icon Browser - Chrome Extension

A Chrome extension for browsing and searching UniFi device icons with **automatic** device name extraction from UniFi portals and **custom icon overrides** for devices that lack official fingerprints.

## Features

### Core Features
- **Pre-loaded Database**: Comes bundled with ~5,500 device names - works offline immediately!
- **Automatic Collection**: Device names are automatically collected as you browse UniFi pages
- **Works Everywhere**: Supports both UniFi cloud portal (unifi.ui.com) and local/self-hosted controllers
- **Search & Browse**: Search devices by name or ID with infinite scroll
- **Context Menu**: Right-click on any icon for quick actions (copy name, ID, URL, or open image)

### Custom Icon Overrides (NEW in v1.4.0)
- **Replace Device Icons**: Assign custom images to devices that lack official UniFi icons
- **Override Device Info**: Customize Manufacturer, Model, and OS displayed in the UniFi side panel
- **Vendor Column Updates**: Custom manufacturer names appear in the device list "Vendor" column
- **Import/Export**: Share your custom icon configurations with others
- **Flash Prevention**: Smooth transitions prevent original values from flickering before replacement

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the `chrome-extension` folder
6. The extension icon should appear in your toolbar

### Generate Icons (Optional)

If the icons don't display correctly, run the PowerShell script:
```powershell
cd chrome-extension/icons
powershell -ExecutionPolicy Bypass -File create-icons.ps1
```

## Usage

### Ready Out of the Box

The extension comes with a pre-loaded database of ~5,500 devices! Just install and start searching.

1. Click the extension icon
2. Type a device name to search, or browse the grid
3. Click any icon to copy the device name
4. Right-click for more options

### Custom Icon Overrides

Replace icons for devices that use generic "donor" fingerprints:

1. Click the **gear icon** in the popup to open Settings
2. Navigate to **Custom Icons** section
3. Enter the **Donor Device ID** (the fingerprint ID assigned in UniFi)
4. Enter a **Custom Icon URL** (direct link to PNG/SVG image)
5. Optionally fill in **Device Info Overrides** (Manufacturer, Model, OS)
6. Click **Add Custom Icon Mapping**

**Finding the Donor Device ID:**
1. In the UniFi portal, click on your device
2. Open the icon picker (Change Icon)
3. Select any device as a "donor" - this assigns that device's fingerprint ID to your device
4. The fingerprint ID is visible in the icon URL or use the extension's Icon Browser to find it

### Refreshing the Database

To get the latest devices (when new UniFi devices are released):

1. Navigate to any UniFi portal and log in
2. Open the **icon picker modal** (Change Icon on any device)
3. The extension automatically captures the complete device list (~5,500 entries)
4. The database is replaced with fresh official data

### Tabs in Popup

- **All Devices**: Browse and search the complete device icon database
- **Custom Icons**: View your custom icon mappings with quick links to edit them

## How It Works

### Device Name Collection

The extension uses multiple methods to collect device data:

1. **React State Extraction**: Traverses React fiber tree to find device data from the icon picker modal
2. **Fetch Interception**: Hooks into `fetch()` to transform API responses with custom device info
3. **DOM Replacement**: Watches for fingerprint images and replaces them with custom icons
4. **Mutation Observer**: Monitors dynamically loaded content for new icons to replace

### Custom Icon System

When you create a custom icon mapping:

1. **Icon Replacement**: Any fingerprint image matching the donor ID is replaced with your custom URL
2. **API Transformation**: Device info in API responses is modified to show your custom values
3. **Panel Updates**: The device detail panel displays your custom Manufacturer/Model/OS
4. **Vendor Column**: The device list Vendor column shows your custom manufacturer

## Permissions

The extension requires the following permissions:

- **storage**: To save device names and custom icon mappings locally
- **activeTab**: To interact with the current tab
- **clipboardWrite**: To copy device names and IDs
- **scripting**: To inject content scripts into local controller pages
- **Host permissions**: To work with UniFi pages and load static images

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
├── scripts/
│   ├── background.js          # Service worker
│   ├── content.js             # Content script for UniFi pages
│   ├── injected.js            # Page script for React/API interception
│   ├── storageManager.js      # Centralized storage operations
│   ├── config.js              # Configuration constants
│   └── utils.js               # Shared utility functions
└── README.md
```

## Compatibility

- Chrome 88+ (Manifest V3)
- Microsoft Edge 88+
- Other Chromium-based browsers

Works with:
- UniFi Cloud Portal (unifi.ui.com)
- UniFi Network Application (local)
- UniFi Dream Machine / Dream Router
- UniFi Cloud Key
- Self-hosted UniFi controllers

## Troubleshooting

### "Not on a UniFi page"
- Make sure you're on a UniFi controller page
- For local controllers, the URL should contain "unifi", "/network", or "/protect"

### "UniFi page detected - not activated"
- Click the **Activate** button to enable collection
- This is normal for local controllers that don't match standard URL patterns

### No devices found
- Open the device icon selection modal in the UniFi portal
- The extension captures the complete database from this modal
- Scroll through the icons to trigger loading

### Custom icons not appearing
- Verify the Donor Device ID matches the fingerprint assigned in UniFi
- Check that the custom icon URL is accessible (direct link to image)
- Refresh the UniFi page after adding a new mapping
- Check browser console for any errors

### Vendor column not updating
- Ensure the Manufacturer field is filled in your custom mapping
- The extension uses Manufacturer for the Vendor column
- Refresh the device list page

## Changelog

### v1.4.0
- **NEW: Custom Icon Overrides** - Replace device icons with custom images
- **NEW: Device Info Overrides** - Customize Manufacturer, Model, and OS in side panel
- **NEW: Vendor Column Replacement** - Custom manufacturer appears in device list
- **NEW: Custom Icons Tab** in popup - Quick access to your custom mappings
- **NEW: Options Page** - Full settings interface with Custom Icons management
- **NEW: Import/Export** for custom mappings
- Flash prevention system for smooth icon/info transitions
- Modular code architecture with StorageManager, Config, and Utils modules
- Improved security with HTML escaping and XSS prevention

### v1.3.0
- **NEW: Pre-loaded Database** - Extension now comes bundled with ~5,500 device names
- Automatic database loading on first run from bundled data
- Database auto-refreshes when visiting authenticated UniFi pages

### v1.2.0
- **NEW: Fetch All button** - Downloads complete fingerprint database with one click
- Automatic database fetch on page load
- Direct API integration with fingerprint_devices endpoint

### v1.1.0
- Added support for local/self-hosted UniFi controllers
- Automatic device collection via API interception
- Added "Activate" button for manual script injection
- Improved extraction methods

### v1.0.0
- Initial release
- Basic extraction from UniFi cloud portal
- Search and browse functionality
- Import/Export support

## License

MIT License - Feel free to modify and distribute.

## Contributing

Found a bug or have a feature request? Open an issue on GitHub!

## Credits

Device icons are loaded from Ubiquiti's static CDN (static.ui.com). This extension is not affiliated with or endorsed by Ubiquiti Inc.
