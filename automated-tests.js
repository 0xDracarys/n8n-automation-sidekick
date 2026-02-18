#!/usr/bin/env node

/**
 * Automated Testing Suite for n8n Automation Sidekick
 * Tests all components: Authentication, Workflow Generation, Templates, TOON Optimization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5175',
  apiBaseUrl: 'http://localhost:3001',
  timeout: 10000,
  retries: 3
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test utilities
class TestUtils {
  static log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  static success(message) {
    this.log(`✅ ${message}`, colors.green);
  }

  static error(message) {
    this.log(`❌ ${message}`, colors.red);
  }

  static warning(message) {
    this.log(`⚠️ ${message}`, colors.yellow);
  }

  static info(message) {
    this.log(`ℹ️ ${message}`, colors.blue);
  }

  static async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static async retry(fn, retries = TEST_CONFIG.retries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        this.warning(`Attempt ${i + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

// Main test runner
class AutomatedTestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async runTest(name, testFn) {
    this.results.total++;
    TestUtils.info(`Running test: ${name}`);
    
    try {
      await testFn();
      this.results.passed++;
      TestUtils.success(`${name} - PASSED`);
    } catch (error) {
      this.results.failed++;
      TestUtils.error(`${name} - FAILED: ${error.message}`);
    }
  }

  async testFrontendServer() {
    await this.runTest('Frontend Server Health', async () => {
      const response = await TestUtils.fetchWithTimeout(TEST_CONFIG.baseUrl);
      if (!response.ok) {
        throw new Error(`Frontend server returned ${response.status}`);
      }
    });
  }

  async testBackendServer() {
    await this.runTest('Backend Server Health', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`Backend server returned ${response.status}`);
      }
      const data = await response.json();
      if (data.status !== 'ok') {
        throw new Error('Backend health check failed');
      }
    });
  }

  async testWorkflowGeneration() {
    await this.runTest('Workflow Generation', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/workflow/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Create a simple workflow with webhook trigger and email action',
          provider: 'openrouter',
          model: 'openai/gpt-4o-mini'
        })
      });

      if (response.status !== 200) {
        throw new Error(`Workflow generation returned ${response.status}`);
      }

      const data = await response.json();
      if (!data.workflow) {
        throw new Error('No workflow returned');
      }
    });
  }

  async testAuthentication() {
    await this.runTest('Authentication Endpoints', async () => {
      // Test signup endpoint exists
      const signupResponse = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'testpassword123',
          name: 'Test User'
        })
      });

      // Should return 200 or 401 (endpoint exists)
      if (signupResponse.status !== 200 && signupResponse.status !== 401) {
        throw new Error(`Signup endpoint returned ${signupResponse.status}`);
      }
    });
  }

  async testTOONOptimization() {
    await this.runTest('TOON Optimization', async () => {
      // Test if TOON files exist
      const toonFiles = [
        'toon-converter.js',
        'toon-workflow-optimizer.js'
      ];

      for (const file of toonFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
          throw new Error(`TOON file missing: ${file}`);
        }
      }
    });
  }

  async testSupabaseMigration() {
    await this.runTest('Supabase Migration Files', async () => {
      const migrationFiles = [
        'SUPABASE_MIGRATION.sql',
        'MANUAL_SUPABASE_SETUP.sql'
      ];

      for (const file of migrationFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
          throw new Error(`Migration file missing: ${file}`);
        }
      }
    });
  }

  async testWorkflowTemplates() {
    await this.runTest('Workflow Templates', async () => {
      if (!fs.existsSync(path.join(__dirname, 'COMPLETE_WORKFLOW_TEMPLATES.md'))) {
        throw new Error('Complete workflow templates file missing');
      }
    });
  }

  async testEnvironmentFiles() {
    await this.runTest('Environment Configuration', async () => {
      const envFiles = [
        '.env.example',
        'website/.env',
        'website/client/.env'
      ];

      for (const file of envFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
          throw new Error(`Environment file missing: ${file}`);
        }
      }
    });
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    TestUtils.info('Test Results Summary');
    console.log('='.repeat(50));
    TestUtils.success(`Passed: ${this.results.passed}`);
    TestUtils.error(`Failed: ${this.results.failed}`);
    TestUtils.info(`Total: ${this.results.total}`);
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    const color = this.results.failed === 0 ? colors.green : colors.red;
    TestUtils.log(`Success Rate: ${successRate}%`, color);
    console.log('='.repeat(50));
  }

  async runAllTests() {
    TestUtils.log('\n🚀 Starting Automated Test Suite', colors.bright + colors.cyan);
    TestUtils.log('Testing n8n Automation Sidekick', colors.cyan);
    console.log('='.repeat(50));

    const startTime = Date.now();

    // Run all tests
    await this.testFrontendServer();
    await this.testBackendServer();
    await this.testWorkflowGeneration();
    await this.testAuthentication();
    await this.testTOONOptimization();
    await this.testSupabaseMigration();
    await this.testWorkflowTemplates();
    await this.testEnvironmentFiles();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    this.printResults();
    
    console.log('\n' + '='.repeat(50));
    TestUtils.log('FINAL TEST RESULTS', colors.bright);
    console.log('='.repeat(50));
    TestUtils.success(`Total Passed: ${this.results.passed}`);
    TestUtils.error(`Total Failed: ${this.results.failed}`);
    TestUtils.info(`Total Tests: ${this.results.total}`);
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    const color = this.results.failed === 0 ? colors.green : colors.red;
    TestUtils.log(`Success Rate: ${successRate}%`, color);
    TestUtils.log(`Duration: ${duration.toFixed(2)}s`);
    console.log('='.repeat(50));

    if (this.results.failed === 0) {
      TestUtils.success('🎉 All tests passed! System is ready for production.');
    } else {
      TestUtils.warning(`${this.results.failed} tests failed. Please review and fix issues.`);
    }

    return this.results.failed === 0;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new AutomatedTestRunner();
  runner.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    TestUtils.error(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = AutomatedTestRunner;
