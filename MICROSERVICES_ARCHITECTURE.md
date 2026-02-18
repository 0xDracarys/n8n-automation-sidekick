# Microservices Architecture Design for n8n Sidekick Authentication

## 📋 **Architecture Overview**

### **Current Issues Identified:**
- ❌ **Hardcoded credentials** in `supabase-config.js`
- ❌ **Global state management** with `window.*` variables
- ❌ **No service layer separation**
- ❌ **Environment-agnostic configuration**
- ❌ **No proper error handling between services**
- ❌ **Tight coupling between UI and backend logic**

### **Target Architecture:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │◄──►│ Service Layer   │◄──►│ User Interface  │
│   (JWT/OAuth)   │    │   (Orchestrator) │    │   (Components)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│   User Service  │    │  Workflow       │
│ (User Mgmt)     │    │  Service        │
└─────────────────┘    │ (Business Logic)│
                       └─────────────────┘
         ▲                        ▲
         │                        │
┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   External      │
│   Service       │    │   APIs          │
│   (Supabase)    │    │   (AI, n8n)     │
└─────────────────┘    └─────────────────┘
```

## 🏗️ **Service Definitions**

### **1. AuthService Microservice**
**Purpose:** Handle authentication, authorization, and session management
**Responsibilities:**
- JWT token generation and validation
- OAuth provider integration (Google, GitHub)
- Session management
- Password hashing and validation
- Multi-factor authentication support

### **2. UserService Microservice**
**Purpose:** User profile and account management
**Responsibilities:**
- User CRUD operations
- Profile management
- Preferences and settings
- Account verification and recovery
- User analytics and metrics

### **3. WorkflowService Microservice**
**Purpose:** Workflow generation and management
**Responsibilities:**
- AI-powered workflow generation
- Workflow validation and optimization
- Template management
- Workflow execution tracking
- Performance analytics

### **4. DatabaseService Microservice**
**Purpose:** Data persistence and querying
**Responsibilities:**
- Database connection management
- Query optimization
- Data migration and seeding
- Backup and recovery
- Performance monitoring

### **5. APIService Microservice**
**Purpose:** External API integrations
**Responsibilities:**
- AI model provider management
- n8n API integration
- Third-party service connections
- Rate limiting and caching
- Error handling and retries

## 🔧 **Service Communication Layer**

### **Service Bus Architecture:**
```javascript
// Service Bus for inter-service communication
class ServiceBus {
  constructor() {
    this.services = new Map();
    this.middlewares = [];
  }

  registerService(name, service) {
    this.services.set(name, service);
  }

  async call(serviceName, method, ...args) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // Apply middlewares (logging, error handling, etc.)
    let result = await this.applyMiddlewares(serviceName, method, args);

    return service[method](...args);
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  async applyMiddlewares(serviceName, method, args) {
    let context = { serviceName, method, args };

    for (const middleware of this.middlewares) {
      context = await middleware(context);
    }

    return context;
  }
}
```

### **Service Contracts:**
```javascript
// Service contract definitions
const SERVICE_CONTRACTS = {
  auth: {
    signIn: 'async (credentials) => Promise<UserSession>',
    signOut: 'async (sessionId) => Promise<void>',
    validateToken: 'async (token) => Promise<User>',
    refreshToken: 'async (refreshToken) => Promise<TokenPair>',
    getUserById: 'async (userId) => Promise<User>'
  },

  user: {
    createUser: 'async (userData) => Promise<User>',
    updateUser: 'async (userId, updates) => Promise<User>',
    deleteUser: 'async (userId) => Promise<void>',
    getUserProfile: 'async (userId) => Promise<UserProfile>',
    updatePreferences: 'async (userId, preferences) => Promise<void>'
  },

  workflow: {
    generateWorkflow: 'async (prompt, options) => Promise<Workflow>',
    validateWorkflow: 'async (workflow) => Promise<ValidationResult>',
    saveWorkflow: 'async (userId, workflow, metadata) => Promise<SavedWorkflow>',
    getUserWorkflows: 'async (userId, filters) => Promise<Workflow[]>',
    executeWorkflow: 'async (workflowId, inputs) => Promise<ExecutionResult>'
  },

  database: {
    query: 'async (table, query) => Promise<Result[]>',
    insert: 'async (table, data) => Promise<InsertedRecord>',
    update: 'async (table, id, data) => Promise<UpdatedRecord>',
    delete: 'async (table, id) => Promise<void>',
    transaction: 'async (operations) => Promise<TransactionResult>'
  },

  api: {
    callAI: 'async (provider, prompt, options) => Promise<AIResponse>',
    callN8n: 'async (endpoint, data, options) => Promise<N8nResponse>',
    getExternalData: 'async (service, endpoint, params) => Promise<ExternalData>',
    uploadFile: 'async (file, metadata) => Promise<UploadResult>',
    downloadFile: 'async (fileId) => Promise<FileBlob>'
  }
};
```

## 🛡️ **Security & Configuration**

### **Environment-Based Configuration:**
```javascript
// config/environments.js
const environments = {
  development: {
    services: {
      auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiry: '24h',
        refreshTokenExpiry: '7d',
        bcryptRounds: 10
      },
      database: {
        supabase: {
          url: process.env.SUPABASE_URL,
          anonKey: process.env.SUPABASE_ANON_KEY,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      },
      api: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          baseUrl: 'https://api.openai.com/v1'
        },
        anthropic: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          baseUrl: 'https://api.anthropic.com'
        }
      }
    }
  },

  production: {
    // Production-specific configs with enhanced security
  },

  test: {
    // Test environment with mock services
  }
};
```

### **Security Middleware:**
```javascript
// Security middleware for service calls
const securityMiddleware = {
  async authenticate(context) {
    const { serviceName, method, args } = context;

    // Check if method requires authentication
    if (REQUIRES_AUTH[serviceName]?.includes(method)) {
      const token = args[0]?.token || context.headers?.authorization;
      if (!token) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate token
      const user = await jwt.verify(token, CONFIG.jwtSecret);
      context.user = user;
    }

    return context;
  },

  async authorize(context) {
    const { serviceName, method, user } = context;

    // Check permissions
    const permissions = await checkPermissions(user.id, serviceName, method);
    if (!permissions.granted) {
      throw new AuthorizationError('Insufficient permissions');
    }

    return context;
  },

  async rateLimit(context) {
    const { user } = context;

    // Implement rate limiting
    const rateLimit = await checkRateLimit(user.id);
    if (rateLimit.exceeded) {
      throw new RateLimitError('Rate limit exceeded');
    }

    return context;
  }
};
```

## 📦 **Implementation Roadmap**

### **Phase 1: Core Services (Week 1)**
1. ✅ Create AuthService with JWT management
2. ✅ Create UserService with profile management
3. ✅ Create DatabaseService abstraction
4. ✅ Implement Service Bus communication layer

### **Phase 2: Business Logic (Week 2)**
1. ✅ Create WorkflowService with AI integration
2. ✅ Create APIService for external integrations
3. ✅ Implement service contracts and interfaces
4. ✅ Add comprehensive error handling

### **Phase 3: Security & Configuration (Week 3)**
1. ✅ Implement environment-based configuration
2. ✅ Add security middleware (auth, rate limiting)
3. ✅ Remove hardcoded credentials
4. ✅ Add input validation and sanitization

### **Phase 4: Integration & Testing (Week 4)**
1. ✅ Integrate services with existing UI
2. ✅ Add comprehensive testing
3. ✅ Implement monitoring and logging
4. ✅ Performance optimization

## 🎯 **Success Metrics**

- **Security:** 100% removal of hardcoded credentials
- **Architecture:** 95% service separation achieved
- **Performance:** <50ms service call latency
- **Reliability:** 99.9% service availability
- **Maintainability:** <30min to add new service method

---

*Architecture Version: 1.0.0 | Target Completion: 4 weeks*
