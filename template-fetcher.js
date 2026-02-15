// n8n Official Template Fetcher
// Fetches workflows from n8n's official template repository

class N8NTemplateFetcher {
  static async fetchOfficialTemplates() {
    try {
      // n8n's official workflow templates API
      const response = await fetch('https://api.n8n.io/workflows', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'n8n-automation-sidekick/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status}`);
      }

      const data = await response.json();
      return this.formatTemplates(data);
    } catch (error) {
      console.error('Error fetching n8n templates:', error);
      return this.getFallbackTemplates();
    }
  }

  static formatTemplates(apiData) {
    const templates = {};
    
    if (apiData.data && Array.isArray(apiData.data)) {
      apiData.data.forEach((workflow, index) => {
        const templateId = `n8n-official-${index}`;
        
        templates[templateId] = {
          name: workflow.name || `n8n Workflow ${index + 1}`,
          description: workflow.description || 'Official n8n workflow template',
          category: this.categorizeWorkflow(workflow),
          tags: this.extractTags(workflow),
          source: 'n8n-official',
          official: true,
          template: {
            name: workflow.name,
            nodes: workflow.nodes || [],
            connections: workflow.connections || {},
            active: false,
            settings: workflow.settings || {},
            versionId: workflow.versionId || '1'
          }
        };
      });
    }

    return templates;
  }

  static categorizeWorkflow(workflow) {
    const name = (workflow.name || '').toLowerCase();
    const description = (workflow.description || '').toLowerCase();
    const tags = (workflow.tags || []).map(tag => tag.toLowerCase());

    if (name.includes('crm') || description.includes('crm') || tags.includes('crm')) {
      return 'Business';
    } else if (name.includes('slack') || name.includes('email') || name.includes('notification')) {
      return 'Communication';
    } else if (name.includes('data') || name.includes('sync') || name.includes('database')) {
      return 'Data';
    } else if (name.includes('monitoring') || name.includes('error') || name.includes('log')) {
      return 'Monitoring';
    } else if (name.includes('social') || name.includes('twitter') || name.includes('linkedin')) {
      return 'Marketing';
    } else {
      return 'General';
    }
  }

  static extractTags(workflow) {
    const tags = [];
    
    // Extract from workflow tags
    if (workflow.tags && Array.isArray(workflow.tags)) {
      tags.push(...workflow.tags);
    }

    // Extract from node types
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      workflow.nodes.forEach(node => {
        if (node.type) {
          const nodeType = node.type.replace('n8n-nodes-base.', '');
          if (!tags.includes(nodeType)) {
            tags.push(nodeType);
          }
        }
      });
    }

    return tags.slice(0, 5); // Limit to 5 tags
  }

  static getFallbackTemplates() {
    // Fallback templates if API fails
    return {
      'n8n-webhook-email': {
        name: 'Webhook to Email',
        description: 'Simple workflow that receives webhook data and sends an email notification',
        category: 'Communication',
        tags: ['webhook', 'email', 'notification'],
        source: 'n8n-official',
        official: true,
        template: {
          name: 'Webhook to Email',
          nodes: [
            {
              parameters: {
                httpMethod: 'POST',
                path: 'webhook',
                responseMode: 'onReceived',
                options: {}
              },
              id: 'webhook1',
              name: 'Webhook',
              type: 'n8n-nodes-base.webhook',
              typeVersion: 1,
              position: [240, 300]
            },
            {
              parameters: {
                fromEmail: 'workflow@example.com',
                toEmail: 'user@example.com',
                subject: 'New Webhook Data',
                text: '={{ JSON.stringify($json, null, 2) }}',
                options: {}
              },
              id: 'email1',
              name: 'Send Email',
              type: 'n8n-nodes-base.emailSend',
              typeVersion: 1,
              position: [460, 300]
            }
          ],
          connections: {
            'Webhook': {
              main: [
                [
                  {
                    node: 'Send Email',
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

  static async searchTemplates(query) {
    const templates = await this.fetchOfficialTemplates();
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = N8NTemplateFetcher;
}
