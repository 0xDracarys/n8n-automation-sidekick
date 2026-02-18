# 🚀 Quick Setup & Testing Guide

## ✅ **What's Fixed & Ready**

1. **Debug System**: Fixed `window.debug.logAPIRequest is not a function` error
2. **Test Buttons**: Added fallback functions for all test buttons
3. **Edge Browser**: Configured VS Code to launch with Edge
4. **Extension Loading**: Improved initialization with error handling

## 🎯 **Immediate Actions**

### **1. Edge Browser is Now Launching**
- Edge should open with the extension loaded
- Look for the n8n Sidekick icon in the toolbar

### **2. Test the Extension**
1. **Open Extension**: Click the n8n Sidekick icon
2. **Go to Setup Tab**: Select "Ollama (Local/Free)"
3. **Test Connection**: Click "🔗 Test Connection" button
4. **Check Results**: Should show your `llama3.2:latest` model

### **3. Debug Any Issues**
Open browser console (F12) and run:
```javascript
debugExtension()
```

This will show a complete status report of the extension.

## 🔧 **If Buttons Don't Work**

### **Check Console:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Run `debugExtension()` to see status

### **Manual Testing:**
If buttons don't work, test manually in console:
```javascript
// Test connection directly
testConnection()

// Test prompt generation  
testPromptGeneration()

// Run quick test
runQuickTest()
```

## 📊 **Expected Results**

### **✅ Successful Test Connection:**
```
✅ Ollama connection successful!
Server: http://localhost:11434
Available models:
  • llama3.2:latest (1.87 GB)
```

### **✅ Debug Extension Report Should Show:**
```
🔍 EXTENSION DEBUG REPORT
📋 DOM Elements:
  Popup container: true
  Tab buttons: 4
  Test buttons: 3
  Test results div: true
  Test output div: true

🌐 Global Objects:
  window.sidekick: true
  window.testSuite: true
  window.debugSystem: true
  window.debug: true

🧪 Test Functions:
  runQuickTest: function
  testConnection: function
  testPromptGeneration: function
```

## 🚨 **Troubleshooting**

### **If Extension Doesn't Load:**
1. Refresh the extension page (Edge extensions page)
2. Check for any error messages
3. Run `debugExtension()` in console

### **If Test Buttons Don't Work:**
1. Check console for errors
2. Try manual functions in console
3. Make sure Ollama is running: `ollama list`

### **If Connection Fails:**
1. Verify Ollama is running: `ollama list`
2. Check URL is correct: `http://localhost:11434`
3. Test direct connection in console:
   ```javascript
   fetch('http://localhost:11434/api/tags').then(r => r.json()).then(console.log)
   ```

## 🎯 **VS Code Launch Options**

You now have 3 launch configurations in VS Code:

1. **Launch Edge with Extension** - Opens Edge with extension
2. **Launch Chrome with Extension** - Opens Chrome with extension  
3. **Launch Chrome against localhost** - For web development

Use **"Launch Edge with Extension"** from the debug panel.

## 📋 **Testing Checklist**

- [ ] Edge opens with extension loaded
- [ ] Extension icon appears in toolbar
- [ ] Extension opens when clicked
- [ ] Setup tab shows provider options
- [ ] Ollama is selected as provider
- [ ] Test Connection button works
- [ ] Shows llama3.2:latest model
- [ ] No errors in console
- [ ] Debug panel opens (🔍 button)

**🎉 Your extension should now be working perfectly in Edge!**
