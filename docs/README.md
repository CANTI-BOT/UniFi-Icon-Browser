# UniFi Icon Browser Documentation

Welcome to the UniFi Icon Browser documentation. This directory contains comprehensive documentation for users and developers.

## Documentation Index

| Document | Description | Audience |
|----------|-------------|----------|
| [User Guide](USER_GUIDE.md) | How to use the extension | End Users |
| [Architecture](ARCHITECTURE.md) | System design and components | Developers |
| [API Reference](API.md) | Internal APIs and data structures | Developers |
| [Contributing](CONTRIBUTING.md) | How to contribute to the project | Contributors |

## Quick Links

### For Users

- [Installation](USER_GUIDE.md#getting-started)
- [Searching for Devices](USER_GUIDE.md#searching-for-devices)
- [Custom Icon Overrides](USER_GUIDE.md#custom-icon-overrides)
- [Troubleshooting](USER_GUIDE.md#troubleshooting)
- [FAQ](USER_GUIDE.md#faq)

### For Developers

- [Project Structure](CONTRIBUTING.md#project-structure)
- [Development Setup](CONTRIBUTING.md#development-setup)
- [Architecture Overview](ARCHITECTURE.md#system-overview)
- [Message API](API.md#chrome-runtime-messaging)
- [Storage Schema](API.md#data-structures)
- [Coding Standards](CONTRIBUTING.md#coding-standards)

## Overview

The UniFi Icon Browser is a Chrome Extension that provides:

1. **Device Icon Browser** - Browse and search ~5,500 UniFi device icons
2. **Custom Icon Overrides** - Replace icons for devices without official fingerprints
3. **Device Info Overrides** - Customize manufacturer, model, and OS display
4. **Import/Export** - Share and backup your configurations

## Architecture Summary

```
┌──────────────────────────────────────────────────┐
│                Chrome Extension                  │
├──────────────────────────────────────────────────┤
│  UI Layer    │  Service Worker  │  Content Layer │
│  - Popup     │  - Background    │  - Content     │
│  - Options   │                  │  - Injected    │
├──────────────────────────────────────────────────┤
│              Shared Modules                      │
│  Config  │  Utils  │  StorageManager             │
├──────────────────────────────────────────────────┤
│              Data Storage                        │
│  Chrome Local Storage  │  Pre-loaded Database    │
└──────────────────────────────────────────────────┘
```

## Getting Help

- **Bug Reports**: [Open an issue](https://github.com/YOUR_USERNAME/UniFi-Icon-Browser/issues)
- **Feature Requests**: [Open an issue](https://github.com/YOUR_USERNAME/UniFi-Icon-Browser/issues)
- **Questions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/UniFi-Icon-Browser/discussions)

## Version

Current documentation version: **v1.4.0**

Documentation is kept in sync with the extension version.
