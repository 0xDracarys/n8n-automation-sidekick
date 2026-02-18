# Environment Setup Guide

## Security Best Practices

⚠️ **Never commit API keys to version control!** Always use environment variables.

## Required Environment Variables

### Supabase Configuration
```bash
# Website (website/.env)
SUPABASE_URL=https://egabjbrvvhkutivbogjg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYWJqYnJ2dmhrdXRpdmJvZ2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTM1NzMsImV4cCI6MjA4NjgyOTU3M30.Nak3nrBV3wpJaZWJC8KLcHQpWu3_V_R_RMB-rMQPhBw

# Extension (extension.env)
SUPABASE_URL=https://egabjbrvvhkutivbogjg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYWJqYnJ2dmhrdXRpdmJvZ2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTM1NzMsImV4cCI6MjA4NjgyOTU3M30.Nak3nrBV3wpJaZWJC8KLcHQpWu3_V_R_RMB-rMQPhBw
```

### AI Provider API Keys
Set these in your environment or provide them in the extension UI:

```bash
# OpenRouter (Recommended)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Google Gemini
GOOGLE_API_KEY=AIza-your-google-key

# Groq
GROQ_API_KEY=gsk_your-groq-key
```

## Setup Instructions

### 1. Website Development
```bash
# Copy the example file
cp .env.example website/.env

# Edit website/.env with your actual keys
nano website/.env
```

### 2. Chrome Extension
The extension will prompt you to enter API keys in the Setup tab. No environment variables needed for the extension.

### 3. Testing
```bash
# Set environment variable for testing
export OPENROUTER_API_KEY=sk-or-v1-your-key
node quick-test.js

# Or pass as argument
node quick-test.js sk-or-v1-your-key
```

## Environment Variable Priority

1. **Environment variables** (highest priority)
2. **User input in extension UI**
3. **Default values** (fallback)

## Security Notes

- ✅ API keys are never hardcoded in the source code
- ✅ Extension stores keys in Chrome storage (encrypted)
- ✅ Website uses environment variables only
- ✅ No API keys in version control
- ✅ Keys are validated before use

## Getting API Keys

### OpenRouter
1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Sign up and get your API key from the dashboard
3. Copy the key starting with `sk-or-v1-`

### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key in the API section
3. Copy the key starting with `sk-`

### Google Gemini
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Copy the key starting with `AIza`

### Groq
1. Go to [Groq Console](https://console.groq.com)
2. Create an API key
3. Copy the key starting with `gsk_`

## Troubleshooting

### Extension Shows "API Key Required"
- Go to the Setup tab in the extension
- Enter your API key in the appropriate field
- Click "Test Connection" to verify

### Website Shows Authentication Error
- Check that `website/.env` exists and has the correct keys
- Restart the development server
- Verify the keys are valid

### API Key Not Working
- Verify the key is copied correctly (no extra spaces)
- Check if the key has expired
- Ensure you have sufficient credits/quota
