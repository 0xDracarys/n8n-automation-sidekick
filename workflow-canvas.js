// Workflow Canvas Visualizer for Builder
class WorkflowCanvas {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scale = 0.6;
    this.nodeWidth = 180;
    this.nodeHeight = 80;
    this.connectionWidth = 2;
    this.colors = {
      background: '#f8f9fa',
      node: '#ffffff',
      nodeBorder: '#e0e0e0',
      connection: '#4a90e2',
      connectionArrow: '#4a90e2',
      text: '#333333',
      trigger: '#ff6b6b',
      action: '#51cf66',
      transform: '#339af0',
      conditional: '#ff922b'
    };
  }

  render(workflow) {
    if (!this.container || !workflow?.nodes) {
      this.showError('Invalid workflow data');
      return;
    }

    this.container.innerHTML = '';
    const svg = this.createSVG();
    this.container.appendChild(svg);

    const bounds = this.calculateBounds(workflow.nodes);
    const viewBox = `${bounds.minX - 100} ${bounds.minY - 100} ${bounds.width + 200} ${bounds.height + 200}`;
    svg.setAttribute('viewBox', viewBox);

    // Render connections first (behind nodes)
    workflow.connections?.forEach(conn => this.renderConnection(svg, conn, workflow.nodes));
    
    // Render nodes
    workflow.nodes.forEach(node => this.renderNode(svg, node));
  }

  createSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.width = '100%';
    svg.style.height = '400px';
    svg.style.border = '1px solid #e0e0e0';
    svg.style.borderRadius = '8px';
    svg.style.background = this.colors.background;
    return svg;
  }

  renderNode(svg, node) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${node.position[0]}, ${node.position[1]})`);

    // Node background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', this.nodeWidth);
    rect.setAttribute('height', this.nodeHeight);
    rect.setAttribute('rx', '8');
    rect.setAttribute('fill', this.getNodeColor(node.type));
    rect.setAttribute('stroke', this.colors.nodeBorder);
    rect.setAttribute('stroke-width', '2');
    g.appendChild(rect);

    // Node icon/symbol
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    icon.setAttribute('x', '15');
    icon.setAttribute('y', '25');
    icon.setAttribute('font-size', '20');
    icon.setAttribute('fill', this.colors.text);
    icon.textContent = this.getNodeIcon(node.type);
    g.appendChild(icon);

    // Node name
    const name = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    name.setAttribute('x', '15');
    name.setAttribute('y', '45');
    name.setAttribute('font-size', '12');
    name.setAttribute('font-weight', 'bold');
    name.setAttribute('fill', this.colors.text);
    name.textContent = node.name || 'Unnamed';
    g.appendChild(name);

    // Node type
    const type = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    type.setAttribute('x', '15');
    type.setAttribute('y', '60');
    type.setAttribute('font-size', '10');
    type.setAttribute('fill', '#666');
    type.textContent = this.getShortNodeType(node.type);
    g.appendChild(type);

    // Connection points
    this.addConnectionPoints(g, node);

    svg.appendChild(g);
  }

  renderConnection(svg, connection, nodes) {
    const [sourceNode, sourcePort, targetNode, targetPort] = connection;
    const source = nodes.find(n => n.name === sourceNode);
    const target = nodes.find(n => n.name === targetNode);

    if (!source || !target) return;

    const sourcePos = this.getPortPosition(source, sourcePort, false);
    const targetPos = this.getPortPosition(target, targetPort, true);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = this.calculatePath(sourcePos, targetPos);
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', this.colors.connection);
    path.setAttribute('stroke-width', this.connectionWidth);
    path.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(path);
  }

  addConnectionPoints(g, node) {
    // Input port (left side)
    const inputPort = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    inputPort.setAttribute('cx', '0');
    inputPort.setAttribute('cy', this.nodeHeight / 2);
    inputPort.setAttribute('r', '4');
    inputPort.setAttribute('fill', this.colors.connection);
    g.appendChild(inputPort);

    // Output port (right side)
    const outputPort = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outputPort.setAttribute('cx', this.nodeWidth);
    outputPort.setAttribute('cy', this.nodeHeight / 2);
    outputPort.setAttribute('r', '4');
    outputPort.setAttribute('fill', this.colors.connection);
    g.appendChild(outputPort);
  }

  getPortPosition(node, portIndex, isTarget) {
    const x = node.position[0] + (isTarget ? 0 : this.nodeWidth);
    const y = node.position[1] + this.nodeHeight / 2;
    return { x, y };
  }

  calculatePath(start, end) {
    const midX = (start.x + end.x) / 2;
    return `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
  }

  getNodeColor(type) {
    if (/trigger|webhook/i.test(type)) return this.colors.trigger;
    if (/if|switch|condition/i.test(type)) return this.colors.conditional;
    if (/set|edit|modify|transform/i.test(type)) return this.colors.transform;
    return this.colors.action;
  }

  getNodeIcon(type) {
    if (/trigger|webhook/i.test(type)) return '⚡';
    if (/if|switch|condition/i.test(type)) return '🔀';
    if (/http|request/i.test(type)) return '🌐';
    if (/email/i.test(type)) return '✉️';
    if (/slack/i.test(type)) return '💬';
    if (/google|sheets|drive/i.test(type)) return '📊';
    if (/set|edit|modify/i.test(type)) return '✏️';
    if (/delay|wait/i.test(type)) return '⏰';
    return '⚙️';
  }

  getShortNodeType(type) {
    return type.replace('n8n-nodes-base.', '').replace(/([A-Z])/g, ' $1').trim();
  }

  calculateBounds(nodes) {
    if (nodes.length === 0) return { minX: 0, minY: 0, width: 400, height: 300 };

    const positions = nodes.map(n => ({
      x: n.position[0],
      y: n.position[1],
      x2: n.position[0] + this.nodeWidth,
      y2: n.position[1] + this.nodeHeight
    }));

    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x2));
    const maxY = Math.max(...positions.map(p => p.y2));

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  showError(message) {
    if (this.container) {
      this.container.innerHTML = `<div style="padding: 20px; color: #ff6b6b; text-align: center;">${message}</div>`;
    }
  }
}

// Export for use in Builder
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WorkflowCanvas };
} else if (typeof window !== 'undefined') {
  window.WorkflowCanvas = WorkflowCanvas;
}
