// Popup JavaScript for Price Rounder Extension
document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusElement = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const refreshNotice = document.getElementById('refreshNotice');
    const roundingModeRadios = document.querySelectorAll('input[name="roundingMode"]');

    // Load current state
    loadCurrentState();

    // Toggle switch click handler
    toggleSwitch.addEventListener('click', function() {
        const isCurrentlyActive = toggleSwitch.classList.contains('active');
        const newState = !isCurrentlyActive;
        
        // Update UI immediately
        updateToggleState(newState);
        updateStatus(newState);
        
        // Save to storage
        chrome.storage.sync.set({
            priceRounderEnabled: newState
        }, function() {
            console.log('Settings saved:', newState);
        });

        // Show processing indicator
        if (newState) {
            showProcessingIndicator('Processing prices...');
        }

        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggle',
                    enabled: newState
                }, function(response) {
                    hideProcessingIndicator();
                    
                    if (chrome.runtime.lastError) {
                        // Content script might not be loaded yet
                        console.log('Content script not ready:', chrome.runtime.lastError.message);
                        showRefreshNotice();
                    } else if (response && response.success) {
                        console.log('Toggle successful');
                        hideRefreshNotice();
                        
                        if (newState) {
                            showSuccessMessage('Price rounding activated!');
                        } else {
                            showSuccessMessage('Original prices restored!');
                        }
                    } else {
                        console.log('Toggle failed or no response');
                        showRefreshNotice();
                    }
                });
            }
        });
    });

    roundingModeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const selectedMode = this.value;
                
                // Update examples immediately
                updateExamples(selectedMode);
                
                // Show processing indicator
                showProcessingIndicator('Updating prices...');
                
                // Save to storage
                chrome.storage.sync.set({
                    priceRoundingMode: selectedMode
                }, function() {
                    console.log('Rounding mode saved:', selectedMode);
                });

                // Send message to content script for immediate update
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'setRoundingMode',
                            mode: selectedMode
                        }, function(response) {
                            hideProcessingIndicator();
                            
                            if (chrome.runtime.lastError) {
                                console.log('Content script not ready, will apply on next page load');
                                showRefreshNotice();
                            } else if (response && response.success) {
                                console.log('Rounding mode updated successfully');
                                hideRefreshNotice();
                                showSuccessMessage(`Prices updated to ${selectedMode} rounding mode!`);
                            } else {
                                showRefreshNotice();
                            }
                        });
                    }
                });
            }
        });
    });

    function loadCurrentState() {
        // Load from storage
        chrome.storage.sync.get(['priceRounderEnabled', 'priceRoundingMode'], function(result) {
            const isEnabled = result.priceRounderEnabled !== false; // Default to true
            const roundingMode = result.priceRoundingMode || 'nearest'; // Default to nearest
            
            updateToggleState(isEnabled);
            updateStatus(isEnabled);
            updateRoundingMode(roundingMode);
            updateExamples(roundingMode);
            
            // Try to get status from content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'getStatus'
                    }, function(response) {
                        if (chrome.runtime.lastError) {
                            // Content script not loaded
                            showRefreshNotice();
                        } else if (response) {
                            updateToggleState(response.enabled);
                            updateStatus(response.enabled);
                            if (response.roundingMode) {
                                updateRoundingMode(response.roundingMode);
                                updateExamples(response.roundingMode);
                            }
                            hideRefreshNotice();
                        }
                    });
                }
            });
        });
    }

    function updateToggleState(isEnabled) {
        if (isEnabled) {
            toggleSwitch.classList.add('active');
        } else {
            toggleSwitch.classList.remove('active');
        }
    }

    function updateStatus(isEnabled) {
        if (isEnabled) {
            statusElement.className = 'status enabled';
            statusText.textContent = '✅ Active - Rounding prices on this page';
        } else {
            statusElement.className = 'status disabled';
            statusText.textContent = '❌ Disabled - Showing original prices';
        }
    }

    function updateRoundingMode(mode) {
        const radio = document.querySelector(`input[name="roundingMode"][value="${mode}"]`);
        if (radio) {
            radio.checked = true;
        }
    }

    function updateExamples(mode) {
        const examples = {
            nearest: {
                '$39.99': '$40.00',
                '₦29,133': '₦30,000',
                '€19.95': '€20.00'
            },
            multiple5: {
                '$39.99': '$40.00',
                '₦29,133': '₦30,000',
                '€19.95': '€20.00'
            },
            multiple10: {
                '$39.99': '$40.00',
                '₦29,133': '₦30,000',
                '€19.95': '€20.00'
            }
        };

        const currentExamples = examples[mode] || examples.nearest;
        
        // Update example elements if they exist
        const example1After = document.getElementById('example1After');
        const example2After = document.getElementById('example2After');
        const example3After = document.getElementById('example3After');
        
        if (example1After) example1After.textContent = currentExamples['$39.99'];
        if (example2After) example2After.textContent = currentExamples['₦29,133'];
        if (example3After) example3After.textContent = currentExamples['€19.95'];
    }

    function showRefreshNotice() {
        refreshNotice.style.display = 'block';
    }

    function hideRefreshNotice() {
        refreshNotice.style.display = 'none';
    }

    function showProcessingIndicator(message) {
        // Create or update processing indicator
        let indicator = document.getElementById('processingIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'processingIndicator';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                right: 10px;
                background: #007bff;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                text-align: center;
                z-index: 1000;
            `;
            document.body.appendChild(indicator);
        }
        indicator.textContent = message;
        indicator.style.display = 'block';
    }

    function hideProcessingIndicator() {
        const indicator = document.getElementById('processingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    function showSuccessMessage(message) {
        // Create or update success message
        let successMsg = document.getElementById('successMessage');
        if (!successMsg) {
            successMsg = document.createElement('div');
            successMsg.id = 'successMessage';
            successMsg.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                right: 10px;
                background: #28a745;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                text-align: center;
                z-index: 1000;
            `;
            document.body.appendChild(successMsg);
        }
        successMsg.textContent = message;
        successMsg.style.display = 'block';
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 2000);
    }
});
