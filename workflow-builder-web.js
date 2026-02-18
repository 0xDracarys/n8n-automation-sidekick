// Web Workflow Builder
class WebWorkflowBuilder {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.isDragging = false;
        this.draggedNode = null;
        this.nodeIdCounter = 1;
        this.isConnecting = false;
        this.connectionStart = null;
        this.tempConnection = null;
        
        this.init();
    }

    init() {
        this.createBuilderUI();
        this.setupEventListeners();
        this.loadSavedWorkflows();
    }

    createBuilderUI() {
        this.container.innerHTML = `
            <div class="web-workflow-builder">
                <!-- Toolbar -->
                <div class="builder-toolbar">
                    <div class="toolbar-left">
                        <button class="toolbar-btn" onclick="webBuilder.newWorkflow()" title="New Workflow">
                            <i class="fas fa-file"></i>
                        </button>
                        <button class="toolbar-btn" onclick="webBuilder.saveWorkflow()" title="Save Workflow">
                            <i class="fas fa-save"></i>
                        </button>
                        <button class="toolbar-btn" onclick="webBuilder.loadWorkflow()" title="Load Workflow">
                            <i class="fas fa-folder-open"></i>
                        </button>
                        <button class="toolbar-btn" onclick="webBuilder.exportWorkflow()" title="Export JSON">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="toolbar-btn" onclick="webBuilder.importWorkflow()" title="Import JSON">
                            <i class="fas fa-upload"></i>
                        </button>
                    </div>
                    <div class="toolbar-center">
                        <input type="text" class="workflow-name" placeholder="Untitled Workflow" id="workflowName">
                    </div>
                    <div class="toolbar-right">
                        <button class="toolbar-btn" onclick="webBuilder.zoomIn()" title="Zoom In">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        <button class="toolbar-btn" onclick="webBuilder.zoomOut()" title="Zoom Out">
                            <i class="fas fa-search-minus"></i>
                        </button>
                        <button class="toolbar-btn" onclick="webBuilder.resetZoom()" title="Reset Zoom">
                            <i class="fas fa-compress"></i>
                        </button>
                        <button class="toolbar-btn" onclick="webBuilder.autoLayout()" title="Auto Layout">
                            <i class="fas fa-magic"></i>
                        </button>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="builder-content">
                    <!-- Node Palette -->
                    <div class="node-palette">
                        <div class="palette-header">
                            <h4>Nodes</h4>
                            <input type="text" class="palette-search" placeholder="Search nodes..." id="nodeSearch">
                        </div>
                        <div class="palette-categories">
                            <div class="category active" data-category="triggers">
                                <i class="fas fa-bolt"></i>
                                <span>Triggers</span>
                            </div>
                            <div class="category" data-category="actions">
                                <i class="fas fa-cogs"></i>
                                <span>Actions</span>
                            </div>
                            <div class="category" data-category="transforms">
                                <i class="fas fa-exchange-alt"></i>
                                <span>Transforms</span>
                            </div>
                        </div>
                        <div class="palette-nodes" id="paletteNodes">
                            <!-- Nodes will be populated here -->
                        </div>
                    </div>

                    <!-- Canvas -->
                    <div class="builder-canvas" id="builderCanvas">
                        <div class="canvas-grid" id="canvasGrid"></div>
                        <svg class="connections-layer" id="connectionsLayer">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                    <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
                                </marker>
                            </defs>
                        </svg>
                        <div class="nodes-layer" id="nodesLayer">
                            <!-- Nodes will be added here -->
                        </div>
                    </div>

                    <!-- Properties Panel -->
                    <div class="properties-panel" id="propertiesPanel">
                        <div class="panel-header">
                            <h4>Properties</h4>
                            <button class="panel-close" onclick="webBuilder.closeProperties()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="panel-content" id="propertiesContent">
                            <div class="no-selection">
                                <i class="fas fa-mouse-pointer"></i>
                                <p>Select a node to edit its properties</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="builder-status">
                    <div class="status-left">
                        <span class="node-count">Nodes: <span id="nodeCount">0</span></span>
                        <span class="connection-count">Connections: <span id="connectionCount">0</span></span>
                    </div>
                    <div class="status-center">
                        <span class="status-message" id="statusMessage">Ready</span>
                    </div>
                    <div class="status-right">
                        <span class="zoom-level">Zoom: <span id="zoomLevel">100%</span></span>
                    </div>
                </div>
            </div>
        `;

        this.populateNodePalette();
        this.updateStatus();
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
            nodeEl.addEventListener('dragstart', (e) => this.handleDragStart(e, node));
            nodeEl.addEventListener('dragend', (e) => this.handleDragEnd(e));
            
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

        // Search
        document.getElementById('nodeSearch').addEventListener('input', (e) => {
            this.searchNodes(e.target.value);
        });
    }

    filterNodes(category) {
        const nodes = document.querySelectorAll('.palette-node');
        nodes.forEach(node => {
            if (category === 'all' || node.dataset.category === category) {
                node.style.display = 'flex';
            } else {
                node.style.display = 'none';
            }
        });
    }

    searchNodes(query) {
        const nodes = window.nodeRegistry.searchNodes(query);
        const paletteNodes = document.getElementById('paletteNodes');
        
        // Clear current nodes
        paletteNodes.innerHTML = '';
        
        // Add filtered nodes
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
            nodeEl.addEventListener('dragstart', (e) => this.handleDragStart(e, node));
            nodeEl.addEventListener('dragend', (e) => this.handleDragEnd(e));
            
            paletteNodes.appendChild(nodeEl);
        });
    }

    setupEventListeners() {
        const canvas = document.getElementById('builderCanvas');
        const nodesLayer = document.getElementById('nodesLayer');
        
        // Canvas drop
        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', (e) => this.handleCanvasDrop(e));
        
        // Canvas click for deselecting
        canvas.addEventListener('click', (e) => {
            if (e.target === canvas || e.target.id === 'canvasGrid') {
                this.deselectAll();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedNode) {
                this.deleteNode(this.selectedNode);
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveWorkflow();
            }
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            }
        });
    }

    handleDragStart(e, node) {
        this.draggedNode = node;
        e.dataTransfer.effectAllowed = 'copy';
    }

    handleDragEnd(e) {
        this.draggedNode = null;
    }

    handleCanvasDrop(e) {
        e.preventDefault();
        
        if (!this.draggedNode) return;
        
        const canvas = document.getElementById('builderCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
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
            data: {},
            parameters: { ...nodeConfig.defaultParameters }
        };
        
        this.nodes.push(node);
        this.renderNode(node);
        this.updateStatus();
        this.showStatus(`Added ${node.name} node`);
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
        const nodesLayer = document.getElementById('nodesLayer');
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
                    <button class="node-action-btn" onclick="webBuilder.duplicateNode('${node.id}')" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="node-action-btn" onclick="webBuilder.deleteNode('${node.id}')" title="Delete">
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
        
        nodesLayer.appendChild(nodeEl);
    }

    getNodeDescription(nodeType) {
        const nodeConfig = window.nodeRegistry.getNode(nodeType);
        return nodeConfig ? nodeConfig.description : 'Custom node functionality';
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
        
        const canvas = document.getElementById('builderCanvas');
        const rect = canvas.getBoundingClientRect();
        
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
        this.showEmptyProperties();
    }

    showNodeProperties(node) {
        const propertiesContent = document.getElementById('propertiesContent');
        
        propertiesContent.innerHTML = `
            <div class="node-properties">
                <div class="property-group">
                    <label>Node Name</label>
                    <input type="text" id="nodeName" value="${node.name}" onchange="webBuilder.updateNodeName('${node.id}', this.value)">
                </div>
                
                ${this.generateParameterFields(node)}
                
                <div class="property-actions">
                    <button class="btn-primary" onclick="webBuilder.applyNodeChanges('${node.id}')">
                        <i class="fas fa-check"></i>
                        Apply Changes
                    </button>
                    <button class="btn-secondary" onclick="webBuilder.deselectAll()">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                </div>
            </div>
        `;
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
                        <option value="PUT" ${node.parameters.method === 'PUT' ? 'selected' : ''}>PUT</option>
                        <option value="DELETE" ${node.parameters.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
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
                        <option value="PUT" ${node.parameters.method === 'PUT' ? 'selected' : ''}>PUT</option>
                        <option value="DELETE" ${node.parameters.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
                    </select>
                </div>
            `,
            email: `
                <div class="property-group">
                    <label>To</label>
                    <input type="email" id="emailTo" value="${node.parameters.to || ''}" placeholder="recipient@example.com">
                </div>
                <div class="property-group">
                    <label>Subject</label>
                    <input type="text" id="emailSubject" value="${node.parameters.subject || ''}" placeholder="Email subject">
                </div>
                <div class="property-group">
                    <label>Body</label>
                    <textarea id="emailBody" rows="4" placeholder="Email body">${node.parameters.body || ''}</textarea>
                </div>
            `,
            function: `
                <div class="property-group">
                    <label>JavaScript Code</label>
                    <textarea id="functionCode" rows="8" placeholder="// Your JavaScript code">${node.parameters.code || ''}</textarea>
                </div>
            `
        };
        
        return fields[node.type] || '<p>No configurable parameters for this node type.</p>';
    }

    showEmptyProperties() {
        const propertiesContent = document.getElementById('propertiesContent');
        propertiesContent.innerHTML = `
            <div class="no-selection">
                <i class="fas fa-mouse-pointer"></i>
                <p>Select a node to edit its properties</p>
            </div>
        `;
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
                node.parameters.body = document.getElementById('emailBody').value;
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
                x: node.position.x + 50,
                y: node.position.y + 50
            }
        };
        
        this.nodes.push(newNode);
        this.renderNode(newNode);
        this.updateStatus();
        this.showStatus(`Duplicated ${node.name} node`);
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
        
        // Update connections display
        this.renderConnections();
        this.updateStatus();
        this.showStatus(`Deleted ${node.name} node`);
        
        if (this.selectedNode?.id === nodeId) {
            this.deselectAll();
        }
    }

    startConnection(e, node) {
        e.stopPropagation();
        this.isConnecting = true;
        this.connectionStart = node;
        
        document.addEventListener('mousemove', this.handleConnectionDrag);
        document.addEventListener('mouseup', this.endConnection);
    }

    handleConnectionDrag = (e) => {
        if (!this.isConnecting) return;
        
        const canvas = document.getElementById('builderCanvas');
        const rect = canvas.getBoundingClientRect();
        
        // Draw temporary connection line
        this.drawTempConnection(e.clientX - rect.left, e.clientY - rect.top);
    }

    endConnection = (e) => {
        if (!this.isConnecting) return;
        
        this.isConnecting = false;
        this.connectionStart = null;
        
        // Remove temporary connection
        const tempLine = document.getElementById('tempConnection');
        if (tempLine) {
            tempLine.remove();
        }
        
        document.removeEventListener('mousemove', this.handleConnectionDrag);
        document.removeEventListener('mouseup', this.endConnection);
    }

    drawTempConnection(x, y) {
        const svg = document.getElementById('connectionsLayer');
        let tempLine = document.getElementById('tempConnection');
        
        if (!tempLine) {
            tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tempLine.id = 'tempConnection';
            tempLine.setAttribute('stroke', '#6b7280');
            tempLine.setAttribute('stroke-width', '2');
            tempLine.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(tempLine);
        }
        
        const startNode = document.getElementById(this.connectionStart.id);
        const outputPort = startNode.querySelector('.port.output');
        const startRect = outputPort.getBoundingClientRect();
        const canvasRect = svg.getBoundingClientRect();
        
        const startX = startRect.left + startRect.width / 2 - canvasRect.left;
        const startY = startRect.top + startRect.height / 2 - canvasRect.top;
        
        tempLine.setAttribute('x1', startX);
        tempLine.setAttribute('y1', startY);
        tempLine.setAttribute('x2', x);
        tempLine.setAttribute('y2', y);
    }

    updateConnections() {
        this.renderConnections();
    }

    renderConnections() {
        const svg = document.getElementById('connectionsLayer');
        
        // Remove existing connections (except temp)
        svg.querySelectorAll('line:not(#tempConnection)').forEach(line => line.remove());
        
        // Draw connections
        this.connections.forEach(conn => {
            const sourceNode = document.getElementById(conn.source);
            const targetNode = document.getElementById(conn.target);
            
            if (!sourceNode || !targetNode) return;
            
            const outputPort = sourceNode.querySelector('.port.output');
            const inputPort = targetNode.querySelector('.port.input');
            
            const sourceRect = outputPort.getBoundingClientRect();
            const targetRect = inputPort.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', sourceRect.left + sourceRect.width / 2 - svgRect.left);
            line.setAttribute('y1', sourceRect.top + sourceRect.height / 2 - svgRect.top);
            line.setAttribute('x2', targetRect.left + targetRect.width / 2 - svgRect.left);
            line.setAttribute('y2', targetRect.top + targetRect.height / 2 - svgRect.top);
            line.setAttribute('stroke', '#6b7280');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('marker-end', 'url(#arrowhead)');
            
            svg.appendChild(line);
        });
    }

    // Workflow operations
    newWorkflow() {
        if (confirm('Create a new workflow? Any unsaved changes will be lost.')) {
            this.nodes = [];
            this.connections = [];
            this.selectedNode = null;
            this.nodeIdCounter = 1;
            
            document.getElementById('nodesLayer').innerHTML = '';
            document.getElementById('workflowName').value = 'Untitled Workflow';
            this.renderConnections();
            this.updateStatus();
            this.showEmptyProperties();
            this.showStatus('New workflow created');
        }
    }

    async saveWorkflow() {
        const workflowName = document.getElementById('workflowName').value || 'Untitled Workflow';
        
        const workflowData = {
            name: workflowName,
            nodes: this.nodes,
            connections: this.connections,
            metadata: {
                createdAt: new Date().toISOString(),
                version: '1.0'
            }
        };
        
        try {
            const workflowId = await window.workflowManager.saveWorkflow(workflowData, workflowName);
            this.showStatus(`Workflow saved successfully!`, 'success');
            
            // Track save event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'workflow_saved', {
                    'workflow_id': workflowId,
                    'node_count': this.nodes.length
                });
            }
        } catch (error) {
            this.showStatus(`Error saving workflow: ${error.message}`, 'error');
        }
    }

    async loadWorkflow() {
        try {
            const workflows = await window.workflowManager.getUserWorkflows();
            
            if (workflows.length === 0) {
                this.showStatus('No saved workflows found', 'info');
                return;
            }
            
            // Simple workflow selection (in a real app, you'd show a modal)
            const workflow = workflows[0];
            this.loadWorkflowData(workflow);
            this.showStatus(`Loaded workflow: ${workflow.name}`, 'success');
        } catch (error) {
            this.showStatus(`Error loading workflow: ${error.message}`, 'error');
        }
    }

    loadWorkflowData(workflow) {
        this.nodes = workflow.nodes || [];
        this.connections = workflow.connections || [];
        this.nodeIdCounter = Math.max(...this.nodes.map(n => parseInt(n.id.split('_')[1]) || 0), 0) + 1;
        
        document.getElementById('workflowName').value = workflow.name || 'Untitled Workflow';
        
        // Clear and re-render
        document.getElementById('nodesLayer').innerHTML = '';
        this.nodes.forEach(node => this.renderNode(node));
        this.renderConnections();
        this.updateStatus();
    }

    exportWorkflow() {
        const workflowData = {
            name: document.getElementById('workflowName').value || 'Untitled Workflow',
            nodes: this.nodes,
            connections: this.connections,
            metadata: {
                exportedAt: new Date().toISOString(),
                version: '1.0'
            }
        };
        
        // Convert to n8n format and copy to clipboard
        const n8nWorkflow = this.convertToN8nFormat(workflowData);
        
        // Copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(n8nWorkflow, null, 2)).then(() => {
            this.showStatus('n8n workflow copied to clipboard! Ready to import.', 'success');
        }).catch(() => {
            // Fallback to download if clipboard fails
            const dataStr = JSON.stringify(n8nWorkflow, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${workflowData.name.replace(/\s+/g, '_')}_n8n.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showStatus('n8n workflow downloaded', 'success');
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
                parameters: { ...node.parameters }
            };
            
            // Add specific configurations for different node types
            switch (node.type) {
                case 'webhook':
                    n8nNode.type = 'n8n-nodes-base.webhook';
                    n8nNode.parameters.httpMethod = node.parameters.method || 'POST';
                    n8nNode.parameters.path = node.parameters.path || '/webhook';
                    n8nNode.parameters.responseMode = 'onReceived';
                    break;
                case 'http':
                    n8nNode.type = 'n8n-nodes-base.httpRequest';
                    n8nNode.parameters.method = node.parameters.method || 'GET';
                    n8nNode.parameters.url = node.parameters.url || '';
                    n8nNode.parameters.options = {};
                    break;
                case 'email':
                    n8nNode.type = 'n8n-nodes-base.emailSend';
                    n8nNode.parameters.toEmail = node.parameters.to || '';
                    n8nNode.parameters.subject = node.parameters.subject || '';
                    n8nNode.parameters.text = node.parameters.body || '';
                    n8nNode.parameters.emailFormat = 'text';
                    break;
                case 'slack':
                    n8nNode.type = 'n8n-nodes-base.slack';
                    n8nNode.parameters.channel = node.parameters.channel || '';
                    n8nNode.parameters.text = node.parameters.message || '';
                    n8nNode.parameters.otherOptions = {};
                    break;
                case 'discord':
                    n8nNode.type = 'n8n-nodes-base.discord';
                    n8nNode.parameters.channelId = node.parameters.channelId || '';
                    n8nNode.parameters.text = node.parameters.message || '';
                    break;
                case 'google':
                    n8nNode.type = 'n8n-nodes-base.googleSheets';
                    n8nNode.parameters.operation = 'append';
                    n8nNode.parameters.sheetId = node.parameters.sheetId || '';
                    n8nNode.parameters.columns = node.parameters.columns || [];
                    break;
                case 'database':
                    n8nNode.type = 'n8n-nodes-base.mysql';
                    n8nNode.parameters.operation = 'executeQuery';
                    n8nNode.parameters.query = node.parameters.query || '';
                    break;
                case 'function':
                    n8nNode.type = 'n8n-nodes-base.function';
                    n8nNode.parameters.functionCode = node.parameters.code || '';
                    break;
                case 'filter':
                    n8nNode.type = 'n8n-nodes-base.filter';
                    n8nNode.parameters.conditions = node.parameters.conditions || [];
                    break;
                case 'merge':
                    n8nNode.type = 'n8n-nodes-base.merge';
                    n8nNode.parameters.mode = 'combine';
                    n8nNode.parameters.combineBy = 'combineAll';
                    break;
                case 'switch':
                    n8nNode.type = 'n8n-nodes-base.switch';
                    n8nNode.parameters.switchValues = node.parameters.routes || [];
                    break;
                case 'set':
                    n8nNode.type = 'n8n-nodes-base.set';
                    n8nNode.parameters.values = node.parameters.values || [];
                    break;
                case 'cron':
                    n8nNode.type = 'n8n-nodes-base.cron';
                    n8nNode.parameters.cronExpression = node.parameters.cron || '0 0 * * *';
                    break;
                case 'manual':
                    n8nNode.type = 'n8n-nodes-base.manualTrigger';
                    break;
            }
            
            return n8nNode;
        });

        // Build connections object for n8n
        const connections = {};
        workflowData.connections.forEach(conn => {
            if (!connections[conn.source]) {
                connections[conn.source] = { main: [[]] };
            }
            connections[conn.source].main[0].push({
                node: conn.target,
                type: 'main',
                index: 0
            });
        });

        return {
            name: workflowData.name,
            nodes: n8nNodes,
            connections: connections,
            active: false,
            settings: {
                executionOrder: 'v1',
                saveManualExecutions: true,
                callerPolicyDefaultOption: 'workflowsFromSameOwner'
            },
            versionId: '1',
            meta: {
                templateCredsSetupCompleted: true
            },
            tags: []
        };
    }

    importWorkflow() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workflowData = JSON.parse(e.target.result);
                    this.loadWorkflowData(workflowData);
                    this.showStatus('Workflow imported successfully', 'success');
                } catch (error) {
                    this.showStatus('Error importing workflow: Invalid JSON', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Zoom and layout
    zoomIn() {
        const canvas = document.getElementById('builderCanvas');
        const currentScale = parseFloat(canvas.style.transform.replace('scale(', '').replace(')', '') || 1);
        const newScale = Math.min(currentScale + 0.1, 2);
        canvas.style.transform = `scale(${newScale})`;
        document.getElementById('zoomLevel').textContent = `${Math.round(newScale * 100)}%`;
    }

    zoomOut() {
        const canvas = document.getElementById('builderCanvas');
        const currentScale = parseFloat(canvas.style.transform.replace('scale(', '').replace(')', '') || 1);
        const newScale = Math.max(currentScale - 0.1, 0.5);
        canvas.style.transform = `scale(${newScale})`;
        document.getElementById('zoomLevel').textContent = `${Math.round(newScale * 100)}%`;
    }

    resetZoom() {
        const canvas = document.getElementById('builderCanvas');
        canvas.style.transform = 'scale(1)';
        document.getElementById('zoomLevel').textContent = '100%';
    }

    autoLayout() {
        if (this.nodes.length === 0) return;
        
        const horizontalSpacing = 200;
        const verticalSpacing = 100;
        const startX = 50;
        const startY = 50;
        
        // Simple grid layout
        this.nodes.forEach((node, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            
            node.position = {
                x: startX + col * horizontalSpacing,
                y: startY + row * verticalSpacing
            };
            
            const nodeEl = document.getElementById(node.id);
            nodeEl.style.left = `${node.position.x}px`;
            nodeEl.style.top = `${node.position.y}px`;
        });
        
        this.updateConnections();
        this.showStatus('Auto layout applied');
    }

    // Utility methods
    updateStatus() {
        document.getElementById('nodeCount').textContent = this.nodes.length;
        document.getElementById('connectionCount').textContent = this.connections.length;
    }

    showStatus(message, type = 'info') {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        
        setTimeout(() => {
            statusMessage.textContent = 'Ready';
            statusMessage.className = 'status-message';
        }, 3000);
    }

    closeProperties() {
        this.deselectAll();
    }

    async loadSavedWorkflows() {
        // Auto-load last workflow if available
        try {
            const workflows = await window.workflowManager.getUserWorkflows();
            if (workflows.length > 0) {
                // Optionally load the most recent workflow
                // this.loadWorkflowData(workflows[0]);
            }
        } catch (error) {
            console.log('No saved workflows to load');
        }
    }

    undo() {
        // Implement undo functionality
        if (this.history.length > 1) {
            this.history.pop(); // Remove current state
            const previousState = this.history[this.history.length - 1];
            this.workflow = JSON.parse(JSON.stringify(previousState));
            this.render();
            this.showStatus('Undo successful');
        } else {
            this.showStatus('Nothing to undo');
        }
    }
}

// Export for global access
window.WebWorkflowBuilder = WebWorkflowBuilder;
