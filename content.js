// Price Rounder Content Script
(function() {
    'use strict';
    
    console.log('Price Rounder: Content script loaded');

    let isEnabled = true;
    let roundingMode = 'nearest'; // 'nearest', 'multiple5', 'multiple10'
    let originalPrices = new Map(); // Store original prices for restoration
    let isInitialized = false;

    // Function to detect if current site is an e-commerce site
    function isEcommerceSite() {
        const hostname = window.location.hostname.toLowerCase();
        console.log('Price Rounder: Checking if site is e-commerce:', hostname);
        
        // Check for known e-commerce domains
        const ecommerceDomains = [
            'amazon.com', 'amazon.ca', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.com.au', 'amazon.co.jp',
            'temu.com',
            'ebay.com', 'ebay.ca', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.it', 'ebay.es', 'ebay.com.au',
            'walmart.com', 'target.com', 'bestbuy.com', 'costco.com', 'homedepot.com', 'lowes.com',
            'aliexpress.com', 'alibaba.com', 'shopify.com',
            'etsy.com', 'wayfair.com', 'overstock.com', 'newegg.com', 'tigerdirect.com',
            'macys.com', 'nordstrom.com', 'kohls.com', 'jcpenney.com', 'sears.com',
            'zappos.com', 'nike.com', 'adidas.com', 'rei.com', 'dickssportinggoods.com'
        ];
        
        // Check if hostname matches any known e-commerce domain
        const isKnownEcommerce = ecommerceDomains.some(domain => 
            hostname === domain || hostname.endsWith('.' + domain)
        );
        
        if (isKnownEcommerce) {
            console.log('Price Rounder: Detected known e-commerce site');
            return true;
        }
        
        // Check for e-commerce indicators in the page structure
        const ecommerceIndicators = [
            '.a-price', // Amazon
            '[data-type="price"]', // Temu
            '.price', '.product-price', '.cost', '.amount',
            '.cart', '.add-to-cart', '.buy-now', '.checkout',
            '.product', '.item', '.goods'
        ];
        
        const hasEcommerceElements = ecommerceIndicators.some(selector => 
            document.querySelector(selector) !== null
        );
        
        if (hasEcommerceElements) {
            console.log('Price Rounder: Detected e-commerce indicators in page structure');
            return true;
        }
        
        console.log('Price Rounder: No e-commerce indicators detected');
        return false;
    }

    // Currency symbols and patterns
    const currencySymbols = ['$', '€', '£', '¥', '₹', '₽', '₩', 'R$', 'C$', 'A$', 'kr', 'zł', '₪', '₦'];
    
    // Universal e-commerce site price structure configurations
    const ecommerceConfigs = {
        amazon: {
            selectors: [
                '.a-price', '.a-offscreen', 
                '[class*="price"]', '[class*="cost"]',
                '.a-price-whole', '.a-price-fraction',
                'span[class*="a-"]', '.price-display',
                '[data-price]', '.pricing', '.amount'
            ],
            handler: 'processAmazonPrice',
            structure: {
                container: '.a-price',
                offscreen: '.a-offscreen',
                symbol: '.a-price-symbol', 
                whole: '.a-price-whole',
                fraction: '.a-price-fraction',
                decimal: '.a-price-decimal'
            }
        },
        temu: {
            selectors: [
                // Original Temu selectors
                '[data-type="price"]', '._2myxWHLi', '._2XgTiMJi',
                
                // Current price display selectors (based on screenshot)
                '.current-price', '.price-section', '.price-section *',
                '[class*="price"]', '[class*="cost"]', '[class*="amount"]',
                
                // Generic text-containing elements that might have prices
                'span', 'div', 'p', 'strong', 'b',
                
                // Data attributes and aria labels
                '[data-price]', '[aria-label*="price"]', '[aria-label*="cost"]',
                
                // Common price container classes
                '.price', '.cost', '.pricing', '.money', '.currency',
                
                // Temu-specific dynamic classes (they change frequently)
                'span[class*="_"]', 'div[class*="_"]',
                'span[class*="2"]', 'div[class*="2"]',
                'span[class*="price" i]', 'div[class*="price" i]'
            ],
            handler: 'processTemuPrice',
            structure: {
                container: '[data-type="price"]',
                priceText: '._2XgTiMJi',
                symbol: '._23iHZvtC',
                amount: '._2de9ERAH'
            }
        },
        ebay: {
            selectors: [
                '.display-price', '.price', '.ebayui-ellipsis-2',
                '[class*="price"]', '[class*="cost"]', '[class*="amount"]',
                '[data-price]', '.pricing', '.cost-display'
            ],
            handler: 'processGenericPrice'
        },
        walmart: {
            selectors: [
                '[data-automation-id*="price"]', '.price-current', '.price-display',
                '[class*="price"]', '[class*="cost"]', '[class*="amount"]',
                '[data-price]', '.pricing', '.cost'
            ],
            handler: 'processGenericPrice'
        },
        generic: {
            selectors: [
                '.price', '.cost', '.amount', '.pricing',
                '[class*="price"]', '[class*="cost"]', '[class*="amount"]',
                '[data-price]', '[data-cost]', '[data-amount]',
                'span[class*="$"]', 'div[class*="$"]',
                '[aria-label*="price"]', '[aria-label*="cost"]',
                '.money', '.currency', '.dollar', '.euro'
            ],
            handler: 'processGenericPrice'
        }
    };
    
    // Enhanced universal price patterns to handle different regional formats
    const pricePatterns = [
        // AMAZON SPECIFIC PATTERNS (based on actual screenshot) - HIGHEST PRIORITY
        // Amazon structured pricing: $40.72, $39.99 (for offscreen accessibility)
        /\$(\d{1,3})\.(\d{2})/g,
        
        // Amazon list price format: List: $48.37, List: $56.99
        /(List:\s*)\$(\d{1,3}(?:,\d{3})*\.\d{2})/gi,
        
        // TEMU SPECIFIC PATTERNS (based on actual screenshot) - HIGH PRIORITY
        // Nigerian Naira format exactly as shown: ₦29,133, ₦22,516, ₦3,218
        /₦(\d{1,2},\d{3}|\d{1,4})/g,
        
        // Save amount format: Save ₦5145.00, Save ₦630.00
        /(Save\s+)₦(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/gi,
        
        // Strikethrough original price format: ₦46645.00
        /₦(\d{2,5}(?:\.\d{2})?)/g,
        
        // Nigerian Naira and similar: ₦1,299.99 or ₦1,299,99 (comma as thousand separator)
        /([₦₹₨₪₵₡₽₩¥])\s*(\d{1,3}(?:,\d{3})*[.,]\d{2})/g,
        
        // European format with comma as decimal: €19,95 or 1.299,95
        /([€$£¥₹₽₩R\$C\$A\$₪₦₡₨₱₵])\s*(\d{1,3}(?:\.\d{3})*,\d{2})/g,
        
        // Standard US/UK format: $9.99, €19.95, £4.99
        /([€$£¥₹₽₩R\$C\$A\$₪₦₡₨₱₵])\s*(\d{1,3}(?:,\d{3})*\.\d{2})/g,
        
        // Symbol after with various formats: 1,299.99₦, 19,95€, 1.299,95€
        /(\d{1,3}(?:[,.\s]\d{3})*[.,]\d{2})\s*([€$£¥₹₽₩R\$C\$A\$₪₦₡₨₱₵])/g,
        
        // Currency codes with regional formats: NGN 1,299.99, EUR 1.299,95
        /(NGN|USD|EUR|GBP|JPY|CAD|AUD|INR|RUB|CNY|KRW|BRL|ZAR|MXN|SGD|HKD|THB|TRY|PLN|CZK|HUF|RON|BGN|HRK|SEK|NOK|DKK|CHF|ILS|AED|SAR|EGP|KES|GHS|UGX|TZS|ZMW|XAF|XOF)\s*(\d{1,3}(?:[,.\s]\d{3})*[.,]\d{0,2})/g,
        
        // Currency codes after: 1,299.99 NGN, 19,95 EUR
        /(\d{1,3}(?:[,.\s]\d{3})*[.,]\d{0,2})\s*(NGN|USD|EUR|GBP|JPY|CAD|AUD|INR|RUB|CNY|KRW|BRL|ZAR|MXN|SGD|HKD|THB|TRY|PLN|CZK|HUF|RON|BGN|HRK|SEK|NOK|DKK|CHF|ILS|AED|SAR|EGP|KES|GHS|UGX|TZS|ZMW|XAF|XOF)/g,
        
        // Special currency names with regional formats
        /(kr|zł|lei|din|kn|rsd|mkd|all|ron|bgn|hrk|bam|czk|huf|pln|sek|nok|dkk|isk|naira|kobo|peseta|peso|real|rand|yuan|won|rupiah|baht|ringgit|dong|riyal|dirham|shekel)\s*(\d{1,3}(?:[,.\s]\d{3})*[.,]\d{0,2})/gi,
        
        // Currency names after with formats
        /(\d{1,3}(?:[,.\s]\d{3})*[.,]\d{0,2})\s*(kr|zł|lei|din|kn|rsd|mkd|all|ron|bgn|hrk|bam|czk|huf|pln|sek|nok|dkk|isk|naira|kobo|peseta|peso|real|rand|yuan|won|rupiah|baht|ringgit|dong|riyal|dirham|shekel)/gi,
        
        // Pure numbers with thousand separators: 1,299.99, 1.299,95, 9.99
        /\b(\d{1,3}(?:,\d{3})+\.\d{2})\b/g,        // US format with commas: 1,299.99
        /\b(\d{1,3}(?:\.\d{3})+,\d{2})\b/g,        // EU format with dots: 1.299,95
        /\b(\d{1,4}[.,]\d{2})\b/g,                  // Simple decimal: 9.99 or 9,99
        
        // Numbers without decimals but clearly prices in various formats
        /\b(\d{1,3}(?:[,.\s]\d{3})+)\b(?=\s*(?:only|just|from|starting|price|cost|sale|deal|offer|discount|off|save|reduced|was|now|today|\+|$))/gi,
        
        // Context-based price detection with flexible formatting
        /(?:price|cost|sale|deal|offer|discount|save|was|now|only|just|from|starting|total|amount|pay|buy|purchase|checkout|cart|order)[\s:]*([€$£¥₹₽₩R\$C\$A\$₪₦₡₨₱₵]?\s*\d{1,4}(?:[,.\s]\d{3})*[.,]?\d{0,2}[€$£¥₹₽₩R\$C\$A\$₪₦₡₨₱₵]?)/gi,
        
        // Common price endings with various formats
        /(\d+[.,][89]9|[.,]95|[.,]50|[.,]00)/g,
        
        // Naira specific patterns (Nigerian format)
        /(₦|NGN|naira)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(₦|NGN|naira)/gi
    ];

    // Enhanced function to round price values with regional format support
    function roundPrice(priceStr) {
        // Handle different regional number formats
        let cleanPrice = priceStr;
        let numericValue;
        
        // Detect format and normalize
        if (priceStr.includes(',') && priceStr.includes('.')) {
            // Mixed format - determine which is decimal separator
            const lastComma = priceStr.lastIndexOf(',');
            const lastDot = priceStr.lastIndexOf('.');
            
            if (lastDot > lastComma) {
                // US format: 1,299.99 (comma = thousand, dot = decimal)
                cleanPrice = priceStr.replace(/[^\d.]/g, '');
            } else {
                // EU format: 1.299,99 (dot = thousand, comma = decimal)
                cleanPrice = priceStr.replace(/\./g, '').replace(',', '.');
                cleanPrice = cleanPrice.replace(/[^\d.]/g, '');
            }
        } else if (priceStr.includes(',') && !priceStr.includes('.')) {
            // Only comma - could be thousand separator or decimal
            const commaIndex = priceStr.lastIndexOf(',');
            const afterComma = priceStr.substring(commaIndex + 1);
            
            if (afterComma.length === 2 && /^\d{2}$/.test(afterComma)) {
                // Decimal separator: 19,99
                cleanPrice = priceStr.replace(',', '.').replace(/[^\d.]/g, '');
            } else {
                // Thousand separator: 1,299
                cleanPrice = priceStr.replace(/,/g, '').replace(/[^\d]/g, '');
            }
        } else {
            // Simple format or dot only
            cleanPrice = priceStr.replace(/[^\d.]/g, '');
        }
        
        numericValue = parseFloat(cleanPrice);
        
        if (isNaN(numericValue)) {
            console.log(`Price Rounder: Invalid price format: "${priceStr}" -> "${cleanPrice}"`);
            return priceStr; // Return original if can't parse
        }
        
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
        
        console.log(`Price Rounder: ${priceStr} (${numericValue}) → ${rounded.toFixed(2)}`);
        return rounded.toFixed(2);
    }

    // Enhanced function to replace price in text while preserving regional format
    function replacePriceInText(text, match, currencySymbol, price, isSymbolAfter = false, isSpaced = false) {
        const roundedPrice = roundPrice(price);
        
        // Detect original format to preserve it
        let formattedPrice = roundedPrice;
        
        // Special handling for Nigerian Naira (Temu format) - no decimals, comma thousands
        if (currencySymbol === '₦' || currencySymbol === 'NGN' || currencySymbol.toLowerCase() === 'naira') {
            const roundedNum = Math.round(parseFloat(roundedPrice));
            // Format with comma thousands but no decimals (like Temu: ₦29,133)
            formattedPrice = roundedNum.toLocaleString('en-NG', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }
        // Preserve thousand separator format from original
        else if (price.includes(',') && !price.includes('.')) {
            // Original had comma only - if it was thousand separator, preserve it
            const commaIndex = price.lastIndexOf(',');
            const afterComma = price.substring(commaIndex + 1);
            if (afterComma.length > 2) {
                // Was thousand separator
                const roundedNum = Math.round(parseFloat(roundedPrice));
                formattedPrice = roundedNum.toLocaleString('en-US') + '.00';
            } else {
                // Was decimal separator - use original format
                formattedPrice = Math.round(parseFloat(roundedPrice)) + ',00';
            }
        } else if (price.includes('.') && price.includes(',')) {
            const lastComma = price.lastIndexOf(',');
            const lastDot = price.lastIndexOf('.');
            
            if (lastDot > lastComma) {
                // US format: 1,299.99
                const roundedNum = Math.round(parseFloat(roundedPrice));
                formattedPrice = roundedNum.toLocaleString('en-US') + '.00';
            } else {
                // EU format: 1.299,99
                const roundedNum = Math.round(parseFloat(roundedPrice));
                formattedPrice = roundedNum.toLocaleString('de-DE').replace(',', '.') + ',00';
            }
        } else if (price.includes('.')) {
            // Simple decimal format
            formattedPrice = Math.round(parseFloat(roundedPrice)) + '.00';
        } else {
            // No decimal - just round to whole number
            formattedPrice = Math.round(parseFloat(roundedPrice)).toString();
        }
        
        if (isSymbolAfter) {
            return isSpaced ? 
                `${formattedPrice} ${currencySymbol}` : 
                `${formattedPrice}${currencySymbol}`;
        } else {
            return isSpaced ? 
                `${currencySymbol} ${formattedPrice}` : 
                `${currencySymbol}${formattedPrice}`;
        }
    }

    // Enhanced function to process text content and round prices with regional support
    function processTextForPrices(text) {
        if (!text || typeof text !== 'string') return text;
        
        let processedText = text;
        let changesMade = 0;

        // Use the enhanced pricePatterns array for comprehensive matching
        pricePatterns.forEach((pattern, index) => {
            processedText = processedText.replace(pattern, (match, ...groups) => {
                changesMade++;
                console.log(`Price Rounder: Pattern ${index + 1} - Found "${match}"`);
                
                // Determine symbol and price from the groups
                let symbol = '';
                let price = '';
                let isSymbolAfter = false;
                let isSpaced = false;
                
                // Parse groups based on pattern structure
                if (groups.length >= 2) {
                    const group1 = groups[0];
                    const group2 = groups[1];
                    
                    // Check if first group is currency symbol
                    if (/[€$£¥₹₽₩₦₡₨₱₵₪]|NGN|USD|EUR|GBP|JPY|kr|zł|naira/i.test(group1)) {
                        symbol = group1;
                        price = group2;
                        isSymbolAfter = false;
                        isSpaced = match.includes(' ');
                    } else {
                        // First group is price, second is symbol
                        price = group1;
                        symbol = group2;
                        isSymbolAfter = true;
                        isSpaced = match.includes(' ');
                    }
                } else if (groups.length === 1) {
                    // Single group - likely just a number, try to preserve context
                    price = groups[0];
                    symbol = ''; // No symbol detected
                }
                
                if (price && /\d/.test(price)) {
                    return replacePriceInText(match, match, symbol, price, isSymbolAfter, isSpaced);
                }
                
                return match; // Return unchanged if parsing failed
            });
        });

        if (changesMade > 0) {
            console.log(`Price Rounder: Made ${changesMade} price changes in text`);
        }
        
        return processedText;
    }
                console.log(`Price Rounder: Text Pattern 4 - Found "${match}"`);
                return replacePriceInText(match, match, symbol, price, true, true);
            });

        // Pattern 5: USD 9.99 (currency code before)
        processedText = processedText.replace(/(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|SEK|NOK|MXN|INR|RUB|KRW|SGD|HKD|NZD|ZAR|BRL|PLN|CZK|HUF|ILS|TRY|THB|MYR|PHP|IDR|VND|AED|SAR|EGP|NGN|KES|GHS|UGX|TZS|ZMW|BWP|NAD|SZL|LSL|MWK|RWF|BIF|DJF|ETB|SOS|SCR|MUR|MVR|NPR|BTN|LKR|PKR|BDT|AFN|IRR|IQD|JOD|KWD|LBP|SYP|YER|OMR|QAR|BHD|AMD|AZN|GEL|KGS|KZT|MDL|TJS|TMT|UZS|BYN|UAH|RON|BGN|HRK|RSD|BAM|MKD|ALL|DKK|ISK|FOK|FJD|TOP|WST|VUV|SBD|PGK|NCR|XPF|TVD|KID|NRU|PLW)\s+(\d{1,3}(?:,\d{3})*\.?\d{0,2})/g, 
            (match, symbol, price) => {
                changesMade++;
                console.log(`Price Rounder: Text Pattern 5 - Found "${match}"`);
                return replacePriceInText(match, match, symbol, price, false, true);
            });

        // Pattern 6: 9.99 USD (currency code after)
        processedText = processedText.replace(/(\d{1,3}(?:,\d{3})*\.?\d{0,2})\s+(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|SEK|NOK|MXN|INR|RUB|KRW|SGD|HKD|NZD|ZAR|BRL|PLN|CZK|HUF|ILS|TRY|THB|MYR|PHP|IDR|VND|AED|SAR|EGP|NGN|KES|GHS|UGX|TZS|ZMW|BWP|NAD|SZL|LSL|MWK|RWF|BIF|DJF|ETB|SOS|SCR|MUR|MVR|NPR|BTN|LKR|PKR|BDT|AFN|IRR|IQD|JOD|KWD|LBP|SYP|YER|OMR|QAR|BHD|AMD|AZN|GEL|KGS|KZT|MDL|TJS|TMT|UZS|BYN|UAH|RON|BGN|HRK|RSD|BAM|MKD|ALL|DKK|ISK|FOK|FJD|TOP|WST|VUV|SBD|PGK|NCR|XPF|TVD|KID|NRU|PLW)/g, 
            (match, price, symbol) => {
                changesMade++;
                console.log(`Price Rounder: Text Pattern 6 - Found "${match}"`);
                return replacePriceInText(match, match, symbol, price, true, true);
            });

        if (changesMade > 0) {
            console.log(`Price Rounder: Made ${changesMade} text price replacements`);
        }

        return processedText;
    }

    // Main function to process structured e-commerce prices
    function processStructuredPrices() {
        if (!isEnabled) {
            console.log('Price Rounder: Extension disabled, skipping structured prices');
            return;
        }
        
        // Automatically detect if this is an e-commerce site
        if (!isEcommerceSite()) {
            console.log('Price Rounder: Not an e-commerce site, skipping structured price processing');
            return;
        }
        
        console.log('Price Rounder: Processing structured e-commerce prices...');
        let processedCount = 0;
        
        // Process each configured e-commerce site
        Object.entries(ecommerceConfigs).forEach(([siteName, config]) => {
            config.selectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                        // Check if element is still in DOM and valid
                        if (!element || !element.parentNode) {
                            return;
                        }
                        
                        try {
                            if (config.handler === 'processAmazonPrice' && processAmazonPrice(element)) {
                                processedCount++;
                            } else if (config.handler === 'processTemuPrice' && processTemuPrice(element)) {
                                processedCount++;
                            } else if (config.handler === 'processGenericPrice' && processGenericPrice(element)) {
                                processedCount++;
                            }
                        } catch (elementError) {
                            console.warn(`Price Rounder: Error processing element with ${config.handler}:`, elementError);
                        }
                    });
                } catch (selectorError) {
                    console.warn(`Price Rounder: Error with selector ${selector}:`, selectorError);
                }
            });
        });
        
        console.log(`Price Rounder: Processed ${processedCount} structured price elements`);
    }

    // Amazon price structure handler - more generic approach
    function processAmazonPrice(priceElement) {
        // Safety check
        if (!priceElement || !priceElement.parentNode) {
            return false;
        }
        
        const config = ecommerceConfigs.amazon.structure;
        let processed = false;
        
        try {
            // Strategy 1: Try offscreen element (accessibility text)
            const offscreenElement = priceElement.querySelector(config.offscreen);
            if (offscreenElement && offscreenElement.textContent && offscreenElement.textContent.trim()) {
                const originalText = offscreenElement.textContent.trim();
                const processedText = processTextForPrices(originalText);
                
                if (originalText !== processedText) {
                    console.log(`Price Rounder: Amazon offscreen "${originalText}" → "${processedText}"`);
                    
                    if (!originalPrices.has(priceElement)) {
                        originalPrices.set(priceElement, {
                            type: 'amazon',
                            offscreen: originalText,
                            whole: null,
                            fraction: null
                        });
                    }
                    
                    offscreenElement.textContent = processedText;
                    updateAmazonVisualElements(priceElement, processedText, config);
                    processed = true;
                }
            }
            
            // Strategy 2: Try structured elements (whole + fraction)
            if (!processed) {
                const wholeElement = priceElement.querySelector(config.whole);
                const fractionElement = priceElement.querySelector(config.fraction);
                
                if (wholeElement && fractionElement && wholeElement.textContent && fractionElement.textContent) {
                    const whole = wholeElement.textContent.replace(/[^\d]/g, '');
                    const fraction = fractionElement.textContent.replace(/[^\d]/g, '');
                    
                    if (whole && fraction) {
                        const originalPrice = parseFloat(`${whole}.${fraction}`);
                        const roundedPrice = getRoundedPrice(originalPrice);
                        const roundedWhole = Math.floor(roundedPrice);
                        
                        if (!originalPrices.has(priceElement)) {
                            originalPrices.set(priceElement, {
                                type: 'amazon',
                                offscreen: offscreenElement ? offscreenElement.textContent : null,
                                whole: wholeElement.textContent,
                                fraction: fractionElement.textContent
                            });
                        }
                        
                        // Update visual elements with rounded values
                        wholeElement.textContent = roundedWhole.toString();
                        fractionElement.textContent = "00";  // Always show 00 for rounded prices
                        
                        // Update offscreen for accessibility
                        if (offscreenElement) {
                            const symbolElement = priceElement.querySelector(config.symbol);
                            const symbol = symbolElement && symbolElement.textContent ? symbolElement.textContent.trim() : '$';
                            offscreenElement.textContent = `${symbol}${roundedWhole.toFixed(2)}`;
                        }
                        
                        console.log(`Price Rounder: Amazon structured $${originalPrice} → $${roundedWhole}.00`);
                        processed = true;
                    }
                }
            }
            
            // Strategy 3: Universal text processing on any text content
            if (!processed) {
                const allTextElements = priceElement.querySelectorAll('*');
                for (const element of allTextElements) {
                    if (element && element.children.length === 0 && element.textContent) { // Only text nodes
                        const originalText = element.textContent.trim();
                        const processedText = processTextForPrices(originalText);
                        
                        if (originalText !== processedText && originalText.match(/[\d.,]+/)) {
                            console.log(`Price Rounder: Amazon universal "${originalText}" → "${processedText}"`);
                            
                            if (!originalPrices.has(element)) {
                                originalPrices.set(element, {
                                    type: 'amazon-universal',
                                    text: originalText
                                });
                            }
                            
                            element.textContent = processedText;
                            processed = true;
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Price Rounder: Error in processAmazonPrice:', error);
        }
        
        return processed;
    }
    
    // Helper function to update Amazon visual elements based on processed offscreen text
    function updateAmazonVisualElements(priceElement, processedText, config) {
        // Extract price information from processed text
        const priceMatch = processedText.match(/([^\d]*)([\d,]+)\.(\d{2})/);
        if (!priceMatch) return;
        
        const [, symbol, wholePart, fractionPart] = priceMatch;
        
        // For rounded prices, we want to show whole dollars with 00 cents
        const roundedPrice = parseFloat(`${wholePart}.${fractionPart}`);
        const roundedWhole = Math.ceil(roundedPrice); // Round up to next whole dollar
        
        // Update visual elements if they exist
        const symbolElement = priceElement.querySelector(config.symbol);
        const wholeElement = priceElement.querySelector(config.whole);
        const fractionElement = priceElement.querySelector(config.fraction);
        
        if (symbolElement && symbol) {
            symbolElement.textContent = symbol.trim();
        }
        
        if (wholeElement) {
            // Always show the rounded whole number
            wholeElement.textContent = roundedWhole.toString();
        }
        
        if (fractionElement) {
            // Always show 00 for rounded prices
            fractionElement.textContent = "00";
        }
        
        console.log(`Price Rounder: Amazon visual update ${symbol}${wholePart}.${fractionPart} → ${symbol}${roundedWhole}.00`);
    }

    // Temu price structure handler
    function processTemuPrice(priceElement) {
        // Safety check
        if (!priceElement || !priceElement.parentNode) {
            return false;
        }
        
        const config = ecommerceConfigs.temu.structure;
        let processed = false;
        
        try {
            // Strategy 1: Try structured Temu elements
            const priceTextElement = priceElement.querySelector(config.priceText);
            const symbolElement = priceElement.querySelector(config.symbol);
            const amountElement = priceElement.querySelector(config.amount);
            
            if (priceTextElement && priceTextElement.textContent) {
                const originalText = priceTextElement.textContent.trim();
                const processedText = processTextForPrices(originalText);
                
                if (originalText !== processedText) {
                    console.log(`Price Rounder: Temu structured "${originalText}" → "${processedText}"`);
                    
                    if (!originalPrices.has(priceElement)) {
                        originalPrices.set(priceElement, {
                            type: 'temu',
                            priceText: originalText,
                            amount: amountElement && amountElement.textContent ? amountElement.textContent : null
                        });
                    }
                    
                    priceTextElement.textContent = processedText;
                    
                    if (amountElement && amountElement.textContent) {
                        const processedAmount = processTextForPrices(amountElement.textContent);
                        if (amountElement.textContent !== processedAmount) {
                            amountElement.textContent = processedAmount;
                        }
                    }
                    
                    processed = true;
                }
            }
            
            // Strategy 2: Universal text processing on any child elements
            if (!processed) {
                const allTextElements = priceElement.querySelectorAll('*');
                for (const element of allTextElements) {
                    if (element && element.children.length === 0 && element.textContent) { // Only leaf text nodes
                        const originalText = element.textContent.trim();
                        const processedText = processTextForPrices(originalText);
                        
                        // Check if this looks like a price and was changed
                        if (originalText !== processedText && 
                            originalText.match(/[\d.,]+/) && 
                            originalText.length > 2) {
                            
                            console.log(`Price Rounder: Temu universal "${originalText}" → "${processedText}"`);
                            
                            if (!originalPrices.has(element)) {
                                originalPrices.set(element, {
                                    type: 'temu-universal',
                                    text: originalText
                                });
                            }
                            
                            element.textContent = processedText;
                            processed = true;
                            break;
                        }
                    }
                }
            }
            
            // Strategy 3: Direct processing of the main element if it contains price text
            if (!processed && priceElement.textContent) {
                const mainText = priceElement.textContent.trim();
                const processedMainText = processTextForPrices(mainText);
                
                if (mainText !== processedMainText && 
                    mainText.match(/[\d.,]+/) && 
                    !priceElement.querySelector('*')) {
                    
                    console.log(`Price Rounder: Temu direct "${mainText}" → "${processedMainText}"`);
                    
                    if (!originalPrices.has(priceElement)) {
                        originalPrices.set(priceElement, {
                            type: 'temu-direct',
                            text: mainText
                        });
                    }
                    
                    priceElement.textContent = processedMainText;
                    processed = true;
                }
            }
        } catch (error) {
            console.warn('Price Rounder: Error in processTemuPrice:', error);
        }
        
        return processed;
    }

    // Universal price handler for all e-commerce sites
    function processGenericPrice(priceElement) {
        // Safety check
        if (!priceElement || !priceElement.parentNode) {
            return false;
        }
        
        // Skip if already processed
        if (originalPrices.has(priceElement) || 
            priceElement.classList.contains('price-rounder-processed')) {
            return false;
        }
        
        let processed = false;
        
        try {
            // Strategy 1: Process direct text content
            const directText = priceElement.textContent ? priceElement.textContent.trim() : '';
            const processedDirectText = processTextForPrices(directText);
            
            if (directText !== processedDirectText && 
                directText.match(/[\d.,]+/) && 
                !priceElement.querySelector('*')) { // No child elements
                
                console.log(`Price Rounder: Generic direct "${directText}" → "${processedDirectText}"`);
                
                if (!originalPrices.has(priceElement)) {
                    originalPrices.set(priceElement, {
                        type: 'generic-direct',
                        text: directText
                    });
                }
                
                priceElement.textContent = processedDirectText;
                priceElement.classList.add('price-rounder-processed');
                processed = true;
            }
            
            // Strategy 2: Process all text-containing child elements
            if (!processed) {
                const allTextElements = priceElement.querySelectorAll('*');
                for (const element of allTextElements) {
                    if (element && element.children.length === 0 && element.textContent) { // Only leaf text nodes
                        const originalText = element.textContent.trim();
                        const processedText = processTextForPrices(originalText);
                        
                        // Check if this looks like a price and was changed
                        if (originalText !== processedText && 
                            originalText.match(/[\d.,]+/) && 
                            originalText.length > 1 &&
                            !originalPrices.has(element)) {
                            
                            console.log(`Price Rounder: Generic child "${originalText}" → "${processedText}"`);
                            
                            originalPrices.set(element, {
                                type: 'generic-child',
                                text: originalText
                            });
                            
                            element.textContent = processedText;
                            processed = true;
                            break;
                        }
                    }
                }
            }
            
            // Strategy 3: Use broader text processing for any price-like content
            if (!processed && priceElement.textContent) {
                const allText = priceElement.textContent.trim();
                if (allText.length > 2 && 
                    (allText.match(/[\$€£¥₹₽₩₦]/) || 
                     allText.match(/\d+[.,]\d{2}/) || 
                     allText.match(/\b\d{2,4}\b/))) {
                    
                    const processedAllText = processTextForPrices(allText);
                    if (allText !== processedAllText) {
                        console.log(`Price Rounder: Generic universal "${allText}" → "${processedAllText}"`);
                        
                        if (!originalPrices.has(priceElement)) {
                            originalPrices.set(priceElement, {
                                type: 'generic-universal',
                                text: allText
                            });
                        }
                        
                        try {
                            priceElement.innerHTML = priceElement.innerHTML.replace(
                                allText, processedAllText
                            );
                            processed = true;
                        } catch (htmlError) {
                            // Fallback to textContent if innerHTML fails
                            priceElement.textContent = processedAllText;
                            processed = true;
                        }
                    }
                }
            }
            
            if (processed && priceElement.classList) {
                priceElement.classList.add('price-rounder-processed');
            }
        } catch (error) {
            console.warn('Price Rounder: Error in processGenericPrice:', error);
        }
        
        return processed;
    }

    // Helper function to get rounded price based on mode
    function getRoundedPrice(price) {
        let rounded;
        switch (roundingMode) {
            case 'multiple5':
                rounded = Math.ceil(price / 5) * 5;
                break;
            case 'multiple10':
                rounded = Math.ceil(price / 10) * 10;
                break;
            case 'nearest':
            default:
                rounded = Math.ceil(price);
                break;
        }
        return rounded;
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
        
        // First, process structured e-commerce prices
        processStructuredPrices();
        
        // Then process regular text content
        const textNodes = getTextNodes(document.body);
        console.log(`Price Rounder: Found ${textNodes.length} text nodes to process`);
        
        let processedCount = 0;
        let sampleTexts = [];
        textNodes.forEach(node => {
            const originalText = node.textContent;
            
            // Collect sample texts that might contain prices for debugging
            if (originalText && originalText.match(/[\d.,]+/) && originalText.length < 100) {
                sampleTexts.push(originalText.trim());
            }
            
            processTextNode(node);
            if (originalText !== node.textContent) {
                processedCount++;
            }
        });
        
        // Show sample texts for debugging (first 10)
        if (sampleTexts.length > 0) {
            console.log(`Price Rounder: Sample text content (first 10):`, sampleTexts.slice(0, 10));
        }
        
        console.log(`Price Rounder: Processed ${processedCount} text price changes`);
    }

    // Function to restore original prices
    function restoreOriginalPrices() {
        originalPrices.forEach((originalData, element) => {
            // Check if element still exists in DOM
            if (!element || !element.parentNode) {
                return;
            }
            
            try {
                if (typeof originalData === 'string') {
                    // Legacy text node
                    element.textContent = originalData;
                } else if (originalData && originalData.type) {
                    // Structured price data
                    switch (originalData.type) {
                        case 'amazon':
                            const wholeElement = element.querySelector('.a-price-whole');
                            const fractionElement = element.querySelector('.a-price-fraction');
                            const offscreenElement = element.querySelector('.a-offscreen');
                            
                            // Restore offscreen element first (primary source of truth)
                            if (offscreenElement && originalData.offscreen) {
                                offscreenElement.textContent = originalData.offscreen;
                            }
                            
                            // Restore visual elements if they were stored
                            if (originalData.whole && wholeElement) {
                                wholeElement.textContent = originalData.whole;
                            }
                            if (originalData.fraction && fractionElement) {
                                fractionElement.textContent = originalData.fraction;
                            }
                            break;
                            
                        case 'amazon-universal':
                        case 'temu-universal':
                        case 'temu-direct':
                        case 'generic-direct':
                        case 'generic-child':
                        case 'generic-universal':
                            // Universal text restoration
                            if (originalData.text) {
                                element.textContent = originalData.text;
                            }
                            break;
                            
                        case 'temu':
                            const priceTextElement = element.querySelector('._2XgTiMJi');
                            const amountElement = element.querySelector('._2de9ERAH');
                            
                            if (priceTextElement && originalData.priceText) {
                                priceTextElement.textContent = originalData.priceText;
                            }
                            if (amountElement && originalData.amount) {
                                amountElement.textContent = originalData.amount;
                            }
                            break;
                            
                        case 'generic':
                            if (originalData.text) {
                                element.textContent = originalData.text;
                            }
                            break;
                            
                        default:
                            // Fallback for any unrecognized types
                            if (originalData.text) {
                                element.textContent = originalData.text;
                            }
                            break;
                    }
                }
                
                // Remove processing marker safely
                if (element.classList && typeof element.classList.remove === 'function') {
                    element.classList.remove('price-rounder-processed');
                }
            } catch (error) {
                console.warn('Price Rounder: Error restoring element:', error);
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
            const status = {enabled: isEnabled, roundingMode: roundingMode, ecommerceSite: isEcommerceSite()};
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
                roundingMode: roundingMode,
                ecommerceSite: isEcommerceSite()
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
    });
})();
