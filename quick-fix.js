// Quick Fix Script - Run this in browser console to fix button issues
function quickFix() {
    console.log('🔧 APPLYING QUICK FIX');
    
    // Fix generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        // Remove existing listeners
        const newBtn = generateBtn.cloneNode(true);
        generateBtn.parentNode.replaceChild(newBtn, generateBtn);
        
        // Add new listener
        newBtn.addEventListener('click', async () => {
            console.log('🚀 Generate button clicked!');
            if (window.sidekick) {
                await window.sidekick.generateWorkflow();
            } else {
                console.error('Sidekick not available');
            }
        });
        
        console.log('✅ Generate button fixed');
    }
    
    // Fix test buttons
    const testButtons = document.querySelectorAll('.test-btn');
    testButtons.forEach((btn, index) => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log(`🧪 Test button ${index} clicked!`);
            
            // Get the provider from the closest config div
            const configDiv = newBtn.closest('.provider-config');
            if (configDiv) {
                const provider = configDiv.id.replace('Config', '');
                console.log(`Testing provider: ${provider}`);
                if (window.sidekick) {
                    await window.sidekick.testConnection(provider);
                }
            } else {
                // Fallback test functions
                if (newBtn.textContent.includes('Quick Test')) {
                    if (window.runQuickTest) await window.runQuickTest();
                } else if (newBtn.textContent.includes('Connection')) {
                    if (window.testConnection) await window.testConnection();
                } else if (newBtn.textContent.includes('Prompt')) {
                    if (window.testPromptGeneration) await window.testPromptGeneration();
                }
            }
        });
    });
    
    // Test Ollama connection directly
    console.log('🔗 Testing direct Ollama connection...');
    fetch('http://localhost:11434/api/tags')
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        })
        .then(data => {
            console.log('✅ Ollama connection successful!');
            console.log('Available models:', data.models.map(m => `${m.name} (${Math.round(m.size/1024/1024)}MB)`));
            
            // Update UI if possible
            const apiStatus = document.getElementById('apiStatus');
            if (apiStatus) {
                apiStatus.textContent = `✅ Ollama connected! Found ${data.models.length} models`;
                apiStatus.className = 'api-status success';
            }
        })
        .catch(error => {
            console.error('❌ Ollama connection failed:', error.message);
            
            // Update UI if possible
            const apiStatus = document.getElementById('apiStatus');
            if (apiStatus) {
                apiStatus.textContent = `❌ Ollama connection failed. Make sure Ollama is running on http://localhost:11434`;
                apiStatus.className = 'api-status error';
            }
        });
    
    // Test manual workflow generation
    window.testManualGeneration = async () => {
        console.log('🧠 Testing manual workflow generation...');
        
        if (!window.sidekick) {
            console.error('Sidekick not available');
            return;
        }
        
        try {
            const settings = await window.sidekick.getSettings();
            console.log('Settings:', settings);
            
            // Simple test prompt
            const prompt = 'Create a workflow with a webhook trigger that sends an email';
            console.log('Testing prompt:', prompt);
            
            const workflow = await window.sidekick.callAI(prompt, settings);
            console.log('✅ Workflow generated:', workflow);
            
            // Display result
            const resultSection = document.getElementById('resultSection');
            const resultContent = document.querySelector('.result-content');
            
            if (resultSection && resultContent) {
                resultSection.style.display = 'block';
                resultContent.textContent = JSON.stringify(workflow, null, 2);
            }
            
        } catch (error) {
            console.error('❌ Workflow generation failed:', error);
        }
    };
    
    console.log('🎯 Quick fixes applied!');
    console.log('📋 Available commands:');
    console.log('  - testManualGeneration() - Test workflow generation');
    console.log('  - Click any button to test');
    console.log('  - Check console for detailed logs');
    
    return {
        generateButton: !!generateBtn,
        testButtons: testButtons.length,
        ollamaTest: 'Tested automatically'
    };
}

// Auto-run
quickFix();

// Make available globally
window.quickFix = quickFix;
window.testManualGeneration = async () => {
    console.log('🧠 Testing manual workflow generation...');
    
    if (!window.sidekick) {
        console.error('Sidekick not available');
        return;
    }
    
    try {
        const settings = await window.sidekick.getSettings();
        console.log('Settings:', settings);
        
        // Simple test prompt
        const prompt = 'Create a workflow with a webhook trigger that sends an email';
        console.log('Testing prompt:', prompt);
        
        const workflow = await window.sidekick.callAI(prompt, settings);
        console.log('✅ Workflow generated:', workflow);
        
        // Display result
        const resultSection = document.getElementById('resultSection');
        const resultContent = document.querySelector('.result-content');
        
        if (resultSection && resultContent) {
            resultSection.style.display = 'block';
            resultContent.textContent = JSON.stringify(workflow, null, 2);
        }
        
    } catch (error) {
        console.error('❌ Workflow generation failed:', error);
    }
};

console.log('🔧 Quick fix script loaded. Run quickFix() to reapply fixes.');
