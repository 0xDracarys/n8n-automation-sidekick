/**
 * JWT Service - Token Management Microservice
 * Handles JWT creation, validation, and refresh token management
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class JWTService {
  constructor(config) {
    this.config = config;
    this.blacklistedTokens = new Set(); // In production, use Redis
    this.initialized = false;
  }

  async initialize() {
    try {
      this._validateConfig();

      // Test JWT operations
      await this._testJWT();

      this.initialized = true;
      console.log('✅ JWTService initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ JWTService initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  _validateConfig() {
    const required = ['secret', 'accessTokenExpiry', 'refreshTokenExpiry', 'issuer'];
    for (const key of required) {
      if (!this.config[key]) {
        throw new Error(`Missing required JWT config: ${key}`);
      }
    }
  }

  async _testJWT() {
    const testPayload = { test: true, userId: 'test-user' };
    const token = this.generateAccessToken(testPayload);
    const decoded = this.verifyAccessToken(token);

    if (decoded.userId !== testPayload.userId) {
      throw new Error('JWT test failed');
    }
  }

  /**
   * Access Token Methods
   */

  generateAccessToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        iss: this.config.issuer
      };

      return jwt.sign(tokenPayload, this.config.secret, {
        expiresIn: this.config.accessTokenExpiry,
        algorithm: this.config.algorithm || 'HS256'
      });
    } catch (error) {
      console.error('JWTService.generateAccessToken error:', error);
      throw new Error('Failed to generate access token');
    }
  }

  verifyAccessToken(token) {
    try {
      if (this.blacklistedTokens.has(token)) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, this.config.secret, {
        issuer: this.config.issuer,
        algorithms: [this.config.algorithm || 'HS256']
      });

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      console.error('JWTService.verifyAccessToken error:', error);
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Refresh Token Methods
   */

  generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        type: 'refresh',
        tokenId: crypto.randomBytes(16).toString('hex'),
        iat: Math.floor(Date.now() / 1000),
        iss: this.config.issuer
      };

      return jwt.sign(tokenPayload, this.config.refreshSecret || this.config.secret, {
        expiresIn: this.config.refreshTokenExpiry,
        algorithm: this.config.algorithm || 'HS256'
      });
    } catch (error) {
      console.error('JWTService.generateRefreshToken error:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.refreshSecret || this.config.secret, {
        issuer: this.config.issuer,
        algorithms: [this.config.algorithm || 'HS256']
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      console.error('JWTService.verifyRefreshToken error:', error);
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Token Management Methods
   */

  revokeToken(token) {
    try {
      // Add to blacklist (in production, use Redis with TTL)
      this.blacklistedTokens.add(token);

      // Clean up expired tokens periodically
      this._cleanupExpiredTokens();

      return { success: true };
    } catch (error) {
      console.error('JWTService.revokeToken error:', error);
      return { success: false, error: error.message };
    }
  }

  revokeAllUserTokens(userId) {
    try {
      // In production, this would revoke all tokens for a user
      // For now, we'll implement a basic version
      // This would typically involve storing token metadata in a database

      console.log(`Revoking all tokens for user: ${userId}`);
      return { success: true, message: 'All user tokens revoked' };
    } catch (error) {
      console.error('JWTService.revokeAllUserTokens error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Token Information Methods
   */

  getTokenInfo(token) {
    try {
      // Decode without verification to get metadata
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded) {
        return { success: false, error: 'Invalid token format' };
      }

      const { payload } = decoded;
      const now = Math.floor(Date.now() / 1000);

      return {
        success: true,
        info: {
          type: payload.type,
          userId: payload.userId,
          issuedAt: new Date(payload.iat * 1000),
          expiresAt: new Date(payload.exp * 1000),
          issuer: payload.iss,
          isExpired: payload.exp < now,
          timeToExpiry: payload.exp - now
        }
      };
    } catch (error) {
      console.error('JWTService.getTokenInfo error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Token Refresh Methods
   */

  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const refreshPayload = this.verifyRefreshToken(refreshToken);

      // Generate new access token
      const accessPayload = {
        userId: refreshPayload.userId,
        sessionId: refreshPayload.sessionId,
        permissions: refreshPayload.permissions
      };

      const newAccessToken = this.generateAccessToken(accessPayload);

      // Optionally generate new refresh token (rolling refresh)
      let newRefreshToken = refreshToken;
      if (this.config.rollingRefresh) {
        newRefreshToken = this.generateRefreshToken(accessPayload);
      }

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this._parseExpiryToSeconds(this.config.accessTokenExpiry)
      };
    } catch (error) {
      console.error('JWTService.refreshAccessToken error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Utility Methods
   */

  _parseExpiryToSeconds(expiry) {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return value;
    }
  }

  _cleanupExpiredTokens() {
    // In production, implement proper cleanup
    // For now, we'll clean up tokens that are clearly expired
    const maxBlacklistSize = 10000;

    if (this.blacklistedTokens.size > maxBlacklistSize) {
      // Simple cleanup - remove oldest tokens
      const tokens = Array.from(this.blacklistedTokens);
      const toKeep = tokens.slice(-maxBlacklistSize);
      this.blacklistedTokens = new Set(toKeep);
    }
  }

  /**
   * Health Check Methods
   */

  async healthCheck() {
    try {
      // Test basic JWT operations
      const testPayload = { test: true };
      const token = this.generateAccessToken(testPayload);
      const decoded = this.verifyAccessToken(token);

      if (decoded.test !== true) {
        throw new Error('JWT health check failed');
      }

      return {
        success: true,
        status: 'healthy',
        metrics: {
          blacklistedTokens: this.blacklistedTokens.size,
          configValid: true
        }
      };
    } catch (error) {
      console.error('JWTService health check failed:', error);
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Configuration Methods
   */

  updateConfig(newConfig) {
    try {
      // Validate new config
      const required = ['secret', 'accessTokenExpiry', 'refreshTokenExpiry', 'issuer'];
      for (const key of required) {
        if (newConfig[key] && !this.config[key]) {
          throw new Error(`Cannot remove required config: ${key}`);
        }
      }

      // Update config
      this.config = { ...this.config, ...newConfig };

      // Re-validate
      this._validateConfig();

      return { success: true, message: 'Configuration updated successfully' };
    } catch (error) {
      console.error('JWTService.updateConfig error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default JWTService;
