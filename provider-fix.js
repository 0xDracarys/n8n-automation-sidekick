// PROVIDER FIX - Fix provider switching and connection testing
console.log('🔧 LOADING PROVIDER FIX...');

window.fixProviderSwitching = function() {
    console.log('🔄 FIXING PROVIDER SWITCHING...');
    
    // Fix provider selection
    const providerSelect = document.getElementById('providerSelect');
    if (providerSelect) {
        // Remove existing listeners
        const newSelect = providerSelect.cloneNode(true);
        providerSelect.parentNode.replaceChild(newSelect, providerSelect);
        
        // Add fresh listener
        newSelect.addEventListener('change', function(e) {
            const provider = e.target.value;
            console.log(`🔄 Provider switched to: ${provider}`);
            
            // Hide all provider configs
            document.querySelectorAll('.provider-config').forEach(config => {
                config.style.display = 'none';
            });
            
            // Show selected provider config
            const selectedConfig = document.getElementById(`${provider}Config`);
            if (selectedConfig) {
                selectedConfig.style.display = 'block';
                console.log(`✅ Showing ${provider} configuration`);
            }
            
            // Update API status
            const apiStatus = document.getElementById('apiStatus');
            if (apiStatus) {
                apiStatus.textContent = `Provider switched to ${provider}. Test connection to verify.`;
                apiStatus.className = 'api-status info';
            }
            
            // Save setting
            if (window.sidekick && window.sidekick.saveSettings) {
                window.sidekick.saveSettings();
            }
        });
        
        console.log('✅ Provider selection fixed');
    }
    
    // Fix test connection buttons for each provider
    const providers = ['openrouter', 'openai', 'google', 'ollama', 'groq'];
    
    providers.forEach(provider => {
        const configDiv = document.getElementById(`${provider}Config`);
        if (configDiv) {
            const testBtn = configDiv.querySelector('.test-btn');
            if (testBtn) {
                // Remove existing listeners
                const newBtn = testBtn.cloneNode(true);
                testBtn.parentNode.replaceChild(newBtn, testBtn);
                
                // Add fresh listener
                newBtn.addEventListener('click', async function(e) {
                    e.preventDefault();
                    console.log(`🧪 Testing ${provider} connection...`);
                    
                    // Visual feedback
                    const originalText = this.textContent;
                    this.disabled = true;
                    this.textContent = 'Testing...';
                    
                    try {
                        // Get API key if needed
                        let apiKey = '';
                        if (provider !== 'ollama') {
                            const apiKeyInput = document.getElementById(`${provider}ApiKey`);
                            apiKey = apiKeyInput ? apiKeyInput.value : '';
                            
                            if (!apiKey) {
                                throw new Error(`API key required for ${provider}`);
                            }
                        }
                        
                        // Test connection using our robust system
                        const generator = window.createRobustWorkflowGenerator();
                        const testResult = await generator.generateWorkflow(
                            'Test connection - create simple workflow',
                            provider,
                            provider === 'ollama' ? null : apiKey,
                            provider === 'ollama' ? 'llama3.2' : (provider === 'openrouter' ? 'openai/gpt-4o-mini' : `${provider}-model`)
                        );
                        
                        if (testResult.success) {
                            console.log(`✅ ${provider} connection successful!`);
                            
                            // Update status
                            const apiStatus = document.getElementById('apiStatus');
                            if (apiStatus) {
                                apiStatus.textContent = `✅ ${provider} connection successful! Ready to generate workflows.`;
                                apiStatus.className = 'api-status success';
                            }
                            
                            // Show success
                            alert(`✅ ${provider} connection successful! You can now generate workflows.`);
                            
                        } else {
                            throw new Error(testResult.error);
                        }
                        
                    } catch (error) {
                        console.error(`❌ ${provider} connection failed:`, error);
                        
                        // Update status
                        const apiStatus = document.getElementById('apiStatus');
                        if (apiStatus) {
                            apiStatus.textContent = `❌ ${provider} connection failed: ${error.message}`;
                            apiStatus.className = 'api-status error';
                        }
                        
                        alert(`❌ ${provider} connection failed: ${error.message}`);
                        
                    } finally {
                        // Reset button
                        this.disabled = false;
                        this.textContent = originalText;
                    }
                });
                
                console.log(`✅ ${provider} test button fixed`);
            }
        }
    });
    
    // Set initial provider to OpenRouter
    const initialProvider = 'openrouter';
    const initialConfig = document.getElementById(`${initialProvider}Config`);
    if (initialConfig) {
        initialConfig.style.display = 'block';
        console.log(`✅ Initial provider set to ${initialProvider}`);
    }
    
    // Check if OpenRouter API key is configured
    const openrouterKeyInput = document.getElementById('openrouterApiKey');
    if (openrouterKeyInput && !openrouterKeyInput.value) {
        console.log('⚠️ OpenRouter API key not configured');
    }
    
    console.log('🎉 PROVIDER SWITCHING FIXED!');
    return {
        providerSelect: !!providerSelect,
        testButtons: providers.length,
        initialProvider: initialProvider
    };
};

// Auto-apply fix
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixProviderSwitching);
} else {
    fixProviderSwitching();
}

console.log('🔧 Provider fix loaded. Run fixProviderSwitching() to reapply.');
