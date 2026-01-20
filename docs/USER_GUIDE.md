# UniFi Icon Browser - User Guide

A comprehensive guide to using the UniFi Icon Browser Chrome Extension.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Browsing Device Icons](#browsing-device-icons)
3. [Searching for Devices](#searching-for-devices)
4. [Using the Context Menu](#using-the-context-menu)
5. [Custom Icon Overrides](#custom-icon-overrides)
6. [Managing Your Database](#managing-your-database)
7. [Tips and Tricks](#tips-and-tricks)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

1. **Download the Extension**
   - Download the repository as a ZIP file or clone it
   - Extract to a folder on your computer

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `chrome-extension` folder

3. **Verify Installation**
   - The UniFi Icon Browser icon should appear in your toolbar
   - Click it to open the popup - you should see the device grid

### First Use

The extension comes **pre-loaded with ~5,500 device icons**. You can start browsing immediately:

1. Click the extension icon in your toolbar
2. Browse the icon grid or type to search
3. Click any icon to copy its device name

---

## Browsing Device Icons

### The Main Interface

```
┌─────────────────────────────────────────┐
│ UniFi Icon Browser            [⚙️]     │
├─────────────────────────────────────────┤
│ [All Devices] [Custom Icons]            │
├─────────────────────────────────────────┤
│ 🔍 Search devices...                    │
├─────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│ │ 📱 │ │ 💻 │ │ 🖥️ │ │ 📺 │ │ 🔌 │    │
│ │    │ │    │ │    │ │    │ │    │    │
│ │Name│ │Name│ │Name│ │Name│ │Name│    │
│ └────┘ └────┘ └────┘ └────┘ └────┘    │
│        ... more icons ...              │
├─────────────────────────────────────────┤
│ Showing 5,487 devices                   │
└─────────────────────────────────────────┘
```

### Tabs

- **All Devices** - Browse the complete device database
- **Custom Icons** - View your custom icon mappings

### Scrolling

- Scroll down to load more icons (50 at a time)
- The grid uses infinite scroll for smooth browsing
- Device count is shown at the bottom

---

## Searching for Devices

### Basic Search

1. Click in the search box or start typing
2. Enter any part of the device name
3. Results update in real-time

### Search Tips

| Search Term | What It Finds |
|-------------|---------------|
| `iphone` | All Apple iPhones |
| `galaxy s23` | Samsung Galaxy S23 variants |
| `sonos` | All Sonos devices |
| `printer` | All printers |
| `12345` | Device with ID 12345 |

### Search Features

- **Partial matching** - "phone" finds "iPhone", "Telephone", etc.
- **Case insensitive** - "IPHONE" = "iphone" = "iPhone"
- **ID search** - Search by device fingerprint ID
- **Real-time results** - No need to press Enter

---

## Using the Context Menu

Right-click on any device icon to access quick actions:

```
┌─────────────────────────┐
│ Copy Device Name        │
│ Copy Device ID          │
│ Copy Image URL          │
│ Open Image in New Tab   │
├─────────────────────────┤
│ Use as Custom Icon      │
└─────────────────────────┘
```

### Actions

| Action | Description |
|--------|-------------|
| **Copy Device Name** | Copy the device name to clipboard |
| **Copy Device ID** | Copy the fingerprint ID (e.g., "12345") |
| **Copy Image URL** | Copy the full URL to the icon image |
| **Open Image** | Open the icon in a new browser tab |
| **Use as Custom Icon** | Open options to create custom mapping |

### Quick Copy

Click directly on any icon to quickly copy its device name.

---

## Custom Icon Overrides

Custom icon overrides let you replace device icons and information for devices that don't have official UniFi fingerprints.

### Why Use Custom Icons?

When you set a device's icon in UniFi, you're assigning a "donor" device's fingerprint. This means:
- The icon shows the donor device image
- The side panel shows the donor's manufacturer/model/OS

Custom overrides let you:
- Use your own icon images
- Set custom manufacturer, model, and OS values
- Keep the benefits of the fingerprint while fixing the display

### Creating a Custom Mapping

#### Step 1: Find the Donor Device ID

1. Go to your UniFi portal
2. Click on the device you want to customize
3. Click "Change Icon" and select a donor device
4. Note the fingerprint ID (visible in the icon URL)

Or use the extension:
1. Search for the donor device in the extension
2. Right-click → "Copy Device ID"

#### Step 2: Open Settings

1. Click the **⚙️ gear icon** in the popup
2. Navigate to the **Custom Icons** section

#### Step 3: Add the Mapping

```
┌─────────────────────────────────────────────────────┐
│ Add Custom Icon Mapping                             │
├─────────────────────────────────────────────────────┤
│ Donor Device ID (Fingerprint ID)*                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 500                                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Display Name*                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ My Home Server                                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Custom Icon URL*                                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ https://example.com/server-icon.png            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ▼ Device Info Overrides (Optional)                 │
│                                                     │
│ Manufacturer    Model           OS                  │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│ │ Dell        │ │ PowerEdge   │ │ Ubuntu      │    │
│ └─────────────┘ └─────────────┘ └─────────────┘    │
│                                                     │
│                         [Add Custom Icon Mapping]   │
└─────────────────────────────────────────────────────┘
```

#### Fields Explained

| Field | Required | Description |
|-------|----------|-------------|
| Donor Device ID | Yes | The fingerprint ID of the donor device |
| Display Name | Yes | Name shown in the extension |
| Custom Icon URL | Yes | Direct URL to your custom icon image |
| Manufacturer | No | Replaces manufacturer in UniFi side panel |
| Model | No | Replaces model in UniFi side panel |
| OS | No | Replaces OS in UniFi side panel |

### Managing Custom Icons

#### View Custom Icons

1. Click **Custom Icons** tab in popup, or
2. Go to Settings → Custom Icons section

#### Edit a Mapping

1. Find the mapping in your list
2. Click **Edit**
3. Update the fields
4. Click **Save**

#### Delete a Mapping

1. Find the mapping in your list
2. Click **Delete**
3. Confirm the deletion

#### Import/Export

Export your mappings to share or backup:
1. Go to Settings → Custom Icons
2. Click **Export Custom Icons**
3. Save the JSON file

Import mappings:
1. Click **Import Custom Icons**
2. Select a JSON file
3. Mappings are merged with existing ones

---

## Managing Your Database

### Refreshing the Database

To get the latest devices (when new UniFi products are released):

1. Navigate to your UniFi portal
2. Log in and go to any device
3. Click "Change Icon" to open the icon picker
4. The extension automatically captures all devices
5. Check the badge for confirmation

### Import/Export

#### Export Registry

1. Go to Settings → Database section
2. Click **Export**
3. Save the JSON file

#### Import Registry

1. Click **Import**
2. Select a previously exported JSON file
3. New devices are merged with existing

### Clear Database

1. Go to Settings → Database section
2. Click **Clear Registry**
3. Confirm the action

**Note:** Clearing resets to the pre-loaded database. Custom icon mappings are preserved.

---

## Tips and Tricks

### Finding the Right Icon

1. **Search broadly first** - Start with general terms like "router" or "camera"
2. **Get specific** - Narrow down with model numbers
3. **Try manufacturer names** - "ubiquiti", "apple", "samsung"
4. **Use partial model numbers** - "s23" instead of "Galaxy S23 Ultra"

### Best Practices for Custom Icons

1. **Use PNG or SVG images** - These work best
2. **Keep icons square** - 128x128px is ideal
3. **Host reliably** - Use URLs that won't change
4. **Fill in manufacturer** - This updates the Vendor column in device list

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search box |
| `Escape` | Clear search / close menu |
| `Enter` | Copy first result's name |

### Performance Tips

- Use specific searches rather than browsing all 5,500 icons
- Custom icon images load from your URLs - use fast hosts
- Clear unused custom mappings to keep things tidy

---

## Troubleshooting

### Extension Not Working

**Symptom:** Extension popup is blank or shows error

**Solutions:**
1. Reload the extension in `chrome://extensions/`
2. Check that all files are present
3. Verify manifest.json is valid
4. Check browser console for errors

---

### "Not on a UniFi page"

**Symptom:** Status shows page is not detected as UniFi

**Solutions:**
1. Verify you're on a UniFi controller page
2. URL should contain "unifi", "ui.com", "/network", or "/protect"
3. Click **Activate** to manually inject scripts
4. For local controllers, ensure HTTPS is configured

---

### Database Not Updating

**Symptom:** New devices not appearing after visiting UniFi portal

**Solutions:**
1. Open the **icon picker modal** in UniFi (this triggers extraction)
2. Wait for the badge to show device count
3. Close and reopen the extension popup
4. Check Settings → Database for total count

---

### Custom Icons Not Appearing

**Symptom:** Custom icon mapping added but not showing in UniFi

**Cause:** Several possible issues

**Solutions:**
1. **Verify Donor ID** - Must exactly match the fingerprint assigned in UniFi
2. **Check URL accessibility** - Icon URL must be publicly accessible
3. **Refresh the UniFi page** - Changes require page reload
4. **Check browser console** - Look for CORS or loading errors
5. **Test the URL** - Open icon URL directly in browser

---

### Vendor Column Not Updating

**Symptom:** Custom manufacturer not showing in device list Vendor column

**Solutions:**
1. Ensure **Manufacturer** field is filled in your mapping
2. Manufacturer → Vendor column mapping
3. Refresh the device list page
4. May take a moment to replace after page load

---

### Import/Export Errors

**Symptom:** Error when importing JSON file

**Solutions:**
1. Verify file is valid JSON
2. Check file encoding (should be UTF-8)
3. Ensure file isn't empty
4. Try a smaller subset first

---

### Slow Performance

**Symptom:** Extension popup slow to load or scroll

**Solutions:**
1. Use search instead of scrolling through all devices
2. Reduce number of custom mappings if excessive
3. Clear and re-import database
4. Restart Chrome

---

## Getting Help

### Resources

- **GitHub Issues:** Report bugs or request features
- **README:** Quick start and installation
- **Architecture Docs:** Technical details

### Reporting Issues

When reporting issues, include:
1. Chrome version
2. Extension version (shown in Settings → About)
3. Steps to reproduce
4. Browser console errors (if any)
5. Screenshots (if helpful)

---

## FAQ

**Q: Does this work with Firefox?**
A: No, the extension uses Manifest V3 which is currently Chrome/Chromium only.

**Q: Where is my data stored?**
A: All data is stored locally in Chrome storage. Nothing is sent externally.

**Q: Will custom icons persist through UniFi updates?**
A: Yes, custom mappings are stored in the extension, not UniFi.

**Q: Can I share my custom icons with others?**
A: Yes! Use the Export feature to save your mappings as JSON.

**Q: How do I update the device database?**
A: Visit any UniFi portal and open the icon picker modal.

**Q: Why can't I find [specific device]?**
A: The database contains official UniFi fingerprints. If a device isn't listed, it may not have an official fingerprint yet.
