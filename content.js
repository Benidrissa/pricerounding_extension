// Price Rounder Content Script
(function() {
    'use strict';
    
    console.log('Price Rounder: Content script loaded');

    let isEnabled = true;
    let roundingMode = 'nearest'; // 'nearest', 'multiple5', 'multiple10'
    let originalPrices = new Map(); // Store original prices for restoration
    let isInitialized = false;

    // Currency symbols and patterns
    const currencySymbols = ['$', '€', '£', '¥', '₹', '₽', '₩', 'R$', 'C$', 'A$', 'kr', 'zł', '₪', '₦'];
    
    // Price patterns to match various price formats
    const pricePatterns = [
        // $9.99, €19.95, £4.99
        /(\$|€|£|¥|₹|₽|₩|R\$|C\$|A\$|₪|₦)\s*(\d{1,3}(?:,\d{3})*)\.\d{2}/g,
        // 9.99$, 19.95€, 4.99£ (symbol after)
        /(\d{1,3}(?:,\d{3})*)\.\d{2}\s*(\$|€|£|¥|₹|₽|₩|R\$|C\$|A\$|₪|₦)/g,
        // kr 9.99, zł 19.95 (symbol before with space)
        /(kr|zł)\s+(\d{1,3}(?:,\d{3})*)\.\d{2}/g,
        // 9.99 kr, 19.95 zł (symbol after with space)
        /(\d{1,3}(?:,\d{3})*)\.\d{2}\s+(kr|zł)/g,
        // USD 9.99, EUR 19.95 (currency code before)
        /(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|SEK|NOK|MXN|INR|RUB|KRW|SGD|HKD|NZD|ZAR|BRL|PLN|CZK|HUF|ILS|TRY|THB|MYR|PHP|IDR|VND|AED|SAR|EGP|NGN|KES|GHS|UGX|TZS|ZMW|BWP|NAD|SZL|LSL|MWK|RWF|BIF|DJF|ETB|SOS|SCR|MUR|MVR|NPR|BTN|LKR|PKR|BDT|AFN|IRR|IQD|JOD|KWD|LBP|SYP|YER|OMR|QAR|BHD|AMD|AZN|GEL|KGS|KZT|MDL|TJS|TMT|UZS|BYN|UAH|RON|BGN|HRK|RSD|BAM|MKD|ALL|EUR|DKK|ISK|FOK|FJD|TOP|WST|VUV|SBD|PGK|NCR|XPF|NZD|AUD|TVD|KID|NRU|PLW)\s+(\d{1,3}(?:,\d{3})*)\.\d{2}/g,
        // 9.99 USD, 19.95 EUR (currency code after)
        /(\d{1,3}(?:,\d{3})*)\.\d{2}\s+(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|SEK|NOK|MXN|INR|RUB|KRW|SGD|HKD|NZD|ZAR|BRL|PLN|CZK|HUF|ILS|TRY|THB|MYR|PHP|IDR|VND|AED|SAR|EGP|NGN|KES|GHS|UGX|TZS|ZMW|BWP|NAD|SZL|LSL|MWK|RWF|BIF|DJF|ETB|SOS|SCR|MUR|MVR|NPR|BTN|LKR|PKR|BDT|AFN|IRR|IQD|JOD|KWD|LBP|SYP|YER|OMR|QAR|BHD|AMD|AZN|GEL|KGS|KZT|MDL|TJS|TMT|UZS|BYN|UAH|RON|BGN|HRK|RSD|BAM|MKD|ALL|EUR|DKK|ISK|FOK|FJD|TOP|WST|VUV|SBD|PGK|NCR|XPF|NZD|AUD|TVD|KID|NRU|PLW)/g
    ];

    // Function to round a price value based on selected mode (always UP)
    function roundPrice(priceStr) {
        // Extract numeric value
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

    // Function to replace price in text while preserving format
    function replacePriceInText(text, match, currencySymbol, price, isSymbolAfter = false, isSpaced = false) {
        const roundedPrice = roundPrice(price);
        
        if (isSymbolAfter) {
            return isSpaced ? 
                `${roundedPrice} ${currencySymbol}` : 
                `${roundedPrice}${currencySymbol}`;
        } else {
            return isSpaced ? 
                `${currencySymbol} ${roundedPrice}` : 
                `${currencySymbol}${roundedPrice}`;
        }
    }

    // Function to process text content and round prices
    function processTextForPrices(text) {
        if (!text || typeof text !== 'string') return text;
        
        let processedText = text;

        // Pattern 1: $9.99, €19.95, £4.99 (symbol before, no space)
        processedText = processedText.replace(/(\$|€|£|¥|₹|₽|₩|R\$|C\$|A\$|₪|₦)\s*(\d{1,3}(?:,\d{3})*\.\d{2})/g, 
            (match, symbol, price) => {
                return replacePriceInText(match, match, symbol, price, false, false);
            });

        // Pattern 2: 9.99$, 19.95€ (symbol after, no space)
        processedText = processedText.replace(/(\d{1,3}(?:,\d{3})*\.\d{2})\s*(\$|€|£|¥|₹|₽|₩|R\$|C\$|A\$|₪|₦)/g, 
            (match, price, symbol) => {
                return replacePriceInText(match, match, symbol, price, true, false);
            });

        // Pattern 3: kr 9.99, zł 19.95 (symbol before with space)
        processedText = processedText.replace(/(kr|zł)\s+(\d{1,3}(?:,\d{3})*\.\d{2})/g, 
            (match, symbol, price) => {
                return replacePriceInText(match, match, symbol, price, false, true);
            });

        // Pattern 4: 9.99 kr, 19.95 zł (symbol after with space)
        processedText = processedText.replace(/(\d{1,3}(?:,\d{3})*\.\d{2})\s+(kr|zł)/g, 
            (match, price, symbol) => {
                return replacePriceInText(match, match, symbol, price, true, true);
            });

        // Pattern 5: USD 9.99 (currency code before)
        processedText = processedText.replace(/(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|SEK|NOK|MXN|INR|RUB|KRW|SGD|HKD|NZD|ZAR|BRL|PLN|CZK|HUF|ILS|TRY|THB|MYR|PHP|IDR|VND|AED|SAR|EGP|NGN|KES|GHS|UGX|TZS|ZMW|BWP|NAD|SZL|LSL|MWK|RWF|BIF|DJF|ETB|SOS|SCR|MUR|MVR|NPR|BTN|LKR|PKR|BDT|AFN|IRR|IQD|JOD|KWD|LBP|SYP|YER|OMR|QAR|BHD|AMD|AZN|GEL|KGS|KZT|MDL|TJS|TMT|UZS|BYN|UAH|RON|BGN|HRK|RSD|BAM|MKD|ALL|DKK|ISK|FOK|FJD|TOP|WST|VUV|SBD|PGK|NCR|XPF|TVD|KID|NRU|PLW)\s+(\d{1,3}(?:,\d{3})*\.\d{2})/g, 
            (match, symbol, price) => {
                return replacePriceInText(match, match, symbol, price, false, true);
            });

        // Pattern 6: 9.99 USD (currency code after)
        processedText = processedText.replace(/(\d{1,3}(?:,\d{3})*\.\d{2})\s+(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|SEK|NOK|MXN|INR|RUB|KRW|SGD|HKD|NZD|ZAR|BRL|PLN|CZK|HUF|ILS|TRY|THB|MYR|PHP|IDR|VND|AED|SAR|EGP|NGN|KES|GHS|UGX|TZS|ZMW|BWP|NAD|SZL|LSL|MWK|RWF|BIF|DJF|ETB|SOS|SCR|MUR|MVR|NPR|BTN|LKR|PKR|BDT|AFN|IRR|IQD|JOD|KWD|LBP|SYP|YER|OMR|QAR|BHD|AMD|AZN|GEL|KGS|KZT|MDL|TJS|TMT|UZS|BYN|UAH|RON|BGN|HRK|RSD|BAM|MKD|ALL|DKK|ISK|FOK|FJD|TOP|WST|VUV|SBD|PGK|NCR|XPF|TVD|KID|NRU|PLW)/g, 
            (match, price, symbol) => {
                return replacePriceInText(match, match, symbol, price, true, true);
            });

        return processedText;
    }

    // Function to process a single text node
    function processTextNode(node) {
        if (!isEnabled || !node.textContent) return;
        
        const originalText = node.textContent;
        const processedText = processTextForPrices(originalText);
        
        if (originalText !== processedText) {
            console.log(`Price Rounder: "${originalText.trim()}" → "${processedText.trim()}"`);
            // Store original text for potential restoration
            if (!originalPrices.has(node)) {
                originalPrices.set(node, originalText);
            }
            node.textContent = processedText;
        }
    }

    // Function to get all text nodes in an element
    function getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip script and style elements
                    if (node.parentElement && 
                        (node.parentElement.tagName === 'SCRIPT' || 
                         node.parentElement.tagName === 'STYLE')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        return textNodes;
    }

    // Function to process all prices on the page
    function processPricesOnPage() {
        if (!isEnabled) {
            console.log('Price Rounder: Extension disabled, skipping processing');
            return;
        }
        
        console.log('Price Rounder: Processing prices on page...');
        const textNodes = getTextNodes(document.body);
        console.log(`Price Rounder: Found ${textNodes.length} text nodes to process`);
        
        let processedCount = 0;
        textNodes.forEach(node => {
            const originalText = node.textContent;
            processTextNode(node);
            if (originalText !== node.textContent) {
                processedCount++;
            }
        });
        
        console.log(`Price Rounder: Processed ${processedCount} price changes`);
    }

    // Function to restore original prices
    function restoreOriginalPrices() {
        originalPrices.forEach((originalText, node) => {
            if (node.parentNode) {
                node.textContent = originalText;
            }
        });
        originalPrices.clear();
    }

    // Observer for dynamically loaded content
    const observer = new MutationObserver(function(mutations) {
        if (!isEnabled) return;
        
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const textNodes = getTextNodes(node);
                    textNodes.forEach(processTextNode);
                } else if (node.nodeType === Node.TEXT_NODE) {
                    processTextNode(node);
                }
            });
        });
    });

    // Start observing changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        console.log('Price Rounder: Received message:', request);
        
        if (request.action === 'toggle') {
            isEnabled = request.enabled;
            console.log('Price Rounder: Toggle to', isEnabled);
            if (isEnabled) {
                processPricesOnPage();
            } else {
                restoreOriginalPrices();
            }
            sendResponse({success: true});
        } else if (request.action === 'getStatus') {
            const status = {enabled: isEnabled, roundingMode: roundingMode};
            console.log('Price Rounder: Sending status:', status);
            sendResponse(status);
        } else if (request.action === 'setRoundingMode') {
            roundingMode = request.mode;
            console.log('Price Rounder: Rounding mode changed to', roundingMode);
            if (isEnabled) {
                restoreOriginalPrices();
                processPricesOnPage();
            }
            sendResponse({success: true});
        }
    });

    // Initialize extension
    function initializeExtension() {
        if (isInitialized) return;
        
        console.log('Price Rounder: Initializing extension...');
        isInitialized = true;
        
        // Load settings from storage
        chrome.storage.sync.get(['priceRounderEnabled', 'priceRoundingMode'], function(result) {
            isEnabled = result.priceRounderEnabled !== false; // Default to true
            roundingMode = result.priceRoundingMode || 'nearest'; // Default to nearest
            
            console.log('Price Rounder: Settings loaded -', {
                enabled: isEnabled,
                roundingMode: roundingMode
            });
            
            if (isEnabled) {
                // Initial processing when page loads
                console.log('Price Rounder: Starting initial price processing...');
                processPricesOnPage();
            }
        });
        
        // Start observing changes
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            console.log('Price Rounder: DOM observer started');
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Price Rounder: DOM Content Loaded');
            setTimeout(initializeExtension, 100);
        });
    } else {
        console.log('Price Rounder: DOM already ready');
        setTimeout(initializeExtension, 100);
    }

    // Also try after window load for dynamic content
    window.addEventListener('load', function() {
        console.log('Price Rounder: Window loaded, processing again...');
        setTimeout(function() {
            if (isEnabled) {
                processPricesOnPage();
            }
        }, 1000);
    });})();
