# n8n Automation Sidekick - Setup Guide

## 🔧 **Comprehensive Debugging & Supabase Integration Setup**

### **📋 What's Been Implemented**

#### **1. Advanced Debugging System**
- ✅ **Real-time Debug Panel**: Click the 🔍 button to see live logs
- ✅ **API Request/Response Logging**: Full visibility into all API calls
- ✅ **Performance Monitoring**: Timer-based performance tracking
- ✅ **Error Tracking**: Comprehensive error logging with stack traces
- ✅ **Export Logs**: Download complete debug history for analysis

#### **2. Supabase Authentication & Backend**
- ✅ **Migration from Firebase**: Complete authentication system moved to Supabase
- ✅ **User Management**: Sign up, sign in, password reset
- ✅ **Workflow Logging**: All generations logged to Supabase
- ✅ **User Statistics**: Track usage, costs, and preferences
- ✅ **Data Persistence**: Save workflows and settings

#### **3. Enhanced Test Connection**
- ✅ **Comprehensive Testing**: Tests all AI provider connections
- ✅ **Detailed Feedback**: Shows exact error messages and status
- ✅ **Performance Metrics**: Response time tracking
- ✅ **Network Diagnostics**: Network error detection and reporting

---

## 🚀 **Setup Instructions**

### **Step 1: Supabase Database Setup**

1. **Go to your Supabase Project**: https://supabase.com/dashboard
2. **Navigate to SQL Editor**
3. **Run the schema setup**:
   - Open `supabase-schema.sql`
   - Copy and paste the entire SQL content
   - Click "Run" to execute

This will create:
- `profiles` table for user data
- `workflow_generations` table for logging
- `saved_workflows` table for user workflows
- `user_settings` table for preferences
- `api_usage` table for usage tracking
- Row Level Security (RLS) policies

### **Step 2: Test the Extension**

1. **Open Chrome Extension**:
   - Chrome should automatically open with the extension loaded
   - Click the n8n Sidekick icon in the toolbar

2. **Enable Debug Mode**:
   - Click the 🔍 button in the top-right corner
   - This opens the debug panel showing real-time logs

3. **Test Connection**:
   - Go to "Setup" tab
   - Select "OpenRouter" as provider
   - Enter your OpenRouter API key
   - Click "Test Connection"
   - Watch the debug panel for detailed logs

4. **Test Workflow Generation**:
   - Go to "Generate" tab
   - Enter a simple prompt like "Create a workflow that sends an email when a web form is submitted"
   - Click "Generate Workflow"
   - Monitor the debug panel for step-by-step progress

### **Step 3: Test Authentication**

1. **Open the Website**:
   - Navigate to your `index.html` in the browser
   - You should see "Sign In" and "Sign Up" buttons

2. **Create Account**:
   - Click "Sign Up"
   - Enter email and password
   - Check your email for verification (if enabled)

3. **Sign In**:
   - Click "Sign In"
   - Enter credentials
   - You should see your email displayed

---

## 🔍 **Debugging Guide**

### **Using the Debug Panel**

The debug panel provides real-time insights:

#### **Log Levels**
- 🔴 **ERROR**: Critical errors that stop functionality
- 🟡 **WARN**: Warnings that don't break functionality
- 🔵 **INFO**: Important events and state changes
- ⚪ **DEBUG**: Detailed execution information
- 🔘 **TRACE**: Very detailed step-by-step logging

#### **Key Log Categories**
- `WORKFLOW_GENERATION`: Complete workflow generation process
- `API_REQUEST`: Outbound API calls with headers and body
- `API_RESPONSE`: API responses with status and timing
- `TEST_CONNECTION`: Connection testing process
- `AUTH`: Authentication events
- `CONSOLE`: Console.log/error/warn/info/debug calls

#### **Debug Features**
- **Filter**: Type to filter logs by category, message, or data
- **Clear**: Remove all logs from the panel
- **Export**: Download complete log history as JSON
- **Auto-scroll**: Automatically scrolls to show latest logs

### **Common Issues & Solutions**

#### **1. "API Connection Failed"**
**Debug Steps:**
1. Check debug panel for `TEST_CONNECTION` logs
2. Look for `API_REQUEST` and `API_RESPONSE` entries
3. Verify API key format and permissions
4. Check network connectivity

**Common Causes:**
- Invalid API key
- Network restrictions
- API service downtime
- Incorrect endpoint URL

#### **2. "Workflow Generation Failed"**
**Debug Steps:**
1. Look for `WORKFLOW_GENERATION` logs
2. Check `API_REQUEST` to see what was sent
3. Check `API_RESPONSE` for error details
4. Verify prompt format and length

**Common Causes:**
- Invalid API credentials
- Prompt too long
- Model not available
- Content policy violations

#### **3. "Authentication Failed"**
**Debug Steps:**
1. Check `AUTH` logs
2. Verify Supabase configuration
3. Check email verification status
4. Review RLS policies

**Common Causes:**
- Incorrect Supabase URL/keys
- Email not verified
- RLS policy blocking access
- Network issues

---

## 📊 **Performance Monitoring**

### **Timing Metrics**
The debug system tracks:
- **API Call Duration**: Time for each API request
- **Generation Time**: Complete workflow generation process
- **UI Response Time**: Interface responsiveness

### **Usage Tracking**
With Supabase integration, you can track:
- **Total Generations**: Number of workflows created
- **Success Rate**: Percentage of successful generations
- **Token Usage**: AI model token consumption
- **Cost Tracking**: API usage costs
- **Popular Models**: Most used AI providers/models

---

## 🛠 **Advanced Configuration**

### **Debug Level Adjustment**
```javascript
// In debug-system.js, change the current level:
this.currentLevel = this.logLevels.TRACE; // Most verbose
this.currentLevel = this.logLevels.ERROR; // Only errors
```

### **Custom Logging**
```javascript
// Add custom logging in your code:
window.debug.info('CUSTOM_CATEGORY', 'Custom message', { data: 'value' });
window.debug.timer('Custom Operation');
// ... your code ...
window.debug.end(timer);
```

### **Supabase Queries**
```javascript
// Query user statistics:
const stats = await window.supabaseClient
  .rpc('get_user_stats', { user_uuid: userId });

// Query recent generations:
const generations = await window.supabaseClient
  .from('workflow_generations')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

---

## 🚨 **Troubleshooting Checklist**

### **Before Testing**
- [ ] Supabase schema executed successfully
- [ ] Extension loaded in Chrome without errors
- [ ] Debug panel opens when clicking 🔍
- [ ] API keys are valid and have proper permissions

### **During Testing**
- [ ] Watch debug panel for real-time feedback
- [ ] Check browser console for additional errors
- [ ] Verify network requests in DevTools
- [ ] Test with simple prompts first

### **After Testing**
- [ ] Export debug logs if issues persist
- [ ] Check Supabase dashboard for database errors
- [ ] Review API provider dashboards for usage limits
- [ ] Document any unexpected behavior

---

## 📞 **Getting Help**

### **Debug Information to Collect**
1. **Exported Debug Logs**: Use the "Export" button in debug panel
2. **Browser Console Errors**: Screenshots of console errors
3. **Network Tab**: Screenshots of failed network requests
4. **Supabase Logs**: Check Supabase dashboard for errors
5. **API Provider Status**: Check provider service status

### **Common Debug Commands**
```javascript
// Check Supabase connection
console.log('Supabase client:', window.supabaseClient);
console.log('Auth manager:', window.supabaseAuth);
console.log('Backend manager:', window.supabaseBackend);

// Check debug system
console.log('Debug system:', window.debugSystem);
console.log('Recent logs:', window.debugSystem.logs.slice(-10));

// Check extension state
console.log('Sidekick instance:', window.sidekick);
console.log('Current settings:', await window.sidekick.getSettings());
```

---

## ✅ **Success Indicators**

### **Working Setup Shows:**
- ✅ Debug panel opens and shows initialization logs
- ✅ Test connection returns "successful" with timing data
- ✅ Workflow generation completes with JSON output
- ✅ Authentication UI works (sign up/sign in)
- ✅ Data appears in Supabase dashboard tables
- ✅ No error messages in debug panel or console

### **Performance Benchmarks:**
- 🎯 **API Response Time**: < 3 seconds for most providers
- 🎯 **Workflow Generation**: < 10 seconds for simple workflows
- 🎯 **UI Response**: < 100ms for button clicks
- 🎯 **Debug Panel**: Real-time updates without lag

---

**🎉 Your n8n Automation Sidekick is now equipped with enterprise-grade debugging and Supabase backend!**
