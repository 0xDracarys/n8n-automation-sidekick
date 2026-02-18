// n8n Services Catalog Component
import { useState } from 'react';
import { Search, Zap, Database, Cloud, MessageSquare, CreditCard, Brain, Monitor, Shield } from 'lucide-react';

const N8NServicesCatalog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const services = {
    triggers: [
      { name: 'Webhook', type: 'n8n-nodes-base.webhook', version: 'v2', desc: 'HTTP webhook triggers', icon: '🔗' },
      { name: 'Schedule', type: 'n8n-nodes-base.scheduleTrigger', version: 'v1', desc: 'Time-based automation', icon: '⏰' },
      { name: 'Manual Trigger', type: 'n8n-nodes-base.manualTrigger', version: 'v1', desc: 'Start workflows manually', icon: '▶️' },
      { name: 'Email Trigger', type: 'n8n-nodes-base.emailReadImap', version: 'v1', desc: 'React to incoming emails', icon: '📧' },
      { name: 'Form Trigger', type: 'n8n-nodes-base.formTrigger', version: 'v1', desc: 'Form submission handler', icon: '📝' }
    ],
    processing: [
      { name: 'Set', type: 'n8n-nodes-base.set', version: 'v3', desc: 'Transform and rename data fields', icon: '🔄' },
      { name: 'Code', type: 'n8n-nodes-base.code', version: 'v2', desc: 'Custom JavaScript/Python code', icon: '💻' },
      { name: 'If', type: 'n8n-nodes-base.if', version: 'v2', desc: 'Conditional branching logic', icon: '🔀' },
      { name: 'Switch', type: 'n8n-nodes-base.switch', version: 'v3', desc: 'Multi-way branching', icon: '🎛️' },
      { name: 'Filter', type: 'n8n-nodes-base.filter', version: 'v2', desc: 'Filter data conditions', icon: '🔍' },
      { name: 'Merge', type: 'n8n-nodes-base.merge', version: 'v2', desc: 'Combine data branches', icon: '🔗' },
      { name: 'HTTP Request', type: 'n8n-nodes-base.httpRequest', version: 'v4', desc: 'API calls and web requests', icon: '🌐' },
      { name: 'Function', type: 'n8n-nodes-base.function', version: 'v1', desc: 'Custom JavaScript functions', icon: '⚙️' }
    ],
    communication: [
      { name: 'Send Email', type: 'n8n-nodes-base.emailSend', version: 'v1', desc: 'Send emails via SMTP', icon: '📤' },
      { name: 'Slack', type: 'n8n-nodes-base.slack', version: 'v2', desc: 'Slack messages and bots', icon: '💬' },
      { name: 'Discord', type: 'n8n-nodes-base.discord', version: 'v1', desc: 'Discord bot integration', icon: '🎮' },
      { name: 'Telegram', type: 'n8n-nodes-base.telegram', version: 'v1', desc: 'Telegram bot messages', icon: '✈️' },
      { name: 'Microsoft Teams', type: 'n8n-nodes-base.microsoftTeams', version: 'v1', desc: 'Teams integration', icon: '👥' }
    ],
    databases: [
      { name: 'PostgreSQL', type: 'n8n-nodes-base.postgres', version: 'v1', desc: 'PostgreSQL database operations', icon: '🐘' },
      { name: 'MySQL', type: 'n8n-nodes-base.mysql', version: 'v1', desc: 'MySQL database queries', icon: '🐬' },
      { name: 'MongoDB', type: 'n8n-nodes-base.mongodb', version: 'v1', desc: 'MongoDB document operations', icon: '🍃' },
      { name: 'Redis', type: 'n8n-nodes-base.redis', version: 'v1', desc: 'Redis cache operations', icon: '🔴' },
      { name: 'Airtable', type: 'n8n-nodes-base.airtable', version: 'v1', desc: 'Airtable spreadsheet operations', icon: '📊' },
      { name: 'Notion', type: 'n8n-nodes-base.notion', version: 'v2', desc: 'Notion database operations', icon: '📝' }
    ],
    cloud: [
      { name: 'Google Sheets', type: 'n8n-nodes-base.googleSheets', version: 'v4', desc: 'Google Sheets operations', icon: '📈' },
      { name: 'Google Drive', type: 'n8n-nodes-base.googleDrive', version: 'v1', desc: 'Google Drive file management', icon: '📁' },
      { name: 'AWS S3', type: 'n8n-nodes-base.awsS3', version: 'v1', desc: 'AWS S3 storage operations', icon: '☁️' },
      { name: 'AWS Lambda', type: 'n8n-nodes-base.awsLambda', version: 'v1', desc: 'AWS Lambda functions', icon: '⚡' },
      { name: 'Azure Blob', type: 'n8n-nodes-base.azureBlobStorage', version: 'v1', desc: 'Azure Blob storage', icon: '💙' },
      { name: 'Dropbox', type: 'n8n-nodes-base.dropbox', version: 'v1', desc: 'Dropbox file operations', icon: '📦' }
    ],
    ai: [
      { name: 'OpenAI', type: 'n8n-nodes-base.openAi', version: 'v1', desc: 'OpenAI/ChatGPT integration', icon: '🤖' },
      { name: 'Hugging Face', type: 'n8n-nodes-base.huggingFace', version: 'v1', desc: 'Hugging Face ML models', icon: '🤗' },
      { name: 'Stability AI', type: 'n8n-nodes-base.stabilityAi', version: 'v1', desc: 'AI image generation', icon: '🎨' },
      { name: 'Claude AI', type: 'n8n-nodes-base.anthropic', version: 'v1', desc: 'Anthropic Claude integration', icon: '🧠' },
      { name: 'Google Gemini', type: 'n8n-nodes-base.googleGemini', version: 'v1', desc: 'Google Gemini AI', icon: '✨' }
    ],
    business: [
      { name: 'Stripe', type: 'n8n-nodes-base.stripe', version: 'v1', desc: 'Stripe payment processing', icon: '💳' },
      { name: 'Shopify', type: 'n8n-nodes-base.shopify', version: 'v1', desc: 'Shopify e-commerce', icon: '🛒' },
      { name: 'Salesforce', type: 'n8n-nodes-base.salesforce', version: 'v1', desc: 'Salesforce CRM operations', icon: '☁️' },
      { name: 'HubSpot', type: 'n8n-nodes-base.hubspot', version: 'v1', desc: 'HubSpot CRM integration', icon: '🎯' },
      { name: 'Jira', type: 'n8n-nodes-base.jira', version: 'v1', desc: 'Jira project management', icon: '📋' },
      { name: 'Asana', type: 'n8n-nodes-base.asana', version: 'v1', desc: 'Asana task management', icon: '✅' },
      { name: 'Trello', type: 'n8n-nodes-base.trello', version: 'v1', desc: 'Trello board operations', icon: '📌' }
    ],
    monitoring: [
      { name: 'Error Trigger', type: 'n8n-nodes-base.errorTrigger', version: 'v1', desc: 'Catch workflow errors', icon: '⚠️' },
      { name: 'XML', type: 'n8n-nodes-base.xml', version: 'v1', desc: 'XML data processing', icon: '📄' },
      { name: 'HTML Extract', type: 'n8n-nodes-base.htmlExtract', version: 'v1', desc: 'Web scraping', icon: '🕷️' },
      { name: 'Date/Time', type: 'n8n-nodes-base.dateTime', version: 'v1', desc: 'Date/time operations', icon: '📅' },
      { name: 'Wait', type: 'n8n-nodes-base.wait', version: 'v1', desc: 'Delays and timing', icon: '⏱️' }
    ]
  };

  const allServices = Object.entries(services).flatMap(([category, items]) => 
    items.map(service => ({ ...service, category }))
  );

  const filteredServices = allServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    const icons = {
      triggers: <Zap className="w-4 h-4" />,
      processing: <Brain className="w-4 h-4" />,
      communication: <MessageSquare className="w-4 h-4" />,
      databases: <Database className="w-4 h-4" />,
      cloud: <Cloud className="w-4 h-4" />,
      ai: <Brain className="w-4 h-4" />,
      business: <CreditCard className="w-4 h-4" />,
      monitoring: <Monitor className="w-4 h-4" />
    };
    return icons[category] || <Shield className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">n8n Services Catalog</h1>
          <p className="text-text-secondary">Complete list of available n8n nodes and their capabilities</p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-light border border-border rounded-lg text-white placeholder-text-secondary focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-surface-light border border-border rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="all">All Categories</option>
            <option value="triggers">Triggers</option>
            <option value="processing">Processing</option>
            <option value="communication">Communication</option>
            <option value="databases">Databases</option>
            <option value="cloud">Cloud Services</option>
            <option value="ai">AI/ML</option>
            <option value="business">Business</option>
            <option value="monitoring">Monitoring</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => (
            <div key={index} className="bg-surface-light rounded-xl border border-border p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="text-2xl">{service.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{service.name}</h3>
                  <p className="text-sm text-text-secondary mb-2">{service.desc}</p>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                      {service.type}
                    </span>
                    <span className="px-2 py-1 bg-surface border border-border rounded">
                      {service.version}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-text-secondary">No services found matching your criteria.</p>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(services).map(([category, items]) => (
            <div key={category} className="bg-surface-light rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                {getCategoryIcon(category)}
                <h3 className="text-lg font-semibold text-white capitalize">{category}</h3>
              </div>
              <p className="text-sm text-text-secondary mb-4">{items.length} services available</p>
              <div className="space-y-2">
                {items.slice(0, 3).map((service, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>{service.icon}</span>
                    <span>{service.name}</span>
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-xs text-primary">+{items.length - 3} more</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default N8NServicesCatalog;
