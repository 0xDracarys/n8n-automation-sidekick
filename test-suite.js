// Comprehensive Test Suite for n8n Automation Sidekick
class TestSuite {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  async runQuickTest() {
    console.log('⚡ Running Quick Test with Ollama');
    
    this.showTestResults('Starting quick test...');
    
    const quickTest = {
      id: 'quick-test',
      category: 'Quick Test',
      prompt: 'Create a simple workflow with a webhook trigger that sends an email notification',
      provider: 'ollama',
      model: 'llama3.2:latest',
      expectedNodes: ['Webhook', 'Send Email']
    };

    try {
      this.showTestResults('Testing connection to Ollama...');
      await this.runSingleTest(quickTest);
      
      const result = this.testResults[this.testResults.length - 1];
      
      let output = `🎯 Quick Test Result:\n`;
      output += `Status: ${result.status === 'passed' ? '✅ PASSED' : result.status === 'failed' ? '❌ FAILED' : '💥 ERROR'}\n`;
      output += `Duration: ${result.duration}ms\n`;
      
      if (result.validation) {
        output += `Node Count: ${result.validation.nodeCount}\n`;
        output += `Has Connections: ${result.validation.hasConnections ? '✅' : '❌'}\n`;
        output += `Issues: ${result.validation.issues.length}\n`;
        output += `Warnings: ${result.validation.warnings.length}\n`;
        
        if (result.validation.expectedNodesFound.length > 0) {
          output += `Found nodes: ${result.validation.expectedNodesFound.join(', ')}\n`;
        }
        
        if (result.validation.issues.length > 0) {
          output += `\n🔴 Issues:\n`;
          result.validation.issues.forEach(issue => {
            output += `  • ${issue}\n`;
          });
        }
        
        if (result.validation.warnings.length > 0) {
          output += `\n🟡 Warnings:\n`;
          result.validation.warnings.forEach(warning => {
            output += `  • ${warning}\n`;
          });
        }
      }
      
      if (result.error) {
        output += `\n💥 Error: ${result.error}\n`;
      }
      
      this.showTestResults(output);
      
    } catch (error) {
      this.showTestResults(`💥 Quick test failed: ${error.message}`);
    }
    
    return this.testResults[this.testResults.length - 1];
  }

  async testConnectionOnly() {
    console.log('🔗 Testing Ollama Connection Only');
    
    this.showTestResults('Testing Ollama connection...');
    
    try {
      const settings = await window.sidekick.getSettings();
      console.log('Current settings:', {
        provider: settings.provider,
        ollamaUrl: settings.ollamaUrl
      });

      const response = await fetch(`${settings.ollamaUrl}/api/tags`);
      const data = await response.json();
      
      let output = `✅ Ollama connection successful!\n`;
      output += `Server: ${settings.ollamaUrl}\n`;
      output += `Available models:\n`;
      
      data.models.forEach(model => {
        output += `  • ${model.name} (${this.formatBytes(model.size)})\n`;
      });
      
      this.showTestResults(output);
      
      return { success: true, models: data.models };
    } catch (error) {
      const output = `❌ Ollama connection failed: ${error.message}\n`;
      output += `Make sure Ollama is running on: http://localhost:11434`;
      this.showTestResults(output);
      return { success: false, error: error.message };
    }
  }

  async testPromptGeneration() {
    console.log('🧠 Testing Prompt Generation');
    
    this.showTestResults('Testing prompt generation...');
    
    const testPrompt = 'Create a workflow that sends a Slack message when a new user signs up';
    
    try {
      const settings = await window.sidekick.getSettings();
      settings.provider = 'ollama';
      settings.model = 'llama3.2:latest';
      
      console.log('Testing prompt:', testPrompt);
      
      const workflow = await window.sidekick.callAI(testPrompt, settings);
      
      let output = `✅ Workflow generated successfully!\n`;
      output += `Prompt: ${testPrompt}\n`;
      output += `Node count: ${workflow.nodes?.length || 0}\n`;
      output += `Has connections: ${!!(workflow.connections && Object.keys(workflow.connections).length > 0) ? '✅' : '❌'}\n`;
      
      if (workflow.nodes) {
        output += `\nNode types:\n`;
        workflow.nodes.forEach((node, index) => {
          output += `  ${index + 1}. ${node.type} - ${node.name}\n`;
        });
      }
      
      this.showTestResults(output);
      
      return { success: true, workflow };
    } catch (error) {
      const output = `❌ Prompt generation failed: ${error.message}`;
      this.showTestResults(output);
      return { success: false, error: error.message };
    }
  }

  async runSingleTest(testCase) {
    console.log(`\n🔍 Running Test: ${testCase.id} - ${testCase.category}`);
    console.log(`📝 Prompt: ${testCase.prompt}`);
    
    this.currentTest = {
      ...testCase,
      startTime: Date.now(),
      status: 'running'
    };

    try {
      // Ensure we're using the right provider
      const settings = await window.sidekick.getSettings();
      settings.provider = testCase.provider;
      settings.model = testCase.model;
      
      console.log(`🔧 Using provider: ${testCase.provider}/${testCase.model}`);
      
      // Generate workflow
      const workflow = await window.sidekick.callAI(testCase.prompt, settings);
      
      // Validate the result
      const validation = this.validateWorkflow(workflow, testCase);
      
      this.currentTest = {
        ...this.currentTest,
        status: validation.isValid ? 'passed' : 'failed',
        duration: Date.now() - this.currentTest.startTime,
        workflow: workflow,
        validation: validation,
        error: null
      };
      
      console.log(`✅ Test ${testCase.id} ${validation.isValid ? 'PASSED' : 'FAILED'}`);
      console.log(`📊 Validation:`, validation);
      
    } catch (error) {
      this.currentTest = {
        ...this.currentTest,
        status: 'error',
        duration: Date.now() - this.currentTest.startTime,
        workflow: null,
        validation: null,
        error: error.message
      };
      
      console.log(`❌ Test ${testCase.id} ERROR: ${error.message}`);
    }
    
    this.testResults.push(this.currentTest);
  }

  validateWorkflow(workflow, testCase) {
    const validation = {
      isValid: true,
      issues: [],
      warnings: [],
      nodeCount: 0,
      hasConnections: false,
      expectedNodesFound: [],
      structureMatches: true
    };

    try {
      // Check if workflow is valid JSON
      if (!workflow || typeof workflow !== 'object') {
        validation.isValid = false;
        validation.issues.push('Invalid workflow format - not a valid object');
        return validation;
      }

      // Check required n8n structure
      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        validation.isValid = false;
        validation.issues.push('Missing or invalid nodes array');
        return validation;
      }

      validation.nodeCount = workflow.nodes.length;

      // Check connections
      if (workflow.connections && Object.keys(workflow.connections).length > 0) {
        validation.hasConnections = true;
      } else {
        validation.warnings.push('No connections found between nodes');
      }

      // Check for expected nodes
      workflow.nodes.forEach(node => {
        if (node.type?.toLowerCase().includes('webhook')) {
          validation.expectedNodesFound.push('Webhook');
        }
        if (node.type?.toLowerCase().includes('mail')) {
          validation.expectedNodesFound.push('Email');
        }
        if (node.type?.toLowerCase().includes('slack')) {
          validation.expectedNodesFound.push('Slack');
        }
      });

      // Check node structure
      workflow.nodes.forEach((node, index) => {
        if (!node.id) {
          validation.issues.push(`Node ${index} missing ID`);
        }
        if (!node.name) {
          validation.issues.push(`Node ${index} missing name`);
        }
        if (!node.type) {
          validation.issues.push(`Node ${index} missing type`);
        }
        if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          validation.issues.push(`Node ${index} has invalid position`);
        }
      });

      // Final validation
      if (validation.issues.length > 0) {
        validation.isValid = false;
      }

    } catch (error) {
      validation.isValid = false;
      validation.issues.push(`Validation error: ${error.message}`);
    }

    return validation;
  }

  showTestResults(output) {
    const resultsDiv = document.getElementById('testResults');
    const outputDiv = document.getElementById('testOutput');
    
    if (resultsDiv && outputDiv) {
      resultsDiv.style.display = 'block';
      outputDiv.textContent = output;
      
      // Add color coding
      outputDiv.innerHTML = output
        .replace(/✅/g, '<span class="success">✅</span>')
        .replace(/❌/g, '<span class="error">❌</span>')
        .replace(/💥/g, '<span class="error">💥</span>')
        .replace(/🟡/g, '<span class="warning">🟡</span>')
        .replace(/🔴/g, '<span class="error">🔴</span>')
        .replace(/🎯/g, '<span class="info">🎯</span>');
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Initialize test suite
window.testSuite = new TestSuite();

// Make test functions available globally
window.runQuickTest = () => window.testSuite.runQuickTest();
window.testConnection = () => window.testSuite.testConnectionOnly();
window.testPromptGeneration = () => window.testSuite.testPromptGeneration();

console.log('🧪 Test Suite initialized. Available commands:');
console.log('  runQuickTest() - Quick single test');
console.log('  testConnection() - Test Ollama connection');
console.log('  testPromptGeneration() - Test prompt generation');
