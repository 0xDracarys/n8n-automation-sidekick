// Enhanced Content Script for n8n Canvas Integration
// Handles direct workflow injection into n8n canvas

class N8NCanvasIntegration {
  constructor() {
    this.isN8NPage = false;
    this.workflowData = null;
    this.init();
  }

  init() {
    // Check if we're on an n8n page
    this.checkN8NPage();
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Set up keyboard shortcut for workflow injection (Ctrl+Shift+V)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        this.injectWorkflowFromClipboard();
      }
    });
  }

  checkN8NPage() {
    const url = window.location.href;
    this.isN8NPage =
      url.includes('n8n.io') ||
      url.includes('n8n.cloud') ||
      url.includes('app.n8n.cloud') ||
      url.includes('localhost:5678') ||
      url.includes('127.0.0.1:5678');
    
    if (this.isN8NPage) {
      console.log('🎯 n8n Sidekick: Detected n8n page, enabling canvas integration');
      this.setupCanvasObserver();
    }
  }

  setupCanvasObserver() {
    // Observe for canvas changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          this.checkCanvasReady();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  checkCanvasReady() {
    // Look for n8n canvas elements
    const canvasContainer = document.querySelector('[data-test-id="canvas-container"]') ||
                          document.querySelector('.canvas-container') ||
                          document.querySelector('#canvas');

    if (canvasContainer && !this.canvasReady) {
      this.canvasReady = true;
      console.log('✅ n8n canvas ready for workflow injection');
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getCanvasState':
          sendResponse({ success: true, data: await this.getCanvasState() });
          break;

        case 'injectWorkflow':
          const result = await this.injectWorkflow(request.workflow);
          sendResponse(result);
          break;

        case 'checkCanvasReady':
          sendResponse({ success: true, ready: this.canvasReady });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async getCanvasState() {
    if (!this.isN8NPage) {
      return { error: 'Not on n8n page' };
    }

    try {
      // Try to get current workflow data from n8n's state
      const workflowData = this.extractWorkflowFromPage();
      return {
        success: true,
        data: {
          hasWorkflow: !!workflowData,
          nodeCount: workflowData?.nodes?.length || 0,
          connectionCount: Object.keys(workflowData?.connections || {}).length,
          workflowData: workflowData
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  extractWorkflowFromPage() {
    // Try multiple methods to extract workflow data
    try {
      // Method 1: Check for n8n's global state
      if (window.n8nWorkflow) {
        return window.n8nWorkflow;
      }

      // Method 2: Check for Vue app instance
      const vueApp = document.querySelector('#app').__vue__;
      if (vueApp && vueApp.$store && vueApp.$store.state.workflow) {
        return vueApp.$store.state.workflow;
      }

      // Method 3: Look for workflow in localStorage
      const localWorkflow = localStorage.getItem('n8n-workflow');
      if (localWorkflow) {
        return JSON.parse(localWorkflow);
      }

      // Method 4: Fallback to DOM-based node extraction for offset calculations
      const domNodes = this.extractNodesFromDom();
      if (domNodes.length > 0) {
        return {
          nodes: domNodes,
          connections: {}
        };
      }

      return null;
    } catch (error) {
      console.warn('Failed to extract workflow from page:', error);
      return null;
    }
  }

  extractNodesFromDom() {
    const candidates = [
      '[data-test-id="canvas-node"]',
      '.node-view',
      '.workflow-node',
      '.jtk-node',
      '[class*="node"]',
      '[data-node-id]',
      '[data-node-type]'
    ];

    for (const selector of candidates) {
      const elements = Array.from(document.querySelectorAll(selector)).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 20 && rect.height > 20;
      });

      if (elements.length > 0) {
        return elements.slice(0, 300).map((el, index) => {
          const left = Number.parseFloat(el.style.left);
          const top = Number.parseFloat(el.style.top);
          const rect = el.getBoundingClientRect();

          // Extract advanced node metadata
          const nodeMetadata = this.extractNodeMetadata(el);

          return {
            id: el.getAttribute('data-id') ||
                el.getAttribute('data-node-id') ||
                `dom-node-${index}`,
            name: el.getAttribute('data-name') ||
                  el.getAttribute('data-node-name') ||
                  el.textContent?.trim()?.slice(0, 40) ||
                  `Node ${index + 1}`,
            type: el.getAttribute('data-node-type') ||
                  el.getAttribute('data-type') ||
                  nodeMetadata.type ||
                  'unknown',
            position: [
              Number.isFinite(left) ? left : Math.round(rect.left + window.scrollX),
              Number.isFinite(top) ? top : Math.round(rect.top + window.scrollY)
            ],
            parameters: nodeMetadata.parameters || {},
            connections: nodeMetadata.connections || [],
            properties: nodeMetadata.properties || {},
            disabled: el.classList.contains('disabled') || el.getAttribute('data-disabled') === 'true',
            selected: el.classList.contains('selected') || el.classList.contains('active'),
            error: el.classList.contains('error') || el.classList.contains('has-error'),
            metadata: {
              domSelector: selector,
              elementClasses: Array.from(el.classList),
              dataAttributes: this.extractDataAttributes(el),
              dimensions: { width: rect.width, height: rect.height },
              position: { x: rect.left, y: rect.top }
            }
          };
        });
      }
    }

    return [];
  }

  extractNodeMetadata(element) {
    const metadata = {
      type: 'unknown',
      parameters: {},
      connections: [],
      properties: {}
    };

    try {
      // Extract node type from various sources
      metadata.type = element.getAttribute('data-node-type') ||
                      element.getAttribute('data-type') ||
                      element.className.match(/node-type-(\w+)/)?.[1] ||
                      'unknown';

      // Extract parameters from data attributes
      const paramAttrs = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('data-param-'))
        .map(attr => ({
          key: attr.name.replace('data-param-', ''),
          value: this.parseParameterValue(attr.value)
        }));

      metadata.parameters = Object.fromEntries(paramAttrs.map(p => [p.key, p.value]));

      // Extract properties from data attributes
      const propAttrs = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('data-prop-'))
        .map(attr => ({
          key: attr.name.replace('data-prop-', ''),
          value: this.parseParameterValue(attr.value)
        }));

      metadata.properties = Object.fromEntries(propAttrs.map(p => [p.key, p.value]));

      // Extract connection information
      const connectionData = element.getAttribute('data-connections') ||
                            element.getAttribute('data-links');
      if (connectionData) {
        try {
          metadata.connections = JSON.parse(connectionData);
        } catch (e) {
          // Try to extract connections from class names or other attributes
          metadata.connections = this.extractConnectionsFromClasses(element);
        }
      }

      // Try to extract from Vue component data if available
      if (element.__vue__ && element.__vue__.$data) {
        const vueData = element.__vue__.$data;
        if (vueData.parameters) metadata.parameters = { ...metadata.parameters, ...vueData.parameters };
        if (vueData.properties) metadata.properties = { ...metadata.properties, ...vueData.properties };
        if (vueData.type) metadata.type = vueData.type;
      }

    } catch (error) {
      console.warn('Failed to extract advanced node metadata:', error);
    }

    return metadata;
  }

  extractDataAttributes(element) {
    const dataAttrs = {};
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    });
    return dataAttrs;
  }

  parseParameterValue(value) {
    if (!value) return null;

    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch (e) {
      // Not JSON, return as string
      return value;
    }
  }

  extractConnectionsFromClasses(element) {
    const connections = [];
    const classList = Array.from(element.classList);

    // Look for connection-related classes
    classList.forEach(className => {
      const match = className.match(/connected-to-(\w+)/);
      if (match) {
        connections.push({
          target: match[1],
          type: 'output'
        });
      }
    });

    return connections;
  }

  async injectWorkflow(workflow) {
    if (!this.isN8NPage) {
      return { success: false, error: 'Not on an n8n page' };
    }

    if (!workflow) {
      return { success: false, error: 'No workflow data provided' };
    }

    try {
      // Store workflow data
      this.workflowData = workflow;

      // Method 1: Try direct n8n API injection
      const directResult = await this.tryDirectInjection(workflow);
      if (directResult.success) {
        return directResult;
      }

      // Method 2: Try Vue store injection
      const vueResult = await this.tryVueInjection(workflow);
      if (vueResult.success) {
        return vueResult;
      }

      // Method 3: Fallback to clipboard with instructions
      return await this.fallbackToClipboard(workflow);

    } catch (error) {
      console.error('Workflow injection failed:', error);
      return { success: false, error: error.message };
    }
  }

  async tryDirectInjection(workflow) {
    try {
      // Look for n8n's workflow import function
      if (window.n8n && window.n8n.importWorkflow) {
        await window.n8n.importWorkflow(workflow);
        return { success: true, method: 'direct-api' };
      }

      // Check for global import function
      if (window.importWorkflow) {
        await window.importWorkflow(workflow);
        return { success: true, method: 'global-function' };
      }

      return { success: false, error: 'Direct injection not available' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async tryVueInjection(workflow) {
    try {
      const app = document.querySelector('#app').__vue__;
      if (!app || !app.$store) {
        return { success: false, error: 'Vue app not found' };
      }

      // Update workflow in store
      await app.$store.dispatch('workflow/loadWorkflow', workflow);
      
      // Trigger UI update
      app.$forceUpdate();

      return { success: true, method: 'vue-store' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fallbackToClipboard(workflow) {
    try {
      const workflowJson = JSON.stringify(workflow, null, 2);

      // Method 1: Try ClipboardEvent simulation (preferred)
      const simulationResult = await this.simulatePasteEvent(workflowJson);
      if (simulationResult.success) {
        return simulationResult;
      }

      // Method 2: Fallback to traditional clipboard copy
      console.log('⚠️ ClipboardEvent simulation failed, falling back to clipboard copy');
      await navigator.clipboard.writeText(workflowJson);

      // Show injection instructions
      this.showInjectionInstructions();

      return {
        success: true,
        method: 'clipboard-fallback',
        message: 'Workflow copied to clipboard. Use Ctrl+V to paste into n8n canvas.'
      };
    } catch (error) {
      return { success: false, error: 'Failed to copy to clipboard: ' + error.message };
    }
  }

  async simulatePasteEvent(workflowJson) {
    try {
      // Find the n8n canvas element
      const canvas = this.findCanvasElement();
      if (!canvas) {
        return { success: false, error: 'Canvas element not found' };
      }

      // Create a ClipboardEvent with the workflow JSON
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer()
      });

      // Set the clipboard data
      pasteEvent.clipboardData.setData('text/plain', workflowJson);
      pasteEvent.clipboardData.setData('application/json', workflowJson);

      // Dispatch the event to the canvas
      canvas.dispatchEvent(pasteEvent);

      // Check if the event was handled (prevented default)
      if (pasteEvent.defaultPrevented) {
        return {
          success: true,
          method: 'paste-simulation',
          message: 'Workflow injected via ClipboardEvent simulation'
        };
      }

      // If not handled, try focusing the canvas and dispatching again
      canvas.focus();
      canvas.dispatchEvent(pasteEvent);

      if (pasteEvent.defaultPrevented) {
        return {
          success: true,
          method: 'paste-simulation-focused',
          message: 'Workflow injected via focused ClipboardEvent simulation'
        };
      }

      return { success: false, error: 'Paste event not handled by canvas' };
    } catch (error) {
      console.warn('ClipboardEvent simulation failed:', error);
      return { success: false, error: error.message };
    }
  }

  findCanvasElement() {
    // Try multiple selectors to find the n8n canvas
    const selectors = [
      '[data-test-id="canvas-container"]',
      '.canvas-container',
      '#canvas',
      '.workflow-canvas',
      '[class*="canvas"]',
      '.jtk-canvas',
      // Vue-specific selectors
      '.vue-canvas',
      '[data-v-.*canvas.*]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`🎯 Found canvas element with selector: ${selector}`);
        return element;
      }
    }

    // Fallback: look for any large container that might be the canvas
    const largeContainers = Array.from(document.querySelectorAll('div')).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 400 && rect.height > 300;
    });

    if (largeContainers.length > 0) {
      console.log('🎯 Using large container as canvas fallback');
      return largeContainers[0];
    }

    console.warn('❌ No canvas element found');
    return null;
  }

  showInjectionInstructions() {
    // Remove existing instructions if any
    const existing = document.querySelector('.n8n-injection-instructions');
    if (existing) existing.remove();

    // Create instruction overlay
    const instructions = document.createElement('div');
    instructions.className = 'n8n-injection-instructions';
    instructions.innerHTML = `
      <div class="instructions-content">
        <div class="instructions-header">
          <h3>🎯 Workflow Ready!</h3>
          <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="instructions-body">
          <p>The workflow has been copied to your clipboard.</p>
          <div class="instruction-steps">
            <div class="step">
              <span class="step-number">1</span>
              <span class="step-text">Press <kbd>Ctrl+V</kbd> (Windows) or <kbd>Cmd+V</kbd> (Mac)</span>
            </div>
            <div class="step">
              <span class="step-number">2</span>
              <span class="step-text">The workflow will appear on your canvas</span>
            </div>
          </div>
          <div class="keyboard-shortcut">
            <strong>Pro Tip:</strong> Use <kbd>Ctrl+Shift+V</kbd> for instant injection next time!
          </div>
        </div>
      </div>
    `;

    // Add styles
    instructions.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideInRight 0.3s ease-out;
    `;

    // Add internal styles
    const style = document.createElement('style');
    style.textContent = `
      .instructions-content {
        color: white;
        padding: 20px;
      }
      .instructions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      .instructions-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      .close-btn {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .close-btn:hover {
        background: rgba(255,255,255,0.3);
      }
      .instruction-steps {
        margin: 15px 0;
      }
      .step {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      .step-number {
        background: rgba(255,255,255,0.2);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 12px;
        font-size: 12px;
      }
      .step-text {
        font-size: 14px;
      }
      kbd {
        background: rgba(255,255,255,0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
      }
      .keyboard-shortcut {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(255,255,255,0.2);
        font-size: 12px;
        opacity: 0.9;
      }
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(instructions);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (instructions.parentNode) {
        instructions.remove();
      }
    }, 8000);
  }

  async injectWorkflowFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const workflow = JSON.parse(text);
      const result = await this.injectWorkflow(workflow);
      
      if (result.success) {
        this.showSuccessNotification('Workflow injected successfully!');
      } else {
        this.showErrorNotification('Injection failed: ' + result.error);
      }
    } catch (error) {
      this.showErrorNotification('No valid workflow found in clipboard');
    }
  }

  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `n8n-notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10001;
      animation: slideUp 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
}

// Initialize the enhanced content script
new N8NCanvasIntegration();
