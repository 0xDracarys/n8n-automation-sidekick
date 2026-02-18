// TOON Integration for n8n Workflow Generation
// Reduces AI token costs by optimizing user input and workflow data

class TOONWorkflowOptimizer {
  constructor() {
    this.toonConverter = new TOONConverter();
    this.enabled = true;
  }

  // Convert user prompt to TOON for AI processing
  optimizeUserPrompt(prompt, context = {}) {
    if (!this.enabled) return prompt;

    // Extract key information from prompt
    const extractedInfo = this.extractWorkflowInfo(prompt);
    
    // Convert to TOON format for efficient AI processing
    const toonData = {
      prompt: prompt,
      intent: extractedInfo.intent,
      entities: extractedInfo.entities,
      requirements: extractedInfo.requirements,
      context: context
    };

    return this.toonConverter.jsonToTOON(toonData, 'workflow_request');
  }

  // Extract workflow information from user prompt
  extractWorkflowInfo(prompt) {
    const info = {
      intent: 'unknown',
      entities: [],
      requirements: []
    };

    // Common workflow patterns
    const patterns = {
      trigger: /\b(trigger|when|on|if|as soon as|whenever)\b/gi,
      action: /\b(send|create|update|delete|add|remove|notify|email|slack|discord)\b/gi,
      condition: /\b(if|when|then|else|otherwise|check|validate)\b/gi,
      data: /\b(data|information|record|entry|item|object)\b/gi,
      service: /\b(email|slack|discord|telegram|database|api|webhook|http)\b/gi
    };

    // Extract entities
    Object.keys(patterns).forEach(type => {
      const matches = prompt.match(patterns[type]);
      if (matches) {
        info.entities.push(...matches.map(match => ({
          type: type,
          text: match.toLowerCase()
        })));
      }
    });

    // Determine intent
    if (patterns.trigger.test(prompt)) {
      info.intent = 'create_workflow_with_trigger';
    } else if (patterns.action.test(prompt)) {
      info.intent = 'create_action_workflow';
    } else {
      info.intent = 'general_workflow';
    }

    // Extract requirements
    const requirements = [
      'error handling',
      'logging',
      'retry mechanism',
      'notification',
      'validation',
      'authentication',
      'rate limiting'
    ];

    requirements.forEach(req => {
      if (prompt.toLowerCase().includes(req)) {
        info.requirements.push(req);
      }
    });

    return info;
  }

  // Optimize generated workflow for AI response
  optimizeWorkflowResponse(workflow) {
    if (!this.enabled) return workflow;

    // Convert workflow to TOON for efficient storage/transmission
    const toonWorkflow = this.toonConverter.optimizeN8nWorkflow(workflow);
    
    return {
      original: workflow,
      toon: toonWorkflow,
      savings: this.toonConverter.calculateTokenSavings(workflow)
    };
  }

  // Convert TOON back to regular JSON for frontend
  toonToWorkflow(toonString) {
    try {
      const jsonData = this.toonConverter.toonToJSON(toonString);
      return jsonData.workflow || jsonData;
    } catch (error) {
      console.error('❌ Failed to convert TOON to workflow:', error);
      throw error;
    }
  }

  // Process AI request with TOON optimization
  async processAIRequest(userPrompt, context, aiProvider) {
    if (!this.enabled) {
      return await aiProvider.generateWorkflow(userPrompt, context);
    }

    try {
      // 1. Optimize user prompt to TOON
      const optimizedPrompt = this.optimizeUserPrompt(userPrompt, context);
      
      // 2. Generate workflow with optimized prompt
      const toonResponse = await aiProvider.generateWorkflow(optimizedPrompt, context);
      
      // 3. Convert TOON response back to JSON
      const workflow = this.toonToWorkflow(toonResponse);
      
      // 4. Optimize final workflow
      const optimizedWorkflow = this.optimizeWorkflowResponse(workflow);
      
      return {
        workflow: optimizedWorkflow.original,
        toon: optimizedWorkflow.toon,
        savings: optimizedWorkflow.savings,
        optimization: {
          promptTokens: this.toonConverter.estimateTokens(optimizedPrompt),
          responseTokens: optimizedWorkflow.savings.toonTokens,
          totalSavings: optimizedWorkflow.savings.savings,
          savingsPercent: optimizedWorkflow.savings.savingsPercent
        }
      };
    } catch (error) {
      console.error('❌ TOON optimization failed:', error);
      // Fallback to regular processing
      return await aiProvider.generateWorkflow(userPrompt, context);
    }
  }

  // Batch optimize multiple workflows
  batchOptimize(workflows) {
    return workflows.map(workflow => ({
      id: workflow.id,
      original: workflow,
      toon: this.toonConverter.optimizeN8nWorkflow(workflow),
      savings: this.toonConverter.calculateTokenSavings(workflow)
    }));
  }

  // Create TOON template from existing workflow
  createTOONTemplate(workflow, templateName) {
    const template = {
      name: templateName,
      description: workflow.name || 'Generated workflow template',
      nodes: this.extractNodeTemplate(workflow.nodes),
      connections: this.extractConnectionTemplate(workflow.connections),
      variables: this.extractVariables(workflow)
    };

    return this.toonConverter.jsonToTOON(template, 'template');
  }

  // Extract reusable node template
  extractNodeTemplate(nodes) {
    return nodes.map(node => ({
      type: node.type,
      typeVersion: node.typeVersion,
      parameters: node.parameters,
      displayName: node.name,
      description: `${node.type} node - ${node.name}`
    }));
  }

  // Extract reusable connection template
  extractConnectionTemplate(connections) {
    const template = {};
    Object.keys(connections).forEach(nodeId => {
      template[nodeId] = connections[nodeId];
    });
    return template;
  }

  // Extract variables from workflow
  extractVariables(workflow) {
    const variables = new Set();
    
    // Extract from node parameters
    workflow.nodes?.forEach(node => {
      if (node.parameters) {
        const paramString = JSON.stringify(node.parameters);
        const matches = paramString.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          matches.forEach(match => {
            const variable = match.slice(2, -2);
            variables.add(variable);
          });
        }
      }
    });

    return Array.from(variables);
  }

  // Generate TOON-optimized system prompt
  generateOptimizedSystemPrompt() {
    const basePrompt = `You are an expert n8n workflow architect. Generate workflows in TOON format for maximum efficiency.

TOON Format Rules:
- Use array notation: nodes[3]{id,name,type,position}
- Use object notation: settings{executionOrder,saveData}
- Minimize punctuation and quotes
- Focus on data, not structure

Workflow Requirements:
1. Start with exactly one trigger node
2. Connect all nodes logically
3. Use valid n8n node types only
4. Include error handling
5. Optimize for token efficiency

Respond with TOON format only.`;

    return this.toonConverter.jsonToTOON({
      role: 'n8n_architect',
      format: 'TOON',
      requirements: ['single_trigger', 'connected_nodes', 'error_handling'],
      optimization: 'token_efficiency'
    }, 'system_prompt');
  }

  // Enable/disable TOON optimization
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Get optimization statistics
  getOptimizationStats() {
    return {
      enabled: this.enabled,
      supportedFormats: ['JSON', 'TOON'],
      averageSavings: '45-60%',
      bestUseCases: ['large_workflows', 'batch_processing', 'api_responses'],
      limitations: ['complex_nested_objects', 'mixed_data_types']
    };
  }
}

// Example usage and testing
class TOONExample {
  static demonstrate() {
    const optimizer = new TOONWorkflowOptimizer();
    
    // Example workflow
    const exampleWorkflow = {
      name: "Email Automation Workflow",
      nodes: [
        {
          id: "1",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [240, 300],
          parameters: {
            httpMethod: "POST",
            path: "email-webhook",
            options: {}
          }
        },
        {
          id: "2", 
          name: "Send Email",
          type: "n8n-nodes-base.emailSend",
          typeVersion: 1,
          position: [460, 300],
          parameters: {
            to: "user@example.com",
            subject: "Automated Response",
            body: "Hello World"
          }
        }
      ],
      connections: {
        "1": {
          main: [
            [{ node: "2", type: "main", index: 0 }]
          ]
        }
      },
      settings: {
        executionOrder: "v1",
        saveData: true
      }
    };

    // Convert to TOON
    const toonFormat = optimizer.toonConverter.optimizeN8nWorkflow(exampleWorkflow);
    console.log('🎯 TOON Format:');
    console.log(toonFormat);

    // Calculate savings
    const savings = optimizer.toonConverter.calculateTokenSavings(exampleWorkflow);
    console.log('\n💰 Token Savings:');
    console.log(`JSON: ${savings.jsonTokens} tokens`);
    console.log(`TOON: ${savings.toonTokens} tokens`);
    console.log(`Savings: ${savings.savings} tokens (${savings.savingsPercent}%)`);
    console.log(`Compression: ${savings.compressionRatio}x`);

    return { toonFormat, savings };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TOONWorkflowOptimizer, TOONExample };
} else if (typeof window !== 'undefined') {
  window.TOONWorkflowOptimizer = TOONWorkflowOptimizer;
  window.TOONExample = TOONExample;
}
