// Holiday System Diagnostic Script
console.log('Holiday System Diagnostic Started');

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabase) {
        console.error('Supabase client not available');
        return;
    }

    // Examine the database structure
    console.log('Checking database columns in master_users table...');
    try {
        const { error } = await window.supabase
            .rpc('get_table_columns', { table_name: 'master_users' });

        if (error) {
            console.error('Error getting table columns:', error);
        }
    } catch (e) {
        console.error('Failed to check database columns:', e);
    }

    // Add specific event listeners for debugging
    console.log('Adding event listeners for debugging holiday functionality');
    
    // Hook into modals when they appear
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if it's a staff detail modal
                        if (node.id === 'staff-detail-modal' || node.querySelector('#staff-detail-modal')) {
                            console.log('Staff detail modal opened, attaching debug handlers');
                            setTimeout(attachModalDebugHandlers, 100);
                        }
                    }
                }
            }
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Function to attach debug handlers to modal elements
    function attachModalDebugHandlers() {
        console.log('Attaching debug handlers to modal elements');
        
        // Debug multiplier input changes
        const multiplierInput = document.getElementById('multiplier-input');
        if (multiplierInput) {
            const originalOnInput = multiplierInput.oninput;
            multiplierInput.oninput = function(e) {
                console.log('Multiplier changed to:', this.value);
                if (originalOnInput) originalOnInput.call(this, e);
            };
        }
        
        // Debug override checkbox
        const overrideCheckbox = document.getElementById('override-checkbox');
        if (overrideCheckbox) {
            const originalOnChange = overrideCheckbox.onchange;
            overrideCheckbox.onchange = function(e) {
                console.log('Override checkbox changed to:', this.checked);
                if (originalOnChange) originalOnChange.call(this, e);
            };
        }
        
        // Debug override input
        const overrideInput = document.getElementById('override-input');
        if (overrideInput) {
            const originalOnInput = overrideInput.oninput;
            overrideInput.oninput = function(e) {
                console.log('Override value changed to:', this.value);
                if (originalOnInput) originalOnInput.call(this, e);
            };
        }
        
        // Debug save buttons
        const savePatternBtn = document.getElementById('save-pattern-btn');
        if (savePatternBtn) {
            const originalOnClick = savePatternBtn.onclick;
            savePatternBtn.onclick = function(e) {
                console.log('Save pattern button clicked');
                if (originalOnClick) return originalOnClick.call(this, e);
            };
        }
        
        const saveEntitlementBtn = document.getElementById('save-entitlement-btn');
        if (saveEntitlementBtn) {
            const originalOnClick = saveEntitlementBtn.onclick;
            saveEntitlementBtn.onclick = function(e) {
                console.log('Save entitlement button clicked');
                if (originalOnClick) return originalOnClick.call(this, e);
            };
        }

        // Monitor all time inputs
        const dayInputs = Array.from(document.querySelectorAll('.working-day-input'));
        dayInputs.forEach(input => {
            const originalOnChange = input.onchange;
            input.onchange = function(e) {
                console.log(`Day input ${this.id} changed to:`, this.value);
                if (originalOnChange) originalOnChange.call(this, e);
            };
        });

        // Monitor calculated value changes
        const calculatedElement = document.getElementById('calculated-entitlement');
        if (calculatedElement) {
            // Use MutationObserver to monitor content changes
            const calcObserver = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if (mutation.type === 'characterData' || mutation.type === 'childList') {
                        console.log('Calculated entitlement changed to:', calculatedElement.textContent.trim());
                    }
                }
            });
            
            calcObserver.observe(calculatedElement, { 
                characterData: true, 
                childList: true,
                subtree: true 
            });
        }
    }
});