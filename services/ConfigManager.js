/**
 * Environment-Based Configuration System
 * Manages configuration for all microservices based on environment
 */

import path from 'path';
import fs from 'fs';

class ConfigManager {
  constructor() {
    this.config = {};
    this.environment = this._detectEnvironment();
    this.loaded = false;
  }

  /**
   * Initialize configuration system
   */
  async initialize() {
    try {
      // Load environment variables
      this._loadEnvironmentVariables();

      // Load configuration files
      await this._loadConfigurationFiles();

      // Validate configuration
      this._validateConfiguration();

      // Set up hot reload in development
      if (this.environment === 'development') {
        this._setupHotReload();
      }

      this.loaded = true;
      console.log(`✅ ConfigManager initialized for ${this.environment} environment`);
      return { success: true };
    } catch (error) {
      console.error('❌ ConfigManager initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get configuration for a specific service
   */
  getServiceConfig(serviceName) {
    if (!this.loaded) {
      throw new Error('ConfigManager not initialized');
    }

    const serviceConfig = this.config.services?.[serviceName];
    if (!serviceConfig) {
      throw new Error(`Configuration not found for service: ${serviceName}`);
    }

    return {
      ...serviceConfig,
      environment: this.environment,
      isProduction: this.environment === 'production',
      isDevelopment: this.environment === 'development',
      isTest: this.environment === 'test'
    };
  }

  /**
   * Get global configuration
   */
  getGlobalConfig() {
    return {
      environment: this.environment,
      app: this.config.app,
      logging: this.config.logging,
      security: this.config.security
    };
  }

  /**
   * Update service configuration at runtime
   */
  updateServiceConfig(serviceName, updates) {
    if (!this.config.services[serviceName]) {
      throw new Error(`Service ${serviceName} not found in configuration`);
    }

    // Deep merge updates
    this.config.services[serviceName] = this._deepMerge(
      this.config.services[serviceName],
      updates
    );

    console.log(`⚙️ Updated configuration for service: ${serviceName}`);
    return { success: true };
  }

  /**
   * Get all service configurations
   */
  getAllServiceConfigs() {
    const services = {};

    for (const [serviceName, serviceConfig] of Object.entries(this.config.services || {})) {
      services[serviceName] = this.getServiceConfig(serviceName);
    }

    return services;
  }

  /**
   * Environment detection
   */
  _detectEnvironment() {
    // Check NODE_ENV first
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv && ['development', 'production', 'test'].includes(nodeEnv)) {
      return nodeEnv;
    }

    // Check for environment-specific files
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, '.env.production'))) {
      return 'production';
    }
    if (fs.existsSync(path.join(cwd, '.env.test'))) {
      return 'test';
    }

    // Default to development
    return 'development';
  }

  /**
   * Load environment variables
   */
  _loadEnvironmentVariables() {
    // Load .env file if it exists
    const dotenv = this._loadDotenv();
    if (dotenv) {
      Object.assign(process.env, dotenv);
    }

    // Load environment-specific .env file
    const envDotenv = this._loadDotenv(`.env.${this.environment}`);
    if (envDotenv) {
      Object.assign(process.env, envDotenv);
    }
  }

  /**
   * Load dotenv file
   */
  _loadDotenv(filename = '.env') {
    try {
      const envPath = path.join(process.cwd(), filename);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        return this._parseEnvContent(envContent);
      }
    } catch (error) {
      console.warn(`Failed to load ${filename}:`, error.message);
    }
    return null;
  }

  /**
   * Parse .env file content
   */
  _parseEnvContent(content) {
    const env = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }

    return env;
  }

  /**
   * Load configuration files
   */
  async _loadConfigurationFiles() {
    const configDir = path.join(process.cwd(), 'config');

    // Load default configuration
    const defaultConfig = await this._loadConfigFile(path.join(configDir, 'default.js'));
    if (defaultConfig) {
      this.config = this._deepMerge(this.config, defaultConfig);
    }

    // Load environment-specific configuration
    const envConfig = await this._loadConfigFile(path.join(configDir, `${this.environment}.js`));
    if (envConfig) {
      this.config = this._deepMerge(this.config, envConfig);
    }

    // Override with environment variables
    this._applyEnvironmentOverrides();
  }

  /**
   * Load configuration file
   */
  async _loadConfigFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        // Dynamic import for ES modules
        const configModule = await import(filePath);
        return configModule.default || configModule;
      }
    } catch (error) {
      console.warn(`Failed to load config file ${filePath}:`, error.message);
    }
    return null;
  }

  /**
   * Apply environment variable overrides
   */
  _applyEnvironmentOverrides() {
    // Override configuration with environment variables
    const overrides = {
      'app.port': process.env.PORT,
      'app.host': process.env.HOST,
      'database.url': process.env.DATABASE_URL,
      'auth.jwtSecret': process.env.JWT_SECRET,
      'auth.refreshSecret': process.env.JWT_REFRESH_SECRET,
      'services.auth.jwtSecret': process.env.JWT_SECRET,
      'services.jwt.secret': process.env.JWT_SECRET,
      'services.database.supabase.url': process.env.SUPABASE_URL,
      'services.database.supabase.anonKey': process.env.SUPABASE_ANON_KEY,
      'services.database.supabase.serviceRoleKey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'services.api.openai.apiKey': process.env.OPENAI_API_KEY,
      'services.api.anthropic.apiKey': process.env.ANTHROPIC_API_KEY
    };

    for (const [path, value] of Object.entries(overrides)) {
      if (value !== undefined) {
        this._setNestedProperty(this.config, path, value);
      }
    }
  }

  /**
   * Validate configuration
   */
  _validateConfiguration() {
    const requiredServices = ['auth', 'user', 'jwt', 'database'];

    for (const service of requiredServices) {
      if (!this.config.services?.[service]) {
        throw new Error(`Required service configuration missing: ${service}`);
      }
    }

    // Validate critical configuration values
    const validations = [
      { path: 'services.auth.jwtSecret', message: 'JWT secret is required' },
      { path: 'services.database.supabase.url', message: 'Supabase URL is required' },
      { path: 'services.database.supabase.anonKey', message: 'Supabase anon key is required' }
    ];

    for (const validation of validations) {
      const value = this._getNestedProperty(this.config, validation.path);
      if (!value) {
        throw new Error(validation.message);
      }
    }
  }

  /**
   * Set up hot reload for development
   */
  _setupHotReload() {
    const configDir = path.join(process.cwd(), 'config');

    // Watch for configuration file changes
    fs.watch(configDir, { recursive: true }, async (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        console.log(`🔄 Configuration file changed: ${filename}`);
        try {
          await this._loadConfigurationFiles();
          this._validateConfiguration();
          console.log('✅ Configuration reloaded successfully');
        } catch (error) {
          console.error('❌ Failed to reload configuration:', error);
        }
      }
    });
  }

  /**
   * Utility methods
   */

  _deepMerge(target, source) {
    const output = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this._deepMerge(output[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }

  _setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  _getNestedProperty(obj, path) {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }
}

export default ConfigManager;
