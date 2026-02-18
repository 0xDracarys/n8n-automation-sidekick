// API KEY TESTING AND MODEL SWITCHING FIX
console.log('🔧 LOADING API KEY TEST...');

window.testAPIKey = async function(provider, apiKey) {
    console.log(`🔍 Testing ${provider} API key...`);
    
    try {
        let response, data;
        
        switch (provider) {
            case 'openrouter':
                response = await fetch('https://openrouter.ai/api/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                break;
                
            case 'openai':
                response = await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                break;
                
            case 'groq':
                response = await fetch('https://api.groq.com/openai/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                break;
                
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ ${provider} API key test failed:`, response.status, errorText);
            return {
                success: false,
                error: `HTTP ${response.status}: ${errorText}`,
                status: response.status
            };
        }
        
        data = await response.json();
        console.log(`✅ ${provider} API key working!`);
        console.log(`📊 Available models:`, data.data?.length || 0);
        
        return {
            success: true,
            models: data.data || [],
            provider: provider
        };
        
    } catch (error) {
        console.error(`❌ ${provider} API key test error:`, error);
        return {
            success: false,
            error: error.message
        };
    }
};

window.testYourOpenRouterKey = async function() {
    // Get API key from user input or environment
    const apiKey = document.getElementById('openrouterApiKey')?.value || '';
    if (!apiKey) {
        console.error('❌ OpenRouter API key not provided');
        return { success: false, error: 'API key not provided' };
    }
    return await testAPIKey('openrouter', apiKey);
};

// Enhanced model switching with proper JSON prompt engineering
window.createRobustWorkflowGenerator = function() {
    return {
        async generateWorkflow(description, provider, apiKey, model) {
            console.log(`🧠 Generating workflow with ${provider}/${model}`);
            
            const prompts = {
                openrouter: {
                    system: "You are an expert n8n workflow designer. Always respond with valid JSON only.",
                    user: `Create a complete n8n workflow for: ${description}

Respond with ONLY this JSON format (no markdown, no explanations):
{
  "name": "Workflow Name",
  "nodes": [
    {
      "id": "1",
      "name": "Node Name",
      "type": "n8n-nodes-base.nodeType",
      "position": {"x": 240, "y": 300},
      "parameters": {}
    }
  ],
  "connections": {}
}`
                },
                openai: {
                    system: "You are an n8n workflow expert. Generate valid JSON workflows only.",
                    user: `Create an n8n workflow for: ${description}

Return only valid JSON:
{
  "name": "Workflow",
  "nodes": [{"id": "1", "name": "Node", "type": "n8n-nodes-base.nodeType", "position": {"x": 240, "y": 300}, "parameters": {}}],
  "connections": {}
}`
                },
                groq: {
                    system: "Generate n8n workflows in valid JSON format only.",
                    user: `Create n8n workflow: ${description}

JSON only:
{
  "name": "Workflow",
  "nodes": [{"id": "1", "name": "Node", "type": "n8n-nodes-base.nodeType", "position": {"x": 240, "y": 300}, "parameters": {}}],
  "connections": {}
}`
                },
                ollama: {
                    system: "Create valid n8n workflow JSON only.",
                    user: `Create n8n workflow for: ${description}

Respond only with JSON:
{
  "name": "Workflow",
  "nodes": [{"id": "1", "name": "Node", "type": "n8n-nodes-base.nodeType", "position": {"x": 240, "y": 300}, "parameters": {}}],
  "connections": {}
}`
                }
            };
            
            const prompt = prompts[provider] || prompts.ollama;
            
            try {
                let response, result;
                
                switch (provider) {
                    case 'openrouter':
                        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json',
                                'HTTP-Referer': 'https://n8n-sidekick.com',
                                'X-Title': 'n8n Automation Sidekick'
                            },
                            body: JSON.stringify({
                                model: model,
                                messages: [
                                    { role: 'system', content: prompt.system },
                                    { role: 'user', content: prompt.user }
                                ],
                                temperature: 0.7,
                                max_tokens: 4000,
                                response_format: { type: 'json_object' }
                            })
                        });
                        break;
                        
                    case 'openai':
                        response = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: model,
                                messages: [
                                    { role: 'system', content: prompt.system },
                                    { role: 'user', content: prompt.user }
                                ],
                                temperature: 0.7,
                                max_tokens: 4000,
                                response_format: { type: 'json_object' }
                            })
                        });
                        break;
                        
                    case 'groq':
                        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: model,
                                messages: [
                                    { role: 'system', content: prompt.system },
                                    { role: 'user', content: prompt.user }
                                ],
                                temperature: 0.7,
                                max_tokens: 4000,
                                response_format: { type: 'json_object' }
                            })
                        });
                        break;
                        
                    case 'ollama':
                        response = await fetch('http://localhost:11434/api/generate', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: model,
                                prompt: prompt.system + '\n\n' + prompt.user,
                                stream: false,
                                options: {
                                    temperature: 0.7,
                                    top_p: 0.9,
                                    max_tokens: 4000
                                }
                            })
                        });
                        break;
                        
                    default:
                        throw new Error(`Unsupported provider: ${provider}`);
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ ${provider} generation failed:`, response.status, errorText);
                    throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
                }
                
                result = await response.json();
                
                // Extract workflow based on provider response format
                let workflow;
                if (provider === 'ollama') {
                    // Ollama returns direct response
                    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        workflow = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error('No valid JSON found in Ollama response');
                    }
                } else {
                    // OpenAI/OpenRouter/Groq return choices array
                    workflow = result.choices[0].message.content;
                    if (typeof workflow === 'string') {
                        workflow = JSON.parse(workflow);
                    }
                }
                
                // Validate workflow structure
                if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
                    throw new Error('Invalid workflow structure: missing nodes array');
                }
                
                console.log('✅ Workflow generated successfully!');
                console.log(`📊 Generated ${workflow.nodes.length} nodes`);
                
                return {
                    success: true,
                    workflow: workflow,
                    provider: provider,
                    model: model
                };
                
            } catch (error) {
                console.error(`❌ Workflow generation failed:`, error);
                return {
                    success: false,
                    error: error.message,
                    provider: provider,
                    model: model
                };
            }
        }
    };
};

// Test your specific OpenRouter key
window.testYourKey = async function() {
    console.log('🔍 Testing your OpenRouter API key...');
    const result = await testYourOpenRouterKey();
    
    if (result.success) {
        console.log('✅ API key is valid!');
        console.log(`📊 Found ${result.models.length} available models`);
        
        // Show some recommended models
        const recommendedModels = result.models.filter(m => 
            m.id.includes('gpt') || 
            m.id.includes('claude') || 
            m.id.includes('gemini') ||
            m.id.includes('llama')
        ).slice(0, 5);
        
        console.log('🎯 Recommended models:', recommendedModels.map(m => m.id));
        
        // Test workflow generation
        const generator = createRobustWorkflowGenerator();
        // Get API key from environment or user input
        const apiKey = process.env.OPENROUTER_API_KEY || document.getElementById('openrouterApiKey')?.value || '';
        if (!apiKey) {
            console.error('❌ OpenRouter API key not available for test');
            return;
        }
        
        const workflowResult = await generator.generateWorkflow(
            'Send email when web form is submitted',
            'openrouter',
            apiKey,
            'openai/gpt-4o-mini'
        );
        
        if (workflowResult.success) {
            console.log('🎉 Workflow generation test successful!');
            console.log('📋 Generated workflow:', workflowResult.workflow);
        } else {
            console.error('❌ Workflow generation test failed:', workflowResult.error);
        }
        
    } else {
        console.error('❌ API key test failed:', result.error);
        
        if (result.status === 403) {
            console.log('🔧 403 Error Solutions:');
            console.log('1. Check if API key is correct');
            console.log('2. Check if key has sufficient credits');
            console.log('3. Check if key is active');
            console.log('4. Try generating a new key from OpenRouter dashboard');
        }
    }
    
    return result;
};

console.log('🔧 API key test loaded. Run testYourKey() to test your OpenRouter key.');
