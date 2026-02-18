# 🔧 Chrome Extension Testing Guide

## 🧪 Quick Test Steps

### 1. Load Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project directory
4. Verify the extension icon appears in the toolbar

### 2. Test Basic Functionality
1. Click the extension icon to open the popup
2. Check that all tabs appear (Generate, Templates, Setup)
3. Verify no console errors in the extension popup

### 3. Test AI Integration
1. Go to Setup tab
2. Select an AI provider (e.g., OpenRouter)
3. Enter your API key
4. Click "Test Connection"
5. Should see "Connection successful!" message

### 4. Test Workflow Generation
1. Go to Generate tab
2. Enter a simple workflow description
3. Click "Generate Workflow"
4. Should see workflow JSON in the output area

### 5. Test Canvas Context Detection
1. Open n8n instance (https://app.n8n.cloud or localhost:5678)
2. Open a workflow or create a new one
3. Click the extension icon
4. Should see "Canvas detected" indicator
5. Try generating a workflow with context

### 6. Test Workflow Import
1. Generate a workflow in the extension
2. Click "Copy to Clipboard"
3. Go to n8n canvas
4. Press Ctrl+V (or Cmd+V)
5. Workflow should appear on canvas

## 🔍 Debugging Tips

### Check Console Errors
1. Right-click extension icon → "Inspect popup"
2. Check console for any JavaScript errors
3. Check background script console

### Check Content Script
1. Open n8n page
2. Open Chrome DevTools (F12)
3. Check console for content script messages
4. Look for "n8n Sidekick" messages

### Check Network Requests
1. Open Chrome DevTools → Network tab
2. Generate a workflow
3. Check for API requests to AI providers
4. Verify API key is being sent correctly

## 🐛 Common Issues & Solutions

### Extension Not Loading
- **Issue**: Extension icon doesn't appear
- **Solution**: Check manifest.json syntax, ensure all referenced files exist

### API Connection Fails
- **Issue**: "Connection failed" error
- **Solution**: Verify API key is valid, check network connectivity

### Canvas Not Detected
- **Issue**: No context awareness on n8n pages
- **Solution**: Check content script injection, verify n8n page structure

### Workflow Import Fails
- **Issue**: Clipboard import doesn't work
- **Solution**: Check n8n canvas is active, verify workflow JSON format

## 📱 Testing on Different n8n Instances

### Cloud n8n
1. https://app.n8n.cloud
2. https://your-instance.n8n.cloud

### Self-hosted n8n
1. http://localhost:5678
2. https://your-domain.com:5678

### n8n.io
1. https://app.n8n.io
2. https://your-instance.n8n.io

## ✅ Success Criteria

- ✅ Extension loads without errors
- ✅ All tabs and UI elements work
- ✅ AI provider connections successful
- ✅ Workflow generation produces valid JSON
- ✅ Canvas detection works on n8n pages
- ✅ Workflow import to n8n canvas works
- ✅ No console errors in any context

## 🚨 If Issues Persist

1. **Check Chrome Extension Permissions**
   - Ensure all required permissions are granted
   - Verify host permissions for n8n domains

2. **Clear Extension Cache**
   - Remove and reload the extension
   - Clear browser cache

3. **Check Environment Variables**
   - Verify .env files are correctly configured
   - Ensure API keys are valid

4. **Review Chrome Extension Manifest**
   - Validate manifest.json syntax
   - Check content script matches

5. **Test in Incognito Mode**
   - Some extensions have different behavior in incognito
   - Ensure extension is enabled for incognito if needed
