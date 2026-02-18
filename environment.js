// Environment Configuration for Browser
// This file allows easy configuration without requiring build tools

const ENVIRONMENT = {
    // Set to 'demo' to use demo mode, or 'production' for real Supabase
    MODE: 'production',
    
    // Supabase Configuration
    SUPABASE: {
        url: process.env.SUPABASE_URL || 'https://egabjbrvvhkutivbogjg.supabase.co',
        anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYWJqYnJ2dmhrdXRpdmJvZ2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTM1NzMsImV4cCI6MjA4NjgyOTU3M30.Nak3nrBV3wpJaZWJC8KLcHQpWu3_V_R_RMB-rMQPhBw',
        publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_IQfhDiiVIMwdE5_osNH8Ug_xtILDr9K'
    },
    
    // AI Provider Configuration
    AI_PROVIDERS: {
        openrouter: {
            apiUrl: 'https://openrouter.ai/api/v1',
            defaultModel: 'openai/gpt-4o-mini',
            maxTokens: 4000,
            temperature: 0.7
        },
        openai: {
            apiUrl: 'https://api.openai.com/v1',
            defaultModel: 'gpt-4',
            maxTokens: 4000,
            temperature: 0.7
        },
        google: {
            apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
            defaultModel: 'gemini-2.0-flash-exp',
            maxTokens: 4000,
            temperature: 0.7
        },
        groq: {
            apiUrl: 'https://api.groq.com/openai/v1',
            defaultModel: 'llama-3.1-70b-versatile',
            maxTokens: 4000,
            temperature: 0.7
        },
        ollama: {
            apiUrl: 'http://localhost:11434',
            defaultModel: 'llama3.2',
            maxTokens: 4000,
            temperature: 0.7
        }
    },
    
    // Application Settings
    APP: {
        name: 'n8n Automation Sidekick',
        version: '1.0.0',
        environment: 'production',
        debug: false
    }
};

// Export for use in other files
window.ENVIRONMENT = ENVIRONMENT;

// Helper functions
window.isDemoMode = () => ENVIRONMENT.MODE === 'demo';
window.isProductionMode = () => ENVIRONMENT.MODE === 'production';

// Configuration validation
function validateEnvironment() {
    if (window.isProductionMode()) {
        const requiredFields = ['url', 'anonKey'];
        const missing = requiredFields.filter(field => !ENVIRONMENT.SUPABASE[field] || ENVIRONMENT.SUPABASE[field].includes('your-'));
        
        if (missing.length > 0) {
            console.warn('⚠️ Missing Supabase configuration fields:', missing);
            console.warn('⚠️ Falling back to demo mode');
            ENVIRONMENT.MODE = 'demo';
            return false;
        }
    }
    return true;
}

// Validate on load
validateEnvironment();
