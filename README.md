# n8n Automation Sidekick

A professional Chrome Extension and Web Platform that serves as an intelligent sidekick for n8n workflow automation. Transform natural language descriptions into ready-to-import n8n workflows with AI-powered generation and visual workflow building.

## Features

- **Natural Language Processing**: Describe complex automation logic in plain English
- **AI-Powered Generation**: Uses multiple AI providers (OpenRouter, OpenAI, Google Gemini, Groq, Ollama)
- **Visual Workflow Builder**: Drag-and-drop interface for building workflows visually
- **One-Click Import**: Instantly copy workflows to clipboard for seamless n8n canvas import
- **Professional UI**: Clean, n8n-inspired design with signature orange (#ff6d5a) and dark blue (#223344) colors
- **Smart Options**: Include error handling and logging nodes automatically
- **Real Authentication**: Firebase-based authentication with user accounts
- **Dynamic Configuration**: Environment-based configuration with no hardcoded values

## Installation

### Development Setup

1. Clone or download this repository
2. Install dependencies and configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extension directory
6. The extension will appear in your Chrome toolbar

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id

# AI Provider API Keys (choose one or more)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_API_KEY=AIza-your-google-key
GROQ_API_KEY=gsk_your-groq-key

# Application Settings
APP_NAME=n8n Automation Sidekick
NODE_ENV=development
```

### First Time Setup

1. Click the extension icon in your Chrome toolbar
2. Navigate to the **Setup** tab
3. Configure your preferred AI provider and enter API key
4. Test the connection to verify everything works
5. Switch to the **Generate** tab to start creating workflows

## Usage

### AI Generation
1. **Describe Your Workflow**: In natural language, explain what you want to automate
   - Example: "When a new user signs up, send a welcome email, add them to our CRM, and create a Slack notification"

2. **Configure Options**: Choose whether to include error handling and logging nodes

3. **Generate**: Click "Generate Workflow" and watch the AI create your n8n workflow

4. **Import to n8n**: 
   - Click "Import to Canvas" to copy the workflow JSON
   - Open your n8n canvas and press Ctrl+V (Windows) or Cmd+V (Mac)
   - The workflow will appear ready to use

### Visual Builder
1. **Sign In**: Create an account or sign in to access the visual builder
2. **Drag Nodes**: From the palette, drag nodes to the canvas
3. **Configure**: Click nodes to configure their parameters
4. **Connect**: Drag between node ports to create connections
5. **Export**: Click "Export JSON" to copy the n8n workflow

## Architecture

### Configuration System
- **Dynamic Configuration**: All settings loaded from environment variables
- **Node Registry**: Centralized node definitions with validation
- **Multi-Provider Support**: Pluggable AI provider system

### Authentication
- **Firebase Auth**: Real user authentication with email/password
- **User Sessions**: Persistent login state across browser sessions
- **Account Management**: User profile and workflow saving

### Node System
- **Dynamic Nodes**: Node definitions loaded from registry
- **Parameter Validation**: Built-in validation for node parameters
- **Extensible**: Easy to add new node types

## Requirements

- Chrome browser (Manifest V3 compatible)
- Firebase project for authentication
- AI provider API key (OpenRouter, OpenAI, Google, Groq, or Ollama)
- Active n8n instance for workflow import

## Development

### Project Structure
```
├── manifest.json          # Chrome extension manifest
├── popup.html/js          # Extension popup interface
├── index.html/js/css      # Web platform
├── config.js              # Configuration management
├── nodes-config.js        # Node definitions registry
├── firebase-config.js     # Firebase authentication
└── .env.example           # Environment template
```

### Adding New Nodes
1. Update `nodes-config.js` with new node definitions
2. Add parameter fields and validation rules
3. Nodes automatically appear in both builders

### Adding AI Providers
1. Update `config.js` with provider configuration
2. Add API call methods in `popup.js`
3. Update provider selection UI

## License

MIT License - see LICENSE file for details

## AI Models

The extension supports multiple AI models via OpenRouter:

- **Gemini 2.0 Flash** (Recommended) - Fast and cost-effective
- Claude 3.5 Sonnet - High-quality reasoning
- GPT-4o - Reliable performance

## Security & Privacy

- API keys are stored locally in Chrome's secure storage
- Workflow descriptions are sent to OpenRouter for processing
- No data is stored on external servers beyond the AI API calls
- Clipboard access is used only for workflow import functionality

## Troubleshooting

### API Connection Issues
- Verify your OpenRouter API key is valid
- Check your internet connection
- Ensure you have sufficient API credits

### Workflow Import Problems
- Make sure you're on the n8n canvas page
- Try refreshing the page and importing again
- Check that the workflow JSON is valid

### Generation Errors
- Provide more detailed descriptions
- Try simplifying complex workflows
- Check the error message for specific issues

## Development

### Project Structure
```
n8n-automation-sidekick/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI interface
├── popup.js              # Application logic
├── styles.css            # n8n-inspired styling
├── background.js         # Service worker
├── icons/                # Extension icons
└── README.md             # This file
```

### Customization
- Modify `styles.css` to adjust the UI appearance
- Update `popup.js` to add new features or AI models
- Edit `manifest.json` for permissions and configuration

## License

MIT License - feel free to modify and distribute according to your needs.

## Support

For issues, feature requests, or questions:
1. Check the troubleshooting section above
2. Verify your API key and connection
3. Review the browser console for error messages

---

**n8n Automation Sidekick** - Making workflow automation accessible to everyone.
