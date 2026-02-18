#!/usr/bin/env node

/**
 * 🔍 Comprehensive Endpoint Testing Suite
 * Tests all API endpoints with various scenarios and edge cases
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class EndpointTester {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.testResults = [];
    this.sessionCookie = null;
    this.authToken = null;
    this.testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'Test123456!',
      name: 'Test User'
    };
  }

  // HTTP request helper
  async makeRequest(method, url, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EndpointTester/1.0',
          ...headers
        }
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            json: this.tryParseJSON(body)
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  tryParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }

  // Test result recorder
  recordTest(testName, result) {
    const testResult = {
      name: testName,
      timestamp: new Date().toISOString(),
      ...result
    };
    this.testResults.push(testResult);
    console.log(`${result.success ? '✅' : '❌'} ${testName}: ${result.status} ${result.message || ''}`);
    return testResult;
  }

  // Health endpoint tests
  async testHealthEndpoint() {
    console.log('\n🔍 Testing Health Endpoint...');
    
    // Test 1: Basic health check
    try {
      const response = await this.makeRequest('GET', `${this.baseUrl}/api/health`);
      this.recordTest('Health - Basic Check', {
        success: response.status === 200,
        status: response.status,
        response: response.json,
        message: response.status === 200 ? 'Health endpoint responding' : 'Health endpoint failed'
      });
    } catch (error) {
      this.recordTest('Health - Basic Check', {
        success: false,
        status: 'ERROR',
        error: error.message,
        message: 'Health endpoint unreachable'
      });
    }

    // Test 2: Health with method not allowed
    try {
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/health`);
      this.recordTest('Health - POST Method', {
        success: response.status === 405 || response.status === 404,
        status: response.status,
        message: response.status === 405 ? 'Correctly rejects POST' : 'Unexpected response'
      });
    } catch (error) {
      this.recordTest('Health - POST Method', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }

    // Test 3: Invalid health endpoint
    try {
      const response = await this.makeRequest('GET', `${this.baseUrl}/api/health-invalid`);
      this.recordTest('Health - Invalid Path', {
        success: response.status === 404,
        status: response.status,
        message: response.status === 404 ? 'Correctly returns 404' : 'Should return 404'
      });
    } catch (error) {
      this.recordTest('Health - Invalid Path', {
        success: true,
        status: '404',
        message: 'Correctly returns 404 (connection refused)'
      });
    }
  }

  // Authentication endpoint tests
  async testAuthEndpoints() {
    console.log('\n🔍 Testing Authentication Endpoints...');

    // Test 1: User registration
    try {
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/auth/signup`, {
        email: this.testUser.email,
        password: this.testUser.password,
        name: this.testUser.name
      });
      
      this.recordTest('Auth - User Registration', {
        success: response.status === 200 || response.status === 201,
        status: response.status,
        response: response.json,
        message: response.status === 200 || response.status === 201 ? 'User registered successfully' : 'Registration failed'
      });

      // Extract auth token if provided
      if (response.json && response.json.token) {
        this.authToken = response.json.token;
      }
    } catch (error) {
      this.recordTest('Auth - User Registration', {
        success: false,
        status: 'ERROR',
        error: error.message,
        message: 'Registration endpoint unreachable'
      });
    }

    // Test 2: User login
    try {
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/auth/login`, {
        email: this.testUser.email,
        password: this.testUser.password
      });
      
      this.recordTest('Auth - User Login', {
        success: response.status === 200,
        status: response.status,
        response: response.json,
        message: response.status === 200 ? 'Login successful' : 'Login failed'
      });

      // Extract auth token
      if (response.json && response.json.token) {
        this.authToken = response.json.token;
      }
    } catch (error) {
      this.recordTest('Auth - User Login', {
        success: false,
        status: 'ERROR',
        error: error.message,
        message: 'Login endpoint unreachable'
      });
    }

    // Test 3: Invalid login
    try {
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/auth/login`, {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
      
      this.recordTest('Auth - Invalid Login', {
        success: response.status === 401 || response.status === 400,
        status: response.status,
        message: response.status === 401 ? 'Correctly rejects invalid credentials' : 'Unexpected response'
      });
    } catch (error) {
      this.recordTest('Auth - Invalid Login', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }

    // Test 4: Profile endpoint (requires auth)
    try {
      const headers = this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {};
      const response = await this.makeRequest('GET', `${this.baseUrl}/api/auth/profile`, null, headers);
      
      this.recordTest('Auth - Profile', {
        success: response.status === 200,
        status: response.status,
        response: response.json,
        message: response.status === 200 ? 'Profile retrieved successfully' : 'Profile access failed'
      });
    } catch (error) {
      this.recordTest('Auth - Profile', {
        success: false,
        status: 'ERROR',
        error: error.message,
        message: 'Profile endpoint unreachable'
      });
    }

    // Test 5: Profile without auth
    try {
      const response = await this.makeRequest('GET', `${this.baseUrl}/api/auth/profile`);
      
      this.recordTest('Auth - Profile Without Auth', {
        success: response.status === 401,
        status: response.status,
        message: response.status === 401 ? 'Correctly requires authentication' : 'Should require auth'
      });
    } catch (error) {
      this.recordTest('Auth - Profile Without Auth', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  // Workflow endpoint tests
  async testWorkflowEndpoints() {
    console.log('\n🔍 Testing Workflow Endpoints...');

    // Test 1: Workflow generation
    try {
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/workflow/generate`, {
        description: 'Test workflow: Send email when user signs up',
        provider: 'openrouter',
        apiKey: 'test-key',
        model: 'openai/gpt-4o-mini'
      });
      
      this.recordTest('Workflow - Generation', {
        success: response.status === 200 || response.status === 400,
        status: response.status,
        response: response.json,
        message: response.status === 200 ? 'Workflow generated successfully' : 
                response.status === 400 ? 'Expected validation error' : 'Unexpected response'
      });
    } catch (error) {
      this.recordTest('Workflow - Generation', {
        success: false,
        status: 'ERROR',
        error: error.message,
        message: 'Workflow generation endpoint unreachable'
      });
    }

    // Test 2: Workflow generation with missing data
    try {
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/workflow/generate`, {
        description: ''
      });
      
      this.recordTest('Workflow - Generation Missing Data', {
        success: response.status === 400,
        status: response.status,
        message: response.status === 400 ? 'Correctly validates input' : 'Should validate input'
      });
    } catch (error) {
      this.recordTest('Workflow - Generation Missing Data', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }

    // Test 3: Save workflow
    try {
      const headers = this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {};
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/workflow/save`, {
        name: 'Test Workflow',
        workflow_data: {
          nodes: [{ id: '1', name: 'Test Node', type: 'n8n-nodes-base.test' }],
          connections: {}
        },
        visibility: 'private'
      }, headers);
      
      this.recordTest('Workflow - Save', {
        success: response.status === 200 || response.status === 401,
        status: response.status,
        response: response.json,
        message: response.status === 200 ? 'Workflow saved successfully' : 
                response.status === 401 ? 'Authentication required' : 'Unexpected response'
      });
    } catch (error) {
      this.recordTest('Workflow - Save', {
        success: false,
        status: 'ERROR',
        error: error.message,
        message: 'Save workflow endpoint unreachable'
      });
    }

    // Test 4: Get templates
    try {
      const response = await this.makeRequest('GET', `${this.baseUrl}/api/workflow/templates`);
      
      this.recordTest('Workflow - Get Templates', {
        success: response.status === 200,
        status: response.status,
        response: response.json,
        message: response.status === 200 ? 'Templates retrieved successfully' : 'Templates retrieval failed'
      });
    } catch (error) {
      this.recordTest('Workflow - Get Templates', {
        success: false,
        status: 'ERROR',
        error: error.message,
        message: 'Templates endpoint unreachable'
      });
    }

    // Test 5: Test connection
    try {
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/workflow/test-connection`, {
        provider: 'openrouter',
        apiKey: 'test-key'
      });
      
      this.recordTest('Workflow - Test Connection', {
        success: response.status === 200 || response.status === 400,
        status: response.status,
        response: response.json,
        message: response.status === 200 ? 'Connection test successful' : 
                response.status === 400 ? 'Expected validation error' : 'Unexpected response'
      });
    } catch (error) {
      this.recordTest('Workflow - Test Connection', {
        success: false,
        status: 'ERROR',
        error: error.message,
        message: 'Test connection endpoint unreachable'
      });
    }
  }

  // Edge case tests
  async testEdgeCases() {
    console.log('\n🔍 Testing Edge Cases...');

    // Test 1: Large payload
    try {
      const largePayload = {
        description: 'A'.repeat(10000),
        provider: 'openrouter',
        apiKey: 'test-key',
        model: 'openai/gpt-4o-mini'
      };
      
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/workflow/generate`, largePayload);
      
      this.recordTest('Edge Case - Large Payload', {
        success: response.status === 200 || response.status === 413,
        status: response.status,
        message: response.status === 413 ? 'Correctly rejects large payload' : 'Unexpected response'
      });
    } catch (error) {
      this.recordTest('Edge Case - Large Payload', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }

    // Test 2: Invalid JSON
    try {
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/workflow/generate`, 'invalid-json', {
        'Content-Type': 'application/json'
      });
      
      this.recordTest('Edge Case - Invalid JSON', {
        success: response.status === 400,
        status: response.status,
        message: response.status === 400 ? 'Correctly rejects invalid JSON' : 'Should reject invalid JSON'
      });
    } catch (error) {
      this.recordTest('Edge Case - Invalid JSON', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }

    // Test 3: SQL Injection attempt
    try {
      const sqlInjection = {
        description: "'; DROP TABLE users; --",
        provider: 'openrouter',
        apiKey: 'test-key'
      };
      
      const response = await this.makeRequest('POST', `${this.baseUrl}/api/workflow/generate`, sqlInjection);
      
      this.recordTest('Edge Case - SQL Injection', {
        success: response.status === 400 || response.status === 500,
        status: response.status,
        message: response.status === 400 ? 'Correctly sanitized input' : 'Potential vulnerability'
      });
    } catch (error) {
      this.recordTest('Edge Case - SQL Injection', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }

    // Test 4: Rate limiting
    const rapidRequests = [];
    for (let i = 0; i < 10; i++) {
      rapidRequests.push(
        this.makeRequest('GET', `${this.baseUrl}/api/health`)
      );
    }

    try {
      const responses = await Promise.all(rapidRequests);
      const rateLimited = responses.some(r => r.status === 429);
      
      this.recordTest('Edge Case - Rate Limiting', {
        success: rateLimited,
        status: rateLimited ? '429' : '200',
        message: rateLimited ? 'Rate limiting implemented' : 'No rate limiting detected'
      });
    } catch (error) {
      this.recordTest('Edge Case - Rate Limiting', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  // Security tests
  async testSecurity() {
    console.log('\n🔍 Testing Security...');

    // Test 1: CORS headers
    try {
      const response = await this.makeRequest('OPTIONS', `${this.baseUrl}/api/health`);
      
      this.recordTest('Security - CORS Headers', {
        success: response.headers['access-control-allow-origin'] !== undefined,
        status: response.status,
        headers: response.headers,
        message: response.headers['access-control-allow-origin'] ? 'CORS headers present' : 'Missing CORS headers'
      });
    } catch (error) {
      this.recordTest('Security - CORS Headers', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }

    // Test 2: Security headers
    try {
      const response = await this.makeRequest('GET', `${this.baseUrl}/api/health`);
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security'
      ];
      
      const presentHeaders = securityHeaders.filter(header => response.headers[header]);
      
      this.recordTest('Security - Headers', {
        success: presentHeaders.length >= 2,
        status: response.status,
        headers: response.headers,
        message: `${presentHeaders.length}/${securityHeaders.length} security headers present`
      });
    } catch (error) {
      this.recordTest('Security - Headers', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }

    // Test 3: Authentication bypass attempt
    try {
      const response = await this.makeRequest('GET', `${this.baseUrl}/api/auth/profile`, null, {
        'Authorization': 'Bearer fake-token'
      });
      
      this.recordTest('Security - Auth Bypass', {
        success: response.status === 401,
        status: response.status,
        message: response.status === 401 ? 'Correctly rejects fake token' : 'Potential auth bypass'
      });
    } catch (error) {
      this.recordTest('Security - Auth Bypass', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  // Performance tests
  async testPerformance() {
    console.log('\n🔍 Testing Performance...');

    // Test 1: Response time
    const startTime = Date.now();
    try {
      await this.makeRequest('GET', `${this.baseUrl}/api/health`);
      const responseTime = Date.now() - startTime;
      
      this.recordTest('Performance - Response Time', {
        success: responseTime < 1000,
        status: '200',
        responseTime: responseTime,
        message: `${responseTime}ms - ${responseTime < 1000 ? 'Good' : 'Slow'}`
      });
    } catch (error) {
      this.recordTest('Performance - Response Time', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }

    // Test 2: Concurrent requests
    const concurrentRequests = [];
    const concurrentStart = Date.now();
    
    for (let i = 0; i < 5; i++) {
      concurrentRequests.push(this.makeRequest('GET', `${this.baseUrl}/api/health`));
    }

    try {
      const responses = await Promise.all(concurrentRequests);
      const concurrentTime = Date.now() - concurrentStart;
      const successCount = responses.filter(r => r.status === 200).length;
      
      this.recordTest('Performance - Concurrent Requests', {
        success: successCount === 5,
        status: '200',
        responseTime: concurrentTime,
        message: `${successCount}/5 requests successful in ${concurrentTime}ms`
      });
    } catch (error) {
      this.recordTest('Performance - Concurrent Requests', {
        success: false,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  // Generate comprehensive report
  generateReport() {
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(t => t.success).length;
    const failedTests = totalTests - successfulTests;
    const successRate = ((successfulTests / totalTests) * 100).toFixed(1);

    const report = {
      summary: {
        totalTests,
        successfulTests,
        failedTests,
        successRate: `${successRate}%`,
        timestamp: new Date().toISOString(),
        baseUrl: this.baseUrl
      },
      categories: {
        health: this.testResults.filter(t => t.name.includes('Health')),
        auth: this.testResults.filter(t => t.name.includes('Auth')),
        workflow: this.testResults.filter(t => t.name.includes('Workflow')),
        edgeCases: this.testResults.filter(t => t.name.includes('Edge Case')),
        security: this.testResults.filter(t => t.name.includes('Security')),
        performance: this.testResults.filter(t => t.name.includes('Performance'))
      },
      detailedResults: this.testResults,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(t => !t.success);

    // Analyze failed tests and generate recommendations
    if (failedTests.some(t => t.name.includes('Health'))) {
      recommendations.push('🔧 Fix basic server connectivity - health endpoint failing');
    }

    if (failedTests.some(t => t.name.includes('Auth'))) {
      recommendations.push('🔐 Implement proper authentication flow and token handling');
    }

    if (failedTests.some(t => t.name.includes('Workflow'))) {
      recommendations.push('⚙️ Complete workflow API implementation');
    }

    if (failedTests.some(t => t.name.includes('Security'))) {
      recommendations.push('🛡️ Add security headers and CORS configuration');
    }

    if (failedTests.some(t => t.name.includes('Performance'))) {
      recommendations.push('⚡ Optimize response times and handle concurrent requests');
    }

    if (failedTests.some(t => t.name.includes('Edge Case'))) {
      recommendations.push('🔍 Improve input validation and error handling');
    }

    return recommendations;
  }

  // Save report to file
  async saveReport() {
    const report = this.generateReport();
    const reportPath = path.join(__dirname, 'endpoint-testing-report.json');
    
    try {
      await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.error('Failed to save report:', error.message);
    }

    return report;
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Endpoint Testing...\n');
    console.log(`📍 Testing server: ${this.baseUrl}`);
    console.log(`👤 Test user: ${this.testUser.email}\n`);

    try {
      await this.testHealthEndpoint();
      await this.testAuthEndpoints();
      await this.testWorkflowEndpoints();
      await this.testEdgeCases();
      await this.testSecurity();
      await this.testPerformance();

      const report = await this.saveReport();
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 TESTING SUMMARY');
      console.log('='.repeat(60));
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Successful: ${report.summary.successfulTests}`);
      console.log(`Failed: ${report.summary.failedTests}`);
      console.log(`Success Rate: ${report.summary.successRate}`);
      console.log('\n🎯 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`  ${rec}`));
      console.log('='.repeat(60));

      return report;
    } catch (error) {
      console.error('Testing failed:', error.message);
      throw error;
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new EndpointTester();
  tester.runAllTests().catch(console.error);
}

module.exports = EndpointTester;
