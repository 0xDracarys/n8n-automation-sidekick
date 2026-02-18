/**
 * AuthService Microservice
 * Handles authentication, authorization, and session management
 * Part of the n8n Sidekick microservices architecture
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class AuthService {
  constructor(config) {
    this.config = config;
    this.sessions = new Map(); // In production, use Redis
    this.rateLimits = new Map(); // In production, use Redis
    this.initialized = false;
  }

  async initialize() {
    try {
      // Validate configuration
      this._validateConfig();

      // Initialize JWT signing
      this._setupJWT();

      // Initialize rate limiting
      this._setupRateLimiting();

      this.initialized = true;
      console.log('✅ AuthService initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ AuthService initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  _validateConfig() {
    const required = ['jwtSecret', 'jwtExpiry', 'refreshTokenExpiry', 'bcryptRounds'];
    for (const key of required) {
      if (!this.config[key]) {
        throw new Error(`Missing required config: ${key}`);
      }
    }
  }

  _setupJWT() {
    // Test JWT signing/verification
    const testPayload = { test: true };
    const token = jwt.sign(testPayload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiry
    });
    jwt.verify(token, this.config.jwtSecret);
  }

  _setupRateLimiting() {
    // Clean up expired rate limit entries periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.sessions) {
        if (data.expires < now) {
          this.sessions.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  /**
   * User Authentication Methods
   */

  async signUp(userData) {
    try {
      // Validate input
      const validation = this._validateSignUpData(userData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Check if user already exists
      const existingUser = await this._getUserByEmail(userData.email);
      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.config.bcryptRounds);

      // Create user
      const user = await this._createUser({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        createdAt: new Date(),
        emailVerified: false
      });

      // Generate verification token
      const verificationToken = this._generateVerificationToken();
      await this._saveVerificationToken(user.id, verificationToken);

      // Generate initial session
      const session = await this._createSession(user);

      return {
        success: true,
        user: this._sanitizeUser(user),
        session,
        verificationToken
      };
    } catch (error) {
      console.error('AuthService.signUp error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  async signIn(credentials) {
    try {
      // Rate limiting check
      const rateLimitCheck = this._checkRateLimit(credentials.email || 'anonymous');
      if (!rateLimitCheck.allowed) {
        return { success: false, error: 'Too many login attempts. Please try again later.' };
      }

      // Validate input
      const validation = this._validateSignInData(credentials);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Get user
      const user = await this._getUserByEmail(credentials.email);
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Check password
      const passwordValid = await bcrypt.compare(credentials.password, user.password);
      if (!passwordValid) {
        this._recordFailedAttempt(credentials.email);
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is verified (if required)
      if (this.config.requireEmailVerification && !user.emailVerified) {
        return { success: false, error: 'Please verify your email before signing in' };
      }

      // Create session
      const session = await this._createSession(user);

      // Clear failed attempts on successful login
      this._clearFailedAttempts(credentials.email);

      return {
        success: true,
        user: this._sanitizeUser(user),
        session
      };
    } catch (error) {
      console.error('AuthService.signIn error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  async signOut(sessionId) {
    try {
      await this._destroySession(sessionId);
      return { success: true };
    } catch (error) {
      console.error('AuthService.signOut error:', error);
      return { success: false, error: 'Sign out failed' };
    }
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret);

      // Check if session is still valid
      const session = this.sessions.get(decoded.sessionId);
      if (!session || session.expires < Date.now()) {
        return { success: false, error: 'Session expired' };
      }

      // Get current user data
      const user = await this._getUserById(decoded.userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        user: this._sanitizeUser(user),
        session: session
      };
    } catch (error) {
      console.error('AuthService.validateToken error:', error);
      return { success: false, error: 'Invalid token' };
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Decode refresh token (different secret/expiry)
      const decoded = jwt.verify(refreshToken, this.config.refreshTokenSecret || this.config.jwtSecret);

      // Get session
      const session = this.sessions.get(decoded.sessionId);
      if (!session || session.expires < Date.now()) {
        return { success: false, error: 'Invalid refresh token' };
      }

      // Create new token pair
      const user = await this._getUserById(decoded.userId);
      const newSession = await this._createSession(user);

      return {
        success: true,
        session: newSession
      };
    } catch (error) {
      console.error('AuthService.refreshToken error:', error);
      return { success: false, error: 'Invalid refresh token' };
    }
  }

  async resetPassword(email) {
    try {
      const user = await this._getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return { success: true, message: 'If an account exists, a reset email has been sent' };
      }

      const resetToken = this._generateResetToken();
      await this._saveResetToken(user.id, resetToken);

      // In production, send email via email service
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('AuthService.resetPassword error:', error);
      return { success: false, error: 'Failed to send reset email' };
    }
  }

  async verifyEmail(token) {
    try {
      const userId = await this._verifyEmailToken(token);
      if (!userId) {
        return { success: false, error: 'Invalid verification token' };
      }

      await this._updateUser(userId, { emailVerified: true });
      await this._deleteVerificationToken(token);

      return { success: true };
    } catch (error) {
      console.error('AuthService.verifyEmail error:', error);
      return { success: false, error: 'Email verification failed' };
    }
  }

  /**
   * OAuth Methods
   */

  async signInWithOAuth(provider, code) {
    try {
      // This would integrate with OAuth providers (Google, GitHub, etc.)
      // For now, return placeholder
      const oauthUser = await this._handleOAuthCallback(provider, code);

      // Find or create user
      let user = await this._getUserByOAuthId(provider, oauthUser.id);
      if (!user) {
        user = await this._createUserFromOAuth(provider, oauthUser);
      }

      // Create session
      const session = await this._createSession(user);

      return {
        success: true,
        user: this._sanitizeUser(user),
        session
      };
    } catch (error) {
      console.error('AuthService.signInWithOAuth error:', error);
      return { success: false, error: 'OAuth authentication failed' };
    }
  }

  /**
   * Admin Methods
   */

  async getUserById(userId) {
    try {
      const user = await this._getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, user: this._sanitizeUser(user) };
    } catch (error) {
      console.error('AuthService.getUserById error:', error);
      return { success: false, error: 'Failed to get user' };
    }
  }

  /**
   * Private Helper Methods
   */

  _validateSignUpData(data) {
    if (!data.email || !data.password || !data.name) {
      return { valid: false, error: 'Email, password, and name are required' };
    }

    if (!this._isValidEmail(data.email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (data.password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }

    return { valid: true };
  }

  _validateSignInData(data) {
    if (!data.email || !data.password) {
      return { valid: false, error: 'Email and password are required' };
    }

    return { valid: true };
  }

  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  _generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  _generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  _checkRateLimit(identifier) {
    const key = `login_attempts_${identifier}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    const attempts = this.rateLimits.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return { allowed: false, remainingTime: windowMs - (now - recentAttempts[0]) };
    }

    return { allowed: true };
  }

  _recordFailedAttempt(identifier) {
    const key = `login_attempts_${identifier}`;
    const attempts = this.rateLimits.get(key) || [];
    attempts.push(Date.now());
    this.rateLimits.set(key, attempts);
  }

  _clearFailedAttempts(identifier) {
    const key = `login_attempts_${identifier}`;
    this.rateLimits.delete(key);
  }

  async _createSession(user) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();

    const session = {
      id: sessionId,
      userId: user.id,
      created: now,
      expires: now + this._parseTime(this.config.jwtExpiry),
      refreshToken: this._generateRefreshToken(),
      refreshExpires: now + this._parseTime(this.config.refreshTokenExpiry)
    };

    // Store session
    this.sessions.set(sessionId, session);

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        sessionId: sessionId,
        type: 'access'
      },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtExpiry }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        sessionId: sessionId,
        type: 'refresh'
      },
      this.config.refreshTokenSecret || this.config.jwtSecret,
      { expiresIn: this.config.refreshTokenExpiry }
    );

    return {
      token,
      refreshToken,
      expires: session.expires,
      refreshExpires: session.refreshExpires
    };
  }

  async _destroySession(sessionId) {
    this.sessions.delete(sessionId);
  }

  _parseTime(timeStr) {
    const unit = timeStr.slice(-1);
    const value = parseInt(timeStr.slice(0, -1));

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return value;
    }
  }

  _generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  _sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Database abstraction methods - to be implemented by DatabaseService
   */
  async _getUserByEmail(email) {
    // This will be implemented by the DatabaseService
    throw new Error('DatabaseService not implemented');
  }

  async _getUserById(id) {
    // This will be implemented by the DatabaseService
    throw new Error('DatabaseService not implemented');
  }

  async _createUser(userData) {
    // This will be implemented by the DatabaseService
    throw new Error('DatabaseService not implemented');
  }

  async _updateUser(id, updates) {
    // This will be implemented by the DatabaseService
    throw new Error('DatabaseService not implemented');
  }

  // Additional database methods...
  async _getUserByOAuthId(provider, oauthId) { throw new Error('Not implemented'); }
  async _createUserFromOAuth(provider, oauthUser) { throw new Error('Not implemented'); }
  async _saveVerificationToken(userId, token) { throw new Error('Not implemented'); }
  async _verifyEmailToken(token) { throw new Error('Not implemented'); }
  async _deleteVerificationToken(token) { throw new Error('Not implemented'); }
  async _saveResetToken(userId, token) { throw new Error('Not implemented'); }
}

export default AuthService;
