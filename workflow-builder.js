// Visual Workflow Builder
// Provides a drag-and-drop interface for building n8n workflows

class WorkflowBuilder {
  constructor() {
    this.workflow = {
      name: 'New Workflow',
      nodes: [],
      connections: {},
      active: false,
      settings: {},
      versionId: '1'
    };
    this.selectedNode = null;
    this.draggedNode = null;
  }

  static createBuilderUI() {
    return `
      <div class="workflow-builder">
        <div class="builder-header">
          <div class="builder-title">
            <h3>Visual Workflow Builder</h3>
            <input type="text" id="workflowName" class="workflow-name-input" placeholder="Enter workflow name..." value="New Workflow">
          </div>
          <div class="builder-actions">
            <button class="btn-secondary" onclick="WorkflowBuilder.clearWorkflow()">Clear</button>
            <button class="btn-secondary" onclick="WorkflowBuilder.exportWorkflow()">Export JSON</button>
            <button class="btn-primary" onclick="WorkflowBuilder.copyToClipboard()">Copy to Clipboard</button>
          </div>
        </div>

        <div class="builder-content">
          <div class="node-palette">
            <h4>🧩 Node Palette</h4>
            <div class="node-categories">
              ${this.createNodePalette()}
            </div>
          </div>

          <div class="canvas-container">
            <div class="canvas-header">
              <span class="canvas-info">Drag nodes here to build your workflow</span>
              <div class="canvas-tools">
                <button class="tool-btn" onclick="WorkflowBuilder.autoConnect()" title="Auto-connect nodes">🔗</button>
                <button class="tool-btn" onclick="WorkflowBuilder.validateWorkflow()" title="Validate workflow">✅</button>
                <button class="tool-btn" onclick="WorkflowBuilder.zoomIn()" title="Zoom in">🔍</button>
                <button class="tool-btn" onclick="WorkflowBuilder.zoomOut()" title="Zoom out">🔍</button>
              </div>
            </div>
            <div id="workflowCanvas" class="workflow-canvas" ondrop="WorkflowBuilder.handleDrop(event)" ondragover="WorkflowBuilder.handleDragOver(event)">
              <div class="canvas-placeholder">
                <div class="placeholder-icon">🎯</div>
                <p>Start building your workflow</p>
                <small>Drag nodes from the palette to begin</small>
              </div>
            </div>
          </div>

          <div class="properties-panel">
            <h4>⚙️ Properties</h4>
            <div id="propertiesContent" class="properties-content">
              <div class="no-selection">
                <p>Select a node to configure its properties</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static createNodePalette() {
    const definitions = NodeConfigurator.getNodeDefinitions();
    const categories = {};

    // Group nodes by category
    for (const [nodeType, definition] of Object.entries(definitions)) {
      if (!categories[definition.category]) {
        categories[definition.category] = [];
      }
      categories[definition.category].push({ type: nodeType, ...definition });
    }

    let html = '';
    for (const [category, nodes] of Object.entries(categories)) {
      html += `
        <div class="node-category">
          <h5>${category}</h5>
          <div class="node-list">
      `;
      
      nodes.forEach(node => {
        html += `
          <div class="palette-node" draggable="true" 
               ondragstart="WorkflowBuilder.handleDragStart(event, '${node.type}')"
               onclick="WorkflowBuilder.addNodeToCanvas('${node.type}')">
            <div class="palette-node-icon">${node.icon}</div>
            <div class="palette-node-name">${node.name}</div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    }

    return html;
  }

  static handleDragStart(event, nodeType) {
    event.dataTransfer.setData('nodeType', nodeType);
    event.target.classList.add('dragging');
  }

  static handleDragOver(event) {
    event.preventDefault();
    const canvas = document.getElementById('workflowCanvas');
    canvas.classList.add('drag-over');
  }

  static handleDrop(event) {
    event.preventDefault();
    const canvas = document.getElementById('workflowCanvas');
    canvas.classList.remove('drag-over');
    
    const nodeType = event.dataTransfer.getData('nodeType');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.addNodeToCanvas(nodeType, x, y);
    
    // Remove dragging class
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  }

  static addNodeToCanvas(nodeType, x = null, y = null) {
    const definition = NodeConfigurator.getNodeDefinitions()[nodeType];
    if (!definition) return;

    // Remove placeholder if this is the first node
    const placeholder = document.querySelector('.canvas-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    // Generate unique node ID
    const nodeId = this.generateNodeId(nodeType);
    
    // Position node
    if (x === null || y === null) {
      const canvas = document.getElementById('workflowCanvas');
      const existingNodes = canvas.querySelectorAll('.workflow-node');
      x = 100 + (existingNodes.length * 200);
      y = 200;
    }

    // Create node element
    const nodeElement = document.createElement('div');
    nodeElement.className = 'workflow-node';
    nodeElement.id = `node-${nodeId}`;
    nodeElement.style.left = `${x}px`;
    nodeElement.style.top = `${y}px`;
    nodeElement.innerHTML = `
      <div class="node-header">
        <span class="node-icon">${definition.icon}</span>
        <span class="node-title">${definition.name}</span>
        <button class="node-delete" onclick="WorkflowBuilder.removeNode('${nodeId}')">×</button>
      </div>
      <div class="node-status">
        <span class="status-indicator unconfigured"></span>
        <span class="status-text">Not configured</span>
      </div>
      <div class="node-ports">
        <div class="port input" title="Input"></div>
        <div class="port output" title="Output"></div>
      </div>
    `;

    // Add event listeners
    nodeElement.addEventListener('click', () => this.selectNode(nodeId));
    nodeElement.addEventListener('mousedown', (e) => this.startDragging(e, nodeId));

    // Add to canvas
    document.getElementById('workflowCanvas').appendChild(nodeElement);

    // Add to workflow data
    const builder = WorkflowBuilder.getInstance();
    builder.workflow.nodes.push({
      id: nodeId,
      name: definition.name,
      type: nodeType,
      typeVersion: 1,
      position: [Math.round(x), Math.round(y)],
      parameters: {}
    });

    // Select the new node
    this.selectNode(nodeId);
  }

  static selectNode(nodeId) {
    // Remove previous selection
    document.querySelectorAll('.workflow-node').forEach(node => {
      node.classList.remove('selected');
    });

    // Add selection to clicked node
    const nodeElement = document.getElementById(`node-${nodeId}`);
    nodeElement.classList.add('selected');

    // Update properties panel
    this.updatePropertiesPanel(nodeId);
  }

  static updatePropertiesPanel(nodeId) {
    const builder = WorkflowBuilder.getInstance();
    const node = builder.workflow.nodes.find(n => n.id === nodeId);
    const definition = NodeConfigurator.getNodeDefinitions()[node.type];

    const propertiesContent = document.getElementById('propertiesContent');
    
    propertiesContent.innerHTML = `
      <div class="node-properties">
        <div class="properties-header">
          <h5>${definition.icon} ${definition.name}</h5>
          <span class="node-type">${node.type}</span>
        </div>
        
        <div class="properties-description">
          <p>${definition.description}</p>
        </div>

        <div class="properties-form">
          <div class="form-group">
            <label>Node Name</label>
            <input type="text" id="nodeName" value="${node.name}" 
                   onchange="WorkflowBuilder.updateNodeName('${nodeId}', this.value)">
          </div>

          ${this.createNodeParametersForm(node, definition)}
        </div>

        <div class="properties-actions">
          <button class="btn-secondary" onclick="WorkflowBuilder.testNode('${nodeId}')">Test Node</button>
          <button class="btn-primary" onclick="WorkflowBuilder.openNodeConfig('${nodeId}')">Configure</button>
        </div>
      </div>
    `;
  }

  static createNodeParametersForm(node, definition) {
    let html = '';
    
    for (const [key, param] of Object.entries(definition.parameters)) {
      const value = node.parameters[key] || param.default || '';
      
      html += `
        <div class="form-group">
          <label>${param.label}${param.required ? ' *' : ''}</label>
      `;

      switch (param.type) {
        case 'text':
        case 'email':
        case 'url':
          html += `
            <input type="${param.type}" id="param_${key}" value="${value}" 
                   placeholder="${param.placeholder || ''}" 
                   onchange="WorkflowBuilder.updateNodeParameter('${node.id}', '${key}', this.value)">
          `;
          break;
          
        case 'password':
          html += `
            <input type="password" id="param_${key}" value="${value}" 
                   placeholder="${param.placeholder || ''}" 
                   onchange="WorkflowBuilder.updateNodeParameter('${node.id}', '${key}', this.value)">
          `;
          break;
          
        case 'select':
          html += `
            <select id="param_${key}" onchange="WorkflowBuilder.updateNodeParameter('${node.id}', '${key}', this.value)">
              ${param.options.map(option => 
                `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`
              ).join('')}
            </select>
          `;
          break;
          
        case 'textarea':
          html += `
            <textarea id="param_${key}" rows="3" 
                      onchange="WorkflowBuilder.updateNodeParameter('${node.id}', '${key}', this.value)">${value}</textarea>
          `;
          break;
          
        case 'json':
          html += `
            <textarea id="param_${key}" rows="3" class="json-input"
                      onchange="WorkflowBuilder.updateNodeParameter('${node.id}', '${key}', this.value)">${value}</textarea>
            <small>Enter valid JSON format</small>
          `;
          break;
      }

      html += `
        </div>
      `;
    }

    return html;
  }

  static updateNodeParameter(nodeId, key, value) {
    const builder = WorkflowBuilder.getInstance();
    const node = builder.workflow.nodes.find(n => n.id === nodeId);
    
    if (node) {
      // Handle JSON parsing
      const definition = NodeConfigurator.getNodeDefinitions()[node.type];
      const param = definition.parameters[key];
      
      if (param.type === 'json' && value) {
        try {
          node.parameters[key] = JSON.parse(value);
        } catch (e) {
          // Keep as string if invalid JSON
          node.parameters[key] = value;
        }
      } else {
        node.parameters[key] = value;
      }

      // Update node status
      this.updateNodeStatus(nodeId);
    }
  }

  static updateNodeName(nodeId, name) {
    const builder = WorkflowBuilder.getInstance();
    const node = builder.workflow.nodes.find(n => n.id === nodeId);
    
    if (node) {
      node.name = name;
      // Update UI
      const nodeElement = document.getElementById(`node-${nodeId}`);
      nodeElement.querySelector('.node-title').textContent = name;
    }
  }

  static updateNodeStatus(nodeId) {
    const builder = WorkflowBuilder.getInstance();
    const node = builder.workflow.nodes.find(n => n.id === nodeId);
    const definition = NodeConfigurator.getNodeDefinitions()[node.type];
    
    const nodeElement = document.getElementById(`node-${nodeId}`);
    const statusIndicator = nodeElement.querySelector('.status-indicator');
    const statusText = nodeElement.querySelector('.status-text');
    
    // Check if required parameters are filled
    let configured = true;
    for (const [key, param] of Object.entries(definition.parameters)) {
      if (param.required && !node.parameters[key]) {
        configured = false;
        break;
      }
    }

    if (configured) {
      statusIndicator.className = 'status-indicator configured';
      statusText.textContent = 'Configured';
    } else {
      statusIndicator.className = 'status-indicator unconfigured';
      statusText.textContent = 'Not configured';
    }
  }

  static openNodeConfig(nodeId) {
    const builder = WorkflowBuilder.getInstance();
    const node = builder.workflow.nodes.find(n => n.id === nodeId);
    
    if (node) {
      NodeConfigurator.openConfigPanel(node.type, node);
    }
  }

  static removeNode(nodeId) {
    if (confirm('Are you sure you want to remove this node?')) {
      const builder = WorkflowBuilder.getInstance();
      
      // Remove from workflow data
      builder.workflow.nodes = builder.workflow.nodes.filter(n => n.id !== nodeId);
      
      // Remove connections
      delete builder.workflow.connections[nodeId];
      for (const sourceId in builder.workflow.connections) {
        builder.workflow.connections[sourceId].main = builder.workflow.connections[sourceId].main.filter(
          connection => connection[0].node !== nodeId
        );
      }
      
      // Remove from UI
      const nodeElement = document.getElementById(`node-${nodeId}`);
      nodeElement.remove();
      
      // Clear properties panel
      document.getElementById('propertiesContent').innerHTML = `
        <div class="no-selection">
          <p>Select a node to configure its properties</p>
        </div>
      `;
      
      // Show placeholder if no nodes left
      if (builder.workflow.nodes.length === 0) {
        const canvas = document.getElementById('workflowCanvas');
        canvas.innerHTML = `
          <div class="canvas-placeholder">
            <div class="placeholder-icon">🎯</div>
            <p>Start building your workflow</p>
            <small>Drag nodes from the palette to begin</small>
          </div>
        `;
      }
    }
  }

  static generateNodeId(nodeType) {
    const typeShort = nodeType.replace('n8n-nodes-base.', '');
    const timestamp = Date.now();
    return `${typeShort}-${timestamp}`;
  }

  static getInstance() {
    if (!window.workflowBuilderInstance) {
      window.workflowBuilderInstance = new WorkflowBuilder();
    }
    return window.workflowBuilderInstance;
  }

  static updateNodeConfiguration(nodeType, parameters) {
    // This is called by NodeConfigurator when saving
    const builder = WorkflowBuilder.getInstance();
    // Find the selected node and update its parameters
    // Implementation depends on how we track selected node
  }

  static exportWorkflow() {
    const builder = WorkflowBuilder.getInstance();
    const workflowJSON = JSON.stringify(builder.workflow, null, 2);
    
    // Create download
    const blob = new Blob([workflowJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${builder.workflow.name.replace(/\s+/g, '-').toLowerCase()}-workflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static copyToClipboard() {
    const builder = WorkflowBuilder.getInstance();
    const workflowJSON = JSON.stringify(builder.workflow, null, 2);
    
    navigator.clipboard.writeText(workflowJSON).then(() => {
      NodeConfigurator.showSuccessMessage('Workflow copied to clipboard!');
    });
  }

  static clearWorkflow() {
    if (confirm('Are you sure you want to clear the entire workflow?')) {
      const builder = WorkflowBuilder.getInstance();
      builder.workflow = {
        name: 'New Workflow',
        nodes: [],
        connections: {},
        active: false,
        settings: {},
        versionId: '1'
      };
      
      // Clear canvas
      const canvas = document.getElementById('workflowCanvas');
      canvas.innerHTML = `
        <div class="canvas-placeholder">
          <div class="placeholder-icon">🎯</div>
          <p>Start building your workflow</p>
          <small>Drag nodes from the palette to begin</small>
        </div>
      `;
      
      // Clear properties
      document.getElementById('propertiesContent').innerHTML = `
        <div class="no-selection">
          <p>Select a node to configure its properties</p>
        </div>
      `;
      
      // Reset workflow name
      document.getElementById('workflowName').value = 'New Workflow';
    }
  }

  static autoConnect() {
    const builder = WorkflowBuilder.getInstance();
    const nodes = builder.workflow.nodes;
    
    if (nodes.length < 2) {
      alert('Add at least 2 nodes to auto-connect');
      return;
    }
    
    // Clear existing connections
    builder.workflow.connections = {};
    
    // Create sequential connections
    for (let i = 0; i < nodes.length - 1; i++) {
      const sourceNode = nodes[i];
      const targetNode = nodes[i + 1];
      
      if (!builder.workflow.connections[sourceNode.id]) {
        builder.workflow.connections[sourceNode.id] = { main: [] };
      }
      
      builder.workflow.connections[sourceNode.id].main.push([
        { node: targetNode.id, type: 'main', index: 0 }
      ]);
    }
    
    NodeConfigurator.showSuccessMessage('Nodes auto-connected!');
  }

  static validateWorkflow() {
    const builder = WorkflowBuilder.getInstance();
    const workflow = builder.workflow;
    
    const issues = [];
    
    // Check if workflow has nodes
    if (workflow.nodes.length === 0) {
      issues.push('Workflow has no nodes');
    }
    
    // Check if nodes are configured
    workflow.nodes.forEach(node => {
      const definition = NodeConfigurator.getNodeDefinitions()[node.type];
      if (definition) {
        for (const [key, param] of Object.entries(definition.parameters)) {
          if (param.required && !node.parameters[key]) {
            issues.push(`Node "${node.name}" missing required parameter: ${param.label}`);
          }
        }
      }
    });
    
    // Check if nodes are connected
    if (workflow.nodes.length > 1) {
      const hasConnections = Object.keys(workflow.connections).length > 0;
      if (!hasConnections) {
        issues.push('Nodes are not connected');
      }
    }
    
    if (issues.length === 0) {
      NodeConfigurator.showSuccessMessage('Workflow is valid! ✅');
    } else {
      alert('Workflow Issues:\n\n' + issues.join('\n'));
    }
  }

  // Dragging functionality
  static startDragging(event, nodeId) {
    if (event.target.classList.contains('node-delete')) return;
    
    const nodeElement = document.getElementById(`node-${nodeId}`);
    const rect = nodeElement.getBoundingClientRect();
    const canvas = document.getElementById('workflowCanvas').getBoundingClientRect();
    
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    
    function handleMouseMove(e) {
      const x = e.clientX - canvas.left - offsetX;
      const y = e.clientY - canvas.top - offsetY;
      
      nodeElement.style.left = `${x}px`;
      nodeElement.style.top = `${y}px`;
    }
    
    function handleMouseUp() {
      // Update workflow data
      const builder = WorkflowBuilder.getInstance();
      const node = builder.workflow.nodes.find(n => n.id === nodeId);
      if (node) {
        node.position = [
          Math.round(parseInt(nodeElement.style.left)),
          Math.round(parseInt(nodeElement.style.top))
        ];
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  static testNode(nodeId) {
    const builder = WorkflowBuilder.getInstance();
    const node = builder.workflow.nodes.find(n => n.id === nodeId);
    
    if (node) {
      // Simple test - check if required parameters are set
      const definition = NodeConfigurator.getNodeDefinitions()[node.type];
      let canTest = true;
      
      for (const [key, param] of Object.entries(definition.parameters)) {
        if (param.required && !node.parameters[key]) {
          canTest = false;
          break;
        }
      }
      
      if (canTest) {
        NodeConfigurator.showSuccessMessage(`Node "${node.name}" is ready to test!`);
      } else {
        alert('Please configure all required parameters before testing.');
      }
    }
  }

  static zoomIn() {
    const canvas = document.getElementById('workflowCanvas');
    const currentScale = parseFloat(canvas.style.transform?.replace('scale(', '')?.replace(')', '') || 1);
    const newScale = Math.min(currentScale + 0.1, 2);
    canvas.style.transform = `scale(${newScale})`;
  }

  static zoomOut() {
    const canvas = document.getElementById('workflowCanvas');
    const currentScale = parseFloat(canvas.style.transform?.replace('scale(', '')?.replace(')', '') || 1);
    const newScale = Math.max(currentScale - 0.1, 0.5);
    canvas.style.transform = `scale(${newScale})`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkflowBuilder;
}
