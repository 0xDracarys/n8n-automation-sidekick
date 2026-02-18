#!/usr/bin/env node

/**
 * Comprehensive Waterfall Testing Suite for n8n Automation Sidekick
 * Tests every endpoint and feature in sequence with detailed validation
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5175',
  apiBaseUrl: 'http://localhost:3001',
  timeout: 15000,
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

  static header(message) {
    this.log(`\n🔍 ${message}`, colors.bright + colors.cyan);
    this.log('='.repeat(60));
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
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

// Waterfall Test Suite
class WaterfallTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.testData = {
      user: null,
      session: null,
      workflow: null,
      templateId: null
    };
  }

  async runTest(name, testFn, category = 'General') {
    this.results.total++;
    TestUtils.info(`Running: ${name}`);
    
    const startTime = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.passed++;
      this.results.details.push({
        name,
        status: 'PASSED',
        duration,
        category,
        result
      });
      
      TestUtils.success(`${name} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.failed++;
      this.results.details.push({
        name,
        status: 'FAILED',
        duration,
        category,
        error: error.message
      });
      
      TestUtils.error(`${name} - FAILED (${duration}ms): ${error.message}`);
      throw error;
    }
  }

  // Phase 1: Server Health Tests
  async testServerHealth() {
    TestUtils.header('Phase 1: Server Health Tests');

    await this.runTest('Frontend Server Health', async () => {
      const response = await TestUtils.fetchWithTimeout(TEST_CONFIG.baseUrl);
      if (!response.ok) {
        throw new Error(`Frontend server returned ${response.status}`);
      }
      const text = await response.text();
      if (!text.includes('<html') && !text.includes('<!DOCTYPE')) {
        throw new Error('Frontend not serving HTML');
      }
      return { status: response.status, contentType: response.headers.get('content-type') };
    }, 'Server Health');

    await this.runTest('Backend Server Health', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`Backend server returned ${response.status}`);
      }
      const data = await response.json();
      if (data.status !== 'ok') {
        throw new Error('Backend health check failed');
      }
      return data;
    }, 'Server Health');

    await this.runTest('CORS Configuration', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/health`, {
        headers: {
          'Origin': TEST_CONFIG.baseUrl,
          'Access-Control-Request-Method': 'GET'
        }
      });
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (!corsHeader) {
        throw new Error('CORS not properly configured');
      }
      return { cors: corsHeader };
    }, 'Server Health');
  }

  // Phase 2: Authentication Tests
  async testAuthentication() {
    TestUtils.header('Phase 2: Authentication Tests');

    await this.runTest('Signup Endpoint Exists', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'testpassword123',
          name: 'Test User'
        })
      });
      
      // Should return 200 or 400 (endpoint exists)
      if (response.status !== 200 && response.status !== 400) {
        throw new Error(`Signup endpoint returned ${response.status}`);
      }
      
      const data = await response.json();
      return { status: response.status, hasError: !!data.error };
    }, 'Authentication');

    await this.runTest('Login Endpoint Exists', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123'
        })
      });
      
      // Should return 200 or 400 (endpoint exists)
      if (response.status !== 200 && response.status !== 400) {
        throw new Error(`Login endpoint returned ${response.status}`);
      }
      
      const data = await response.json();
      return { status: response.status, hasError: !!data.error };
    }, 'Authentication');

    await this.runTest('Profile Endpoint Exists', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/auth/profile`);
      
      // Should return 401 for unauthenticated (endpoint exists)
      if (response.status !== 401) {
        throw new Error(`Profile endpoint returned ${response.status}`);
      }
      
      return { status: response.status };
    }, 'Authentication');

    await this.runTest('Logout Endpoint Exists', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/auth/logout`, {
        method: 'POST'
      });
      
      // Should return 200 or 401 (endpoint exists)
      if (response.status !== 200 && response.status !== 401) {
        throw new Error(`Logout endpoint returned ${response.status}`);
      }
      
      return { status: response.status };
    }, 'Authentication');
  }

  // Phase 3: Workflow Generation Tests
  async testWorkflowGeneration() {
    TestUtils.header('Phase 3: Workflow Generation Tests');

    await this.runTest('Workflow Generation Endpoint', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/workflow/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Create a simple workflow with webhook trigger and email action',
          provider: 'openrouter',
          apiKey: 'test-key',
          model: 'openai/gpt-4o-mini'
        })
      });
      
      // Should return 400 for invalid API key (endpoint exists)
      if (response.status !== 400 && response.status !== 500) {
        throw new Error(`Workflow generation endpoint returned ${response.status}`);
      }
      
      const data = await response.json();
      return { status: response.status, hasError: !!data.error };
    }, 'Workflow Generation');

    await this.runTest('Test Connection Endpoint', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/workflow/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'openrouter',
          apiKey: 'test-key'
        })
      });
      
      // Should return 400 for invalid API key (endpoint exists)
      if (response.status !== 400 && response.status !== 500) {
        throw new Error(`Test connection endpoint returned ${response.status}`);
      }
      
      const data = await response.json();
      return { status: response.status, hasError: !!data.error };
    }, 'Workflow Generation');

    await this.runTest('Save Workflow Endpoint', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/workflow/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: { nodes: [], connections: {} },
          name: 'Test Workflow',
          description: 'Test Description',
          userId: 'test-user-id'
        })
      });
      
      // Should return 400 for missing auth (endpoint exists)
      if (response.status !== 400 && response.status !== 500) {
        throw new Error(`Save workflow endpoint returned ${response.status}`);
      }
      
      const data = await response.json();
      return { status: response.status, hasError: !!data.error };
    }, 'Workflow Generation');

    await this.runTest('Get Templates Endpoint', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/workflow/templates`);
      
      // Should return 200 or 500 (endpoint exists)
      if (response.status !== 200 && response.status !== 500) {
        throw new Error(`Templates endpoint returned ${response.status}`);
      }
      
      const data = await response.json();
      return { status: response.status, hasData: !!data.templates };
    }, 'Workflow Generation');
  }

  // Phase 4: Frontend Feature Tests
  async testFrontendFeatures() {
    TestUtils.header('Phase 4: Frontend Feature Tests');

    await this.runTest('Builder Page Loads', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.baseUrl}/builder`);
      if (!response.ok) {
        throw new Error(`Builder page returned ${response.status}`);
      }
      const text = await response.text();
      if (!text.includes('builder') && !text.includes('Builder')) {
        throw new Error('Builder page not loading correctly');
      }
      return { status: response.status, hasBuilderContent: true };
    }, 'Frontend Features');

    await this.runTest('Templates Page Loads', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.baseUrl}/templates`);
      if (!response.ok) {
        throw new Error(`Templates page returned ${response.status}`);
      }
      const text = await response.text();
      if (!text.includes('template') && !text.includes('Template')) {
        throw new Error('Templates page not loading correctly');
      }
      return { status: response.status, hasTemplateContent: true };
    }, 'Frontend Features');

    await this.runTest('Services Page Loads', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.baseUrl}/services`);
      if (!response.ok) {
        throw new Error(`Services page returned ${response.status}`);
      }
      const text = await response.text();
      if (!text.includes('service') && !text.includes('Service')) {
        throw new Error('Services page not loading correctly');
      }
      return { status: response.status, hasServiceContent: true };
    }, 'Frontend Features');

    await this.runTest('Login Page Loads', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.baseUrl}/login`);
      if (!response.ok) {
        throw new Error(`Login page returned ${response.status}`);
      }
      const text = await response.text();
      if (!text.includes('login') && !text.includes('Login')) {
        throw new Error('Login page not loading correctly');
      }
      return { status: response.status, hasLoginContent: true };
    }, 'Frontend Features');

    await this.runTest('Signup Page Loads', async () => {
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.baseUrl}/signup`);
      if (!response.ok) {
        throw new Error(`Signup page returned ${response.status}`);
      }
      const text = await response.text();
      if (!text.includes('signup') && !text.includes('Signup')) {
        throw new Error('Signup page not loading correctly');
      }
      return { status: response.status, hasSignupContent: true };
    }, 'Frontend Features');
  }

  // Phase 5: File Structure Tests
  async testFileStructure() {
    TestUtils.header('Phase 5: File Structure Tests');

    await this.runTest('Core Files Exist', async () => {
      const requiredFiles = [
        'package.json',
        'website/package.json',
        'website/client/package.json',
        'website/server/package.json',
        'website/client/src/App.jsx',
        'website/server/index.js'
      ];

      for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
          throw new Error(`Missing required file: ${file}`);
        }
      }
      
      return { filesChecked: requiredFiles.length };
    }, 'File Structure');

    await this.runTest('TOON Files Exist', async () => {
      const toonFiles = [
        'toon-converter.js',
        'toon-workflow-optimizer.js',
        'TOON_INTEGRATION.md'
      ];

      for (const file of toonFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
          throw new Error(`Missing TOON file: ${file}`);
        }
      }
      
      return { toonFilesChecked: toonFiles.length };
    }, 'File Structure');

    await this.runTest('Supabase Files Exist', async () => {
      const supabaseFiles = [
        'SUPABASE_MIGRATION.sql',
        'MANUAL_SUPABASE_SETUP.sql',
        'website/client/src/lib/supabase.js'
      ];

      for (const file of supabaseFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
          throw new Error(`Missing Supabase file: ${file}`);
        }
      }
      
      return { supabaseFilesChecked: supabaseFiles.length };
    }, 'File Structure');

    await this.runTest('Template Files Exist', async () => {
      const templateFiles = [
        'COMPLETE_WORKFLOW_TEMPLATES.md',
        'workflow-engine.js'
      ];

      for (const file of templateFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
          throw new Error(`Missing template file: ${file}`);
        }
      }
      
      return { templateFilesChecked: templateFiles.length };
    }, 'File Structure');
  }

  // Phase 6: Configuration Tests
  async testConfiguration() {
    TestUtils.header('Phase 6: Configuration Tests');

    await this.runTest('Environment Files Exist', async () => {
      const envFiles = [
        '.env.example',
        'website/.env',
        'website/client/.env'
      ];

      for (const file of envFiles) {
        if (!fs.existsSync(path.join(__dirname, file))) {
          throw new Error(`Missing environment file: ${file}`);
        }
      }
      
      return { envFilesChecked: envFiles.length };
    }, 'Configuration');

    await this.runTest('Package.json Scripts', async () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      if (!packageJson.scripts) {
        throw new Error('Root package.json missing scripts');
      }
      
      const websitePackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'website/package.json'), 'utf8'));
      if (!websitePackageJson.scripts) {
        throw new Error('Website package.json missing scripts');
      }
      
      return { hasRootScripts: true, hasWebsiteScripts: true };
    }, 'Configuration');

    await this.runTest('Dependencies Installed', async () => {
      const requiredDirs = [
        'node_modules',
        'website/node_modules',
        'website/client/node_modules',
        'website/server/node_modules'
      ];

      for (const dir of requiredDirs) {
        if (!fs.existsSync(path.join(__dirname, dir))) {
          throw new Error(`Missing node_modules: ${dir}`);
        }
      }
      
      return { dependenciesChecked: requiredDirs.length };
    }, 'Configuration');
  }

  // Phase 7: Performance Tests
  async testPerformance() {
    TestUtils.header('Phase 7: Performance Tests');

    await this.runTest('Frontend Load Time', async () => {
      const startTime = Date.now();
      const response = await TestUtils.fetchWithTimeout(TEST_CONFIG.baseUrl);
      const loadTime = Date.now() - startTime;

      if (loadTime > 5000) {
        throw new Error(`Frontend load time too slow: ${loadTime}ms`);
      }

      return { loadTime, status: response.status };
    }, 'Performance');

    await this.runTest('API Response Time', async () => {
      const startTime = Date.now();
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/health`);
      const responseTime = Date.now() - startTime;

      if (responseTime > 2000) {
        throw new Error(`API response time too slow: ${responseTime}ms`);
      }

      return { responseTime, status: response.status };
    }, 'Performance');

    await this.runTest('Concurrent Requests', async () => {
      const requests = [];
      const startTime = Date.now();

      for (let i = 0; i < 5; i++) {
        requests.push(TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/health`));
      }

      const results = await Promise.all(requests);
      const endTime = Date.now();

      const failed = results.filter(r => !r.ok).length;
      if (failed > 0) {
        throw new Error(`${failed} concurrent requests failed`);
      }

      return { 
        totalTime: endTime - startTime,
        requestsSucceeded: results.length - failed,
        requestsFailed: failed
      };
    }, 'Performance');
  }

  // Phase 8: Integration Tests
  async testIntegration() {
    TestUtils.header('Phase 8: Integration Tests');

    await this.runTest('Frontend-Backend Communication', async () => {
      // Test if frontend can reach backend
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/health`);
      if (!response.ok) {
        throw new Error('Frontend cannot reach backend');
      }

      const data = await response.json();
      return { backendReachable: true, backendStatus: data.status };
    }, 'Integration');

    await this.runTest('Error Handling', async () => {
      // Test invalid endpoint
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/invalid-endpoint`);
      
      if (response.status !== 404) {
        throw new Error(`Expected 404 for invalid endpoint, got ${response.status}`);
      }

      return { errorHandlingWorking: true };
    }, 'Integration');

    await this.runTest('Request Validation', async () => {
      // Test invalid JSON
      const response = await TestUtils.fetchWithTimeout(`${TEST_CONFIG.apiBaseUrl}/api/workflow/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400 for invalid JSON, got ${response.status}`);
      }

      return { validationWorking: true };
    }, 'Integration');
  }

  // Generate detailed report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    TestUtils.log('📊 COMPREHENSIVE TEST REPORT', colors.bright + colors.cyan);
    console.log('='.repeat(80));

    // Summary
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    TestUtils.log(`\n📈 OVERALL SUMMARY:`, colors.bright);
    TestUtils.success(`Tests Passed: ${this.results.passed}`);
    TestUtils.error(`Tests Failed: ${this.results.failed}`);
    TestUtils.info(`Total Tests: ${this.results.total}`);
    
    const rateColor = this.results.failed === 0 ? colors.green : colors.red;
    TestUtils.log(`Success Rate: ${successRate}%`, rateColor);

    // Category breakdown
    const categories = {};
    this.results.details.forEach(test => {
      if (!categories[test.category]) {
        categories[test.category] = { passed: 0, failed: 0, total: 0 };
      }
      categories[test.category].total++;
      if (test.status === 'PASSED') {
        categories[test.category].passed++;
      } else {
        categories[test.category].failed++;
      }
    });

    TestUtils.log(`\n📋 CATEGORY BREAKDOWN:`, colors.bright);
    Object.entries(categories).forEach(([category, stats]) => {
      const rate = ((stats.passed / stats.total) * 100).toFixed(1);
      const color = stats.failed === 0 ? colors.green : colors.yellow;
      TestUtils.log(`${category}: ${stats.passed}/${stats.total} (${rate}%)`, color);
    });

    // Failed tests details
    if (this.results.failed > 0) {
      TestUtils.log(`\n❌ FAILED TESTS DETAILS:`, colors.bright + colors.red);
      this.results.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          TestUtils.log(`  • ${test.name}: ${test.error}`, colors.red);
        });
    }

    // Performance summary
    const performanceTests = this.results.details.filter(test => test.category === 'Performance');
    if (performanceTests.length > 0) {
      TestUtils.log(`\n⚡ PERFORMANCE SUMMARY:`, colors.bright);
      performanceTests.forEach(test => {
        if (test.result && test.result.loadTime) {
          TestUtils.log(`  • ${test.name}: ${test.result.loadTime}ms`, colors.blue);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    
    if (this.results.failed === 0) {
      TestUtils.success('🎉 ALL TESTS PASSED! System is fully operational and ready for production.');
    } else {
      TestUtils.warning(`⚠️ ${this.results.failed} tests failed. Please review and fix issues before deployment.`);
    }
    
    console.log('='.repeat(80));
    
    return this.results.failed === 0;
  }

  // Run complete waterfall test suite
  async runCompleteWaterfallTests() {
    TestUtils.log('\n🚀 STARTING COMPREHENSIVE WATERFALL TEST SUITE', colors.bright + colors.cyan);
    TestUtils.log('Testing every endpoint and feature sequentially', colors.cyan);
    console.log('='.repeat(80));

    const startTime = Date.now();

    try {
      // Phase 1: Server Health
      await this.testServerHealth();

      // Phase 2: Authentication
      await this.testAuthentication();

      // Phase 3: Workflow Generation
      await this.testWorkflowGeneration();

      // Phase 4: Frontend Features
      await this.testFrontendFeatures();

      // Phase 5: File Structure
      await this.testFileStructure();

      // Phase 6: Configuration
      await this.testConfiguration();

      // Phase 7: Performance
      await this.testPerformance();

      // Phase 8: Integration
      await this.testIntegration();

    } catch (error) {
      TestUtils.error(`Test suite interrupted: ${error.message}`);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    TestUtils.log(`\n⏱️ Test Duration: ${duration.toFixed(2)} seconds`, colors.blue);

    // Generate comprehensive report
    return this.generateReport();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const suite = new WaterfallTestSuite();
  suite.runCompleteWaterfallTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    TestUtils.error(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = WaterfallTestSuite;
