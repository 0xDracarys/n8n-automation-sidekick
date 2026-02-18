// OLLAMA DIAGNOSTIC TOOL - Comprehensive Ollama testing
console.log('🔧 LOADING OLLAMA DIAGNOSTIC...');

window.diagnoseOllama = async function() {
    console.log('🔍 STARTING OLLAMA DIAGNOSTIC');
    console.log('='.repeat(60));
    
    const results = {
        tagsEndpoint: false,
        generateEndpoint: false,
        modelLoaded: false,
        errors: []
    };
    
    try {
        // Test 1: Tags Endpoint
        console.log('📡 Test 1: Testing /api/tags endpoint...');
        try {
            const tagsResponse = await fetch('http://localhost:11434/api/tags');
            console.log('📊 Tags response status:', tagsResponse.status);
            console.log('📊 Tags response headers:', Object.fromEntries(tagsResponse.headers));
            
            if (!tagsResponse.ok) {
                throw new Error(`HTTP ${tagsResponse.status}: ${tagsResponse.statusText}`);
            }
            
            const tagsData = await tagsResponse.json();
            console.log('✅ Tags endpoint working!');
            console.log('📋 Available models:', tagsData.models.map(m => `${m.name} (${Math.round(m.size/1024/1024)}MB)`));
            
            results.tagsEndpoint = true;
            results.models = tagsData.models;
            
            // Check if llama3.2 is available
            const llama32 = tagsData.models.find(m => m.name.includes('llama3.2'));
            if (llama32) {
                console.log('✅ llama3.2 model found!');
                results.modelLoaded = true;
            } else {
                console.log('⚠️ llama3.2 model not found. Available models:', tagsData.models.map(m => m.name));
                results.errors.push('llama3.2 model not found');
            }
            
        } catch (error) {
            console.error('❌ Tags endpoint failed:', error);
            results.errors.push(`Tags endpoint: ${error.message}`);
        }
        
        // Test 2: Generate Endpoint
        console.log('\n📡 Test 2: Testing /api/generate endpoint...');
        try {
            const generatePayload = {
                model: 'llama3.2',
                prompt: 'Hello, respond with just "OK"',
                stream: false,
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                    max_tokens: 10
                }
            };
            
            console.log('📤 Sending payload:', JSON.stringify(generatePayload, null, 2));
            
            const generateResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(generatePayload)
            });
            
            console.log('📊 Generate response status:', generateResponse.status);
            console.log('📊 Generate response headers:', Object.fromEntries(generateResponse.headers));
            
            if (!generateResponse.ok) {
                const errorText = await generateResponse.text();
                console.error('❌ Generate endpoint error:', errorText);
                throw new Error(`HTTP ${generateResponse.status}: ${errorText}`);
            }
            
            const generateData = await generateResponse.json();
            console.log('✅ Generate endpoint working!');
            console.log('📝 Response:', generateData);
            console.log('📝 Response text:', generateData.response);
            console.log('📊 Response length:', generateData.response?.length || 0);
            
            results.generateEndpoint = true;
            results.generateResponse = generateData;
            
        } catch (error) {
            console.error('❌ Generate endpoint failed:', error);
            results.errors.push(`Generate endpoint: ${error.message}`);
        }
        
        // Test 3: Model Info
        console.log('\n📡 Test 3: Testing model info...');
        try {
            const modelResponse = await fetch('http://localhost:11434/api/show', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: 'llama3.2'
                })
            });
            
            if (modelResponse.ok) {
                const modelData = await modelResponse.json();
                console.log('✅ Model info retrieved!');
                console.log('📊 Model details:', {
                    name: modelData.model,
                    modified: modelData.modified_at,
                    size: modelData.size ? Math.round(modelData.size/1024/1024) + 'MB' : 'Unknown'
                });
                results.modelInfo = modelData;
            } else {
                console.log('⚠️ Model info endpoint failed, but this is not critical');
            }
        } catch (error) {
            console.log('⚠️ Model info test failed (not critical):', error.message);
        }
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        results.errors.push(`General: ${error.message}`);
    }
    
    // Generate report
    console.log('\n📊 DIAGNOSTIC REPORT');
    console.log('='.repeat(60));
    console.log('✅ Tags Endpoint:', results.tagsEndpoint);
    console.log('✅ Generate Endpoint:', results.generateEndpoint);
    console.log('✅ Model Loaded:', results.modelLoaded);
    
    if (results.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        results.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
        });
    }
    
    // Provide recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    if (!results.tagsEndpoint) {
        console.log('❌ Ollama is not running or not accessible');
        console.log('   Solution: Run "ollama serve" in PowerShell');
    } else if (!results.modelLoaded) {
        console.log('⚠️ llama3.2 model not found');
        console.log('   Solution: Run "ollama pull llama3.2" or "ollama run llama3.2"');
    } else if (!results.generateEndpoint) {
        console.log('❌ Generate endpoint not working');
        console.log('   Solution: Restart Ollama with "ollama serve"');
        console.log('   Check Ollama logs for errors');
    } else {
        console.log('✅ Everything is working correctly!');
        console.log('   The test prompt should now work');
    }
    
    // Show results in UI
    let output = `🔍 OLLAMA DIAGNOSTIC REPORT\n`;
    output += `========================\n\n`;
    output += `✅ Tags Endpoint: ${results.tagsEndpoint ? 'WORKING' : 'FAILED'}\n`;
    output += `✅ Generate Endpoint: ${results.generateEndpoint ? 'WORKING' : 'FAILED'}\n`;
    output += `✅ Model Loaded: ${results.modelLoaded ? 'FOUND' : 'NOT FOUND'}\n\n`;
    
    if (results.models && results.models.length > 0) {
        output += `📋 Available Models:\n`;
        results.models.forEach(model => {
            output += `  • ${model.name} (${Math.round(model.size/1024/1024)}MB)\n`;
        });
        output += `\n`;
    }
    
    if (results.errors.length > 0) {
        output += `❌ Errors Found:\n`;
        results.errors.forEach((error, index) => {
            output += `  ${index + 1}. ${error}\n`;
        });
        output += `\n`;
    }
    
    output += `🔧 Recommendations:\n`;
    if (!results.tagsEndpoint) {
        output += `  • Run: ollama serve\n`;
        output += `  • Check if Ollama is running\n`;
    } else if (!results.modelLoaded) {
        output += `  • Run: ollama pull llama3.2\n`;
        output += `  • Or: ollama run llama3.2\n`;
    } else if (!results.generateEndpoint) {
        output += `  • Restart Ollama: ollama serve\n`;
        output += `  • Check Ollama logs\n`;
    } else {
        output += `  • Everything is working!\n`;
        output += `  • Try the test prompt again\n`;
    }
    
    // Display in test results
    const resultsDiv = document.getElementById('testResults');
    const outputDiv = document.getElementById('testOutput');
    
    if (resultsDiv && outputDiv) {
        resultsDiv.style.display = 'block';
        outputDiv.textContent = output;
        
        // Add color coding
        outputDiv.innerHTML = output
            .replace(/✅/g, '<span class="success">✅</span>')
            .replace(/❌/g, '<span class="error">❌</span>')
            .replace(/⚠️/g, '<span class="warning">⚠️</span>')
            .replace(/🔧/g, '<span class="info">🔧</span>')
            .replace(/📋/g, '<span class="info">📋</span>');
    }
    
    console.log('\n🎯 DIAGNOSTIC COMPLETE!');
    return results;
};

// Add manual test functions
window.testOllamaManual = async function() {
    console.log('🧪 MANUAL OLLAMA TEST');
    
    try {
        // Test tags
        console.log('Testing tags...');
        const tagsResponse = await fetch('http://localhost:11434/api/tags');
        const tagsData = await tagsResponse.json();
        console.log('Tags OK:', tagsData.models.length, 'models');
        
        // Test generate
        console.log('Testing generate...');
        const generateResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                model: 'llama3.2',
                prompt: 'Say "Hello World"',
                stream: false
            })
        });
        const generateData = await generateResponse.json();
        console.log('Generate OK:', generateData.response);
        
        alert('✅ Manual test successful! Check console for details.');
        
    } catch (error) {
        console.error('Manual test failed:', error);
        alert(`❌ Manual test failed: ${error.message}`);
    }
};

console.log('🔧 Ollama diagnostic loaded. Available commands:');
console.log('  diagnoseOllama() - Full diagnostic');
console.log('  testOllamaManual() - Quick manual test');
