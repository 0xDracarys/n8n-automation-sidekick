// Configuration Management
class Config {
    constructor() {
        this.config = {
            // API Endpoints
            api: window.ENVIRONMENT?.AI_PROVIDERS || {
                openrouter: {
                    url: 'https://openrouter.ai/api/v1',
                    defaultModel: 'openai/gpt-4o-mini',
                    maxTokens: 4000,
                    temperature: 0.7
                },
                openai: {
                    url: 'https://api.openai.com/v1',
                    defaultModel: 'gpt-4',
                    maxTokens: 4000,
                    temperature: 0.7
                },
                google: {
                    url: 'https://generativelanguage.googleapis.com/v1beta',
                    defaultModel: 'gemini-2.0-flash-exp',
                    maxTokens: 4000,
                    temperature: 0.7
                },
                groq: {
                    url: 'https://api.groq.com/openai/v1',
                    defaultModel: 'llama-3.1-70b-versatile',
                    maxTokens: 4000,
                    temperature: 0.7
                },
                ollama: {
                    url: 'http://localhost:11434',
                    defaultModel: 'llama3.2',
                    maxTokens: 4000,
                    temperature: 0.7
                }
            },
            
            // Application Settings
            app: window.ENVIRONMENT?.APP || {
                name: 'n8n Automation Sidekick',
                version: '1.0.0',
                environment: 'development',
                debug: true
            },
            
            // Workflow Settings
            workflow: {
                maxNodes: 50,
                maxConnections: 100,
                autoSave: true,
                exportFormat: 'n8n'
            },
            
            // UI Settings
            ui: {
                theme: 'light',
                language: 'en',
                animations: true
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
