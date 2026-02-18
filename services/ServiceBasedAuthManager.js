/**
 * Service-Based Authentication Manager
 * Uses microservices architecture instead of hardcoded authentication
 */

import ServiceBus from './services/ServiceBus.js';
import AuthService from './services/AuthService.js';
import JWTService from './services/JWTService.js';
import UserService from './services/UserService.js';
import ConfigManager from './services/ConfigManager.js';

class ServiceBasedAuthManager {
  constructor() {
    this.serviceBus = null;
    this.configManager = null;
    this.currentUser = null;
    this.isAuthenticated = false;
    this.initialized = false;
    this.authStateListeners = [];
  }

  /**
   * Initialize the service-based auth manager
   */
  async initialize() {
    try {
      console.log('🔧 Initializing ServiceBasedAuthManager...');

      // Initialize configuration manager
      this.configManager = new ConfigManager();
      const configResult = await this.configManager.initialize();
      if (!configResult.success) {
        throw new Error(`ConfigManager initialization failed: ${configResult.error}`);
      }

      // Initialize service bus
      this.serviceBus = new ServiceBus();
      const busResult = await this.serviceBus.initialize();
      if (!busResult.success) {
        throw new Error(`ServiceBus initialization failed: ${busResult.error}`);
      }

      // Register services
      await this._registerServices();

      // Initialize services
      await this._initializeServices();

      // Set up auth state monitoring
      this._setupAuthStateMonitoring();

      // Check for existing session
      await this._restoreSession();

      this.initialized = true;
      console.log('✅ ServiceBasedAuthManager initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ ServiceBasedAuthManager initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register all authentication-related services
   */
  async _registerServices() {
    // Register AuthService
    const authConfig = this.configManager.getServiceConfig('auth');
    const authService = new AuthService(authConfig);
    this.serviceBus.registerService('auth', authService, { timeout: 10000 });

    // Register JWTService
    const jwtConfig = this.configManager.getServiceConfig('jwt');
    const jwtService = new JWTService(jwtConfig);
    this.serviceBus.registerService('jwt', jwtService, { timeout: 5000 });

    // Register UserService
    const userConfig = this.configManager.getServiceConfig('user');
    const userService = new UserService(userConfig);
    this.serviceBus.registerService('user', userService, { timeout: 10000 });
  }

  /**
   * Initialize all registered services
   */
  async _initializeServices() {
    const services = ['auth', 'jwt', 'user'];

    for (const serviceName of services) {
      console.log(`🔧 Initializing service: ${serviceName}`);
      const result = await this.serviceBus.call(serviceName, 'initialize');
      if (!result.success) {
        throw new Error(`Failed to initialize ${serviceName}: ${result.error}`);
      }
    }
  }

  /**
   * Set up authentication state monitoring
   */
  _setupAuthStateMonitoring() {
    // This would be implemented with session storage monitoring
    // For now, we'll rely on explicit auth calls
  }

  /**
   * Restore existing session from storage
   */
  async _restoreSession() {
    try {
      // Check for stored tokens
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        // Validate access token
        const validation = await this.serviceBus.call('jwt', 'verifyAccessToken', accessToken);

        if (validation) {
          // Token is valid, restore user session
          this.currentUser = validation;
          this.isAuthenticated = true;
          this._notifyAuthStateChange(this.currentUser);
          return;
        }

        // Try to refresh token
        try {
          const refreshResult = await this.serviceBus.call('jwt', 'refreshAccessToken', refreshToken);
          if (refreshResult.success) {
            // Store new tokens
            localStorage.setItem('accessToken', refreshResult.accessToken);
            localStorage.setItem('refreshToken', refreshResult.refreshToken);

            // Get user info
            const userResult = await this.serviceBus.call('user', 'getUserById', refreshResult.userId);
            if (userResult.success) {
              this.currentUser = userResult.user;
              this.isAuthenticated = true;
              this._notifyAuthStateChange(this.currentUser);
            }
          }
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
          // Clear invalid tokens
          this._clearStoredTokens();
        }
      }
    } catch (error) {
      console.error('Session restoration failed:', error);
      this._clearStoredTokens();
    }
  }

  /**
   * Authentication Methods
   */

  async signUp(email, password, name) {
    try {
      console.log('🔐 Signing up user:', email);

      const result = await this.serviceBus.call('auth', 'signUp', {
        email: email.toLowerCase(),
        password,
        name
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Store tokens if signup was successful
      if (result.session) {
        localStorage.setItem('accessToken', result.session.token);
        localStorage.setItem('refreshToken', result.session.refreshToken);
      }

      this.currentUser = result.user;
      this.isAuthenticated = true;
      this._notifyAuthStateChange(this.currentUser);

      return { success: true, user: result.user };
    } catch (error) {
      console.error('SignUp failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      console.log('🔐 Signing in user:', email);

      const result = await this.serviceBus.call('auth', 'signIn', {
        email: email.toLowerCase(),
        password
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Store tokens
      localStorage.setItem('accessToken', result.session.token);
      localStorage.setItem('refreshToken', result.session.refreshToken);

      this.currentUser = result.user;
      this.isAuthenticated = true;
      this._notifyAuthStateChange(this.currentUser);

      return { success: true, user: result.user };
    } catch (error) {
      console.error('SignIn failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      console.log('👋 Signing out user');

      // Get current session ID if available
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const tokenInfo = await this.serviceBus.call('jwt', 'getTokenInfo', accessToken);
          if (tokenInfo.success && tokenInfo.info.sessionId) {
            await this.serviceBus.call('auth', 'signOut', tokenInfo.info.sessionId);
          }
        } catch (error) {
          console.warn('Session cleanup failed:', error);
        }
      }

      // Clear local storage
      this._clearStoredTokens();

      // Reset state
      this.currentUser = null;
      this.isAuthenticated = false;
      this._notifyAuthStateChange(null);

      return { success: true };
    } catch (error) {
      console.error('SignOut failed:', error);
      // Still clear local state even if server call fails
      this._clearStoredTokens();
      this.currentUser = null;
      this.isAuthenticated = false;
      this._notifyAuthStateChange(null);

      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    try {
      console.log('📧 Resetting password for:', email);

      const result = await this.serviceBus.call('auth', 'resetPassword', email.toLowerCase());

      if (!result.success) {
        throw new Error(result.error);
      }

      return { success: true, message: result.message };
    } catch (error) {
      console.error('ResetPassword failed:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyEmail(token) {
    try {
      console.log('📧 Verifying email with token');

      const result = await this.serviceBus.call('auth', 'verifyEmail', token);

      if (!result.success) {
        throw new Error(result.error);
      }

      return { success: true };
    } catch (error) {
      console.error('VerifyEmail failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * OAuth Methods
   */

  async signInWithGoogle() {
    try {
      console.log('🔐 Signing in with Google');

      // This would integrate with Google OAuth
      // For now, return a placeholder
      return { success: false, error: 'Google OAuth not yet implemented' };
    } catch (error) {
      console.error('Google sign-in failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * User Management Methods
   */

  async updateProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      const result = await this.serviceBus.call('user', 'updateProfile', this.currentUser.id, updates);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update local user data
      this.currentUser.profile = { ...this.currentUser.profile, ...updates };
      this._notifyAuthStateChange(this.currentUser);

      return { success: true, profile: result.profile };
    } catch (error) {
      console.error('UpdateProfile failed:', error);
      return { success: false, error: error.message };
    }
  }

  async updateSettings(settings) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      const result = await this.serviceBus.call('user', 'updateSettings', this.currentUser.id, settings);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update local user data
      this.currentUser.settings = { ...this.currentUser.settings, ...settings };
      this._notifyAuthStateChange(this.currentUser);

      return { success: true, settings: result.settings };
    } catch (error) {
      console.error('UpdateSettings failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * State Management Methods
   */

  getCurrentUser() {
    return this.currentUser;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  _notifyAuthStateChange(user) {
    this.authStateListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  /**
   * Utility Methods
   */

  _clearStoredTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Health Check Methods
   */

  async healthCheck() {
    try {
      const results = await this.serviceBus.healthCheckAll();

      const allHealthy = Object.values(results).every(result => result.success);

      return {
        success: allHealthy,
        services: results,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup Methods
   */

  async cleanup() {
    try {
      this._clearStoredTokens();
      this.authStateListeners.length = 0;

      if (this.serviceBus) {
        this.serviceBus.cleanup();
      }

      this.currentUser = null;
      this.isAuthenticated = false;
      this.initialized = false;

      console.log('🧹 ServiceBasedAuthManager cleaned up');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

export default ServiceBasedAuthManager;
