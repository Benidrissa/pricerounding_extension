// Background script for Price Rounder Extension
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        // Set default settings on first install
        chrome.storage.sync.set({
            priceRounderEnabled: true,
            priceRoundingMode: 'nearest',
            priceEcommerceMode: true
        }, function() {
            console.log('Price Rounder extension installed with default settings');
        });
        
        // Open welcome page or show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Price Rounder Installed!',
            message: 'Extension is active. Click the icon to toggle price rounding and select rounding mode.'
        });
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener(function(tab) {
    // This will open the popup, which is already defined in manifest
    // No additional action needed here
});

// Listen for tab updates to reinject content script if needed
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && 
        (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        
        // Check if extension is enabled
        chrome.storage.sync.get(['priceRounderEnabled', 'priceRoundingMode', 'priceEcommerceMode'], function(result) {
            if (result.priceRounderEnabled !== false) {
                // Extension is enabled, make sure content script is working
                chrome.tabs.sendMessage(tabId, {action: 'getStatus'}, function(response) {
                    if (chrome.runtime.lastError) {
                        // Content script might not be loaded, it will be loaded automatically
                        console.log('Content script will be loaded automatically');
                    }
                });
            }
        });
    }
});
