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

        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggle',
                    enabled: newState
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        // Content script might not be loaded yet
                        console.log('Content script not ready:', chrome.runtime.lastError.message);
                        showRefreshNotice();
                    } else if (response && response.success) {
                        console.log('Toggle successful');
                        hideRefreshNotice();
                    } else {
                        console.log('Toggle failed or no response');
                        showRefreshNotice();
                    }
                });
            }
        });
    });

    // Rounding mode change handler
    roundingModeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const selectedMode = this.value;
                
                // Update examples
                updateExamples(selectedMode);
                
                // Save to storage
                chrome.storage.sync.set({
                    priceRoundingMode: selectedMode
                }, function() {
                    console.log('Rounding mode saved:', selectedMode);
                });

                // Send message to content script
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'setRoundingMode',
                            mode: selectedMode
                        }, function(response) {
                            if (chrome.runtime.lastError) {
                                console.log('Content script not ready, will apply on next page load');
                                showRefreshNotice();
                            } else if (response && response.success) {
                                console.log('Rounding mode updated successfully');
                                hideRefreshNotice();
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
                '$9.99': '$10.00',
                '€19.95': '€20.00',
                '£14.99': '£15.00'
            },
            multiple5: {
                '$9.99': '$10.00',
                '€19.95': '€20.00',
                '£14.99': '£15.00'
            },
            multiple10: {
                '$9.99': '$10.00',
                '€19.95': '€20.00',
                '£14.99': '£20.00'
            }
        };

        const currentExamples = examples[mode] || examples.nearest;
        
        document.getElementById('example1After').textContent = currentExamples['$9.99'];
        document.getElementById('example2After').textContent = currentExamples['€19.95'];
        document.getElementById('example3After').textContent = currentExamples['£14.99'];
    }

    function showRefreshNotice() {
        refreshNotice.style.display = 'block';
    }

    function hideRefreshNotice() {
        refreshNotice.style.display = 'none';
    }
});
