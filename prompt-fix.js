// PROMPT FIX - Specific fix for test prompt functionality
console.log('🔧 LOADING PROMPT FIX...');

function fixPromptGeneration() {
    console.log('🚀 APPLYING PROMPT FIX');
    
    // Fix the test prompt button specifically
    const testButtons = document.querySelectorAll('.test-btn');
    
    testButtons.forEach((btn) => {
        if (btn.textContent.includes('Prompt')) {
            console.log('🎯 Found test prompt button');
            
            // Remove existing listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Add fixed event listener
            newBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                console.log('🧠 TEST PROMPT BUTTON CLICKED!');
                
                // Visual feedback
                const originalText = this.textContent;
                this.disabled = true;
                this.textContent = 'Testing...';
                
                try {
                    console.log('🔗 Testing Ollama connection first...');
                    
                    // Test connection to /api/tags
                    const tagsResponse = await fetch('http://localhost:11434/api/tags');
                    if (!tagsResponse.ok) {
                        throw new Error(`Tags endpoint failed: ${tagsResponse.status}`);
                    }
                    
                    const tagsData = await tagsResponse.json();
                    console.log('✅ Tags endpoint working, models:', tagsData.models.map(m => m.name));
                    
                    // Now test the generate endpoint
                    console.log('🧠 Testing /api/generate endpoint...');
                    
                    const testPrompt = 'Create a simple workflow that sends a Slack message when a new user signs up. Respond with only the workflow JSON.';
                    
                    const generateResponse = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: 'llama3.2',
                            prompt: testPrompt,
                            stream: false,
                            options: {
                                temperature: 0.7,
                                top_p: 0.9,
                                max_tokens: 1000
                            }
                        })
                    });
                    
                    console.log('📡 Generate response status:', generateResponse.status);
                    console.log('📡 Generate response headers:', Object.fromEntries(generateResponse.headers));
                    
                    if (!generateResponse.ok) {
                        const errorText = await generateResponse.text();
                        console.error('❌ Generate endpoint error:', errorText);
                        throw new Error(`Generate endpoint failed: ${generateResponse.status} - ${errorText}`);
                    }
                    
                    const generateData = await generateResponse.json();
                    console.log('✅ Generate endpoint working!');
                    console.log('📝 Response length:', generateData.response?.length || 0);
                    console.log('📝 Response preview:', generateData.response?.substring(0, 200) + '...');
                    
                    // Try to parse as workflow
                    let workflow = null;
                    try {
                        // Look for JSON in the response
                        const jsonMatch = generateData.response.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            workflow = JSON.parse(jsonMatch[0]);
                            console.log('✅ Workflow JSON parsed successfully');
                            console.log('📊 Workflow nodes:', workflow.nodes?.length || 0);
                        } else {
                            console.log('⚠️ No JSON found in response, showing raw response');
                        }
                    } catch (parseError) {
                        console.log('⚠️ JSON parse failed, showing raw response');
                    }
                    
                    // Show results
                    let output = `✅ Prompt generation test successful!\n\n`;
                    output += `🔗 Connection: ✅ Working\n`;
                    output += `🧠 Generation: ✅ Working\n`;
                    output += `📝 Response length: ${generateData.response?.length || 0} characters\n`;
                    output += `📊 Workflow nodes: ${workflow?.nodes?.length || 0}\n\n`;
                    
                    if (workflow && workflow.nodes) {
                        output += `📋 Generated workflow:\n`;
                        workflow.nodes.forEach((node, index) => {
                            output += `  ${index + 1}. ${node.type} - ${node.name}\n`;
                        });
                    } else {
                        output += `📄 Raw response preview:\n`;
                        output += generateData.response?.substring(0, 500) + '...\n\n';
                        output += `⚠️ AI response didn't contain valid workflow JSON\n`;
                        output += `💡 This is normal - the AI is working but needs better prompting`;
                    }
                    
                    showTestResults(output);
                    alert('✅ Prompt generation test successful! Check results below.');
                    
                } catch (error) {
                    console.error('❌ Test prompt failed:', error);
                    
                    let output = `❌ Prompt generation test failed\n\n`;
                    output += `🔍 Error: ${error.message}\n\n`;
                    
                    // Provide troubleshooting
                    output += `🔧 Troubleshooting:\n`;
                    output += `1. Make sure Ollama is running: ollama serve\n`;
                    output += `2. Make sure model is loaded: ollama run llama3.2\n`;
                    output += `3. Check Ollama logs for errors\n`;
                    output += `4. Try restarting Ollama\n\n`;
                    
                    output += `🔗 Test connection manually:\n`;
                    output += `fetch('http://localhost:11434/api/tags').then(r=>r.json()).then(console.log)\n\n`;
                    
                    output += `🧠 Test generation manually:\n`;
                    output += `fetch('http://localhost:11434/api/generate', {\n`;
                    output += `  method: 'POST',\n`;
                    output += `  headers: {'Content-Type': 'application/json'},\n`;
                    output += `  body: JSON.stringify({model: 'llama3.2', prompt: 'test', stream: false})\n`;
                    output += `}).then(r=>r.json()).then(console.log)`;
                    
                    showTestResults(output);
                    alert(`❌ Prompt test failed: ${error.message}\n\nCheck console and results below for troubleshooting.`);
                    
                } finally {
                    // Reset button
                    this.disabled = false;
                    this.textContent = originalText;
                }
            });
            
            console.log('✅ Test prompt button fixed');
            return;
        }
    });
    
    console.log('❌ Test prompt button not found');
}

// Helper function to show test results
function showTestResults(output) {
    const resultsDiv = document.getElementById('testResults');
    const outputDiv = document.getElementById('testOutput');
    
    if (resultsDiv && outputDiv) {
        resultsDiv.style.display = 'block';
        outputDiv.textContent = output;
        
        // Add color coding
        outputDiv.innerHTML = output
            .replace(/✅/g, '<span class="success">✅</span>')
            .replace(/❌/g, '<span class="error">❌</span>')
            .replace(/🎯/g, '<span class="info">🎯</span>')
            .replace(/🔧/g, '<span class="warning">🔧</span>')
            .replace(/⚠️/g, '<span class="warning">⚠️</span>');
    }
}

// Apply fix immediately if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixPromptGeneration);
} else {
    fixPromptGeneration();
}

// Make available globally
window.fixPromptGeneration = fixPromptGeneration;
window.showTestResults = showTestResults;

console.log('🔧 Prompt fix script loaded. Run fixPromptGeneration() to reapply.');
