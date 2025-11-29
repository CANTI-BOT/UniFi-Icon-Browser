# UniFi Device Icon Browser

A simple, client-side tool for browsing and searching UniFi device icons with automatic device name/ID extraction from the UniFi portal.

![UniFi Icon Browser](https://img.shields.io/badge/UniFi-Icon%20Browser-132889?style=for-the-badge&logo=ubiquiti)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)
![No Dependencies](https://img.shields.io/badge/dependencies-none-success?style=for-the-badge)

## Features

- **🔍 Smart Search** - Easily search every device icon available in Unifi uisng partial matches
- **📋 Easy Import** - Extracts device ID list directly from UniFi portal using a clever bookmarklet
- **💾 Persistent Storage** - Device ID's are saved locally and persist across sessions
- **🎨 Modern UI** - Beautiful dark mode interface with smooth animations
- **⚡ Fast & Secure** - Pure HTML/CSS/JavaScript, no dependencies, lives 100% in your browser!

## What It Does

This tool solves a major fustration I have with UniFi: **finding the right device icon quickly** (or at least a close match).         
Instead of scrolling through **THOUSANDS** of icons, or trying to search the **EXACT** name of the device in the UniFi portal, you can:

1. Extract the entire device list from your UniFi portal
2. Search and browse devices by partial matches
3. Easily copy device names or image URLs with one click

## Quick Start

### Option 1: Direct Use (Recommended)

1. **Download** `unifi-icon-browser.html` to your computer
2. **Open** it in any modern web browser (Chrome, Firefox, Edge, Safari)
3. **Follow** the on-page instructions to set up the bookmarklet
4. **Start browsing** device icons!

### Option 2: GitHub Pages

1. Fork this repository
2. Enable GitHub Pages in your repository settings
3. Access your instance at `https://yourusername.github.io/unifi-icon-browser/`

## 📖 How to Use

### Step 1: Set Up the Bookmarklet

1. Open the unifi-icon-browser.html file in your browser
2. Drag the **"Extract Devices from UniFi Portal"** link to your bookmarks bar

### Step 2: Extract Device Names

1. Open a **new tab** and navigate to your UniFi portal
2. Log in to your UniFi dashboard (both local and *.ui.com methods work)
3. Click on any client device
4. Click on the device's icon to open the icon selection modal
5. **While the icon selection modal is open**, click the bookmarklet you created in Step 1
6. You'll see a success message with the number of device IDs extracted
7. The JSON data is automatically copied to your clipboard
<img width="713" height="688" alt="image" src="https://github.com/user-attachments/assets/00420bb3-6c20-44f3-bb9d-0945912e438f" />


### Step 3: Import Device Names

1. Return to the UniFi Icon Browser page
2. Click the **"📋 Paste Import"** button
3. Your device names are now imported and searchable!

### Step 4: Search and Browse

- Type in the search box to filter devices by name or ID
- Click any icon to copy its device name to clipboard
- Use the action buttons to copy device ID or image URL

## How It Works

### Architecture

This is a **100% client-side application** - all processing happens in your browser:

- **No backend server** - Everything runs locally
- **No external dependencies** - Pure vanilla JavaScript
- **LocalStorage persistence** - Your data stays on your device
- **Bookmarklet extraction** - Uses React Fiber traversal to extract device data from UniFi portal

### Technical Details

#### Bookmarklet Extraction

The bookmarklet uses advanced techniques to extract device names from the UniFi portal:

1. **React Fiber Traversal** - Traverses React's internal component tree to find device data
2. **DOM Fallback** - Falls back to DOM parsing if React data isn't found
3. **Virtual Scrolling Support** - Extracts all devices, not just visible ones
4. **Safe Execution** - Includes error handling and depth limits to prevent page lockups

#### Data Storage

- **Device Registry** (`UNIFI_DEVICE_REGISTRY`) - Stores ID to name mappings
- **LocalStorage** - Persists registry across browser sessions
- **No Cloud Sync** - Your data never leaves your device

#### Search Algorithm

- Searches both loaded icons and registry entries
- Case-insensitive matching on device names and IDs
- Limits results to 100 items for performance
- Real-time filtering as you type

## Why I Made This

As a UniFi admin, I grew fustrated with scrolling through thousands of devices in a box the size of a postage stamp, looking for the right icon.
(...or if it didn't exist, at least one that was a close match). 

The UniFi portal does have a search box, but it deson't allow perial name matches.               
(...searching "iPhone" shows 0 results, but "**Apple iphone**" does, for example.)

## Screenshots

### Main Interface
- Clean, modern dark mode interface
- Collapsible instructions section
- Sticky search bar for easy access
- Real-time device count display
 <img width="713" height="688" alt="image" src="https://github.com/user-attachments/assets/0be9b219-21c7-4032-8674-f5eb8a88599b" />

### Search Results
- Grid layout with device icons
- Click to copy device names
- Quick access to device IDs and URLs
<img width="713" height="688" alt="image" src="https://github.com/user-attachments/assets/807141da-adbe-463d-bb12-8e9dd6fec32e" />


## 🔒 Privacy & Security

- **100% Local** - All data stays on your device
- **No Tracking** - No analytics, no external requests
- **No Authentication** - No login required
- **Open Source** - Review the code yourself

## 🛠️ Browser Compatibility

- ✅ Chrome/Edge (Chromium) - Full support
- ✅ Firefox - Full support
- ✅ Safari - Full support
- ✅ Opera - Full support

**Note:** The bookmarklet requires a modern browser with JavaScript enabled.


## Contributing

Contributions are welcome! Here are some ways you can help:

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


## ⚠️ Disclaimer

This tool is not affiliated with or endorsed by Ubiquiti Inc. It is an independent, community-driven project. Use at your own discretion.

---

**Made with ❤️ for the UniFi community**

If you find this tool useful, please consider giving it a ⭐ on GitHub!

