// Configuration Management
class Config {
    constructor() {
        this.config = {
            // API Endpoints
            api: window.ENVIRONMENT?.AI_PROVIDERS || {
                openrouter: {
                    url: process?.env?.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
                    defaultModel: process?.env?.OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.0-flash-exp',
                    maxTokens: parseInt(process?.env?.OPENROUTER_MAX_TOKENS) || 4000,
                    temperature: parseFloat(process?.env?.OPENROUTER_TEMPERATURE) || 0.7
                },
                openai: {
                    url: process?.env?.OPENAI_API_URL || 'https://api.openai.com/v1',
                    defaultModel: process?.env?.OPENAI_DEFAULT_MODEL || 'gpt-4',
                    maxTokens: parseInt(process?.env?.OPENAI_MAX_TOKENS) || 4000,
                    temperature: parseFloat(process?.env?.OPENAI_TEMPERATURE) || 0.7
                },
                google: {
                    url: process?.env?.GOOGLE_API_URL || 'https://generativelanguage.googleapis.com/v1beta',
                    defaultModel: process?.env?.GOOGLE_DEFAULT_MODEL || 'gemini-2.0-flash-exp',
                    maxTokens: parseInt(process?.env?.GOOGLE_MAX_TOKENS) || 4000,
                    temperature: parseFloat(process?.env?.GOOGLE_TEMPERATURE) || 0.7
                },
                groq: {
                    url: process?.env?.GROQ_API_URL || 'https://api.groq.com/openai/v1',
                    defaultModel: process?.env?.GROQ_DEFAULT_MODEL || 'llama-3.1-70b-versatile',
                    maxTokens: parseInt(process?.env?.GROQ_MAX_TOKENS) || 4000,
                    temperature: parseFloat(process?.env?.GROQ_TEMPERATURE) || 0.7
                },
                ollama: {
                    url: process?.env?.OLLAMA_API_URL || 'http://localhost:11434',
                    defaultModel: process?.env?.OLLAMA_DEFAULT_MODEL || 'llama3.2',
                    maxTokens: parseInt(process?.env?.OLLAMA_MAX_TOKENS) || 4000,
                    temperature: parseFloat(process?.env?.OLLAMA_TEMPERATURE) || 0.7
                }
            },
            
            // Application Settings
            app: window.ENVIRONMENT?.APP || {
                name: process?.env?.APP_NAME || 'n8n Automation Sidekick',
                version: process?.env?.APP_VERSION || '1.0.0',
                environment: process?.env?.NODE_ENV || 'development',
                debug: process?.env?.DEBUG === 'true'
            },
            
            // Workflow Settings
            workflow: {
                maxNodes: parseInt(process?.env?.WORKFLOW_MAX_NODES) || 50,
                maxConnections: parseInt(process?.env?.WORKFLOW_MAX_CONNECTIONS) || 100,
                autoSave: process?.env?.WORKFLOW_AUTO_SAVE === 'true',
                exportFormat: process?.env?.WORKFLOW_EXPORT_FORMAT || 'n8n'
            },
            
            // UI Settings
            ui: {
                theme: process?.env?.UI_THEME || 'light',
                language: process?.env?.UI_LANGUAGE || 'en',
                animations: process?.env?.UI_ANIMATIONS !== 'false'
            }
        };
    }
    
    get(path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
    }
    
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.config);
        target[lastKey] = value;
    }
    
    getApiUrl(provider) {
        return this.get(`api.${provider}.url`);
    }
    
    getModelConfig(provider) {
        return this.get(`api.${provider}`);
    }
    
    isDevelopment() {
        return this.get('app.environment') === 'development';
    }
    
    isProduction() {
        return this.get('app.environment') === 'production';
    }
}

// Global configuration instance
window.config = new Config();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}
