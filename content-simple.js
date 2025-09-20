// Price Rounder Content Script - Universal E-commerce Version
(function() {
    'use strict';
    
    console.log('Price Rounder: Universal content script loaded and starting...');

    let isEnabled = true;
    let roundingMode = 'nearest';
    let originalPrices = new Map();
    let processedElements = new Set();

    // Simple function to round prices up
    function roundPrice(price) {
        const num = parseFloat(price);
        if (isNaN(num)) return price;
        
        switch (roundingMode) {
            case 'multiple5':
                return Math.ceil(num / 5) * 5;
            case 'multiple10':
                return Math.ceil(num / 10) * 10;
            case 'nearest':
            default:
                return Math.ceil(num);
        }
    }

    // Format price with proper thousands separators
    function formatPrice(price, currency = '₦') {
        if (currency === '₦') {
            // Nigerian Naira format with commas
            return price.toLocaleString('en-NG');
        } else if (currency === '$') {
            // US Dollar format
            return price.toFixed(2);
        } else {
            // Default format
            return price.toFixed(2);
        }
    }

    // Process Temu prices (Nigerian Naira and other formats)
    function processTemuPrices() {
        console.log('Price Rounder: Processing Temu prices...');
        
        // Comprehensive Temu price patterns
        const temuSelectors = [
            '.current-price',
            '[class*="price"]',
            '[class*="Price"]',
            '[class*="cost"]',
            '[class*="Cost"]',
            '.price-section span',
            '.price-section div'
        ];
        
        let processedCount = 0;
        
        temuSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            console.log(`Price Rounder: Found ${elements.length} elements with selector: ${selector}`);
            
            elements.forEach((element, index) => {
                if (processedElements.has(element)) {
                    return; // Skip already processed elements
                }
                
                const originalText = element.textContent.trim();
                
                // Enhanced Naira pattern - handles various formats
                const nairaPattern = /₦\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
                
                if (nairaPattern.test(originalText)) {
                    try {
                        const newText = originalText.replace(nairaPattern, (match, price) => {
                            // Remove commas and convert to number
                            const cleanPrice = price.replace(/,/g, '');
                            const numPrice = parseFloat(cleanPrice);
                            const roundedPrice = roundPrice(numPrice);
                            
                            console.log(`Price Rounder: Temu ${match} → ₦${formatPrice(roundedPrice, '₦')}`);
                            
                            // Store original if not already stored
                            if (!originalPrices.has(element)) {
                                originalPrices.set(element, originalText);
                            }
                            
                            return `₦${formatPrice(roundedPrice, '₦')}`;
                        });
                        
                        if (newText !== originalText) {
                            element.textContent = newText;
                            processedElements.add(element);
                            processedCount++;
                            console.log(`Price Rounder: Updated Temu element: ${originalText} → ${newText}`);
                        }
                    } catch (error) {
                        console.error(`Price Rounder: Error processing Temu element:`, error);
                    }
                }
            });
        });
        
        console.log(`Price Rounder: Processed ${processedCount} Temu prices`);
        return processedCount;
    }

    // Process Amazon prices - enhanced
    function processAmazonPrices() {
        console.log('Price Rounder: Processing Amazon prices...');
        
        // Find all Amazon price containers
        const priceContainers = document.querySelectorAll('.a-price');
        console.log(`Price Rounder: Found ${priceContainers.length} Amazon price containers`);
        
        let processedCount = 0;
        
        priceContainers.forEach((container, index) => {
            if (processedElements.has(container)) {
                return; // Skip already processed elements
            }
            
            try {
                // Get the elements
                const offscreenElement = container.querySelector('.a-offscreen');
                const wholeElement = container.querySelector('.a-price-whole');
                const fractionElement = container.querySelector('.a-price-fraction');
                
                console.log(`Price Rounder: Amazon Container ${index}:`, {
                    offscreen: offscreenElement ? offscreenElement.textContent : 'none',
                    whole: wholeElement ? wholeElement.textContent : 'none',
                    fraction: fractionElement ? fractionElement.textContent : 'none'
                });
                
                // Process if we have the structured elements
                if (wholeElement && fractionElement) {
                    const whole = parseInt(wholeElement.textContent.replace(/[^\d]/g, ''));
                    const fraction = parseInt(fractionElement.textContent.replace(/[^\d]/g, ''));
                    
                    if (!isNaN(whole) && !isNaN(fraction)) {
                        const originalPrice = whole + (fraction / 100);
                        const roundedPrice = roundPrice(originalPrice);
                        const newWhole = Math.floor(roundedPrice);
                        
                        console.log(`Price Rounder: Amazon $${originalPrice} → $${roundedPrice}`);
                        
                        // Store original if not already stored
                        if (!originalPrices.has(container)) {
                            originalPrices.set(container, {
                                whole: wholeElement.textContent,
                                fraction: fractionElement.textContent,
                                offscreen: offscreenElement ? offscreenElement.textContent : null
                            });
                        }
                        
                        // Update the visual elements
                        wholeElement.textContent = newWhole.toString();
                        fractionElement.textContent = '00';
                        
                        // Update offscreen for accessibility
                        if (offscreenElement) {
                            offscreenElement.textContent = `$${newWhole}.00`;
                        }
                        
                        processedElements.add(container);
                        processedCount++;
                        console.log(`Price Rounder: Updated Amazon container ${index} to $${newWhole}.00`);
                    }
                }
            } catch (error) {
                console.error(`Price Rounder: Error processing Amazon container ${index}:`, error);
            }
        });
        
        console.log(`Price Rounder: Processed ${processedCount} Amazon prices`);
        return processedCount;
    }

    // Process universal text prices with comprehensive patterns
    function processUniversalPrices() {
        console.log('Price Rounder: Processing universal text prices...');
        
        // Comprehensive price patterns for various currencies
        const pricePatterns = [
            // Nigerian Naira (various formats)
            { pattern: /₦\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, currency: '₦' },
            // US Dollar
            { pattern: /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, currency: '$' },
            // Euro
            { pattern: /€\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, currency: '€' },
            // British Pound
            { pattern: /£\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, currency: '£' },
            // Other currencies
            { pattern: /(¥|₹|₽|₩)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, currency: 'other' }
        ];
        
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip script and style elements
                    const parent = node.parentElement;
                    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Skip already processed elements
                    if (processedElements.has(parent)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );
        
        let textNode;
        let processedCount = 0;
        
        while (textNode = walker.nextNode()) {
            const originalText = textNode.textContent;
            let hasMatch = false;
            let newText = originalText;
            
            pricePatterns.forEach(({ pattern, currency }) => {
                if (pattern.test(originalText)) {
                    hasMatch = true;
                    newText = newText.replace(pattern, (match, price, altPrice) => {
                        const cleanPrice = (price || altPrice).replace(/,/g, '');
                        const numPrice = parseFloat(cleanPrice);
                        const roundedPrice = roundPrice(numPrice);
                        
                        console.log(`Price Rounder: Universal ${match} → ${currency}${formatPrice(roundedPrice, currency)}`);
                        
                        if (currency === 'other') {
                            const symbol = match.charAt(0);
                            return `${symbol}${formatPrice(roundedPrice, symbol)}`;
                        } else {
                            return `${currency}${formatPrice(roundedPrice, currency)}`;
                        }
                    });
                    pattern.lastIndex = 0; // Reset regex
                }
            });
            
            if (hasMatch && newText !== originalText) {
                // Store original if not already stored
                if (!originalPrices.has(textNode.parentElement)) {
                    originalPrices.set(textNode.parentElement, originalText);
                }
                
                textNode.textContent = newText;
                processedElements.add(textNode.parentElement);
                processedCount++;
                console.log(`Price Rounder: Updated universal text: ${originalText} → ${newText}`);
            }
        }
        
        console.log(`Price Rounder: Processed ${processedCount} universal text prices`);
        return processedCount;
    }

    // Main processing function
    function processAllPrices() {
        console.log('Price Rounder: Starting comprehensive price processing...');
        
        // Reset processed elements for this round
        processedElements.clear();
        
        // Detect site and use appropriate strategy
        const hostname = window.location.hostname.toLowerCase();
        console.log(`Price Rounder: Processing site: ${hostname}`);
        
        let amazonCount = 0;
        let temuCount = 0;
        let universalCount = 0;
        
        if (hostname.includes('amazon')) {
            console.log('Price Rounder: Detected Amazon site');
            amazonCount = processAmazonPrices();
        }
        
        if (hostname.includes('temu')) {
            console.log('Price Rounder: Detected Temu site');
            temuCount = processTemuPrices();
        }
        
        // Always run universal processing as fallback
        universalCount = processUniversalPrices();
        
        const totalProcessed = amazonCount + temuCount + universalCount;
        console.log(`Price Rounder: Total processed - Amazon: ${amazonCount}, Temu: ${temuCount}, Universal: ${universalCount}, Total: ${totalProcessed}`);
        
        return totalProcessed;
    }

    // Mutation observer to handle dynamic content
    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any added nodes contain price-like content
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const text = node.textContent || '';
                            if (/[\$€£¥₹₽₩₦]\s*\d/.test(text)) {
                                shouldProcess = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldProcess && isEnabled) {
                console.log('Price Rounder: New content detected, processing...');
                setTimeout(() => processAllPrices(), 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('Price Rounder: Mutation observer setup complete');
        return observer;
    }

    // Restore original prices
    function restoreOriginalPrices() {
        console.log('Price Rounder: Restoring original prices...');
        let restoredCount = 0;
        
        originalPrices.forEach((originalData, element) => {
            try {
                if (typeof originalData === 'string') {
                    // Simple text restoration
                    element.textContent = originalData;
                    restoredCount++;
                } else if (typeof originalData === 'object' && originalData !== null) {
                    // Amazon structured restoration
                    const wholeElement = element.querySelector('.a-price-whole');
                    const fractionElement = element.querySelector('.a-price-fraction');
                    const offscreenElement = element.querySelector('.a-offscreen');
                    
                    if (wholeElement && originalData.whole) {
                        wholeElement.textContent = originalData.whole;
                    }
                    if (fractionElement && originalData.fraction) {
                        fractionElement.textContent = originalData.fraction;
                    }
                    if (offscreenElement && originalData.offscreen) {
                        offscreenElement.textContent = originalData.offscreen;
                    }
                    restoredCount++;
                }
            } catch (error) {
                console.error('Price Rounder: Error restoring element:', error);
            }
        });
        
        console.log(`Price Rounder: Restored ${restoredCount} original prices`);
        
        // Clear processed elements to allow re-processing
        processedElements.clear();
    }

    // Load settings from storage
    function loadSettings() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get(['priceRounderEnabled', 'priceRoundingMode'], function(result) {
                isEnabled = result.priceRounderEnabled !== false; // Default to true
                roundingMode = result.priceRoundingMode || 'nearest';
                console.log(`Price Rounder: Settings loaded - enabled: ${isEnabled}, mode: ${roundingMode}`);
                
                if (isEnabled) {
                    processAllPrices();
                }
            });
        } else {
            console.log('Price Rounder: Chrome storage not available, using defaults');
            processAllPrices();
        }
    }

    // Message listener for popup communication
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Price Rounder: Received message:', message);
            
            switch (message.action) {
                case 'toggle':
                    isEnabled = message.enabled;
                    console.log(`Price Rounder: Toggled to ${isEnabled ? 'enabled' : 'disabled'}`);
                    
                    if (isEnabled) {
                        processAllPrices();
                    } else {
                        restoreOriginalPrices();
                    }
                    
                    sendResponse({ success: true, enabled: isEnabled });
                    break;
                    
                case 'setRoundingMode':
                    const oldMode = roundingMode;
                    roundingMode = message.mode;
                    console.log(`Price Rounder: Rounding mode changed from ${oldMode} to ${roundingMode}`);
                    
                    if (isEnabled) {
                        // Restore original prices first, then re-process with new mode
                        restoreOriginalPrices();
                        setTimeout(() => {
                            processAllPrices();
                        }, 100);
                    }
                    
                    sendResponse({ success: true, mode: roundingMode });
                    break;
                    
                case 'getStatus':
                    sendResponse({ 
                        enabled: isEnabled, 
                        roundingMode: roundingMode,
                        processedCount: processedElements.size
                    });
                    break;
                    
                case 'reprocess':
                    if (isEnabled) {
                        restoreOriginalPrices();
                        setTimeout(() => {
                            processAllPrices();
                        }, 100);
                    }
                    sendResponse({ success: true });
                    break;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
            
            return true; // Keep message channel open for async response
        });
    }

    // Initialize when DOM is ready
    function initialize() {
        console.log('Price Rounder: Initializing universal extension...');
        loadSettings();
        
        // Set up mutation observer for dynamic content
        setupMutationObserver();
        
        // Process again after delays for dynamic content
        setTimeout(() => {
            if (isEnabled) {
                console.log('Price Rounder: Processing after 2s delay...');
                processAllPrices();
            }
        }, 2000);
        
        setTimeout(() => {
            if (isEnabled) {
                console.log('Price Rounder: Processing after 5s delay...');
                processAllPrices();
            }
        }, 5000);
    }

    // Start when document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Also process when window loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (isEnabled) {
                console.log('Price Rounder: Processing after window load...');
                processAllPrices();
            }
        }, 1000);
    });

    // Handle page visibility changes (for SPAs)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isEnabled) {
            setTimeout(() => {
                console.log('Price Rounder: Processing after visibility change...');
                processAllPrices();
            }, 1000);
        }
    });

    console.log('Price Rounder: Universal script setup complete');
})();
