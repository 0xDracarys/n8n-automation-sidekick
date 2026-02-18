// Default configuration - shared across all environments
export default {
  app: {
    name: 'n8n Sidekick',
    version: '1.0.0',
    port: 3000,
    host: 'localhost',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }
  },

  logging: {
    level: 'info',
    format: 'json',
    transports: ['console', 'file']
  },

  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    cors: {
      enabled: true,
      origins: ['http://localhost:3000', 'http://localhost:5173']
    }
  },

  services: {
    auth: {
      jwtSecret: 'default-jwt-secret-change-in-production',
      jwtExpiry: '24h',
      refreshTokenExpiry: '7d',
      bcryptRounds: 10,
      requireEmailVerification: false,
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000 // 15 minutes
    },

    jwt: {
      secret: 'default-jwt-secret-change-in-production',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      issuer: 'n8n-sidekick',
      algorithm: 'HS256',
      rollingRefresh: true
    },

    user: {
      bcryptRounds: 10,
      defaultUserSettings: {
        theme: 'dark',
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      },
      maxUsersPerPage: 50,
      requireEmailVerification: false
    },

    database: {
      type: 'supabase',
      supabase: {
        url: 'https://your-project.supabase.co',
        anonKey: 'your-anon-key',
        serviceRoleKey: 'your-service-role-key'
      },
      connection: {
        maxConnections: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
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
        apiKey: 'your-openai-key',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        maxTokens: 4000
      },
      anthropic: {
        apiKey: 'your-anthropic-key',
        baseUrl: 'https://api.anthropic.com',
        models: ['claude-3-opus', 'claude-3-sonnet'],
        maxTokens: 4000
      }
    }
  }
};
