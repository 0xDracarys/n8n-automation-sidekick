// Node Configuration - Dynamic node definitions
class NodeRegistry {
    constructor() {
        this.nodes = new Map();
        this.categories = new Map();
        this.initializeNodes();
    }
    
    initializeNodes() {
        // Trigger Nodes
        this.registerNode('webhook', {
            name: 'Webhook',
            category: 'triggers',
            icon: 'fas fa-globe',
            color: '#10b981',
            description: 'Triggers workflow when HTTP request received',
            type: 'n8n-nodes-base.webhook',
            defaultParameters: {
                path: '/webhook',
                method: 'POST',
                responseMode: 'onReceived',
                options: {}
            },
            parameterFields: [
                {
                    name: 'path',
                    label: 'Path',
                    type: 'text',
                    placeholder: '/webhook',
                    required: true
                },
                {
                    name: 'method',
                    label: 'HTTP Method',
                    type: 'select',
                    options: ['POST', 'GET', 'PUT', 'DELETE'],
                    default: 'POST'
                }
            ]
        });
        
        this.registerNode('cron', {
            name: 'Cron',
            category: 'triggers',
            icon: 'fas fa-clock',
            color: '#10b981',
            description: 'Triggers workflow on schedule',
            type: 'n8n-nodes-base.cron',
            defaultParameters: {
                cronExpression: '0 0 * * *',
                options: {}
            },
            parameterFields: [
                {
                    name: 'cronExpression',
                    label: 'Cron Expression',
                    type: 'text',
                    placeholder: '0 0 * * *',
                    required: true,
                    description: 'Format: minute hour day month weekday'
                }
            ]
        });
        
        this.registerNode('manual', {
            name: 'Manual Trigger',
            category: 'triggers',
            icon: 'fas fa-hand-pointer',
            color: '#10b981',
            description: 'Triggers workflow manually',
            type: 'n8n-nodes-base.manualTrigger',
            defaultParameters: {},
            parameterFields: []
        });
        
        // Action Nodes
        this.registerNode('http', {
            name: 'HTTP Request',
            category: 'actions',
            icon: 'fas fa-cloud',
            color: '#3b82f6',
            description: 'Makes HTTP requests to external APIs',
            type: 'n8n-nodes-base.httpRequest',
            defaultParameters: {
                method: 'GET',
                url: '',
                options: {}
            },
            parameterFields: [
                {
                    name: 'url',
                    label: 'URL',
                    type: 'text',
                    placeholder: 'https://api.example.com',
                    required: true
                },
                {
                    name: 'method',
                    label: 'Method',
                    type: 'select',
                    options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                    default: 'GET'
                }
            ]
        });
        
        this.registerNode('email', {
            name: 'Send Email',
            category: 'actions',
            icon: 'fas fa-envelope',
            color: '#3b82f6',
            description: 'Sends email notifications',
            type: 'n8n-nodes-base.emailSend',
            defaultParameters: {
                toEmail: '',
                subject: '',
                text: '',
                emailFormat: 'text'
            },
            parameterFields: [
                {
                    name: 'toEmail',
                    label: 'To Email',
                    type: 'email',
                    placeholder: 'recipient@example.com',
                    required: true
                },
                {
                    name: 'subject',
                    label: 'Subject',
                    type: 'text',
                    placeholder: 'Email subject'
                },
                {
                    name: 'text',
                    label: 'Body',
                    type: 'textarea',
                    placeholder: 'Email body'
                }
            ]
        });
        
        this.registerNode('slack', {
            name: 'Slack',
            category: 'actions',
            icon: 'fab fa-slack',
            color: '#3b82f6',
            description: 'Posts messages to Slack channels',
            type: 'n8n-nodes-base.slack',
            defaultParameters: {
                channel: '',
                text: '',
                otherOptions: {}
            },
            parameterFields: [
                {
                    name: 'channel',
                    label: 'Channel',
                    type: 'text',
                    placeholder: '#general',
                    required: true
                },
                {
                    name: 'text',
                    label: 'Message',
                    type: 'textarea',
                    placeholder: 'Message to send'
                }
            ]
        });
        
        this.registerNode('discord', {
            name: 'Discord',
            category: 'actions',
            icon: 'fab fa-discord',
            color: '#3b82f6',
            description: 'Posts messages to Discord channels',
            type: 'n8n-nodes-base.discord',
            defaultParameters: {
                channelId: '',
                text: ''
            },
            parameterFields: [
                {
                    name: 'channelId',
                    label: 'Channel ID',
                    type: 'text',
                    placeholder: '123456789012345678',
                    required: true
                },
                {
                    name: 'text',
                    label: 'Message',
                    type: 'textarea',
                    placeholder: 'Message to send'
                }
            ]
        });
        
        this.registerNode('google', {
            name: 'Google Sheets',
            category: 'actions',
            icon: 'fab fa-google',
            color: '#3b82f6',
            description: 'Interacts with Google Sheets',
            type: 'n8n-nodes-base.googleSheets',
            defaultParameters: {
                operation: 'append',
                sheetId: '',
                columns: []
            },
            parameterFields: [
                {
                    name: 'operation',
                    label: 'Operation',
                    type: 'select',
                    options: ['append', 'update', 'read', 'delete'],
                    default: 'append'
                },
                {
                    name: 'sheetId',
                    label: 'Sheet ID',
                    type: 'text',
                    placeholder: 'your-sheet-id',
                    required: true
                }
            ]
        });
        
        this.registerNode('database', {
            name: 'Database',
            category: 'actions',
            icon: 'fas fa-database',
            color: '#3b82f6',
            description: 'Performs database operations',
            type: 'n8n-nodes-base.mysql',
            defaultParameters: {
                operation: 'executeQuery',
                query: ''
            },
            parameterFields: [
                {
                    name: 'operation',
                    label: 'Operation',
                    type: 'select',
                    options: ['executeQuery', 'insert', 'update', 'delete', 'select'],
                    default: 'executeQuery'
                },
                {
                    name: 'query',
                    label: 'SQL Query',
                    type: 'textarea',
                    placeholder: 'SELECT * FROM table',
                    required: true
                }
            ]
        });
        
        // Transform Nodes
        this.registerNode('function', {
            name: 'Function',
            category: 'transforms',
            icon: 'fas fa-code',
            color: '#f59e0b',
            description: 'Executes custom JavaScript code',
            type: 'n8n-nodes-base.function',
            defaultParameters: {
                functionCode: '// Your JavaScript code\nreturn items;'
            },
            parameterFields: [
                {
                    name: 'functionCode',
                    label: 'JavaScript Code',
                    type: 'textarea',
                    placeholder: '// Your JavaScript code\nreturn items;',
                    required: true,
                    rows: 8
                }
            ]
        });
        
        this.registerNode('filter', {
            name: 'Filter',
            category: 'transforms',
            icon: 'fas fa-filter',
            color: '#f59e0b',
            description: 'Filters data based on conditions',
            type: 'n8n-nodes-base.filter',
            defaultParameters: {
                conditions: []
            },
            parameterFields: [
                {
                    name: 'conditions',
                    label: 'Conditions',
                    type: 'array',
                    itemType: 'object',
                    description: 'Add filter conditions'
                }
            ]
        });
        
        this.registerNode('merge', {
            name: 'Merge',
            category: 'transforms',
            icon: 'fas fa-code-branch',
            color: '#f59e0b',
            description: 'Combines data from multiple branches',
            type: 'n8n-nodes-base.merge',
            defaultParameters: {
                mode: 'combine',
                combineBy: 'combineAll'
            },
            parameterFields: [
                {
                    name: 'mode',
                    label: 'Merge Mode',
                    type: 'select',
                    options: ['combine', 'passThrough', 'keepOnlyMatches', 'keepNonMatches'],
                    default: 'combine'
                }
            ]
        });
        
        this.registerNode('switch', {
            name: 'Switch',
            category: 'transforms',
            icon: 'fas fa-random',
            color: '#f59e0b',
            description: 'Routes data based on conditions',
            type: 'n8n-nodes-base.switch',
            defaultParameters: {
                switchValues: []
            },
            parameterFields: [
                {
                    name: 'switchValues',
                    label: 'Routes',
                    type: 'array',
                    itemType: 'object',
                    description: 'Add routing rules'
                }
            ]
        });
        
        this.registerNode('set', {
            name: 'Set',
            category: 'transforms',
            icon: 'fas fa-edit',
            color: '#f59e0b',
            description: 'Sets or modifies data values',
            type: 'n8n-nodes-base.set',
            defaultParameters: {
                values: []
            },
            parameterFields: [
                {
                    name: 'values',
                    label: 'Values to Set',
                    type: 'array',
                    itemType: 'object',
                    description: 'Add key-value pairs to set'
                }
            ]
        });
        
        // Initialize categories
        this.initializeCategories();
    }
    
    registerNode(id, config) {
        this.nodes.set(id, config);
    }
    
    initializeCategories() {
        this.categories.set('triggers', {
            name: 'Triggers',
            icon: 'fas fa-bolt',
            description: 'Workflow triggers'
        });
        
        this.categories.set('actions', {
            name: 'Actions',
            icon: 'fas fa-cogs',
            description: 'Action nodes'
        });
        
        this.categories.set('transforms', {
            name: 'Transforms',
            icon: 'fas fa-exchange-alt',
            description: 'Data transformation'
        });
    }
    
    getNode(id) {
        return this.nodes.get(id);
    }
    
    getAllNodes() {
        return Array.from(this.nodes.entries()).map(([id, config]) => ({
            id,
            ...config
        }));
    }
    
    getNodesByCategory(category) {
        return this.getAllNodes().filter(node => node.category === category);
    }
    
    getCategory(category) {
        return this.categories.get(category);
    }
    
    getAllCategories() {
        return Array.from(this.categories.entries()).map(([id, config]) => ({
            id,
            ...config
        }));
    }
    
    searchNodes(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllNodes().filter(node => 
            node.name.toLowerCase().includes(lowerQuery) ||
            node.description.toLowerCase().includes(lowerQuery)
        );
    }
    
    validateNodeParameters(nodeType, parameters) {
        const node = this.getNode(nodeType);
        if (!node) return { valid: false, errors: ['Unknown node type'] };
        
        const errors = [];
        const warnings = [];
        
        node.parameterFields.forEach(field => {
            const value = parameters[field.name];
            
            if (field.required && (!value || value === '')) {
                errors.push(`${field.label} is required`);
            }
            
            if (field.type === 'email' && value && !this.isValidEmail(value)) {
                errors.push(`${field.label} must be a valid email`);
            }
            
            if (field.type === 'url' && value && !this.isValidUrl(value)) {
                errors.push(`${field.label} must be a valid URL`);
            }
        });
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

// Global node registry instance
window.nodeRegistry = new NodeRegistry();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodeRegistry;
}
