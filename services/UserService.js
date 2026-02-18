/**
 * UserService Microservice
 * Handles user profile management, preferences, and account operations
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

class UserService {
  constructor(config) {
    this.config = config;
    this.initialized = false;
  }

  async initialize() {
    try {
      this._validateConfig();

      this.initialized = true;
      console.log('✅ UserService initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ UserService initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  _validateConfig() {
    // UserService config validation
    if (!this.config.defaultUserSettings) {
      this.config.defaultUserSettings = {
        theme: 'dark',
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      };
    }
  }

  /**
   * User CRUD Operations
   */

  async createUser(userData) {
    try {
      // Validate input
      const validation = this._validateUserData(userData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Prepare user data
      const user = {
        id: this._generateUserId(),
        email: userData.email.toLowerCase(),
        name: userData.name,
        password: userData.password, // Should be hashed by AuthService
        emailVerified: userData.emailVerified || false,
        role: userData.role || 'user',
        status: 'active',
        settings: { ...this.config.defaultUserSettings, ...userData.settings },
        profile: {
          avatar: null,
          bio: null,
          website: null,
          location: null,
          company: null
        },
        stats: {
          workflowsCreated: 0,
          workflowsExecuted: 0,
          lastLogin: null,
          joinDate: new Date()
        },
        preferences: {
          emailNotifications: true,
          workflowAlerts: true,
          marketingEmails: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save user (will be implemented by DatabaseService)
      const savedUser = await this._saveUser(user);

      return {
        success: true,
        user: this._sanitizeUser(savedUser)
      };
    } catch (error) {
      console.error('UserService.createUser error:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  async getUserById(userId) {
    try {
      const user = await this._getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        user: this._sanitizeUser(user)
      };
    } catch (error) {
      console.error('UserService.getUserById error:', error);
      return { success: false, error: 'Failed to get user' };
    }
  }

  async getUserByEmail(email) {
    try {
      const user = await this._getUserByEmail(email.toLowerCase());
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        user: this._sanitizeUser(user)
      };
    } catch (error) {
      console.error('UserService.getUserByEmail error:', error);
      return { success: false, error: 'Failed to get user' };
    }
  }

  async updateUser(userId, updates) {
    try {
      // Validate user exists
      const existingUser = await this._getUserById(userId);
      if (!existingUser) {
        return { success: false, error: 'User not found' };
      }

      // Validate updates
      const validation = this._validateUserUpdates(updates);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Prepare update data
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      // Handle password update
      if (updates.password) {
        updateData.password = await bcrypt.hash(updates.password, this.config.bcryptRounds || 10);
      }

      // Update user
      const updatedUser = await this._updateUser(userId, updateData);

      return {
        success: true,
        user: this._sanitizeUser(updatedUser)
      };
    } catch (error) {
      console.error('UserService.updateUser error:', error);
      return { success: false, error: 'Failed to update user' };
    }
  }

  async deleteUser(userId) {
    try {
      // Check if user exists
      const user = await this._getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Soft delete (mark as inactive)
      await this._updateUser(userId, {
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('UserService.deleteUser error:', error);
      return { success: false, error: 'Failed to delete user' };
    }
  }

  /**
   * User Profile Management
   */

  async updateProfile(userId, profileData) {
    try {
      const allowedFields = ['avatar', 'bio', 'website', 'location', 'company'];
      const updates = {};

      // Only allow specific profile fields
      allowedFields.forEach(field => {
        if (profileData[field] !== undefined) {
          updates[`profile.${field}`] = profileData[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return { success: false, error: 'No valid profile fields provided' };
      }

      updates.updatedAt = new Date();

      const updatedUser = await this._updateUser(userId, updates);

      return {
        success: true,
        profile: updatedUser.profile
      };
    } catch (error) {
      console.error('UserService.updateProfile error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await this._getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.profile.avatar,
          bio: user.profile.bio,
          website: user.profile.website,
          location: user.profile.location,
          company: user.profile.company,
          joinDate: user.stats.joinDate,
          stats: user.stats
        }
      };
    } catch (error) {
      console.error('UserService.getUserProfile error:', error);
      return { success: false, error: 'Failed to get user profile' };
    }
  }

  /**
   * User Preferences & Settings
   */

  async updateSettings(userId, settings) {
    try {
      const allowedSettings = ['theme', 'notifications', 'language', 'timezone'];
      const updates = {};

      // Validate settings
      allowedSettings.forEach(setting => {
        if (settings[setting] !== undefined) {
          if (!this._isValidSetting(setting, settings[setting])) {
            throw new Error(`Invalid value for setting: ${setting}`);
          }
          updates[`settings.${setting}`] = settings[setting];
        }
      });

      if (Object.keys(updates).length === 0) {
        return { success: false, error: 'No valid settings provided' };
      }

      updates.updatedAt = new Date();

      const updatedUser = await this._updateUser(userId, updates);

      return {
        success: true,
        settings: updatedUser.settings
      };
    } catch (error) {
      console.error('UserService.updateSettings error:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }

  async updatePreferences(userId, preferences) {
    try {
      const allowedPreferences = ['emailNotifications', 'workflowAlerts', 'marketingEmails'];
      const updates = {};

      // Validate preferences
      allowedPreferences.forEach(pref => {
        if (preferences[pref] !== undefined) {
          if (typeof preferences[pref] !== 'boolean') {
            throw new Error(`Invalid value for preference: ${pref}`);
          }
          updates[`preferences.${pref}`] = preferences[pref];
        }
      });

      if (Object.keys(updates).length === 0) {
        return { success: false, error: 'No valid preferences provided' };
      }

      updates.updatedAt = new Date();

      const updatedUser = await this._updateUser(userId, updates);

      return {
        success: true,
        preferences: updatedUser.preferences
      };
    } catch (error) {
      console.error('UserService.updatePreferences error:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  }

  /**
   * User Statistics & Analytics
   */

  async updateUserStats(userId, stats) {
    try {
      const allowedStats = ['workflowsCreated', 'workflowsExecuted', 'lastLogin'];
      const updates = {};

      allowedStats.forEach(stat => {
        if (stats[stat] !== undefined) {
          updates[`stats.${stat}`] = stats[stat];
        }
      });

      if (Object.keys(updates).length === 0) {
        return { success: false, error: 'No valid stats provided' };
      }

      updates.updatedAt = new Date();

      const updatedUser = await this._updateUser(userId, updates);

      return {
        success: true,
        stats: updatedUser.stats
      };
    } catch (error) {
      console.error('UserService.updateUserStats error:', error);
      return { success: false, error: 'Failed to update user stats' };
    }
  }

  async getUserStats(userId) {
    try {
      const user = await this._getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        stats: user.stats
      };
    } catch (error) {
      console.error('UserService.getUserStats error:', error);
      return { success: false, error: 'Failed to get user stats' };
    }
  }

  /**
   * User Search & Listing
   */

  async searchUsers(query, options = {}) {
    try {
      const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;

      // Basic search implementation (will be enhanced by DatabaseService)
      const users = await this._searchUsers(query, { limit, offset, sortBy, sortOrder });

      return {
        success: true,
        users: users.map(user => this._sanitizeUser(user)),
        pagination: {
          limit,
          offset,
          hasMore: users.length === limit
        }
      };
    } catch (error) {
      console.error('UserService.searchUsers error:', error);
      return { success: false, error: 'Failed to search users' };
    }
  }

  async listUsers(options = {}) {
    try {
      const { limit = 50, offset = 0, status = 'active', role } = options;

      const users = await this._listUsers({ limit, offset, status, role });

      return {
        success: true,
        users: users.map(user => this._sanitizeUser(user)),
        pagination: {
          limit,
          offset,
          total: users.length,
          hasMore: users.length === limit
        }
      };
    } catch (error) {
      console.error('UserService.listUsers error:', error);
      return { success: false, error: 'Failed to list users' };
    }
  }

  /**
   * Private Helper Methods
   */

  _validateUserData(data) {
    if (!data.email || !data.name) {
      return { valid: false, error: 'Email and name are required' };
    }

    if (!this._isValidEmail(data.email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (data.name.length < 2 || data.name.length > 50) {
      return { valid: false, error: 'Name must be between 2 and 50 characters' };
    }

    return { valid: true };
  }

  _validateUserUpdates(updates) {
    // Email validation
    if (updates.email && !this._isValidEmail(updates.email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    // Name validation
    if (updates.name && (updates.name.length < 2 || updates.name.length > 50)) {
      return { valid: false, error: 'Name must be between 2 and 50 characters' };
    }

    // Password validation
    if (updates.password && updates.password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }

    return { valid: true };
  }

  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  _isValidSetting(setting, value) {
    const validations = {
      theme: ['light', 'dark', 'auto'].includes(value),
      notifications: typeof value === 'boolean',
      language: typeof value === 'string' && value.length === 2,
      timezone: typeof value === 'string'
    };

    return validations[setting] || false;
  }

  _generateUserId() {
    return `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  _sanitizeUser(user) {
    if (!user) return null;

    const {
      password,
      verificationToken,
      resetToken,
      ...sanitized
    } = user;

    return sanitized;
  }

  /**
   * Database abstraction methods - to be implemented by DatabaseService
   */
  async _getUserById(id) {
    throw new Error('DatabaseService not implemented');
  }

  async _getUserByEmail(email) {
    throw new Error('DatabaseService not implemented');
  }

  async _saveUser(userData) {
    throw new Error('DatabaseService not implemented');
  }

  async _updateUser(id, updates) {
    throw new Error('DatabaseService not implemented');
  }

  async _searchUsers(query, options) {
    throw new Error('DatabaseService not implemented');
  }

  async _listUsers(options) {
    throw new Error('DatabaseService not implemented');
  }
}

export default UserService;
