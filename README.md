# 💰 Price Rounder - Microsoft Edge Extension

**Clear pricing, honest shopping** - A Microsoft Edge extension that rounds confusing price endings (like $9.99) **UP** to clear higher numbers (like $10.00) on e-commerce websites.

## 🎯 Purpose

Many retailers use psychological pricing strategies (like $9.99, $19.95, etc.) to make prices appear lower than they actually are. This extension helps consumers see the true cost by automatically rounding these prices **UP** to the next higher value, ensuring you always see the higher, more honest price.

## ✨ Features

- **Automatic Price Detection**: Detects prices in multiple formats and currencies
- **Always Rounds UP**: Ensures prices are never underestimated - always shows higher values
- **Multiple Rounding Modes**: Choose between rounding up to whole numbers, multiples of 5, or multiples of 10
- **Real-time Rounding**: Rounds prices as pages load and updates dynamically
- **Multi-Currency Support**: Works with $, €, £, ¥, ₹, ₽, ₩, and many more currencies
- **Toggle Control**: Easy on/off switch via popup interface
- **Customizable Settings**: Select your preferred rounding behavior
- **Non-Destructive**: Original prices can be restored by disabling the extension
- **Universal Compatibility**: Works on all e-commerce and shopping websites

## 🔧 Supported Price Formats & Rounding Modes

The extension recognizes and rounds various price formats with three different rounding modes:

### Rounding Modes (Always UP)

1. **Round UP to Whole Number** (Default)
   - $9.99 → $10.00
   - $9.01 → $10.00
   - €27.50 → €28.00

2. **Round UP to Multiple of 5**
   - $9.99 → $10.00
   - $11.01 → $15.00
   - €27.50 → €30.00

3. **Round UP to Multiple of 10**
   - $9.99 → $10.00
   - $11.01 → $20.00
   - €27.50 → €30.00

### Supported Formats

- **Symbol before**: $9.99 → $10.00, €19.95 → €20.00
- **Symbol after**: 9.99$ → 10.00$, 19.95€ → 20.00€
- **With spaces**: kr 9.99 → kr 10.00, 19.95 zł → 20.00 zł
- **Currency codes**: USD 9.99 → USD 10.00, 9.99 EUR → 10.00 EUR
- **Thousands separators**: $1,299.99 → $1,300.00

## 📥 Installation

### Method 1: Developer Mode (Recommended for now)

1. **Download the extension**:
   ```bash
   git clone <repository-url>
   # or download and extract the ZIP file
   ```

2. **Open Microsoft Edge**:
   - Navigate to `edge://extensions/`
   - Enable "Developer mode" (toggle in bottom left)

3. **Load the extension**:
   - Click "Load unpacked"
   - Select the `pricerounding_extension` folder
   - The extension should now appear in your extensions list

4. **Pin the extension** (optional):
   - Click the puzzle piece icon in the toolbar
   - Find "Price Rounder" and click the pin icon

### Method 2: Edge Add-ons Store (Coming Soon)

The extension will be available on the Microsoft Edge Add-ons store once approved.

## 🚀 Usage

1. **Install and activate** the extension following the installation steps above

2. **Browse any e-commerce website** (Amazon, eBay, shopping sites, etc.)

3. **Prices are automatically rounded UP**:
   - $9.99 becomes $10.00
   - $9.01 becomes $10.00 (always higher, never lower)
   - €19.95 becomes €20.00
   - £4.50 becomes £5.00

4. **Configure rounding mode**:
   - Click the extension icon in the toolbar
   - Choose your preferred rounding mode:
     - **Nearest whole number**: Traditional rounding (default)
     - **Nearest multiple of 5**: Rounds to 5, 10, 15, 20, etc.
     - **Nearest multiple of 10**: Rounds to 10, 20, 30, etc.
   - Use the toggle switch to enable/disable price rounding
   - Changes apply immediately to the current page

## 🛠️ Development

### Project Structure

```
pricerounding_extension/
├── manifest.json          # Extension configuration
├── content.js            # Main price detection and rounding logic
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── create_icons.sh       # Icon generation script
└── README.md            # This file
```

### Key Components

- **`content.js`**: Contains the core price detection algorithms and DOM manipulation
- **`popup.html/js`**: Provides the user interface for controlling the extension
- **`background.js`**: Handles extension lifecycle and settings persistence
- **`manifest.json`**: Defines permissions, content scripts, and extension metadata

### Customization

You can modify the price detection patterns and rounding behavior in `content.js`:

```javascript
// Add new currency symbols
const currencySymbols = ['$', '€', '£', '¥', '₹', '₽', '₩', 'YOUR_SYMBOL'];

// Modify rounding behavior
function roundPrice(priceStr) {
    const numericValue = parseFloat(priceStr.replace(/[^\d.]/g, ''));
    
    let rounded;
    switch (roundingMode) {
        case 'multiple5':
            // Round UP to next multiple of 5
            rounded = Math.ceil(numericValue / 5) * 5;
            break;
        case 'multiple10':
            // Round UP to next multiple of 10
            rounded = Math.ceil(numericValue / 10) * 10;
            break;
        case 'nearest':
        default:
            // Round UP to next whole number
            rounded = Math.ceil(numericValue);
            break;
    }
    
    return rounded.toFixed(2);
}
```

## 🔒 Privacy & Security

- **No data collection**: The extension does not collect, store, or transmit any personal data
- **Local processing**: All price detection and rounding happens locally in your browser
- **No external connections**: The extension does not make any network requests
- **Minimal permissions**: Only requests access to modify page content for price rounding

## 🐛 Troubleshooting

### Extension not working on a page?

1. **Refresh the page** after installing or enabling the extension
2. **Check if the site has prices** in supported formats
3. **Verify the extension is enabled** by clicking the icon and checking the toggle

### Prices not being detected?

1. The extension may not recognize the specific price format used on that site
2. Check the browser console for any errors (F12 → Console tab)
3. Some sites may load prices dynamically - try waiting a moment after page load

### Toggle not working?

1. Try refreshing the page after changing the toggle state
2. Check that the extension has permissions to access the current site
3. Some sites may prevent content modification

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report bugs**: Open an issue with details about what went wrong
2. **Suggest features**: Ideas for new functionality or improvements
3. **Add currency support**: Help add support for more currencies and formats
4. **Improve detection**: Enhance the price detection algorithms
5. **Better icons**: Create proper icon files to replace the placeholder ones

### Development Setup

1. Clone the repository
2. Make your changes
3. Test the extension by loading it in developer mode
4. Submit a pull request with your improvements

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🌟 Changelog

### v1.2.0 (Current)
- **BREAKING CHANGE**: All rounding now goes UP instead of nearest (more consumer-friendly)
- **IMPROVED**: Always shows higher prices, never underestimates costs
- **ENHANCED**: Better examples and documentation for upward rounding behavior

### v1.1.0
- **NEW**: Multiple rounding modes (nearest whole number, multiple of 5, multiple of 10)
- **NEW**: Enhanced popup interface with rounding mode selection
- **NEW**: Real-time example updates based on selected mode
- Improved settings persistence
- Better user experience with immediate visual feedback

### v1.0.0
- Initial release
- Multi-currency price detection and rounding
- Toggle interface
- Support for major e-commerce sites
- Real-time DOM monitoring for dynamic content

## 🔮 Future Plans

- [ ] Support for more currencies and regional formats
- [x] ~~Custom rounding rules (round up, round down, nearest $5, etc.)~~ ✅ Added in v1.1.0
- [ ] Advanced rounding options (always round up, always round down)
- [ ] Price comparison features
- [ ] Statistics on money saved from psychological pricing
- [ ] Options page with advanced settings
- [ ] Keyboard shortcuts
- [ ] Whitelist/blacklist for specific websites
- [ ] Export/import settings

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information about the problem
4. Include your browser version, extension version, and the website where the issue occurred

---

**Made with ❤️ for honest pricing and transparent shopping.**
