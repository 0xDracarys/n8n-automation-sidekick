/**
 * Application Bootstrap
 * Initializes the microservices architecture and starts the application
 */

import ConfigManager from './services/ConfigManager.js';
import ServiceBus from './services/ServiceBus.js';
import ServiceBasedAuthManager from './services/ServiceBasedAuthManager.js';
import AuthService from './services/AuthService.js';
import JWTService from './services/JWTService.js';
import UserService from './services/UserService.js';

// Global application instance
class Application {
  constructor() {
    this.configManager = null;
    this.serviceBus = null;
    this.authManager = null;
    this.initialized = false;
  }

  /**
   * Initialize the entire application
   */
  async initialize() {
    try {
      console.log('🚀 Initializing n8n Sidekick Application...');

      // 1. Initialize Configuration
      console.log('⚙️ Initializing configuration...');
      this.configManager = new ConfigManager();
      const configResult = await this.configManager.initialize();
      if (!configResult.success) {
        throw new Error(`Configuration initialization failed: ${configResult.error}`);
      }

      // 2. Initialize Service Bus
      console.log('🔧 Initializing service bus...');
      this.serviceBus = new ServiceBus();
      const busResult = await this.serviceBus.initialize();
      if (!busResult.success) {
        throw new Error(`Service bus initialization failed: ${busResult.error}`);
      }

      // 3. Register Core Services
      await this._registerCoreServices();

      // 4. Initialize Core Services
      await this._initializeCoreServices();

      // 5. Initialize Authentication Manager
      console.log('🔐 Initializing authentication manager...');
      this.authManager = new ServiceBasedAuthManager();
      const authResult = await this.authManager.initialize();
      if (!authResult.success) {
        throw new Error(`Authentication manager initialization failed: ${authResult.error}`);
      }

      // 6. Set up global references for backward compatibility
      this._setupGlobalReferences();

      this.initialized = true;
      console.log('✅ Application initialized successfully');

      return { success: true };
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register all core services
   */
  async _registerCoreServices() {
    console.log('📝 Registering core services...');

    // Auth Service
    const authConfig = this.configManager.getServiceConfig('auth');
    const authService = new AuthService(authConfig);
    this.serviceBus.registerService('auth', authService, { timeout: 10000 });

    // JWT Service
    const jwtConfig = this.configManager.getServiceConfig('jwt');
    const jwtService = new JWTService(jwtConfig);
    this.serviceBus.registerService('jwt', jwtService, { timeout: 5000 });

    // User Service
    const userConfig = this.configManager.getServiceConfig('user');
    const userService = new UserService(userConfig);
    this.serviceBus.registerService('user', userService, { timeout: 10000 });

    console.log('📝 Core services registered');
  }

  /**
   * Initialize all core services
   */
  async _initializeCoreServices() {
    console.log('🔧 Initializing core services...');

    const services = ['auth', 'jwt', 'user'];
    const results = {};

    for (const serviceName of services) {
      console.log(`  → Initializing ${serviceName}...`);
      const result = await this.serviceBus.call(serviceName, 'initialize');
      results[serviceName] = result;

      if (!result.success) {
        throw new Error(`Failed to initialize ${serviceName}: ${result.error}`);
      }
    }

    console.log('🔧 Core services initialized');
    return results;
  }

  /**
   * Set up global references for backward compatibility
   */
  _setupGlobalReferences() {
    // Set up global auth manager reference
    window.authManager = this.authManager;

    // Set up service bus access
    window.serviceBus = this.serviceBus;

    // Set up config access
    window.appConfig = this.configManager;

    console.log('🌐 Global references established');
  }

  /**
   * Get application status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      environment: this.configManager?.environment,
      services: this.serviceBus?.listServices(),
      config: this.configManager?.getGlobalConfig()
    };
  }

  /**
   * Health check for the entire application
   */
  async healthCheck() {
    try {
      const results = {
        application: { success: this.initialized },
        services: {},
        timestamp: Date.now()
      };

      if (this.serviceBus) {
        results.services = await this.serviceBus.healthCheckAll();
      }

      if (this.authManager) {
        results.auth = await this.authManager.healthCheck();
      }

      const allHealthy = Object.values(results.services).every(service =>
        service.success
      ) && results.auth?.success;

      return {
        success: allHealthy && results.application.success,
        ...results
      };
    } catch (error) {
      console.error('Application health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean shutdown
   */
  async shutdown() {
    try {
      console.log('🛑 Shutting down application...');

      if (this.authManager) {
        await this.authManager.cleanup();
      }

      if (this.serviceBus) {
        this.serviceBus.cleanup();
      }

      // Clear global references
      delete window.authManager;
      delete window.serviceBus;
      delete window.appConfig;

      this.initialized = false;
      console.log('✅ Application shutdown complete');
    } catch (error) {
      console.error('❌ Application shutdown failed:', error);
    }
  }
}

// Create and export global application instance
const app = new Application();

// Auto-initialize when DOM is ready (for browser environment)
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    const result = await app.initialize();
    if (!result.success) {
      console.error('Failed to initialize application:', result.error);
      // Show user-friendly error
      if (window.showNotification) {
        window.showNotification('Application initialization failed. Please refresh the page.', 'error');
      }
    }
  });

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    app.shutdown();
  });
}

export default app;
