# Price Rounder Extension for Microsoft Edge

A Microsoft Edge extension that rounds prices on e-commerce and shopping websites to remove confusing psychological pricing strategies.

## Features

### 🎯 Price Detection Modes
- **Regular Text Detection**: Finds and rounds prices in regular text content (e.g., "$19.99", "€24.95")
- **E-commerce Mode**: Specialized detection for major e-commerce sites with structured HTML pricing

### 🔧 Rounding Options
- **Nearest Dollar**: Rounds to the nearest whole number (always rounds UP)
- **Multiple of 5**: Rounds to the nearest multiple of 5 (always rounds UP)
- **Multiple of 10**: Rounds to the nearest multiple of 10 (always rounds UP)

### 🛍️ Supported E-commerce Sites
- **Amazon**: Handles Amazon's structured pricing with separate elements for dollars and cents
- **Temu**: Supports Temu's pricing structure with integer and cent components
- **Extensible**: Easy to add support for other major e-commerce platforms

## Installation

1. Download or clone this repository
2. Open Microsoft Edge and go to `edge://extensions/`
3. Enable "Developer mode" in the left sidebar
4. Click "Load unpacked" and select the extension folder
5. The Price Rounder icon will appear in the toolbar

## Usage

### Basic Usage
1. Click the extension icon in the toolbar to open the popup
2. Toggle "Enable Price Rounding" to activate/deactivate the extension
3. Select your preferred rounding mode (Nearest, Multiple of 5, or Multiple of 10)
4. Browse any shopping website - prices will be automatically rounded

### E-commerce Mode
1. Toggle "Enable E-commerce Mode" for better support of structured pricing on major sites
2. This mode specifically targets Amazon, Temu, and other sites with complex HTML price structures
3. Can be used alongside or instead of regular text detection

### Settings Persistence
- All settings are automatically saved and restored when you restart the browser
- Settings apply across all tabs and browser sessions

## Examples

| Original Price | Nearest | Multiple of 5 | Multiple of 10 |
|---------------|---------|---------------|----------------|
| $19.99        | $20.00  | $20.00        | $20.00         |
| $24.95        | $25.00  | $25.00        | $30.00         |
| $149.99       | $150.00 | $150.00       | $150.00        |
| $89.95        | $90.00  | $90.00        | $90.00         |
| $27.50        | $28.00  | $30.00        | $30.00         |

## Technical Details

### Supported Currency Formats
- US Dollar ($)
- Euro (€)
- British Pound (£)
- Japanese Yen (¥)
- And many others

### E-commerce Site Configurations
The extension includes pre-configured selectors for:

**Amazon**:
- `.a-price` containers with `.a-price-whole` and `.a-price-fraction` elements
- Handles Amazon's complex pricing structure

**Temu**:
- `.goods-price` containers with `.price-int` and `.price-cent` elements
- Supports Temu's structured pricing format

### File Structure
```
pricerounding_extension/
├── manifest.json          # Extension configuration
├── content.js            # Main price detection and rounding logic
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── background.js        # Extension background service worker
├── popup.css           # Popup styling
├── icons/              # Extension icons
└── test files/         # Test HTML files for development
```

## Development

### Testing
Use the included test files:
- `debug.html` - Basic price detection testing
- `ecommerce-test.html` - E-commerce structured price testing
- `ecommerce-complete-test.html` - Comprehensive testing with all features

### Adding New E-commerce Sites
To add support for a new e-commerce site, modify the `ecommerceConfigs` object in `content.js`:

```javascript
ecommerceConfigs['newsite.com'] = {
    selectors: ['.price-container'],
    handler: function(element) {
        // Custom logic for extracting and updating prices
        // Return true if price was processed, false otherwise
    }
};
```

## Version History

- **v1.3.0**: Added e-commerce mode with Amazon and Temu support
- **v1.2.0**: Added multiple rounding options (5, 10) and improved UI
- **v1.1.0**: Added rounding mode selection and settings persistence
- **v1.0.0**: Initial release with basic price rounding

## Permissions

The extension requires the following permissions:
- `activeTab`: To access and modify content on the current tab
- `storage`: To save and restore user preferences
- `scripting`: To inject content scripts for price detection

## Privacy

This extension:
- ✅ Only processes data locally in your browser
- ✅ Does not send any data to external servers
- ✅ Does not track your browsing activity
- ✅ Only accesses price information to perform rounding

## Contributing

Feel free to contribute by:
1. Adding support for more e-commerce sites
2. Improving price detection algorithms
3. Enhancing the user interface
4. Reporting bugs or suggesting features

## License

This project is open source and available under the MIT License.
