// n8n Workflow Template Library
// Common workflow patterns for quick generation

class WorkflowTemplates {
  static getTemplates() {
    return {
      // Business Automation Templates
      'customer-onboarding': {
        name: 'Customer Onboarding',
        description: 'Welcome new customers, add to CRM, and send notifications',
        category: 'Business',
        tags: ['onboarding', 'crm', 'email', 'slack'],
        template: {
          name: 'Customer Onboarding Workflow',
          nodes: [
            {
              parameters: {
                httpMethod: 'POST',
                path: 'customer-onboarding',
                responseMode: 'onReceived',
                options: {}
              },
              id: 'webhook1',
              name: 'Customer Signup',
              type: 'n8n-nodes-base.webhook',
              typeVersion: 1,
              position: [240, 300]
            },
            {
              parameters: {
                values: {
                  string: [
                    {
                      name: 'customerName',
                      value: '={{ $json.body.customerName }}'
                    },
                    {
                      name: 'customerEmail',
                      value: '={{ $json.body.customerEmail }}'
                    },
                    {
                      name: 'signupDate',
                      value: '={{ new Date().toISOString() }}'
                    }
                  ]
                },
                options: {}
              },
              id: 'set1',
              name: 'Prepare Customer Data',
              type: 'n8n-nodes-base.set',
              typeVersion: 1,
              position: [460, 300]
            },
            {
              parameters: {
                authentication: 'genericCredentialType',
                genericAuthType: 'httpBasicAuth',
                resource: 'record',
                operation: 'create',
                baseUri: 'https://api.airtable.com/v0/',
                databaseId: 'YOUR_DATABASE_ID',
                tableId: 'YOUR_TABLE_ID',
                columns: {
                  mappingMode: 'defineBelow',
                  value: {
                    'Name': '={{ $json.customerName }}',
                    'Email': '={{ $json.customerEmail }}',
                    'Signup Date': '={{ $json.signupDate }}'
                  }
                },
                options: {}
              },
              id: 'airtable1',
              name: 'Add to CRM',
              type: 'n8n-nodes-base.airtable',
              typeVersion: 1,
              position: [680, 300]
            },
            {
              parameters: {
                fromEmail: 'welcome@yourcompany.com',
                toEmail: '={{ $json.customerEmail }}',
                subject: 'Welcome to Our Company!',
                text: 'Hi {{ $json.customerName }},\n\nWelcome aboard! We\'re excited to have you join us.\n\nBest regards,\nThe Team',
                options: {}
              },
              id: 'email1',
              name: 'Send Welcome Email',
              type: 'n8n-nodes-base.emailSend',
              typeVersion: 1,
              position: [900, 200]
            },
            {
              parameters: {
                channel: 'general',
                text: '🎉 New customer signup: {{ $json.customerName }} ({{ $json.customerEmail }})',
                otherOptions: {},
                attachments: [],
                binaryData: false
              },
              id: 'slack1',
              name: 'Notify Team',
              type: 'n8n-nodes-base.slack',
              typeVersion: 1,
              position: [900, 400]
            }
          ],
          connections: {
            'Customer Signup': {
              main: [
                [
                  {
                    node: 'Prepare Customer Data',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            },
            'Prepare Customer Data': {
              main: [
                [
                  {
                    node: 'Add to CRM',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            },
            'Add to CRM': {
              main: [
                [
                  {
                    node: 'Send Welcome Email',
                    type: 'main',
                    index: 0
                  },
                  {
                    node: 'Notify Team',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            }
          },
          active: false,
          settings: {},
          versionId: '1'
        }
      },

      'data-sync': {
        name: 'Data Synchronization',
        description: 'Sync data between two systems on schedule',
        category: 'Data',
        tags: ['sync', 'database', 'api', 'cron'],
        template: {
          name: 'Data Synchronization Workflow',
          nodes: [
            {
              parameters: {
                rule: {
                  interval: [
                    {
                      field: 'hours',
                      hoursInterval: 6
                    }
                  ]
                }
              },
              id: 'cron1',
              name: 'Every 6 Hours',
              type: 'n8n-nodes-base.cron',
              typeVersion: 1,
              position: [240, 300]
            },
            {
              parameters: {
                url: 'https://api.source-system.com/data',
                authentication: 'genericCredentialType',
                genericAuthType: 'httpHeaderAuth',
                requestMethod: 'GET',
                options: {}
              },
              id: 'http1',
              name: 'Get Source Data',
              type: 'n8n-nodes-base.httpRequest',
              typeVersion: 3,
              position: [460, 300]
            },
            {
              parameters: {
                functionCode: 'return items.map(item => ({\n  ...item,\n  processed_at: new Date().toISOString(),\n  id: item.id.toString()\n}));'
              },
              id: 'code1',
              name: 'Transform Data',
              type: 'n8n-nodes-base.code',
              typeVersion: 1,
              position: [680, 300]
            },
            {
              parameters: {
                url: 'https://api.target-system.com/sync',
                authentication: 'genericCredentialType',
                genericAuthType: 'httpHeaderAuth',
                requestMethod: 'POST',
                jsonBody: true,
                bodyParameters: {
                  parameters: [
                    {
                      name: 'data',
                      value: '={{ $json }}'
                    }
                  ]
                },
                options: {}
              },
              id: 'http2',
              name: 'Send to Target',
              type: 'n8n-nodes-base.httpRequest',
              typeVersion: 3,
              position: [900, 300]
            }
          ],
          connections: {
            'Every 6 Hours': {
              main: [
                [
                  {
                    node: 'Get Source Data',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            },
            'Get Source Data': {
              main: [
                [
                  {
                    node: 'Transform Data',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            },
            'Transform Data': {
              main: [
                [
                  {
                    node: 'Send to Target',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            }
          },
          active: false,
          settings: {},
          versionId: '1'
        }
      },

      'error-monitoring': {
        name: 'Error Monitoring & Alerts',
        description: 'Monitor system errors and send alerts when issues occur',
        category: 'Monitoring',
        tags: ['errors', 'monitoring', 'alerts', 'slack'],
        template: {
          name: 'Error Monitoring Workflow',
          nodes: [
            {
              parameters: {
                httpMethod: 'POST',
                path: 'error-report',
                responseMode: 'onReceived',
                options: {}
              },
              id: 'webhook1',
              name: 'Error Webhook',
              type: 'n8n-nodes-base.webhook',
              typeVersion: 1,
              position: [240, 300]
            },
            {
              parameters: {
                conditions: {
                  options: {
                    caseSensitive: true,
                    leftValue: '',
                    typeValidation: 'strict'
                  },
                  conditions: [
                    {
                      id: 'critical-error',
                      leftValue: '={{ $json.body.severity }}',
                      rightValue: 'critical',
                      operator: {
                        type: 'string',
                        operation: 'equals'
                      }
                    }
                  ],
                  combinator: 'and'
                },
                options: {}
              },
              id: 'if1',
              name: 'Is Critical Error?',
              type: 'n8n-nodes-base.if',
              typeVersion: 1,
              position: [460, 300]
            },
            {
              parameters: {
                channel: 'alerts',
                text: '🚨 CRITICAL ERROR\n\nService: {{ $json.body.service }}\nError: {{ $json.body.error }}\nTime: {{ $json.body.timestamp }}\n\nImmediate attention required!',
                otherOptions: {},
                attachments: [],
                binaryData: false
              },
              id: 'slack1',
              name: 'Critical Alert',
              type: 'n8n-nodes-base.slack',
              typeVersion: 1,
              position: [680, 200]
            },
            {
              parameters: {
                channel: 'logs',
                text: '⚠️ Error Report\n\nService: {{ $json.body.service }}\nError: {{ $json.body.error }}\nTime: {{ $json.body.timestamp }}',
                otherOptions: {},
                attachments: [],
                binaryData: false
              },
              id: 'slack2',
              name: 'Log Error',
              type: 'n8n-nodes-base.slack',
              typeVersion: 1,
              position: [680, 400]
            },
            {
              parameters: {
                authentication: 'genericCredentialType',
                genericAuthType: 'httpBasicAuth',
                resource: 'record',
                operation: 'create',
                baseUri: 'https://api.airtable.com/v0/',
                databaseId: 'YOUR_DATABASE_ID',
                tableId: 'YOUR_TABLE_ID',
                columns: {
                  mappingMode: 'defineBelow',
                  value: {
                    'Service': '={{ $json.body.service }}',
                    'Error': '={{ $json.body.error }}',
                    'Severity': '={{ $json.body.severity }}',
                    'Timestamp': '={{ $json.body.timestamp }}'
                  }
                },
                options: {}
              },
              id: 'airtable1',
              name: 'Log to Database',
              type: 'n8n-nodes-base.airtable',
              typeVersion: 1,
              position: [900, 300]
            }
          ],
          connections: {
            'Error Webhook': {
              main: [
                [
                  {
                    node: 'Is Critical Error?',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            },
            'Is Critical Error?': {
              main: [
                [
                  {
                    node: 'Critical Alert',
                    type: 'main',
                    index: 0
                  }
                ],
                [
                  {
                    node: 'Log Error',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            },
            'Critical Alert': {
              main: [
                [
                  {
                    node: 'Log to Database',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            },
            'Log Error': {
              main: [
                [
                  {
                    node: 'Log to Database',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            }
          },
          active: false,
          settings: {},
          versionId: '1'
        }
      },

      'social-media-post': {
        name: 'Social Media Automation',
        description: 'Schedule and post content to multiple social platforms',
        category: 'Marketing',
        tags: ['social', 'twitter', 'linkedin', 'content'],
        template: {
          name: 'Social Media Posting Workflow',
          nodes: [
            {
              parameters: {
                httpMethod: 'POST',
                path: 'social-post',
                responseMode: 'onReceived',
                options: {}
              },
              id: 'webhook1',
              name: 'Content Ready',
              type: 'n8n-nodes-base.webhook',
              typeVersion: 1,
              position: [240, 300]
            },
            {
              parameters: {
                values: {
                  string: [
                    {
                      name: 'content',
                      value: '={{ $json.body.content }}'
                    },
                    {
                      name: 'imageUrl',
                      value: '={{ $json.body.imageUrl }}'
                    },
                    {
                      name: 'hashtags',
                      value: '={{ $json.body.hashtags }}'
                    }
                  ]
                },
                options: {}
              },
              id: 'set1',
              name: 'Prepare Content',
              type: 'n8n-nodes-base.set',
              typeVersion: 1,
              position: [460, 300]
            },
            {
              parameters: {
                resource: 'status',
                operation: 'create',
                text: '={{ $json.content }} {{ $json.hashtags }}',
                additionalFields: {}
              },
              id: 'twitter1',
              name: 'Post to Twitter',
              type: 'n8n-nodes-base.twitter',
              typeVersion: 1,
              position: [680, 200]
            },
            {
              parameters: {
                resource: 'share',
                operation: 'create',
                text: '={{ $json.content }}',
                visibility: 'anyone',
                additionalFields: {}
              },
              id: 'linkedIn1',
              name: 'Post to LinkedIn',
              type: 'n8n-nodes-base.linkedIn',
              typeVersion: 1,
              position: [680, 400]
            }
          ],
          connections: {
            'Content Ready': {
              main: [
                [
                  {
                    node: 'Prepare Content',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            },
            'Prepare Content': {
              main: [
                [
                  {
                    node: 'Post to Twitter',
                    type: 'main',
                    index: 0
                  },
                  {
                    node: 'Post to LinkedIn',
                    type: 'main',
                    index: 0
                  }
                ]
              ]
            }
          },
          active: false,
          settings: {},
          versionId: '1'
        }
      }
    };
  }

  static getTemplate(id) {
    const templates = this.getTemplates();
    return templates[id];
  }

  static searchTemplates(query) {
    const templates = this.getTemplates();
    const results = [];
    
    const lowerQuery = query.toLowerCase();
    
    for (const [id, template] of Object.entries(templates)) {
      if (
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.category.toLowerCase().includes(lowerQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      ) {
        results.push({ id, ...template });
      }
    }
    
    return results;
  }

  static getTemplatesByCategory(category) {
    const templates = this.getTemplates();
    const results = [];
    
    for (const [id, template] of Object.entries(templates)) {
      if (template.category.toLowerCase() === category.toLowerCase()) {
        results.push({ id, ...template });
      }
    }
    
    return results;
  }

  static getAllCategories() {
    const templates = this.getTemplates();
    const categories = new Set();
    
    for (const template of Object.values(templates)) {
      categories.add(template.category);
    }
    
    return Array.from(categories).sort();
  }

  static getAllTags() {
    const templates = this.getTemplates();
    const tags = new Set();
    
    for (const template of Object.values(templates)) {
      template.tags.forEach(tag => tags.add(tag));
    }
    
    return Array.from(tags).sort();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkflowTemplates;
}
