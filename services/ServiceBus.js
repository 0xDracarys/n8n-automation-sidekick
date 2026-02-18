/**
 * Service Communication Layer
 * Handles inter-service communication, error handling, and middleware
 */

class ServiceBus {
  constructor() {
    this.services = new Map();
    this.middlewares = [];
    this.serviceTimeouts = new Map();
    this.initialized = false;
  }

  async initialize() {
    try {
      // Set up default middlewares
      this.use(this.errorHandlingMiddleware.bind(this));
      this.use(this.loggingMiddleware.bind(this));
      this.use(this.timeoutMiddleware.bind(this));

      this.initialized = true;
      console.log('✅ ServiceBus initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ ServiceBus initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Service Registration
   */

  registerService(name, service, config = {}) {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }

    this.services.set(name, {
      instance: service,
      config: config,
      health: 'unknown',
      lastHealthCheck: null
    });

    console.log(`📝 Service registered: ${name}`);
  }

  unregisterService(name) {
    if (this.services.has(name)) {
      this.services.delete(name);
      console.log(`📝 Service unregistered: ${name}`);
      return true;
    }
    return false;
  }

  getService(name) {
    const service = this.services.get(name);
    return service ? service.instance : null;
  }

  /**
   * Service Communication
   */

  async call(serviceName, method, ...args) {
    try {
      const service = this.services.get(serviceName);
      if (!service) {
        throw new ServiceError(`Service ${serviceName} not found`, 'SERVICE_NOT_FOUND');
      }

      if (!service.instance[method]) {
        throw new ServiceError(`Method ${method} not found in service ${serviceName}`, 'METHOD_NOT_FOUND');
      }

      // Prepare context for middlewares
      const context = {
        serviceName,
        method,
        args,
        service,
        startTime: Date.now()
      };

      // Apply middlewares
      let processedContext = context;
      for (const middleware of this.middlewares) {
        processedContext = await middleware(processedContext);
      }

      // Execute service method
      const result = await service.instance[method](...processedContext.args);

      // Post-processing
      processedContext.result = result;
      processedContext.endTime = Date.now();
      processedContext.duration = processedContext.endTime - processedContext.startTime;

      return result;
    } catch (error) {
      console.error(`ServiceBus.call error for ${serviceName}.${method}:`, error);

      // Convert errors to ServiceError if not already
      if (!(error instanceof ServiceError)) {
        throw new ServiceError(error.message, 'SERVICE_ERROR', error);
      }

      throw error;
    }
  }

  /**
   * Middleware Management
   */

  use(middleware) {
    this.middlewares.push(middleware);
  }

  removeMiddleware(middleware) {
    const index = this.middlewares.indexOf(middleware);
    if (index > -1) {
      this.middlewares.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Built-in Middlewares
   */

  async errorHandlingMiddleware(context) {
    try {
      return context;
    } catch (error) {
      console.error('Error handling middleware error:', error);
      throw new ServiceError('Middleware error', 'MIDDLEWARE_ERROR', error);
    }
  }

  async loggingMiddleware(context) {
    const { serviceName, method, args } = context;

    console.log(`🔄 Service call: ${serviceName}.${method}`, {
      argsCount: args.length,
      timestamp: new Date().toISOString()
    });

    return context;
  }

  async timeoutMiddleware(context) {
    const { serviceName, service } = context;
    const timeout = service.config.timeout || 30000; // 30 seconds default

    // Set up timeout
    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new ServiceError(`Service ${serviceName} call timed out after ${timeout}ms`, 'TIMEOUT'));
      }, timeout);

      // Store timer for cleanup
      this.serviceTimeouts.set(`${serviceName}_${Date.now()}`, timer);
    });

    // Race between service call and timeout
    context.timeoutPromise = timeoutPromise;

    return context;
  }

  /**
   * Service Health Monitoring
   */

  async healthCheck(serviceName) {
    try {
      const service = this.services.get(serviceName);
      if (!service) {
        return { success: false, error: 'Service not found' };
      }

      // Check if service has health check method
      if (typeof service.instance.healthCheck === 'function') {
        const healthResult = await service.instance.healthCheck();
        service.health = healthResult.success ? 'healthy' : 'unhealthy';
        service.lastHealthCheck = Date.now();

        return healthResult;
      } else {
        // Basic health check - service exists and is registered
        service.health = 'healthy';
        service.lastHealthCheck = Date.now();

        return {
          success: true,
          status: 'healthy',
          message: 'Service is registered and available'
        };
      }
    } catch (error) {
      console.error(`Health check failed for ${serviceName}:`, error);
      return { success: false, error: error.message };
    }
  }

  async healthCheckAll() {
    const results = {};

    for (const [serviceName] of this.services) {
      results[serviceName] = await this.healthCheck(serviceName);
    }

    return results;
  }

  /**
   * Service Discovery
   */

  listServices() {
    const services = {};

    for (const [name, service] of this.services) {
      services[name] = {
        name,
        health: service.health,
        lastHealthCheck: service.lastHealthCheck,
        methods: Object.getOwnPropertyNames(service.instance.constructor.prototype)
          .filter(method => method !== 'constructor' && typeof service.instance[method] === 'function')
      };
    }

    return services;
  }

  /**
   * Service Configuration
   */

  updateServiceConfig(serviceName, config) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new ServiceError(`Service ${serviceName} not found`, 'SERVICE_NOT_FOUND');
    }

    service.config = { ...service.config, ...config };
    console.log(`⚙️ Updated config for service: ${serviceName}`);

    return { success: true };
  }

  /**
   * Service Metrics
   */

  getMetrics() {
    const metrics = {
      totalServices: this.services.size,
      services: {},
      middlewares: this.middlewares.length,
      timestamp: Date.now()
    };

    for (const [name, service] of this.services) {
      metrics.services[name] = {
        health: service.health,
        lastHealthCheck: service.lastHealthCheck,
        config: service.config,
        methods: Object.keys(service.instance).filter(key =>
          typeof service.instance[key] === 'function'
        ).length
      };
    }

    return metrics;
  }

  /**
   * Cleanup
   */

  cleanup() {
    // Clear timeouts
    for (const [key, timer] of this.serviceTimeouts) {
      clearTimeout(timer);
    }
    this.serviceTimeouts.clear();

    // Clear services
    this.services.clear();
    this.middlewares.length = 0;

    console.log('🧹 ServiceBus cleaned up');
  }
}

/**
 * Service Error Class
 */
class ServiceError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Service Contracts Definition
 */
const SERVICE_CONTRACTS = {
  auth: {
    signIn: 'async (credentials) => Promise<UserSession>',
    signOut: 'async (sessionId) => Promise<void>',
    validateToken: 'async (token) => Promise<User>',
    refreshToken: 'async (refreshToken) => Promise<TokenPair>',
    getUserById: 'async (userId) => Promise<User>',
    signUp: 'async (userData) => Promise<UserSession>',
    resetPassword: 'async (email) => Promise<void>',
    verifyEmail: 'async (token) => Promise<void>'
  },

  user: {
    createUser: 'async (userData) => Promise<User>',
    updateUser: 'async (userId, updates) => Promise<User>',
    deleteUser: 'async (userId) => Promise<void>',
    getUserById: 'async (userId) => Promise<User>',
    getUserByEmail: 'async (email) => Promise<User>',
    updateProfile: 'async (userId, profileData) => Promise<Profile>',
    getUserProfile: 'async (userId) => Promise<Profile>',
    updateSettings: 'async (userId, settings) => Promise<Settings>',
    updatePreferences: 'async (userId, preferences) => Promise<Preferences>',
    updateUserStats: 'async (userId, stats) => Promise<Stats>',
    getUserStats: 'async (userId) => Promise<Stats>',
    searchUsers: 'async (query, options) => Promise<User[]>',
    listUsers: 'async (options) => Promise<User[]>'
  },

  jwt: {
    generateAccessToken: 'async (payload) => Promise<string>',
    verifyAccessToken: 'async (token) => Promise<Payload>',
    generateRefreshToken: 'async (payload) => Promise<string>',
    verifyRefreshToken: 'async (token) => Promise<Payload>',
    revokeToken: 'async (token) => Promise<void>',
    revokeAllUserTokens: 'async (userId) => Promise<void>',
    getTokenInfo: 'async (token) => Promise<TokenInfo>',
    refreshAccessToken: 'async (refreshToken) => Promise<TokenPair>',
    healthCheck: 'async () => Promise<HealthStatus>'
  },

  workflow: {
    generateWorkflow: 'async (prompt, options) => Promise<Workflow>',
    validateWorkflow: 'async (workflow) => Promise<ValidationResult>',
    saveWorkflow: 'async (userId, workflow, metadata) => Promise<SavedWorkflow>',
    getUserWorkflows: 'async (userId, filters) => Promise<Workflow[]>',
    executeWorkflow: 'async (workflowId, inputs) => Promise<ExecutionResult>',
    deleteWorkflow: 'async (workflowId) => Promise<void>',
    updateWorkflow: 'async (workflowId, updates) => Promise<Workflow>'
  },

  database: {
    query: 'async (table, query) => Promise<Result[]>',
    insert: 'async (table, data) => Promise<InsertedRecord>',
    update: 'async (table, id, data) => Promise<UpdatedRecord>',
    delete: 'async (table, id) => Promise<void>',
    transaction: 'async (operations) => Promise<TransactionResult>',
    getUserById: 'async (id) => Promise<User>',
    getUserByEmail: 'async (email) => Promise<User>',
    saveUser: 'async (userData) => Promise<User>',
    updateUser: 'async (id, updates) => Promise<User>',
    searchUsers: 'async (query, options) => Promise<User[]>',
    listUsers: 'async (options) => Promise<User[]>'
  },

  api: {
    callAI: 'async (provider, prompt, options) => Promise<AIResponse>',
    callN8n: 'async (endpoint, data, options) => Promise<N8nResponse>',
    getExternalData: 'async (service, endpoint, params) => Promise<ExternalData>',
    uploadFile: 'async (file, metadata) => Promise<UploadResult>',
    downloadFile: 'async (fileId) => Promise<FileBlob>',
    healthCheck: 'async () => Promise<HealthStatus>'
  }
};

export { ServiceBus, ServiceError, SERVICE_CONTRACTS };
export default ServiceBus;
