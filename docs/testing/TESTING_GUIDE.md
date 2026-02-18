# 🧪 Testing Guide for n8n Automation Sidekick

## 🎯 **Quick Testing Instructions**

Since you have Ollama running with `llama3.2:latest`, here's how to test everything:

### **1. Open Extension**
- Chrome should open with the extension loaded
- Click the n8n Sidekick icon in the toolbar

### **2. Setup Ollama**
1. Click **Setup** tab
2. Select **"Ollama (Local/Free)"** as provider
3. URL should be: `http://localhost:11434`
4. Model should be: `llama3.2`
5. Click **"Test Connection"** button

### **3. Run Test Suite**
In the Setup tab, you'll see **Test Suite** section with three buttons:

#### **🔗 Test Connection**
- Tests basic connection to Ollama
- Shows available models
- Should show: `llama3.2:latest` with file size

#### **🧠 Test Prompt**
- Tests workflow generation with sample prompt
- Should generate a workflow with Slack notification
- Shows node types and structure

#### **🧪 Quick Test**
- Complete end-to-end test
- Tests webhook + email workflow generation
- Validates workflow structure
- Shows detailed results with any issues

---

## 📊 **Expected Results**

### **✅ Successful Test Connection Should Show:**
```
✅ Ollama connection successful!
Server: http://localhost:11434
Available models:
  • llama3.2:latest (1.87 GB)
```

### **✅ Successful Prompt Test Should Show:**
```
✅ Workflow generated successfully!
Prompt: Create a workflow that sends a Slack message when a new user signs up
Node count: 2-3
Has connections: ✅
Node types:
  1. Webhook - Trigger
  2. Slack - Send Message
```

### **✅ Successful Quick Test Should Show:**
```
🎯 Quick Test Result:
Status: ✅ PASSED
Duration: 2000-5000ms
Node Count: 2
Has Connections: ✅
Issues: 0
Warnings: 0
Found nodes: Webhook, Email
```

---

## 🔍 **Debug Panel Usage**

Click the **🔍** button (top-right corner) to open the debug panel:

### **What to Look For:**
- **INFO logs**: Normal operations (green)
- **DEBUG logs**: Detailed execution info (gray)
- **ERROR logs**: Any problems (red)
- **API_REQUEST/RESPONSE**: All API calls with timing

### **Filtering:**
Type in the filter box to search for:
- `TEST_CONNECTION` - Connection test logs
- `WORKFLOW_GENERATION` - Generation process
- `API_REQUEST` - Outbound API calls
- `API_RESPONSE` - API responses

---

## 🚨 **Troubleshooting Common Issues**

### **"Network error: window.debug.logAPIRequest is not a function"**
**✅ FIXED**: This should now be resolved with the debug system fallback

### **"Ollama connection failed"**
**Check:**
1. Ollama is running: `ollama list`
2. Correct URL: `http://localhost:11434`
3. Model is available: `ollama show llama3.2`

### **"Workflow generation failed"**
**Check:**
1. Model is loaded: `ollama run llama3.2` (once)
2. Debug panel shows API requests
3. Prompt is not too complex

### **"Invalid workflow format"**
**Check:**
1. Debug panel shows AI response
2. Response contains valid JSON
3. No markdown formatting in response

---

## 📋 **Test Cases to Try**

### **Basic Test Cases:**
1. **Simple Workflow**: "Send email when form is submitted"
2. **Data Processing**: "Filter CSV data and save to Google Sheets"
3. **API Integration**: "Get weather data and send Slack notification"

### **Expected Node Types:**
- **Webhook**: For form submissions
- **Send Email**: For email notifications
- **Read CSV**: For CSV processing
- **Filter**: For data filtering
- **Google Sheets**: For spreadsheet operations
- **HTTP Request**: For API calls
- **Slack**: For Slack notifications

---

## ⚡ **Performance Benchmarks**

### **Good Performance:**
- **Connection Test**: < 500ms
- **Prompt Generation**: < 5 seconds
- **Quick Test**: < 10 seconds
- **Node Count**: 2-4 nodes for simple workflows

### **If Slow:**
- Check Ollama model loading time
- Verify network connectivity
- Consider simpler prompts for testing

---

## 🎯 **Success Criteria**

### **✅ Working Setup Shows:**
- Extension loads without errors
- Debug panel opens and shows logs
- Ollama connection test succeeds
- Prompt generation produces valid JSON
- Quick test passes with 0 issues
- Generated workflows have proper structure

### **📊 Validation Checks:**
- Workflow has `nodes` array
- Each node has `id`, `name`, `type`, `position`
- Connections object exists (can be empty)
- Node types match expected functionality
- JSON is valid and importable

---

## 🛠 **Advanced Testing**

### **Manual Console Testing:**
Open browser console (F12) and run:

```javascript
// Test connection only
testConnection()

// Test prompt generation
testPromptGeneration()

// Run quick test
runQuickTest()

// Check debug logs
console.log(window.debugSystem.logs.slice(-10))
```

### **API Testing:**
```javascript
// Direct Ollama API test
fetch('http://localhost:11434/api/tags')
  .then(r => r.json())
  .then(d => console.log(d))
```

---

## 📞 **Debug Information Collection**

If issues persist, collect:

1. **Debug Logs**: Click "Export" in debug panel
2. **Console Errors**: Screenshots of console (F12)
3. **Network Tab**: Failed requests in DevTools
4. **Ollama Status**: `ollama list` output

---

## 🎉 **Testing Checklist**

- [ ] Extension loads in Chrome
- [ ] Debug panel opens (🔍 button)
- [ ] Ollama connection test succeeds
- [ ] Prompt generation works
- [ ] Quick test passes
- [ ] Generated workflows are valid JSON
- [ ] No errors in console
- [ ] Performance is acceptable

**🚀 Your n8n Automation Sidekick is ready for testing!**
