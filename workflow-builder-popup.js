// Popup Workflow Builder
class PopupWorkflowBuilder {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.nodeIdCounter = 1;
        this.isDragging = false;
        this.draggedNode = null;
        this.isConnecting = false;
        this.connectionStart = null;
        this.currentCategory = 'triggers';
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.populateNodePalette();
        this.setupEventListeners();
        this.setupConnectionsSVG();
    }

    setupCanvas() {
        const canvasArea = document.getElementById('canvasArea');
        
        // Add drag and drop listeners
        canvasArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        canvasArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleCanvasDrop(e);
        });
        
        // Click to deselect
        canvasArea.addEventListener('click', (e) => {
            if (e.target === canvasArea || e.target.classList.contains('canvas-placeholder')) {
                this.deselectAll();
            }
        });
    }

    populateNodePalette() {
        const nodes = window.nodeRegistry.getAllNodes();
        const paletteNodes = document.getElementById('paletteNodes');
        paletteNodes.innerHTML = '';

        nodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'palette-node';
            nodeEl.dataset.nodeId = node.id;
            nodeEl.dataset.category = node.category;
            nodeEl.draggable = true;
            nodeEl.innerHTML = `
                <div class="node-icon" style="background: ${node.color}">
                    <i class="${node.icon}"></i>
                </div>
                <span class="node-name">${node.name}</span>
            `;
            
            // Drag events
            nodeEl.addEventListener('dragstart', (e) => {
                this.draggedNode = node;
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            nodeEl.addEventListener('dragend', () => {
                this.draggedNode = null;
            });
            
            paletteNodes.appendChild(nodeEl);
        });

        // Category filter
        document.querySelectorAll('.category').forEach(cat => {
            cat.addEventListener('click', () => {
                document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
                cat.classList.add('active');
                this.filterNodes(cat.dataset.category);
            });
        });

        // Initial filter
        this.filterNodes('triggers');
    }

    filterNodes(category) {
        const nodes = document.querySelectorAll('.palette-node');
        nodes.forEach(node => {
            if (category === 'all' || node.dataset.category === category) {
                node.classList.remove('hidden');
            } else {
                node.classList.add('hidden');
            }
        });
    }

    setupEventListeners() {
        // Category switching
        document.querySelectorAll('.category').forEach(cat => {
            cat.addEventListener('click', () => {
                document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
                cat.classList.add('active');
                this.filterNodes(cat.dataset.category);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedNode) {
                this.deleteNode(this.selectedNode);
            }
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                this.exportBuilderWorkflow();
            }
        });
    }

    setupConnectionsSVG() {
        const canvasArea = document.getElementById('canvasArea');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('connections-svg');
        svg.innerHTML = `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
                </marker>
            </defs>
        `;
        canvasArea.appendChild(svg);
    }

    handleCanvasDrop(e) {
        if (!this.draggedNode) return;
        
        const canvasArea = document.getElementById('canvasArea');
        const rect = canvasArea.getBoundingClientRect();
        const x = e.clientX - rect.left - 60; // Center the node
        const y = e.clientY - rect.top - 30;
        
        this.addNode(this.draggedNode, x, y);
    }

    addNode(nodeTemplate, x, y) {
        const nodeConfig = window.nodeRegistry.getNode(nodeTemplate.id);
        if (!nodeConfig) {
            console.error('Unknown node type:', nodeTemplate.id);
            return;
        }
        
        const node = {
            id: `node_${this.nodeIdCounter++}`,
            type: nodeTemplate.id,
            name: nodeConfig.name,
            icon: nodeConfig.icon,
            color: nodeConfig.color,
            position: { x, y },
            parameters: { ...nodeConfig.defaultParameters }
        };
        
        this.nodes.push(node);
        this.renderNode(node);
        this.hidePlaceholder();
    }

    getDefaultParameters(nodeType) {
        const defaults = {
            webhook: { path: '/webhook', method: 'POST' },
            http: { url: '', method: 'GET' },
            email: { to: '', subject: '', body: '' },
            slack: { channel: '', message: '' },
            function: { code: '// Your code here' },
            filter: { conditions: [] },
            set: { values: [] }
        };
        
        return defaults[nodeType] || {};
    }

    renderNode(node) {
        const canvasArea = document.getElementById('canvasArea');
        const nodeEl = document.createElement('div');
        nodeEl.className = 'workflow-node';
        nodeEl.id = node.id;
        nodeEl.style.left = `${node.position.x}px`;
        nodeEl.style.top = `${node.position.y}px`;
        nodeEl.innerHTML = `
            <div class="node-header" style="background: ${node.color}">
                <i class="${node.icon}"></i>
                <span class="node-title">${node.name}</span>
                <div class="node-actions">
                    <button class="node-action-btn" onclick="sidekick.builder.duplicateNode('${node.id}')" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="node-action-btn" onclick="sidekick.builder.deleteNode('${node.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="node-body">
                <div class="node-description">${this.getNodeDescription(node.type)}</div>
            </div>
            <div class="node-ports">
                <div class="port input" data-port="input" data-node="${node.id}"></div>
                <div class="port output" data-port="output" data-node="${node.id}"></div>
            </div>
        `;
        
        // Node events
        nodeEl.addEventListener('mousedown', (e) => this.startDragNode(e, node));
        nodeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node);
        });
        
        // Port events
        const outputPort = nodeEl.querySelector('.port.output');
        outputPort.addEventListener('mousedown', (e) => this.startConnection(e, node));
        
        const inputPort = nodeEl.querySelector('.port.input');
        inputPort.addEventListener('mouseup', (e) => this.endConnection(e, node));
        
        canvasArea.appendChild(nodeEl);
    }

    getNodeDescription(nodeType) {
        const nodeConfig = window.nodeRegistry.getNode(nodeType);
        return nodeConfig ? nodeConfig.description : 'Custom node';
    }

    startDragNode(e, node) {
        if (e.target.classList.contains('port') || e.target.classList.contains('node-action-btn')) {
            return;
        }
        
        this.isDragging = true;
        this.draggedNode = node;
        this.dragOffset = {
            x: e.clientX - node.position.x,
            y: e.clientY - node.position.y
        };
        
        document.addEventListener('mousemove', this.handleDragNode);
        document.addEventListener('mouseup', this.stopDragNode);
    }

    handleDragNode = (e) => {
        if (!this.isDragging || !this.draggedNode) return;
        
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        
        this.draggedNode.position = { x, y };
        
        const nodeEl = document.getElementById(this.draggedNode.id);
        nodeEl.style.left = `${x}px`;
        nodeEl.style.top = `${y}px`;
        
        this.updateConnections();
    }

    stopDragNode = () => {
        this.isDragging = false;
        this.draggedNode = null;
        document.removeEventListener('mousemove', this.handleDragNode);
        document.removeEventListener('mouseup', this.stopDragNode);
    }

    selectNode(node) {
        this.deselectAll();
        this.selectedNode = node;
        
        const nodeEl = document.getElementById(node.id);
        nodeEl.classList.add('selected');
        
        this.showNodeProperties(node);
    }

    deselectAll() {
        document.querySelectorAll('.workflow-node').forEach(node => {
            node.classList.remove('selected');
        });
        this.selectedNode = null;
        this.closeProperties();
    }

    showNodeProperties(node) {
        const propertiesContent = document.getElementById('propertiesContent');
        const propertiesPanel = document.getElementById('builderProperties');
        
        propertiesContent.innerHTML = `
            <div class="node-properties">
                <div class="property-group">
                    <label>Node Name</label>
                    <input type="text" id="nodeName" value="${node.name}" onchange="sidekick.builder.updateNodeName('${node.id}', this.value)">
                </div>
                
                ${this.generateParameterFields(node)}
                
                <div class="property-actions">
                    <button class="btn-primary" onclick="sidekick.builder.applyNodeChanges('${node.id}')">
                        <i class="fas fa-check"></i>
                        Apply
                    </button>
                    <button class="btn-secondary" onclick="sidekick.builder.deselectAll()">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        propertiesPanel.classList.add('open');
    }

    generateParameterFields(node) {
        const fields = {
            webhook: `
                <div class="property-group">
                    <label>Path</label>
                    <input type="text" id="webhookPath" value="${node.parameters.path || ''}" placeholder="/webhook">
                </div>
                <div class="property-group">
                    <label>Method</label>
                    <select id="webhookMethod">
                        <option value="POST" ${node.parameters.method === 'POST' ? 'selected' : ''}>POST</option>
                        <option value="GET" ${node.parameters.method === 'GET' ? 'selected' : ''}>GET</option>
                    </select>
                </div>
            `,
            http: `
                <div class="property-group">
                    <label>URL</label>
                    <input type="text" id="httpUrl" value="${node.parameters.url || ''}" placeholder="https://api.example.com">
                </div>
                <div class="property-group">
                    <label>Method</label>
                    <select id="httpMethod">
                        <option value="GET" ${node.parameters.method === 'GET' ? 'selected' : ''}>GET</option>
                        <option value="POST" ${node.parameters.method === 'POST' ? 'selected' : ''}>POST</option>
                    </select>
                </div>
            `,
            email: `
                <div class="property-group">
                    <label>To</label>
                    <input type="email" id="emailTo" value="${node.parameters.to || ''}" placeholder="email@example.com">
                </div>
                <div class="property-group">
                    <label>Subject</label>
                    <input type="text" id="emailSubject" value="${node.parameters.subject || ''}" placeholder="Subject">
                </div>
            `,
            function: `
                <div class="property-group">
                    <label>JavaScript Code</label>
                    <textarea id="functionCode" rows="6" placeholder="// Your code">${node.parameters.code || ''}</textarea>
                </div>
            `
        };
        
        return fields[node.type] || '<p style="color: #6b7280; font-size: 12px;">No configurable parameters</p>';
    }

    closeProperties() {
        const propertiesPanel = document.getElementById('builderProperties');
        propertiesPanel.classList.remove('open');
    }

    updateNodeName(nodeId, name) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            node.name = name;
            const nodeEl = document.getElementById(nodeId);
            nodeEl.querySelector('.node-title').textContent = name;
        }
    }

    applyNodeChanges(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        // Update parameters based on node type
        switch (node.type) {
            case 'webhook':
                node.parameters.path = document.getElementById('webhookPath').value;
                node.parameters.method = document.getElementById('webhookMethod').value;
                break;
            case 'http':
                node.parameters.url = document.getElementById('httpUrl').value;
                node.parameters.method = document.getElementById('httpMethod').value;
                break;
            case 'email':
                node.parameters.to = document.getElementById('emailTo').value;
                node.parameters.subject = document.getElementById('emailSubject').value;
                break;
            case 'function':
                node.parameters.code = document.getElementById('functionCode').value;
                break;
        }
        
        this.showStatus('Node properties updated');
    }

    duplicateNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        const newNode = {
            ...node,
            id: `node_${this.nodeIdCounter++}`,
            position: {
                x: node.position.x + 30,
                y: node.position.y + 30
            }
        };
        
        this.nodes.push(newNode);
        this.renderNode(newNode);
    }

    deleteNode(nodeId) {
        const index = this.nodes.findIndex(n => n.id === nodeId);
        if (index === -1) return;
        
        const node = this.nodes[index];
        
        // Remove connections
        this.connections = this.connections.filter(conn => 
            conn.source !== nodeId && conn.target !== nodeId
        );
        
        // Remove node
        this.nodes.splice(index, 1);
        
        // Remove from DOM
        const nodeEl = document.getElementById(nodeId);
        if (nodeEl) {
            nodeEl.remove();
        }
        
        // Update connections
        this.updateConnections();
        
        if (this.selectedNode?.id === nodeId) {
            this.deselectAll();
        }
        
        if (this.nodes.length === 0) {
            this.showPlaceholder();
        }
    }

    startConnection(e, node) {
        e.stopPropagation();
        this.isConnecting = true;
        this.connectionStart = node;
        
        document.addEventListener('mousemove', this.handleConnectionDrag);
        document.addEventListener('mouseup', this.cancelConnection);
    }

    endConnection(e, targetNode) {
        e.stopPropagation();
        if (!this.isConnecting || !this.connectionStart || this.connectionStart === targetNode) return;
        
        // Check if connection already exists
        const exists = this.connections.some(conn => 
            conn.source === this.connectionStart.id && conn.target === targetNode.id
        );
        
        if (!exists) {
            this.connections.push({
                source: this.connectionStart.id,
                target: targetNode.id
            });
            
            this.updateConnections();
        }
        
        this.cancelConnection();
    }

    cancelConnection = () => {
        this.isConnecting = false;
        this.connectionStart = null;
        document.removeEventListener('mousemove', this.handleConnectionDrag);
        document.removeEventListener('mouseup', this.cancelConnection);
    }

    handleConnectionDrag = (e) => {
        // Visual feedback for connection dragging could be added here
    }

    updateConnections() {
        const svg = document.querySelector('.connections-svg');
        
        // Remove existing connections
        svg.querySelectorAll('.connection-line').forEach(line => line.remove());
        
        // Draw connections
        this.connections.forEach(conn => {
            const sourceNode = document.getElementById(conn.source);
            const targetNode = document.getElementById(conn.target);
            
            if (!sourceNode || !targetNode) return;
            
            const outputPort = sourceNode.querySelector('.port.output');
            const inputPort = targetNode.querySelector('.port.input');
            
            const sourceRect = outputPort.getBoundingClientRect();
            const targetRect = inputPort.getBoundingClientRect();
            const canvasRect = svg.getBoundingClientRect();
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.classList.add('connection-line');
            line.setAttribute('x1', sourceRect.left + sourceRect.width / 2 - canvasRect.left);
            line.setAttribute('y1', sourceRect.top + sourceRect.height / 2 - canvasRect.top);
            line.setAttribute('x2', targetRect.left + targetRect.width / 2 - canvasRect.left);
            line.setAttribute('y2', targetRect.top + targetRect.height / 2 - canvasRect.top);
            
            svg.appendChild(line);
        });
    }

    hidePlaceholder() {
        const placeholder = document.getElementById('canvasPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }

    showPlaceholder() {
        const placeholder = document.getElementById('canvasPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
    }

    clearBuilder() {
        if (this.nodes.length === 0) return;
        
        if (confirm('Clear all nodes and connections?')) {
            this.nodes = [];
            this.connections = [];
            this.selectedNode = null;
            this.nodeIdCounter = 1;
            
            // Clear DOM
            const canvasArea = document.getElementById('canvasArea');
            canvasArea.querySelectorAll('.workflow-node').forEach(node => node.remove());
            
            const svg = document.querySelector('.connections-svg');
            svg.querySelectorAll('.connection-line').forEach(line => line.remove());
            
            this.closeProperties();
            this.showPlaceholder();
        }
    }

    exportBuilderWorkflow() {
        if (this.nodes.length === 0) {
            this.showStatus('No nodes to export', 'error');
            return;
        }
        
        const workflowData = {
            name: 'Visual Workflow',
            nodes: this.nodes.map(node => ({
                id: node.id,
                type: node.type,
                name: node.name,
                parameters: node.parameters,
                position: node.position
            })),
            connections: this.connections,
            metadata: {
                exportedAt: new Date().toISOString(),
                version: '1.0'
            }
        };
        
        // Convert to n8n format
        const n8nWorkflow = this.convertToN8nFormat(workflowData);
        
        // Copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(n8nWorkflow, null, 2)).then(() => {
            this.showStatus('Workflow copied to clipboard! Ready to import into n8n.', 'success');
        }).catch(() => {
            this.showStatus('Failed to copy to clipboard', 'error');
        });
    }

    convertToN8nFormat(workflowData) {
        const n8nNodes = workflowData.nodes.map(node => {
            const n8nNode = {
                id: node.id,
                name: node.name,
                type: `n8n-nodes-base.${node.type}`,
                typeVersion: 1,
                position: node.position,
                parameters: node.parameters
            };
            
            // Add specific configurations for different node types
            switch (node.type) {
                case 'webhook':
                    n8nNode.type = 'n8n-nodes-base.webhook';
                    n8nNode.parameters.httpMethod = node.parameters.method || 'POST';
                    n8nNode.parameters.path = node.parameters.path || '/webhook';
                    break;
                case 'http':
                    n8nNode.type = 'n8n-nodes-base.httpRequest';
                    n8nNode.parameters.method = node.parameters.method || 'GET';
                    n8nNode.parameters.url = node.parameters.url || '';
                    break;
                case 'email':
                    n8nNode.type = 'n8n-nodes-base.emailSend';
                    n8nNode.parameters.toEmail = node.parameters.to || '';
                    n8nNode.parameters.subject = node.parameters.subject || '';
                    n8nNode.parameters.text = node.parameters.body || '';
                    break;
                case 'function':
                    n8nNode.type = 'n8n-nodes-base.function';
                    n8nNode.parameters.functionCode = node.parameters.code || '';
                    break;
            }
            
            return n8nNode;
        });

        const connections = {};
        workflowData.connections.forEach(conn => {
            connections[conn.source] = {
                main: [[{ node: conn.target, type: 'main', index: 0 }]]
            };
        });

        return {
            name: workflowData.name,
            nodes: n8nNodes,
            connections: connections,
            active: false,
            settings: {},
            versionId: '1'
        };
    }

    showStatus(message, type = 'info') {
        // Use the main sidekick status display
        if (window.sidekick) {
            window.sidekick.showStatus(message, type);
        }
    }
}
