# 🛒 Price Rounder Extension - Testing Guide

## Quick Installation for Testing

1. **Open Microsoft Edge**
2. **Go to Extensions**: `edge://extensions/`
3. **Enable Developer Mode**: Toggle the switch in the bottom-left
4. **Load Extension**: Click "Load unpacked" and select this folder
5. **Pin Extension**: Click the extension icon in the toolbar to pin it

## 🧪 Testing the Temu Fix

### Test Files Available:
- `test-temu-comprehensive.html` - **NEW comprehensive Temu test**
- `actual-temu-test.html` - Original Temu formats
- `test-real-structure.html` - Amazon test

### Quick Test:
1. **Load the extension** (see installation above)
2. **Open test file**: Navigate to `test-temu-comprehensive.html`
3. **Check console**: Press F12 → Console tab
4. **Look for logs**: Search for "Price Rounder:" messages
5. **Verify changes**: Prices should round up (₦29,133 → ₦30,000)

## 🔧 New Features in This Update:

### ✅ Enhanced Temu Support:
- **Nigerian Naira (₦)** format with commas: `₦29,133` → `₦30,000`
- **Multiple selector strategies** for Temu's dynamic classes
- **Proper thousands separators** for Nigerian format
- **Dynamic content detection** for Temu's AJAX loading

### ✅ Universal Price Detection:
- **Site-specific strategies**: Amazon vs Temu vs Universal
- **Multiple currency support**: $, €, £, ¥, ₹, ₽, ₩, ₦
- **Regional formatting**: Proper number formatting per currency
- **Mutation observer**: Handles dynamically loaded content

### ✅ Better Error Handling:
- **Duplicate prevention**: Won't process same element twice
- **Graceful failures**: Continues if one price fails
- **Comprehensive logging**: Detailed console output for debugging

## 🐛 Debugging Steps:

1. **Check Extension Loading**:
   ```
   Open edge://extensions/ → Verify "Price Rounder" is enabled
   ```

2. **Check Console Logs**:
   ```
   F12 → Console → Look for "Price Rounder:" messages
   ```

3. **Test with Real Sites**:
   - Go to real Temu.com
   - Open console (F12)
   - Look for price processing logs
   - Verify prices change from ₦X,XXX to ₦X,000

4. **Manual Testing**:
   ```javascript
   // Run in console on Temu page:
   console.log('Naira elements:', document.querySelectorAll('*[class*="price"]'));
   ```

## Expected Console Output:
```
Price Rounder: Universal content script loaded and starting...
Price Rounder: Processing site: temu.com
Price Rounder: Detected Temu site
Price Rounder: Processing Temu prices...
Price Rounder: Found X elements with selector: .current-price
Price Rounder: Temu ₦29,133 → ₦30,000
Price Rounder: Updated Temu element: ₦29,133 → ₦30,000
Price Rounder: Processed X Temu prices
```

## 🚀 Quick Test Commands:

Open browser console on Temu and run:
```javascript
// Check for Naira prices
document.querySelectorAll('*').forEach(el => {
  if(el.textContent && /₦\s*\d/.test(el.textContent)) {
    console.log('Found:', el.textContent, el);
  }
});
```

If you still see "no effect on Temu", please:
1. Check console for error messages
2. Verify extension is loaded and enabled
3. Test with the comprehensive test file first
4. Share any console errors you see

The extension should now work on real Temu sites with Nigerian Naira formatting! 🎯
