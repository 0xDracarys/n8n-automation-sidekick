// Production environment configuration
export default {
  app: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://n8n-sidekick.com'],
      credentials: true
    }
  },

  logging: {
    level: 'warn',
    format: 'json',
    transports: ['console', 'file']
  },

  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    },
    cors: {
      enabled: true,
      origins: process.env.ALLOWED_ORIGINS?.split(',') || []
    }
  },

  services: {
    auth: {
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiry: '1h', // Shorter for security
      refreshTokenExpiry: '7d',
      bcryptRounds: 12, // Higher for security
      requireEmailVerification: true,
      maxLoginAttempts: 3,
      lockoutDuration: 30 * 60 * 1000 // 30 minutes
    },

    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      issuer: 'n8n-sidekick',
      algorithm: 'HS256',
      rollingRefresh: false
    },

    user: {
      bcryptRounds: 12,
      defaultUserSettings: {
        theme: 'dark',
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      },
      maxUsersPerPage: 50,
      requireEmailVerification: true
    },

    database: {
      type: 'supabase',
      supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      connection: {
        maxConnections: 50,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 10000
      }
    },

    workflow: {
      aiProvider: 'openai',
      defaultModel: 'gpt-4',
      maxWorkflowsPerUser: 100,
      maxNodesPerWorkflow: 50,
      timeout: 30000
    },

    api: {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        maxTokens: 4000
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: 'https://api.anthropic.com',
        models: ['claude-3-opus', 'claude-3-sonnet'],
        maxTokens: 4000
      }
    }
  }
};
