// n8n Node Configurator
// Provides a user-friendly interface for configuring node parameters

class NodeConfigurator {
  static getNodeDefinitions() {
    return {
      // Communication Nodes
      'n8n-nodes-base.emailSend': {
        name: 'Send Email',
        icon: '📧',
        category: 'Communication',
        description: 'Send emails via SMTP',
        parameters: {
          fromEmail: { type: 'email', label: 'From Email', required: true, placeholder: 'noreply@company.com' },
          toEmail: { type: 'email', label: 'To Email', required: true, placeholder: 'user@example.com' },
          subject: { type: 'text', label: 'Subject', required: true, placeholder: 'Your subject here' },
          text: { type: 'textarea', label: 'Message', required: true, placeholder: 'Email content...' },
          smtpHost: { type: 'text', label: 'SMTP Host', required: true, placeholder: 'smtp.gmail.com' },
          smtpPort: { type: 'number', label: 'SMTP Port', required: true, default: 587 },
          smtpUser: { type: 'text', label: 'SMTP Username', required: true },
          smtpPassword: { type: 'password', label: 'SMTP Password', required: true }
        }
      },
      
      'n8n-nodes-base.slack': {
        name: 'Slack',
        icon: '💬',
        category: 'Communication',
        description: 'Send messages to Slack channels',
        parameters: {
          webhookUrl: { type: 'url', label: 'Webhook URL', required: true, placeholder: 'https://hooks.slack.com/...' },
          channel: { type: 'text', label: 'Channel', required: false, placeholder: '#general' },
          text: { type: 'textarea', label: 'Message', required: true, placeholder: 'Your Slack message...' },
          username: { type: 'text', label: 'Bot Username', required: false, default: 'n8n-bot' }
        }
      },

      // Data & Storage Nodes
      'n8n-nodes-base.googleSheets': {
        name: 'Google Sheets',
        icon: '📊',
        category: 'Data',
        description: 'Read/write Google Sheets',
        parameters: {
          spreadsheetId: { type: 'text', label: 'Spreadsheet ID', required: true, placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' },
          sheetName: { type: 'text', label: 'Sheet Name', required: true, placeholder: 'Sheet1' },
          range: { type: 'text', label: 'Range', required: false, placeholder: 'A1:Z1000' },
          apiKey: { type: 'text', label: 'Google API Key', required: true, placeholder: 'AIza...' }
        }
      },

      'n8n-nodes-base.airtable': {
        name: 'Airtable',
        icon: '🗂️',
        category: 'Data',
        description: 'Connect to Airtable bases',
        parameters: {
          apiKey: { type: 'password', label: 'Airtable API Key', required: true, placeholder: 'key...' },
          baseId: { type: 'text', label: 'Base ID', required: true, placeholder: 'app...' },
          tableId: { type: 'text', label: 'Table ID', required: true, placeholder: 'tbl...' }
        }
      },

      // API & Webhook Nodes
      'n8n-nodes-base.webhook': {
        name: 'Webhook',
        icon: '🪝',
        category: 'Triggers',
        description: 'Receive HTTP requests',
        parameters: {
          httpMethod: { type: 'select', label: 'HTTP Method', required: true, options: ['POST', 'GET', 'PUT', 'DELETE'], default: 'POST' },
          path: { type: 'text', label: 'Path', required: true, placeholder: 'webhook' },
          responseMode: { type: 'select', label: 'Response Mode', required: true, options: ['onReceived', 'lastNode'], default: 'onReceived' }
        }
      },

      'n8n-nodes-base.httpRequest': {
        name: 'HTTP Request',
        icon: '🌐',
        category: 'Integration',
        description: 'Make HTTP requests to APIs',
        parameters: {
          url: { type: 'url', label: 'URL', required: true, placeholder: 'https://api.example.com/endpoint' },
          method: { type: 'select', label: 'Method', required: true, options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
          headers: { type: 'json', label: 'Headers', required: false, placeholder: '{"Authorization": "Bearer token"}' },
          body: { type: 'json', label: 'Body', required: false, placeholder: '{"key": "value"}' }
        }
      },

      // CRM Nodes
      'n8n-nodes-base.hubspot': {
        name: 'HubSpot',
        icon: '🎯',
        category: 'CRM',
        description: 'Connect to HubSpot CRM',
        parameters: {
          apiKey: { type: 'password', label: 'HubSpot API Key', required: true, placeholder: 'pat-na1-...' },
          operation: { type: 'select', label: 'Operation', required: true, options: ['create', 'update', 'get', 'delete'], default: 'create' },
          objectType: { type: 'select', label: 'Object Type', required: true, options: ['contacts', 'companies', 'deals'], default: 'contacts' }
        }
      },

      // Database Nodes
      'n8n-nodes-base.mysql': {
        name: 'MySQL',
        icon: '🗄️',
        category: 'Database',
        description: 'Connect to MySQL database',
        parameters: {
          host: { type: 'text', label: 'Host', required: true, placeholder: 'localhost' },
          port: { type: 'number', label: 'Port', required: true, default: 3306 },
          database: { type: 'text', label: 'Database', required: true, placeholder: 'mydatabase' },
          user: { type: 'text', label: 'Username', required: true, placeholder: 'root' },
          password: { type: 'password', label: 'Password', required: true }
        }
      },

      // Utility Nodes
      'n8n-nodes-base.set': {
        name: 'Set',
        icon: '⚙️',
        category: 'Utility',
        description: 'Transform and set data',
        parameters: {
          values: { type: 'json', label: 'Values to Set', required: true, placeholder: '{"name": "John", "email": "john@example.com"}' }
        }
      },

      'n8n-nodes-base.if': {
        name: 'IF',
        icon: '🔀',
        category: 'Logic',
        description: 'Conditional routing',
        parameters: {
          conditions: { type: 'json', label: 'Conditions', required: true, placeholder: '{"field": "status", "operator": "equal", "value": "active"}' }
        }
      }
    };
  }

  static createNodeConfigUI(nodeType, nodeData = {}) {
    const definition = this.getNodeDefinitions()[nodeType];
    if (!definition) return '';

    const existingValues = nodeData.parameters || {};

    let html = `
      <div class="node-config-panel" data-node-type="${nodeType}">
        <div class="node-config-header">
          <div class="node-config-title">
            <span class="node-icon">${definition.icon}</span>
            <h3>${definition.name}</h3>
          </div>
          <div class="node-config-close" onclick="NodeConfigurator.closeConfigPanel()">✕</div>
        </div>
        
        <div class="node-config-description">
          <p>${definition.description}</p>
          <span class="node-category">${definition.category}</span>
        </div>

        <div class="node-config-form">
    `;

    for (const [key, param] of Object.entries(definition.parameters)) {
      const value = existingValues[key] || param.default || '';
      
      html += `
        <div class="form-group">
          <label for="${key}">${param.label}${param.required ? ' *' : ''}</label>
      `;

      switch (param.type) {
        case 'text':
        case 'email':
        case 'url':
          html += `
            <input type="${param.type}" id="${key}" name="${key}" 
                   value="${value}" placeholder="${param.placeholder || ''}" 
                   ${param.required ? 'required' : ''}>
          `;
          break;
          
        case 'password':
          html += `
            <input type="password" id="${key}" name="${key}" 
                   value="${value}" placeholder="${param.placeholder || ''}" 
                   ${param.required ? 'required' : ''}>
          `;
          break;
          
        case 'number':
          html += `
            <input type="number" id="${key}" name="${key}" 
                   value="${value}" ${param.required ? 'required' : ''}>
          `;
          break;
          
        case 'textarea':
          html += `
            <textarea id="${key}" name="${key}" rows="4" 
                      placeholder="${param.placeholder || ''}" 
                      ${param.required ? 'required' : ''}>${value}</textarea>
          `;
          break;
          
        case 'select':
          html += `
            <select id="${key}" name="${key}" ${param.required ? 'required' : ''}>
              ${param.options.map(option => 
                `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`
              ).join('')}
            </select>
          `;
          break;
          
        case 'json':
          html += `
            <textarea id="${key}" name="${key}" rows="3" class="json-input"
                      placeholder="${param.placeholder || ''}" 
                      ${param.required ? 'required' : ''}>${value}</textarea>
            <small class="form-hint">Enter valid JSON format</small>
          `;
          break;
      }

      html += `
        </div>
      `;
    }

    html += `
        </div>
        
        <div class="node-config-actions">
          <button class="btn-secondary" onclick="NodeConfigurator.closeConfigPanel()">Cancel</button>
          <button class="btn-primary" onclick="NodeConfigurator.saveNodeConfig('${nodeType}')">Save Configuration</button>
        </div>
      </div>
    `;

    return html;
  }

  static openConfigPanel(nodeType, nodeData = {}) {
    const existingPanel = document.querySelector('.node-config-overlay');
    if (existingPanel) {
      existingPanel.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'node-config-overlay';
    overlay.innerHTML = this.createNodeConfigUI(nodeType, nodeData);
    
    document.body.appendChild(overlay);
    
    // Add event listeners for validation
    this.setupValidation();
  }

  static closeConfigPanel() {
    const overlay = document.querySelector('.node-config-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  static saveNodeConfig(nodeType) {
    const form = document.querySelector('.node-config-form');
    const formData = new FormData(form);
    const parameters = {};

    let isValid = true;
    const definition = this.getNodeDefinitions()[nodeType];

    for (const [key, param] of Object.entries(definition.parameters)) {
      const value = formData.get(key);
      
      if (param.required && !value) {
        isValid = false;
        this.showFieldError(key, 'This field is required');
        continue;
      }

      if (param.type === 'json' && value) {
        try {
          parameters[key] = JSON.parse(value);
        } catch (e) {
          isValid = false;
          this.showFieldError(key, 'Invalid JSON format');
          continue;
        }
      } else if (value) {
        parameters[key] = value;
      }
    }

    if (isValid) {
      // Save to workflow builder
      WorkflowBuilder.updateNodeConfiguration(nodeType, parameters);
      this.closeConfigPanel();
      this.showSuccessMessage('Node configuration saved successfully!');
    }
  }

  static setupValidation() {
    const inputs = document.querySelectorAll('.node-config-form input, .node-config-form textarea, .node-config-form select');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input.name));
    });
  }

  static validateField(field) {
    const definition = this.getNodeDefinitions()[document.querySelector('.node-config-panel').dataset.nodeType];
    const param = definition.parameters[field.name];
    
    if (param.required && !field.value) {
      this.showFieldError(field.name, 'This field is required');
      return false;
    }

    if (param.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        this.showFieldError(field.name, 'Invalid email format');
        return false;
      }
    }

    if (param.type === 'url' && field.value) {
      try {
        new URL(field.value);
      } catch (e) {
        this.showFieldError(field.name, 'Invalid URL format');
        return false;
      }
    }

    if (param.type === 'json' && field.value) {
      try {
        JSON.parse(field.value);
      } catch (e) {
        this.showFieldError(field.name, 'Invalid JSON format');
        return false;
      }
    }

    return true;
  }

  static showFieldError(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.classList.add('error');
      
      let errorDiv = field.parentNode.querySelector('.field-error');
      if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        field.parentNode.appendChild(errorDiv);
      }
      errorDiv.textContent = message;
    }
  }

  static clearFieldError(fieldName) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.classList.remove('error');
      const errorDiv = field.parentNode.querySelector('.field-error');
      if (errorDiv) {
        errorDiv.remove();
      }
    }
  }

  static showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NodeConfigurator;
}
