// n8n Automation Sidekick - Popup Script
class N8NSidekick {
  constructor() {
    this.currentTab = 'generate';
    this.isGenerating = false;
    this.currentWorkflow = null;
    this.canvasContext = null;
    this.isContextAware = false;
    this.builder = null;
    
    this.init();
  }

  init() {
    console.log('=== INITIALIZING EXTENSION ===');
    this.setupEventListeners();
    this.loadSettings();
    this.updateUI();
    this.checkCanvasContext();
    this.loadTemplates();
    this.initializeBuilder();
    console.log('=== EXTENSION INITIALIZED ===');
  }

  setupEventListeners() {
    console.log('=== SETTING UP EVENT LISTENERS ===');
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', () => this.generateWorkflow());

    // Copy and Import buttons
    document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
    document.getElementById('importBtn').addEventListener('click', () => this.importToCanvas());

    // Provider selection
    document.getElementById('providerSelect').addEventListener('change', (e) => this.switchProvider(e.target.value));

    // Test connection buttons - add individual listeners for debugging
    const ollamaTestBtn = document.querySelector('#ollamaConfig .test-btn');
    console.log('Ollama test button found during setup:', !!ollamaTestBtn);
    if (ollamaTestBtn) {
      ollamaTestBtn.addEventListener('click', () => {
        console.log('Ollama test button clicked!');
        this.testConnection('ollama');
      });
    }

    const openrouterTestBtn = document.querySelector('#openrouterConfig .test-btn');
    console.log('OpenRouter test button found during setup:', !!openrouterTestBtn);
    if (openrouterTestBtn) {
      openrouterTestBtn.addEventListener('click', () => {
        console.log('OpenRouter test button clicked!');
        this.testConnection('openrouter');
      });
    }

    const openaiTestBtn = document.querySelector('#openaiConfig .test-btn');
    console.log('OpenAI test button found during setup:', !!openaiTestBtn);
    if (openaiTestBtn) {
      openaiTestBtn.addEventListener('click', () => {
        console.log('OpenAI test button clicked!');
        this.testConnection('openai');
      });
    }

    const googleTestBtn = document.querySelector('#googleConfig .test-btn');
    console.log('Google test button found during setup:', !!googleTestBtn);
    if (googleTestBtn) {
      googleTestBtn.addEventListener('click', () => {
        console.log('Google test button clicked!');
        this.testConnection('google');
      });
    }

    const groqTestBtn = document.querySelector('#groqConfig .test-btn');
    console.log('Groq test button found during setup:', !!groqTestBtn);
    if (groqTestBtn) {
      groqTestBtn.addEventListener('click', () => {
        console.log('Groq test button clicked!');
        this.testConnection('groq');
      });
    }

    // Auto-save settings for all inputs
    document.getElementById('providerSelect').addEventListener('change', () => this.saveSettings());
    document.getElementById('openrouterApiKey').addEventListener('input', () => this.saveSettings());
    document.getElementById('modelSelect').addEventListener('change', () => this.saveSettings());
    document.getElementById('openaiApiKey').addEventListener('input', () => this.saveSettings());
    document.getElementById('openaiModel').addEventListener('change', () => this.saveSettings());
    document.getElementById('googleApiKey').addEventListener('input', () => this.saveSettings());
    document.getElementById('googleModel').addEventListener('change', () => this.saveSettings());
    document.getElementById('ollamaUrl').addEventListener('input', () => this.saveSettings());
    document.getElementById('ollamaModel').addEventListener('change', () => this.saveSettings());
    document.getElementById('groqApiKey').addEventListener('input', () => this.saveSettings());
    document.getElementById('groqModel').addEventListener('change', () => this.saveSettings());
    document.getElementById('temperature').addEventListener('input', (e) => {
      document.querySelector('.temperature-value').textContent = e.target.value;
      this.saveSettings();
    });

    // Auto-save textarea content
    document.getElementById('workflow-description').addEventListener('input', () => this.saveUserInput());

    // Template tab event listeners
    document.getElementById('templateSearch')?.addEventListener('input', (e) => this.searchTemplates(e.target.value));
    
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.filterByCategory(e.target.dataset.category));
    });

    // Template fetching buttons
    document.getElementById('fetchOfficialBtn')?.addEventListener('click', () => this.fetchOfficialTemplates());
    document.getElementById('refreshTemplatesBtn')?.addEventListener('click', () => this.refreshTemplates());
    
    console.log('=== EVENT LISTENERS SETUP COMPLETE ===');
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });

    this.currentTab = tabName;
    
    // Initialize builder when switching to builder tab
    if (tabName === 'builder' && !this.builder) {
      this.initializeBuilder();
    }
  }

  async generateWorkflow() {
    if (this.isGenerating) return;

    const description = document.getElementById('workflow-description').value.trim();
    if (!description) {
      this.showError('Please describe your workflow first.');
      return;
    }

    const settings = await this.getSettings();
    console.log('Generation settings:', settings);
    
    if (!this.hasValidCredentials(settings)) {
      this.showError('Please configure your API credentials in the Setup tab.');
      this.switchTab('setup');
      return;
    }

    this.isGenerating = true;
    this.updateGenerateButton(true);
    this.hideError();
    this.hideResult();

    try {
      this.updateStatus('thinking', 'Generating workflow...');
      
      let workflow;
      if (this.isContextAware && this.canvasContext) {
        workflow = await this.generateWithContext(description, settings);
      } else {
        workflow = await this.callAI(description, settings);
      }
      
      this.currentWorkflow = workflow;
      
      this.displayResult(workflow);
      this.updateStatus('ready', 'Workflow generated');
    } catch (error) {
      console.error('Generation error:', error);
      this.showError(error.message || 'Failed to generate workflow. Please try again.');
      this.updateStatus('error', 'Generation failed');
    } finally {
      this.isGenerating = false;
      this.updateGenerateButton(false);
    }
  }

  switchProvider(provider) {
    // Hide all provider configs
    document.querySelectorAll('.provider-config').forEach(config => {
      config.style.display = 'none';
    });
    
    // Show selected provider config
    const selectedConfig = document.getElementById(`${provider}Config`);
    if (selectedConfig) {
      selectedConfig.style.display = 'block';
    }
    
    this.saveSettings();
  }

  hasValidCredentials(settings) {
    switch (settings.provider) {
      case 'openrouter':
        return settings.openrouterApiKey;
      case 'openai':
        return settings.openaiApiKey;
      case 'google':
        return settings.googleApiKey;
      case 'ollama':
        return settings.ollamaUrl;
      case 'groq':
        return settings.groqApiKey;
      default:
        return false;
    }
  }

  async testConnection(provider) {
    console.log('=== TEST CONNECTION STARTED ===');
    console.log('Provider:', provider);
    
    const settings = await this.getSettings();
    console.log('Settings loaded:', settings);
    
    const apiStatus = document.getElementById('apiStatus');
    console.log('API status element found:', !!apiStatus);
    
    let testBtn;
    let url, headers, successMessage;

    console.log('Switching on provider:', provider);
    
    switch (provider) {
      case 'openrouter':
        testBtn = document.querySelector('#openrouterConfig .test-btn');
        url = 'https://openrouter.ai/api/v1/models';
        headers = { 'Authorization': `Bearer ${settings.openrouterApiKey}` };
        successMessage = 'OpenRouter connection successful!';
        break;
        
      case 'openai':
        testBtn = document.querySelector('#openaiConfig .test-btn');
        url = 'https://api.openai.com/v1/models';
        headers = { 'Authorization': `Bearer ${settings.openaiApiKey}` };
        successMessage = 'OpenAI connection successful!';
        break;
        
      case 'google':
        testBtn = document.querySelector('#googleConfig .test-btn');
        url = `https://generativelanguage.googleapis.com/v1beta/models?key=${settings.googleApiKey}`;
        headers = {};
        successMessage = 'Google Gemini connection successful!';
        break;
        
      case 'ollama':
        testBtn = document.querySelector('#ollamaConfig .test-btn');
        url = `${settings.ollamaUrl}/api/tags`;
        headers = {};
        successMessage = 'Ollama connection successful!';
        console.log(`Ollama test - URL: ${url}`);
        console.log(`Ollama URL from settings: ${settings.ollamaUrl}`);
        break;
        
      case 'groq':
        testBtn = document.querySelector('#groqConfig .test-btn');
        url = 'https://api.groq.com/openai/v1/models';
        headers = { 'Authorization': `Bearer ${settings.groqApiKey}` };
        successMessage = 'Groq connection successful!';
        break;
        
      default:
        console.error(`Unknown provider: ${provider}`);
        return;
    }

    console.log('Test button found:', !!testBtn);
    console.log('Test button element:', testBtn);
    console.log('Test URL:', url);
    console.log('Headers:', headers);

    if (!testBtn) {
      console.error('Test button not found for provider:', provider);
      console.error('Looking for selector:', `#${provider}Config .test-btn`);
      this.showApiStatus('error', 'Test button not found');
      return;
    }

    console.log('Disabling test button...');
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    apiStatus.className = 'api-status';

    try {
      console.log('Making fetch request to:', url);
      console.log('Request headers:', headers);
      
      const response = await fetch(url, { headers });
      
      console.log('Response received:');
      console.log('- Status:', response.status);
      console.log('- OK:', response.ok);
      console.log('- Status text:', response.statusText);
      console.log('- Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        console.log('Response OK, parsing JSON...');
        const data = await response.json();
        console.log('Response data:', data);
        console.log('Showing success message...');
        this.showApiStatus('success', successMessage);
        console.log('Saving settings...');
        await this.saveSettings();
        console.log('Settings saved');
      } else {
        console.log('Response NOT OK, getting error details...');
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.log('Parsed error data:', errorData);
        } catch (e) {
          console.log('Could not parse error as JSON, using raw text');
          errorData = { raw: errorText };
        }
        const errorMessage = errorData.error?.message || `Connection failed: ${response.status} - ${errorText}`;
        console.log('Showing error message:', errorMessage);
        this.showApiStatus('error', errorMessage);
      }
    } catch (error) {
      console.error('Network/JavaScript error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      const errorMessage = `Network error: ${error.message}. Make sure Ollama is running on ${settings.ollamaUrl}`;
      console.log('Showing network error message:', errorMessage);
      this.showApiStatus('error', errorMessage);
    } finally {
      console.log('Finally block - re-enabling button');
      testBtn.disabled = false;
      testBtn.textContent = 'Test Connection';
      console.log('=== TEST CONNECTION FINISHED ===');
    }
  }

  async callAI(description, settings) {
    console.log('=== CALL AI STARTED ===');
    console.log('Provider:', settings.provider);
    console.log('Settings:', settings);
    
    const prompt = this.createPrompt(description, settings);
    console.log('Prompt created, length:', prompt.length);
    
    let response, content;
    
    try {
      console.log('Switching on provider:', settings.provider);
      
      switch (settings.provider) {
        case 'openrouter':
          console.log('Calling OpenRouter...');
          response = await this.callOpenRouter(prompt, settings);
          break;
        case 'openai':
          console.log('Calling OpenAI...');
          response = await this.callOpenAI(prompt, settings);
          break;
        case 'google':
          console.log('Calling Google...');
          response = await this.callGoogle(prompt, settings);
          break;
        case 'ollama':
          console.log('Calling Ollama...');
          response = await this.callOllama(prompt, settings);
          break;
        case 'groq':
          console.log('Calling Groq...');
          response = await this.callGroq(prompt, settings);
          break;
        default:
          throw new Error('Unsupported AI provider');
      }
      
      content = response;
      console.log('Got response, length:', content?.length);
      
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }

    // Parse JSON response
    try {
      console.log('Parsing JSON response...');
      const workflow = JSON.parse(content);
      console.log('JSON parsed successfully');
      this.validateWorkflow(workflow);
      console.log('Workflow validated successfully');
      return workflow;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw content:', content);
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const workflow = JSON.parse(jsonMatch[1]);
          this.validateWorkflow(workflow);
          return workflow;
        } catch (markdownError) {
          console.error('Markdown JSON Parse Error:', markdownError);
        }
      }
      
      throw new Error(`Invalid workflow format received from AI. Parse error: ${parseError.message}`);
    }
  }

  async callOpenRouter(prompt, settings) {
    const apiUrl = window.config.getApiUrl('openrouter');
    const modelConfig = window.config.getModelConfig('openrouter');
    
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.openrouterApiKey}`,
        'HTTP-Referer': window.config.get('app.name').toLowerCase().replace(/\s+/g, '-') + '.com',
        'X-Title': window.config.get('app.name')
      },
      body: JSON.stringify({
        model: settings.model || modelConfig.default,
        messages: [
          {
            role: 'system',
            content: 'You are an expert n8n workflow automation assistant. Generate valid, import-ready n8n workflow JSON based on user descriptions. Always respond with only the JSON workflow object, no explanations or markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(settings.temperature || modelConfig.temperature),
        max_tokens: parseInt(settings.maxTokens || modelConfig.maxTokens)
      })
    });

    console.log('OpenRouter response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenRouter response data:', data);
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenRouter');
    }
    
    return content;
  }

  async callOpenAI(prompt, settings) {
    const apiUrl = window.config.getApiUrl('openai');
    const modelConfig = window.config.getModelConfig('openai');
    
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.openaiApiKey}`
      },
      body: JSON.stringify({
        model: settings.openaiModel || modelConfig.default,
        messages: [
          {
            role: 'system',
            content: 'You are an expert n8n workflow automation assistant. Generate valid, import-ready n8n workflow JSON based on user descriptions. Always respond with only the JSON workflow object, no explanations or markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(settings.temperature || modelConfig.temperature),
        max_tokens: parseInt(settings.maxTokens || modelConfig.maxTokens)
      })
    });

    return await this.handleResponse(response, 'OpenAI');
  }

  async callGoogle(prompt, settings) {
    const apiUrl = window.config.getApiUrl('google');
    const modelConfig = window.config.getModelConfig('google');
    
    const response = await fetch(`${apiUrl}/models/${settings.googleModel || modelConfig.default}:generateContent?key=${settings.googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert n8n workflow automation assistant. Generate valid, import-ready n8n workflow JSON based on user descriptions. Always respond with only the JSON workflow object, no explanations or markdown formatting.\n\nUser request: ${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: parseFloat(settings.temperature),
          maxOutputTokens: 4000
        }
      })
    });

    const data = await this.handleResponse(response, 'Google');
    return data; // handleResponse now returns the content directly for Google too
  }

  async callOllama(prompt, settings) {
    const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.ollamaModel,
        prompt: `You are an expert n8n workflow automation assistant. Generate valid, import-ready n8n workflow JSON based on user descriptions. Always respond with only the JSON workflow object, no explanations or markdown formatting.

User request: ${prompt}

Generate the workflow now:`,
        stream: false,
        options: {
          temperature: parseFloat(settings.temperature),
          num_predict: 4000
        }
      })
    });

    console.log('Ollama response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama error:', errorText);
      throw new Error(`Ollama API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Ollama response data:', data);
    
    // Ollama response format - check if response exists
    if (data.response) {
      return data.response;
    } else if (data.content) {
      return data.content;
    } else {
      console.error('Invalid Ollama response format:', data);
      throw new Error('Invalid response format from Ollama');
    }
  }

  async callGroq(prompt, settings) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.groqApiKey}`
      },
      body: JSON.stringify({
        model: settings.groqModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert n8n workflow automation assistant. Generate valid, import-ready n8n workflow JSON based on user descriptions. Always respond with only the JSON workflow object, no explanations or markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(settings.temperature),
        max_tokens: 4000
      })
    });

    return await this.handleResponse(response, 'Groq');
  }

  async handleResponse(response, provider) {
    console.log(`${provider} API Response status:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${provider} API Error Response:`, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { raw: errorText };
      }
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error(`Invalid API key for ${provider}. Please check your API key.`);
      } else if (response.status === 403) {
        throw new Error(`Access forbidden for ${provider}. Your API key may not have access to this model or your account needs verification.`);
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded for ${provider}. Please try again in a moment.`);
      } else {
        throw new Error(errorData.error?.message || errorData.message || `${provider} API Error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log(`${provider} API Response data:`, data);
    
    // Handle different response formats
    let content;
    
    if (provider === 'Ollama') {
      // Ollama has a different response structure
      content = data.response;
    } else if (provider === 'Google') {
      // Google API response format
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        content = data.candidates[0].content.parts[0].text;
      }
    } else {
      // OpenAI/OpenRouter/Groq format
      content = data.choices?.[0]?.message?.content;
    }
    
    if (!content) {
      console.error(`No content in ${provider} response:`, data);
      throw new Error(`No response content from ${provider} AI model`);
    }

    return content;
  }

  createPrompt(description, settings) {
    const includeErrorHandling = document.getElementById('include-error-handling').checked;
    const includeLogging = document.getElementById('include-logging').checked;

    let prompt = `You are an expert n8n workflow architect. Create a production-ready n8n workflow for: "${description}"

CRITICAL REQUIREMENTS:
1. Generate ONLY a valid n8n workflow JSON object
2. Use official n8n node naming conventions (e.g., "n8n-nodes-base.webhook", "n8n-nodes-base.httpRequest")
3. Configure ALL necessary node parameters with realistic values
4. Set up proper node connections in the connections object - THIS IS CRITICAL
5. Include node IDs, names, positions, and typeVersion where applicable

WORKFLOW STRUCTURE (FOLLOW EXACTLY):
{
  "name": "Descriptive workflow name",
  "nodes": [
    {
      "parameters": { /* complete configuration */ },
      "id": "unique-node-id",
      "name": "Human-readable node name",
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": 1,
      "position": [x, y]
    }
  ],
  "connections": {
    "sourceNodeId": {
      "main": [
        [
          {
            "node": "targetNodeId",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {},
  "versionId": "1"
}

CONNECTIONS REQUIREMENTS:
- EVERY node (except the last) must connect to the next node
- Use the exact connections format shown above
- Node IDs in connections must match actual node IDs
- Sequential flow: first node → second node → third node, etc.

NODE SELECTION GUIDELINES:
- Webhook triggers for external events
- HTTP Request for API integrations
- Set/Filter for data manipulation
- Code nodes for custom JavaScript logic
- Slack/Email for notifications
- Google Sheets/Airtable for data storage`;

    if (includeErrorHandling) {
      prompt += `

ERROR HANDLING:
- Add Error Trigger nodes where appropriate
- Include Set nodes to handle error data
- Configure retry logic for HTTP requests
- Add routing for error paths`;
    }

    if (includeLogging) {
      prompt += `

LOGGING & MONITORING:
- Add No-Op nodes for workflow checkpoints
- Include Set nodes to log key data points
- Configure webhook responses for tracking
- Add timing nodes for performance monitoring`;
    }

    prompt += `

BEST PRACTICES:
- Use descriptive node names
- Position nodes logically (left to right flow: [100, 300], [300, 300], [500, 300], etc.)
- Set appropriate timeouts for HTTP requests
- Include data validation where needed
- Configure proper content types and headers

MOST IMPORTANT: Ensure all nodes are properly connected in sequence. The workflow should flow from trigger through all processing nodes to the final action.

Return ONLY the JSON workflow object. No explanations, no markdown formatting, no code blocks.`;

    return prompt;
  }

  validateWorkflow(workflow) {
    if (!workflow || typeof workflow !== 'object') {
      throw new Error('Invalid workflow structure - must be a JSON object');
    }

    // Check required top-level fields
    const requiredFields = ['nodes', 'connections'];
    for (let field of requiredFields) {
      if (!workflow[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(workflow.nodes)) {
      throw new Error('Workflow must contain a nodes array');
    }

    if (typeof workflow.connections !== 'object') {
      throw new Error('Workflow must contain a connections object');
    }

    if (workflow.nodes.length === 0) {
      throw new Error('Workflow must contain at least one node');
    }

    // Validate each node
    const nodeIds = new Set();
    workflow.nodes.forEach((node, index) => {
      try {
        this.validateNode(node, index);
        if (nodeIds.has(node.id)) {
          throw new Error(`Duplicate node ID: ${node.id}`);
        }
        nodeIds.add(node.id);
      } catch (error) {
        throw new Error(`Node ${index} (${node.name || 'unnamed'}): ${error.message}`);
      }
    });

    // Validate connections reference existing nodes
    this.validateConnections(workflow.connections, nodeIds);

    // Check for at least one trigger node
    const hasTrigger = workflow.nodes.some(node => 
      node.type.includes('webhook') || 
      node.type.includes('cron') || 
      node.type.includes('manualTrigger') ||
      node.type.includes('formTrigger')
    );

    if (!hasTrigger) {
      console.warn('Warning: No trigger node found in workflow');
    }

    return true;
  }

  validateNode(node, index) {
    if (!node.id || typeof node.id !== 'string') {
      throw new Error('Missing or invalid node ID');
    }

    if (!node.name || typeof node.name !== 'string') {
      throw new Error('Missing or invalid node name');
    }

    if (!node.type || typeof node.type !== 'string') {
      throw new Error('Missing or invalid node type');
    }

    // Validate node type format
    if (!node.type.startsWith('n8n-nodes-')) {
      console.warn(`Warning: Node type "${node.type}" may not be a valid n8n node type`);
    }

    // Validate position
    if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
      throw new Error('Missing or invalid node position');
    }

    const [x, y] = node.position;
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('Node position coordinates must be numbers');
    }

    // Validate parameters
    if (node.parameters && typeof node.parameters !== 'object') {
      throw new Error('Node parameters must be an object');
    }

    // Validate typeVersion if present
    if (node.typeVersion && typeof node.typeVersion !== 'number') {
      throw new Error('Node typeVersion must be a number');
    }
  }

  validateConnections(connections, nodeIds) {
    for (let sourceNodeId in connections) {
      if (!nodeIds.has(sourceNodeId)) {
        throw new Error(`Connection references non-existent node: ${sourceNodeId}`);
      }

      const nodeConnections = connections[sourceNodeId];
      if (!nodeConnections.main || !Array.isArray(nodeConnections.main)) {
        continue;
      }

      nodeConnections.main.forEach((outputGroup, groupIndex) => {
        if (!Array.isArray(outputGroup)) {
          throw new Error(`Invalid connection group ${groupIndex} in node ${sourceNodeId}`);
        }

        outputGroup.forEach((connection, connIndex) => {
          if (!connection.node || !nodeIds.has(connection.node)) {
            throw new Error(`Connection ${connIndex} in group ${groupIndex} of node ${sourceNodeId} references non-existent target node`);
          }

          if (typeof connection.type !== 'string') {
            throw new Error(`Connection ${connIndex} missing type`);
          }

          if (typeof connection.index !== 'number') {
            throw new Error(`Connection ${connIndex} missing index`);
          }
        });
      });
    }
  }

  displayResult(workflow) {
    const resultSection = document.getElementById('resultSection');
    const workflowJson = document.getElementById('workflowJson');
    
    workflowJson.textContent = JSON.stringify(workflow, null, 2);
    resultSection.classList.remove('hidden');
    
    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  hideResult() {
    document.getElementById('resultSection').classList.add('hidden');
  }

  async copyToClipboard() {
    if (!this.currentWorkflow) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(this.currentWorkflow, null, 2));
      this.showSuccessMessage('Workflow copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      this.showError('Failed to copy to clipboard');
    }
  }

  async importToCanvas() {
    if (!this.currentWorkflow) return;

    try {
      // Copy to clipboard first
      await navigator.clipboard.writeText(JSON.stringify(this.currentWorkflow, null, 2));
      
      // Show import instructions
      this.showImportInstructions();
    } catch (error) {
      console.error('Import failed:', error);
      this.showError('Failed to prepare workflow for import');
    }
  }

  showImportInstructions() {
    const message = `
🎯 Workflow ready for import!

1. Open your n8n canvas
2. Press Ctrl+V (Windows) or Cmd+V (Mac) to paste
3. The workflow will appear on your canvas

The workflow JSON has been copied to your clipboard.
    `.trim();
    
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'import-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <h4>Ready to Import!</h4>
        <pre>${message}</pre>
        <button class="close-btn">Got it!</button>
      </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        .import-notification {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .notification-content {
          background: white;
          padding: 24px;
          border-radius: 8px;
          max-width: 350px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .notification-content h4 {
          margin: 0 0 12px 0;
          color: var(--primary-orange);
          font-size: 16px;
        }
        .notification-content pre {
          background: var(--bg-secondary);
          padding: 12px;
          border-radius: 4px;
          font-size: 12px;
          margin: 0 0 16px 0;
          white-space: pre-wrap;
        }
        .close-btn {
          width: 100%;
          padding: 8px;
          background: var(--primary-orange);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        .close-btn:hover {
          background: #ff5a47;
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Handle close button
    notification.querySelector('.close-btn').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  async testApiConnection() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const apiStatus = document.getElementById('apiStatus');
    const testBtn = document.getElementById('testApiBtn');
    
    if (!apiKey) {
      this.showApiStatus('error', 'Please enter an API key first');
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    apiStatus.className = 'api-status';

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        this.showApiStatus('success', 'API connection successful!');
        await this.saveSettings();
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.showApiStatus('error', errorData.error?.message || 'API connection failed');
      }
    } catch (error) {
      this.showApiStatus('error', 'Network error - please check your connection');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test Connection';
    }
  }

  showApiStatus(type, message) {
    const apiStatus = document.getElementById('apiStatus');
    apiStatus.textContent = message;
    apiStatus.className = `api-status ${type}`;
  }

  updateGenerateButton(isGenerating) {
    const btn = document.getElementById('generateBtn');
    const btnText = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.loading-spinner');
    
    if (isGenerating) {
      btn.disabled = true;
      btnText.textContent = 'Generating...';
      spinner.classList.remove('hidden');
    } else {
      btn.disabled = false;
      btnText.textContent = 'Generate Workflow';
      spinner.classList.add('hidden');
    }
  }

  updateStatus(type, text) {
    const statusText = document.querySelector('.status-text');
    const statusDot = document.querySelector('.status-dot');
    
    statusText.textContent = text;
    
    // Update dot color
    statusDot.className = 'status-dot';
    switch (type) {
      case 'thinking':
        statusDot.style.background = '#f59e0b';
        break;
      case 'error':
        statusDot.style.background = '#ef4444';
        break;
      case 'ready':
      default:
        statusDot.style.background = '#10b981';
        break;
    }
  }

  showError(message) {
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
    this.hideResult();
  }

  hideError() {
    document.getElementById('errorSection').classList.add('hidden');
  }

  showSuccessMessage(message) {
    // Simple success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      box-shadow: var(--shadow-lg);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  async saveSettings() {
    const settings = {
      provider: document.getElementById('providerSelect').value,
      openrouterApiKey: document.getElementById('openrouterApiKey').value,
      model: document.getElementById('modelSelect').value,
      openaiApiKey: document.getElementById('openaiApiKey').value,
      openaiModel: document.getElementById('openaiModel').value,
      googleApiKey: document.getElementById('googleApiKey').value,
      googleModel: document.getElementById('googleModel').value,
      ollamaUrl: document.getElementById('ollamaUrl').value,
      ollamaModel: document.getElementById('ollamaModel').value,
      groqApiKey: document.getElementById('groqApiKey').value,
      groqModel: document.getElementById('groqModel').value,
      temperature: document.getElementById('temperature').value
    };
    
    await chrome.storage.sync.set({ settings });
  }

  async getSettings() {
    const result = await chrome.storage.sync.get(['settings']);
    return {
      provider: 'openrouter',
      openrouterApiKey: '',
      model: 'google/gemini-2.0-flash-exp',
      openaiApiKey: '',
      openaiModel: 'gpt-3.5-turbo',
      googleApiKey: '',
      googleModel: 'gemini-2.0-flash-exp',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      groqApiKey: '',
      groqModel: 'llama-3.1-70b-versatile',
      temperature: '0.7',
      ...result.settings
    };
  }

  async loadSettings() {
    const settings = await this.getSettings();
    
    // Load provider selection
    document.getElementById('providerSelect').value = settings.provider;
    
    // Load OpenRouter settings
    document.getElementById('openrouterApiKey').value = settings.openrouterApiKey || '';
    document.getElementById('modelSelect').value = settings.model;
    
    // Load OpenAI settings
    document.getElementById('openaiApiKey').value = settings.openaiApiKey || '';
    document.getElementById('openaiModel').value = settings.openaiModel;
    
    // Load Google settings
    document.getElementById('googleApiKey').value = settings.googleApiKey || '';
    document.getElementById('googleModel').value = settings.googleModel;
    
    // Load Ollama settings
    document.getElementById('ollamaUrl').value = settings.ollamaUrl;
    document.getElementById('ollamaModel').value = settings.ollamaModel;
    
    // Load Groq settings
    document.getElementById('groqApiKey').value = settings.groqApiKey || '';
    document.getElementById('groqModel').value = settings.groqModel;
    
    // Load temperature
    document.getElementById('temperature').value = settings.temperature;
    document.querySelector('.temperature-value').textContent = settings.temperature;
    
    // Show correct provider config
    this.switchProvider(settings.provider);
  }

  async saveUserInput() {
    const userInput = document.getElementById('workflow-description').value;
    await chrome.storage.local.set({ userInput });
  }

  async loadUserInput() {
    const result = await chrome.storage.local.get(['userInput']);
    if (result.userInput) {
      document.getElementById('workflow-description').value = result.userInput;
    }
  }

  updateUI() {
    this.loadUserInput();
    this.updateContextIndicator();
  }

  // Phase 2: Context-Aware Editing Methods
  async checkCanvasContext() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (!currentTab) return;

      // Check if we're on an n8n page
      const isN8NPage = currentTab.url && (
        currentTab.url.includes('n8n.io') || 
        currentTab.url.includes('n8n.cloud') ||
        currentTab.url.includes('app.n8n.cloud')
      );

      if (isN8NPage) {
        // Try to get canvas state
        const response = await chrome.tabs.sendMessage(currentTab.id, { 
          action: 'getCanvasState' 
        }).catch(() => null);

        if (response && response.success) {
          this.canvasContext = response.data;
          this.isContextAware = true;
          this.enableContextualFeatures();
        }
      }
    } catch (error) {
      console.log('Canvas context check failed:', error);
      this.isContextAware = false;
    }
  }

  enableContextualFeatures() {
    // Show contextual UI elements
    const contextualIndicator = document.createElement('div');
    contextualIndicator.className = 'context-indicator';
    contextualIndicator.innerHTML = `
      <span class="context-badge">🎯 Context Mode</span>
      <span class="context-info">Canvas detected - ${this.canvasContext.nodes?.length || 0} nodes</span>
    `;
    
    // Insert after header
    const header = document.querySelector('.header');
    header.insertAdjacentElement('afterend', contextualIndicator);

    // Add contextual options
    this.addContextualOptions();
    
    // Update placeholder text
    const textarea = document.getElementById('workflow-description');
    if (textarea) {
      textarea.placeholder = `e.g., "Add a Slack notification after the Filter node" or "Modify the HTTP Request to include headers"`;
    }
  }

  addContextualOptions() {
    const optionsSection = document.querySelector('.options-section');
    if (!optionsSection || !this.canvasContext) return;

    const contextualOptions = document.createElement('div');
    contextualOptions.className = 'contextual-options';
    contextualOptions.innerHTML = `
      <div class="option-group">
        <label class="checkbox-label">
          <input type="checkbox" id="use-context" checked>
          <span class="checkmark"></span>
          Use current canvas context
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="smart-connections" checked>
          <span class="checkmark"></span>
          Smart node connections
        </label>
      </div>
      <div class="context-summary">
        <p><strong>Current Canvas:</strong></p>
        <div class="node-list">
          ${this.canvasContext.nodes?.slice(0, 5).map(node => 
            `<div class="node-item">${node.name} (${node.type})</div>`
          ).join('') || ''}
          ${this.canvasContext.nodes?.length > 5 ? 
            `<div class="node-item">... and ${this.canvasContext.nodes.length - 5} more</div>` : ''}
        </div>
      </div>
    `;

    optionsSection.insertAdjacentElement('afterend', contextualOptions);

    // Add event listeners
    document.getElementById('use-context')?.addEventListener('change', () => this.saveSettings());
    document.getElementById('smart-connections')?.addEventListener('change', () => this.saveSettings());
  }

  updateContextIndicator() {
    const statusText = document.querySelector('.status-text');
    const statusDot = document.querySelector('.status-dot');
    
    if (this.isContextAware && statusText && statusDot) {
      statusText.textContent = 'Context Ready';
      statusDot.classList.add('context-ready');
    }
  }

  async generateWithContext(description, settings) {
    const useContext = document.getElementById('use-context')?.checked !== false;
    const smartConnections = document.getElementById('smart-connections')?.checked !== false;

    let enhancedPrompt = description;

    if (useContext && this.canvasContext) {
      enhancedPrompt = this.createContextualPrompt(description, this.canvasContext, smartConnections);
    }

    return await this.callAI(enhancedPrompt, settings);
  }

  createContextualPrompt(description, canvasData, smartConnections) {
    let prompt = `Modify or extend the existing n8n workflow based on: "${description}"

Current Workflow Context:
- Existing Nodes: ${canvasData.nodes?.length || 0}
${canvasData.nodes?.map(node => 
  `- ${node.name} (Type: ${node.type}, ID: ${node.id})`
).join('\n') || ''}

${canvasData.connections && Object.keys(canvasData.connections).length > 0 ? 
  `Current Connections: ${JSON.stringify(canvasData.connections, null, 2)}` : ''
}

Requirements:`;

    // Add contextual intelligence
    if (description.toLowerCase().includes('add') && description.toLowerCase().includes('after')) {
      prompt += `
- Parse the "after [node name]" instruction to identify the connection point
- Insert new nodes after the specified node in the workflow
- Maintain existing connections and add new ones appropriately`;
    }

    if (description.toLowerCase().includes('modify') || description.toLowerCase().includes('change')) {
      prompt += `
- Identify which node(s) to modify based on the description
- Update the specified node parameters while preserving other settings
- Maintain existing connections unchanged`;
    }

    if (description.toLowerCase().includes('replace')) {
      prompt += `
- Remove the specified node and replace it with new functionality
- Preserve input connections to the replaced node
- Connect the new node to the same downstream nodes`;
    }

    if (smartConnections) {
      prompt += `
- Automatically determine the best connection points
- Use n8n best practices for node linking
- Ensure logical flow between nodes`;
    }

    prompt += `

Return the complete, updated workflow JSON that includes both existing and new nodes, ready for import.`;

    return prompt;
  }

  // Template Management Methods
  loadTemplates() {
    this.allTemplates = WorkflowTemplates.getTemplates();
    this.currentCategory = 'all';
    this.currentSearch = '';
    this.renderTemplates();
  }

  async fetchOfficialTemplates() {
    console.log('Fetching official n8n templates...');
    
    const fetchBtn = document.getElementById('fetchOfficialBtn');
    const originalText = fetchBtn.textContent;
    
    try {
      fetchBtn.disabled = true;
      fetchBtn.textContent = '🌐 Fetching...';
      
      const officialTemplates = await N8NTemplateFetcher.fetchOfficialTemplates();
      
      // Merge with existing templates
      this.allTemplates = {
        ...this.allTemplates,
        ...officialTemplates
      };
      
      this.renderTemplates();
      this.showSuccessMessage(`Fetched ${Object.keys(officialTemplates).length} official n8n templates!`);
      
    } catch (error) {
      console.error('Error fetching templates:', error);
      this.showError(`Failed to fetch templates: ${error.message}`);
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = originalText;
    }
  }

  refreshTemplates() {
    console.log('Refreshing templates...');
    this.loadTemplates();
    this.showSuccessMessage('Templates refreshed!');
  }

  renderTemplates() {
    const templatesList = document.getElementById('templatesList');
    if (!templatesList) return;

    let templates = Object.entries(this.allTemplates);

    // Filter by category
    if (this.currentCategory !== 'all') {
      templates = templates.filter(([id, template]) => 
        template.category.toLowerCase() === this.currentCategory
      );
    }

    // Filter by search
    if (this.currentSearch) {
      templates = templates.filter(([id, template]) => {
        const searchLower = this.currentSearch.toLowerCase();
        return (
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
    }

    if (templates.length === 0) {
      templatesList.innerHTML = `
        <div class="no-templates">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 13H15M9 17H15M12 3L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>No templates found</p>
          <p style="font-size: 12px; margin-top: 4px;">Try adjusting your search or category filter</p>
        </div>
      `;
      return;
    }

    templatesList.innerHTML = templates.map(([id, template]) => `
      <div class="template-card ${template.official ? 'official-template' : ''}" data-template-id="${id}">
        <div class="template-header">
          <h4 class="template-title">
            ${template.name}
            ${template.official ? '<span class="official-badge">⭐ Official</span>' : ''}
          </h4>
          <span class="template-category">${template.category}</span>
        </div>
        <p class="template-description">${template.description}</p>
        <div class="template-tags">
          ${template.tags.map(tag => `<span class="template-tag">${tag}</span>`).join('')}
        </div>
        <div class="template-actions">
          <button class="template-btn" onclick="sidekick.useTemplate('${id}')">Use Template</button>
          <button class="template-btn secondary" onclick="sidekick.previewTemplate('${id}')">Preview</button>
        </div>
      </div>
    `).join('');
  }

  searchTemplates(query) {
    this.currentSearch = query;
    this.renderTemplates();
  }

  filterByCategory(category) {
    this.currentCategory = category;
    
    // Update category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    this.renderTemplates();
  }

  useTemplate(templateId) {
    const template = WorkflowTemplates.getTemplate(templateId);
    if (!template) return;

    this.currentWorkflow = template.template;
    this.displayResult(template.template);
    
    // Switch to generate tab to show the result
    this.switchTab('generate');
    
    this.showSuccessMessage(`Template "${template.name}" loaded!`);
  }

  previewTemplate(templateId) {
    const template = WorkflowTemplates.getTemplate(templateId);
    if (!template) return;

    // Create preview modal
    const modal = document.createElement('div');
    modal.className = 'template-preview-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${template.name}</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p><strong>Category:</strong> ${template.category}</p>
          <p><strong>Description:</strong> ${template.description}</p>
          <p><strong>Tags:</strong> ${template.tags.join(', ')}</p>
          <div class="workflow-preview">
            <h4>Workflow Structure:</h4>
            <pre>${JSON.stringify(template.template, null, 2)}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button class="template-btn" onclick="sidekick.useTemplate('${templateId}')">Use This Template</button>
          <button class="template-btn secondary close-modal">Close</button>
        </div>
      </div>
    `;

    // Add modal styles
    if (!document.querySelector('#modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.textContent = `
        .template-preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 600px;
          max-height: 80vh;
          width: 90%;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .modal-header {
          padding: 20px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
          color: var(--text-primary);
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-muted);
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-body {
          padding: 20px;
          max-height: 50vh;
          overflow-y: auto;
        }
        .workflow-preview {
          margin-top: 16px;
        }
        .workflow-preview h4 {
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        .workflow-preview pre {
          background: var(--bg-secondary);
          padding: 12px;
          border-radius: 4px;
          font-size: 11px;
          overflow-x: auto;
          max-height: 200px;
          overflow-y: auto;
        }
        .modal-footer {
          padding: 20px;
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(modal);

    // Handle close events
    const closeModal = () => modal.remove();
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Builder methods
  initializeBuilder() {
    if (typeof PopupWorkflowBuilder !== 'undefined' && document.getElementById('builder-tab')) {
      this.builder = new PopupWorkflowBuilder();
      console.log('Builder initialized');
    }
  }

  clearBuilder() {
    if (this.builder) {
      this.builder.clearBuilder();
    }
  }

  exportBuilderWorkflow() {
    if (this.builder) {
      this.builder.exportBuilderWorkflow();
    }
  }

  closeProperties() {
    if (this.builder) {
      this.builder.closeProperties();
    }
  }
}

// Initialize the application
let sidekick; // Global reference for template onclick handlers
document.addEventListener('DOMContentLoaded', () => {
  sidekick = new N8NSidekick();
});
