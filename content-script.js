// Content Script for Phase 2: Canvas Context Awareness
// This script runs on n8n pages to read canvas state

class N8NCanvasReader {
  constructor() {
    this.isN8NPage = this.detectN8NPage();
    this.workflowData = null;
    this.init();
  }

  detectN8NPage() {
    // Check if we're on an n8n canvas page
    return window.location.hostname.includes('n8n.io') || 
           window.location.hostname.includes('app.n8n.cloud') ||
           document.querySelector('.node-creator') !== null ||
           document.querySelector('[data-test-id="canvas"]') !== null;
  }

  init() {
    if (!this.isN8NPage) return;

    console.log('n8n Canvas Reader initialized');
    this.setupMessageListener();
    this.startCanvasMonitoring();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getCanvasState') {
        this.getCanvasState().then(sendResponse);
        return true; // Keep message channel open
      }
    });
  }

  async getCanvasState() {
    try {
      // Method 1: Try to read from n8n's internal state
      const workflowData = await this.readFromN8NState();
      
      if (workflowData) {
        return {
          success: true,
          data: workflowData,
          nodes: this.extractNodeInfo(workflowData),
          connections: this.extractConnectionInfo(workflowData)
        };
      }

      // Method 2: Fallback to DOM parsing
      const domData = this.readFromDOM();
      return {
        success: true,
        data: domData,
        nodes: this.extractNodeInfoFromDOM(),
        connections: this.extractConnectionInfoFromDOM()
      };

    } catch (error) {
      console.error('Failed to read canvas state:', error);
      return { success: false, error: error.message };
    }
  }

  async readFromN8NState() {
    // Try to access n8n's internal workflow data
    // This varies by n8n version and hosting type
    
    try {
      // Check for n8n's global state
      if (window.__n8n_workflow_data__) {
        return window.__n8n_workflow_data__;
      }

      // Try to find in Redux store (if available)
      if (window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_STORE__) {
        const state = window.__REDUX_STORE__.getState();
        if (state.workflow && state.workflow.workflow) {
          return state.workflow.workflow;
        }
      }

      // Try to extract from page script tags
      const scripts = document.querySelectorAll('script');
      for (let script of scripts) {
        const content = script.textContent;
        if (content.includes('workflowData') || content.includes('"nodes"')) {
          const match = content.match(/(?:workflowData|\"nodes\"\s*:\s*\[)([\s\S]*?)(?:\]\s*,|\]\s*$)/);
          if (match) {
            try {
              return JSON.parse('{"nodes":' + match[1] + '}');
            } catch (e) {
              // Continue to next method
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error reading from n8n state:', error);
      return null;
    }
  }

  readFromDOM() {
    // Fallback: Parse visible nodes from DOM
    const nodeElements = document.querySelectorAll('[data-test-id="node"], .node, .workflow-node');
    const nodes = [];
    
    nodeElements.forEach((element, index) => {
      const nodeData = this.extractNodeDataFromElement(element, index);
      if (nodeData) {
        nodes.push(nodeData);
      }
    });

    return { nodes, connections: {} };
  }

  extractNodeDataFromElement(element, index) {
    try {
      // Extract node information from DOM element
      const rect = element.getBoundingClientRect();
      const nodeType = this.getNodeTypeFromElement(element);
      const nodeName = this.getNodeNameFromElement(element);
      
      return {
        id: element.id || element.getAttribute('data-node-id') || `node-${index}`,
        name: nodeName || nodeType || 'Unknown Node',
        type: nodeType || 'n8n-nodes-base.unknown',
        position: [rect.left, rect.top],
        parameters: this.extractNodeParameters(element)
      };
    } catch (error) {
      console.error('Error extracting node data:', error);
      return null;
    }
  }

  getNodeTypeFromElement(element) {
    // Try various methods to get node type
    const typeSelectors = [
      '[data-node-type]',
      '.node-type',
      '.node-name',
      '[class*="node-"]'
    ];

    for (let selector of typeSelectors) {
      const typeElement = element.querySelector(selector);
      if (typeElement) {
        return typeElement.textContent || typeElement.getAttribute('data-node-type');
      }
    }

    // Try to infer from class names
    const classList = Array.from(element.classList);
    const typeClass = classList.find(cls => cls.includes('node-') && !cls.includes('workflow'));
    if (typeClass) {
      return `n8n-nodes-base.${typeClass.replace('node-', '')}`;
    }

    return null;
  }

  getNodeNameFromElement(element) {
    const nameSelectors = [
      '.node-display-name',
      '.node-label',
      '[data-node-name]',
      '.node-title'
    ];

    for (let selector of nameSelectors) {
      const nameElement = element.querySelector(selector);
      if (nameElement) {
        return nameElement.textContent.trim();
      }
    }

    return null;
  }

  extractNodeParameters(element) {
    // Try to extract visible parameters from the node
    const parameters = {};
    
    // Look for parameter displays
    const paramElements = element.querySelectorAll('[data-parameter], .parameter, .node-param');
    paramElements.forEach(param => {
      const key = param.getAttribute('data-parameter') || param.getAttribute('data-param');
      const value = param.textContent.trim();
      if (key && value) {
        parameters[key] = value;
      }
    });

    return parameters;
  }

  extractNodeInfo(workflowData) {
    if (!workflowData.nodes) return [];
    
    return workflowData.nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      typeVersion: node.typeVersion,
      position: node.position,
      parameters: node.parameters,
      webhookId: node.webhookId
    }));
  }

  extractConnectionInfo(workflowData) {
    if (!workflowData.connections) return {};
    
    return workflowData.connections;
  }

  extractNodeInfoFromDOM() {
    const nodeElements = document.querySelectorAll('[data-test-id="node"], .node, .workflow-node');
    const nodes = [];
    
    nodeElements.forEach((element, index) => {
      const nodeData = this.extractNodeDataFromElement(element, index);
      if (nodeData) {
        nodes.push(nodeData);
      }
    });

    return nodes;
  }

  extractConnectionInfoFromDOM() {
    // This is complex - would need to parse SVG connections
    // For now, return empty object
    return {};
  }

  startCanvasMonitoring() {
    // Monitor for changes in the canvas
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if nodes were added/removed
          const nodeChanges = Array.from(mutation.addedNodes).concat(
            Array.from(mutation.removedNodes)
          ).filter(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.matches('[data-test-id="node"], .node, .workflow-node') ||
             node.querySelector('[data-test-id="node"], .node, .workflow-node'))
          );

          if (nodeChanges.length > 0) {
            console.log('Canvas nodes changed, updating state');
            this.workflowData = null; // Invalidate cache
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Helper method to find specific nodes by type or name
  findNodes(criteria) {
    if (!this.workflowData) {
      return [];
    }

    return this.workflowData.nodes.filter(node => {
      if (criteria.type && node.type.includes(criteria.type)) {
        return true;
      }
      if (criteria.name && node.name.toLowerCase().includes(criteria.name.toLowerCase())) {
        return true;
      }
      if (criteria.id && node.id === criteria.id) {
        return true;
      }
      return false;
    });
  }

  // Helper method to find connection points
  findConnectionPoints(nodeId) {
    if (!this.workflowData || !this.workflowData.connections) {
      return [];
    }

    const connections = [];
    const nodeConnections = this.workflowData.connections[nodeId];
    
    if (nodeConnections) {
      Object.keys(nodeConnections).forEach(outputIndex => {
        nodeConnections[outputIndex].forEach(connection => {
          connections.push({
            from: nodeId,
            to: connection.node,
            outputIndex: parseInt(outputIndex),
            inputIndex: connection.index
          });
        });
      });
    }

    return connections;
  }
}

// Initialize the canvas reader
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new N8NCanvasReader();
  });
} else {
  new N8NCanvasReader();
}
