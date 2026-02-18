// Development environment configuration
export default {
  app: {
    port: 3001,
    host: 'localhost',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
      credentials: true
    }
  },

  logging: {
    level: 'debug',
    format: 'dev',
    transports: ['console']
  },

  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000 // Higher limit for development
    }
  },

  services: {
    auth: {
      jwtSecret: 'dev-jwt-secret-key-for-development-only',
      jwtExpiry: '24h',
      refreshTokenExpiry: '7d',
      bcryptRounds: 8, // Faster for development
      requireEmailVerification: false,
      maxLoginAttempts: 10,
      lockoutDuration: 5 * 60 * 1000 // 5 minutes for development
    },

    jwt: {
      secret: 'dev-jwt-secret-key-for-development-only',
      accessTokenExpiry: '1h', // Shorter for development
      refreshTokenExpiry: '24h',
      issuer: 'n8n-sidekick-dev',
      rollingRefresh: true
    },

    user: {
      bcryptRounds: 8,
      defaultUserSettings: {
        theme: 'dark',
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      },
      maxUsersPerPage: 20,
      requireEmailVerification: false
    },

    database: {
      type: 'supabase',
      supabase: {
        url: 'https://egabjbrvvhkutivbogjg.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYWJqYnJ2dmhrdXRpdmJvZ2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTM1NzMsImV4cCI6MjA4NjgyOTU3M30.Nak3nrBV3wpJaZWJC8KLcHQpWu3_V_R_RMB-rMQPhBw',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'development-service-role-key'
      }
    },

    workflow: {
      aiProvider: 'openai',
      defaultModel: 'gpt-4',
      maxWorkflowsPerUser: 1000, // Higher limit for development
      maxNodesPerWorkflow: 100,
      timeout: 60000 // Longer timeout for development debugging
    },

    api: {
      timeout: 60000,
      retries: 5,
      retryDelay: 1000,
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'development-openai-key',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
        maxTokens: 8000
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || 'development-anthropic-key',
        baseUrl: 'https://api.anthropic.com',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        maxTokens: 8000
      }
    }
  }
};
