# 🔧 PROMPT TEST TROUBLESHOOTING

## 🎯 **Issue: Test Connection Works, Test Prompt Fails**

This is a common issue where:
- ✅ **Test Connection**: `/api/tags` endpoint works (can list models)
- ❌ **Test Prompt**: `/api/generate` endpoint fails (can't generate text)

## 🔍 **Why This Happens**

1. **Tags vs Generate**: Different endpoints, different requirements
2. **Model Loading**: Model might be listed but not fully loaded
3. **Ollama State**: Ollama might be running but not ready for generation
4. **API Format**: Generate endpoint has stricter requirements

## 🚀 **Immediate Solutions**

### **Solution 1: Run Diagnostic**
Open browser console (F12) and run:
```javascript
diagnoseOllama()
```

This will tell you exactly what's wrong.

### **Solution 2: Manual Test**
In console run:
```javascript
testOllamaManual()
```

### **Solution 3: Fix Test Prompt Button**
In console run:
```javascript
fixPromptGeneration()
```

## 🔧 **Common Fixes**

### **Fix 1: Restart Ollama**
```powershell
# Stop Ollama
Stop-Process -Name ollama -Force -ErrorAction SilentlyContinue

# Start Ollama
ollama serve
```

### **Fix 2: Load Model Properly**
```powershell
# Pull and load model
ollama pull llama3.2
ollama run llama3.2
# Wait for it to fully load, then exit
```

### **Fix 3: Check Ollama Status**
```powershell
# Check what's running
ollama list

# Check if serving
curl http://localhost:11434/api/tags
```

## 🧪 **Manual Testing Steps**

### **Step 1: Test Tags Endpoint**
```javascript
fetch('http://localhost:11434/api/tags').then(r=>r.json()).then(console.log)
```
Should show your llama3.2 model.

### **Step 2: Test Generate Endpoint**
```javascript
fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        model: 'llama3.2',
        prompt: 'Say "Hello"',
        stream: false
    })
}).then(r=>r.json()).then(console.log)
```

### **Step 3: Test Extension Button**
Click the "🧠 Test Prompt" button again.

## 📊 **Expected Results**

### **✅ Working Generate Endpoint:**
```json
{
  "model": "llama3.2",
  "created_at": "2024-01-01T00:00:00.000Z",
  "response": "Hello",
  "done": true,
  "total_duration": 123456789,
  "prompt_eval_count": 10,
  "eval_count": 5
}
```

### **❌ Common Errors:**
- `model not found`: Model not loaded properly
- `connection refused`: Ollama not running
- `internal server error`: Ollama issue

## 🎯 **Diagnostic Results Meaning**

### **All Green ✅**: Everything working, try test prompt again
### **Tags ✅, Generate ❌**: Model issue, reload model
### **Both ❌**: Ollama not running, restart Ollama

## 🔄 **Complete Reset Procedure**

1. **Stop Everything**:
   ```powershell
   Stop-Process -Name ollama -Force -ErrorAction SilentlyContinue
   Stop-Process -Name msedge -Force -ErrorAction SilentlyContinue
   ```

2. **Start Ollama Fresh**:
   ```powershell
   ollama serve
   ```

3. **Load Model**:
   ```powershell
   ollama run llama3.2
   # Wait for complete load, then exit
   ```

4. **Start Extension**:
   - Open Edge with extension
   - Open console (F12)
   - Run `diagnoseOllama()`

5. **Test Again**:
   - Try "🔗 Test Connection" 
   - Try "🧠 Test Prompt"

## 🎉 **Success Indicators**

- ✅ Diagnostic shows all endpoints working
- ✅ Test prompt button shows "Testing..." then success
- ✅ Console shows "Generate endpoint working!"
- ✅ Alert says "Prompt generation test successful!"

**🚀 After these steps, the test prompt should work perfectly!**
