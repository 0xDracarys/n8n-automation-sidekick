# Development Setup Guide

## 🚀 Quick Start

This guide will help you set up the n8n Automation Sidekick for local development.

## 📋 Prerequisites

- Node.js 16+ and npm 8+
- Chrome browser (for extension development)
- Git
- Code editor (VS Code recommended)

## 🛠 Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/0xDracarys/n8n-automation-sidekick.git
cd n8n-automation-sidekick
```

### 2. Environment Configuration

#### For Local Development
The project includes real credentials in `.env` for local development. This file is **NOT** committed to GitHub.

#### For New Setup
Copy the example file and add your credentials:
```bash
cp .env.example .env
```

Add your API keys to `.env`:
```bash
# AI Provider API Keys (choose one or more)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=AIza-your-google-key
GROQ_API_KEY=gsk_your-groq-key

# Supabase Configuration (if using)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Install Dependencies
```bash
# Install root dependencies
npm install

# Install website server dependencies
cd website
npm install
cd ..
```

### 4. Start the Development Server

#### Option A: Start Web Platform Only
```bash
cd website
npm run server
```
The server will start on `http://localhost:3001`

#### Option B: Start with Extension
1. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

2. Start the server:
```bash
cd website
npm run server
```

## 🔧 Configuration

### Environment Variables

The project uses two environment files:

- **`.env`**: Local development with real credentials (never committed)
- **`.env.example`**: Template with placeholders (committed to GitHub)

### Key Configuration Files

- `config.js`: Main configuration management
- `environment.js`: Browser environment settings
- `manifest.json`: Chrome extension configuration
- `website/.env`: Server environment variables

## 🧪 Testing

### Run Automated Tests
```bash
npm test
```

### Manual Testing
1. Open Chrome extension popup
2. Test workflow generation
3. Verify server connectivity
4. Test template functionality

## 📁 Project Structure

```
n8n-automation-sidekick/
├── manifest.json          # Chrome extension manifest
├── popup.html/js/css       # Extension popup interface
├── content-script.js      # n8n canvas integration
├── config.js              # Configuration management
├── environment.js         # Environment settings
├── .env                   # Local credentials (not committed)
├── .env.example           # Credential template (committed)
├── website/               # Web platform server
│   ├── server/           # Express server
│   ├── client/           # React frontend (if added)
│   └── .env              # Server credentials
├── services/             # Business logic services
├── icons/                # Extension icons
└── docs/                 # Documentation
```

## 🔒 Security Notes

- **Never commit real API keys** to version control
- `.env` files are excluded by `.gitignore`
- Use `.env.example` as a template for new setups
- Rotate API keys regularly

## 🚨 Common Issues

### Server Won't Start
- Check if port 3001 is available
- Verify `.env` file exists with correct variables
- Run `npm install` in website directory

### Extension Not Loading
- Enable Developer mode in Chrome extensions
- Check manifest.json for syntax errors
- Verify all referenced files exist

### API Connection Issues
- Verify API keys are valid and active
- Check network connectivity
- Review API provider rate limits

## 📚 Development Tips

### Chrome Extension Development
1. Use Chrome DevTools for debugging
2. Check extension popup console for errors
3. Use `chrome://extensions/` for reloading

### Server Development
1. Server runs on `http://localhost:3001`
2. API endpoints available at `/api/*`
3. Health check at `/api/health`

### Code Style
- Use ES6+ features
- Follow existing naming conventions
- Add comments for complex logic
- Test changes before committing

## 🔄 Deployment

### Chrome Extension
1. Update version in `manifest.json`
2. Test thoroughly
3. Package for Chrome Web Store

### Web Platform
1. Set `NODE_ENV=production`
2. Build client assets (if applicable)
3. Deploy to hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

- Check existing issues on GitHub
- Review troubleshooting guides
- Join community discussions
- Contact maintainers for help

---

**Happy Coding! 🎉**
