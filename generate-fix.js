// GENERATE FIX - Fix the generate tab to use selected provider
console.log('🔧 LOADING GENERATE FIX...');

window.fixGenerateTab = function() {
    console.log('🚀 FIXING GENERATE TAB...');
    
    // Fix the generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        console.log('✅ Found generate button');
        
        // Remove existing listeners
        const newBtn = generateBtn.cloneNode(true);
        generateBtn.parentNode.replaceChild(newBtn, generateBtn);
        
        // Add fresh listener that uses selected provider
        newBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('🚀 GENERATE BUTTON CLICKED - FIXED VERSION!');
            
            // Visual feedback
            this.disabled = true;
            this.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
            
            try {
                // Get description
                const descField = document.getElementById('workflow-description');
                const description = descField ? descField.value.trim() : '';
                
                if (!description) {
                    alert('Please describe your workflow first!');
                    return;
                }
                
                console.log('📝 Description:', description);
                
                // Get selected provider from dropdown
                const providerSelect = document.getElementById('providerSelect');
                const selectedProvider = providerSelect ? providerSelect.value : 'openrouter';
                console.log('🔄 Selected provider:', selectedProvider);
                
                // Get API key
                let apiKey = '';
                if (selectedProvider !== 'ollama') {
                    const apiKeyInput = document.getElementById(`${selectedProvider}ApiKey`);
                    apiKey = apiKeyInput ? apiKeyInput.value : '';
                    
                    if (!apiKey) {
                        throw new Error(`API key required for ${selectedProvider}. Please configure your API key in the Setup tab.`);
                    }
                }
                
                // Get model
                let model = 'llama3.2'; // default for Ollama
                if (selectedProvider === 'openrouter') {
                    const modelSelect = document.getElementById('modelSelect');
                    model = modelSelect ? modelSelect.value : 'openai/gpt-4o-mini';
                } else if (selectedProvider === 'openai') {
                    const modelSelect = document.getElementById('openaiModel');
                    model = modelSelect ? modelSelect.value : 'gpt-4o-mini';
                } else if (selectedProvider === 'google') {
                    const modelSelect = document.getElementById('googleModel');
                    model = modelSelect ? modelSelect.value : 'gemini-2.0-flash-exp';
                } else if (selectedProvider === 'groq') {
                    const modelSelect = document.getElementById('groqModel');
                    model = modelSelect ? modelSelect.value : 'llama-3.1-70b-versatile';
                }
                
                console.log('🤖 Using model:', model);
                
                // Update status
                const statusText = document.querySelector('.status-text');
                if (statusText) {
                    statusText.textContent = `Generating with ${selectedProvider}...`;
                }
                
                // Use the robust workflow generator
                const generator = window.createRobustWorkflowGenerator();
                
                const result = await generator.generateWorkflow(
                    description,
                    selectedProvider,
                    selectedProvider === 'ollama' ? null : apiKey,
                    model
                );
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                console.log('✅ Workflow generated with', selectedProvider);
                console.log('📊 Generated nodes:', result.workflow.nodes?.length || 0);
                
                // Display result
                const resultSection = document.getElementById('resultSection');
                const resultContent = document.querySelector('.result-content');
                
                if (resultSection && resultContent) {
                    resultSection.style.display = 'block';
                    resultContent.textContent = JSON.stringify(result.workflow, null, 2);
                    console.log('✅ Result displayed');
                }
                
                // Update status
                if (statusText) {
                    statusText.textContent = `✅ Workflow generated with ${selectedProvider}!`;
                }
                
                alert(`✅ Workflow generated successfully with ${selectedProvider}!\n\nGenerated ${result.workflow.nodes?.length || 0} nodes.`);
                
            } catch (error) {
                console.error('❌ Generation failed:', error);
                
                // Update status
                const statusText = document.querySelector('.status-text');
                if (statusText) {
                    statusText.textContent = `❌ Error: ${error.message}`;
                }
                
                alert(`❌ Generation failed: ${error.message}\n\nPlease check your API key and connection.`);
                
            } finally {
                // Reset button
                this.disabled = false;
                this.innerHTML = '<span class="btn-icon">🚀</span> Generate Workflow';
            }
        });
        
        console.log('✅ Generate button fixed with proper provider detection');
    } else {
        console.error('❌ Generate button not found');
    }
    
    // Fix provider selection to update generate button status
    const providerSelect = document.getElementById('providerSelect');
    if (providerSelect) {
        providerSelect.addEventListener('change', function(e) {
            const provider = e.target.value;
            console.log('🔄 Provider changed to:', provider);
            
            // Update status to show current provider
            const statusText = document.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = `Ready to generate with ${provider}`;
            }
            
            // Check if API key is configured
            if (provider === 'openrouter') {
                const apiKeyInput = document.getElementById('openrouterApiKey');
                if (!apiKeyInput || !apiKeyInput.value) {
                    console.log('⚠️ OpenRouter API key not configured');
                }
            }
        });
        
        console.log('✅ Provider selection listener added');
    }
    
    console.log('🎉 GENERATE TAB FIXED!');
    return {
        generateButton: !!generateBtn,
        providerSelect: !!providerSelect
    };
};

// Auto-apply fix
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixGenerateTab);
} else {
    fixGenerateTab();
}

console.log('🔧 Generate fix loaded. Run fixGenerateTab() to reapply.');
