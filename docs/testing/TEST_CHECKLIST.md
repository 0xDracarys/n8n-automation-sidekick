# Quick Test Script for Workflow Storage

## 1. Run Supabase Migration
Copy contents of `MANUAL_SUPABASE_SETUP.sql` and paste into:
https://supabase.com/dashboard/project/egabjbrvvhkutivbogjg/sql

## 2. Start Website
```bash
cd website/server
npm run server
```

## 3. Test Flow
1. Open http://localhost:3001/builder
2. Sign up/login with email/password
3. Generate a workflow (use OpenRouter API key from your terminal)
4. Click "Save" → Choose privacy (private/public)
5. Visit http://localhost:3001/templates to see public workflows
6. Test template usage (click "Use Template")

## 4. Extension Test
1. Reload Chrome extension
2. Sign in via extension Setup tab
3. Generate workflow → Save to profile
4. Check if it appears in website templates

## 5. PowerShell API Test (Working)
```powershell
$headers = @{"Authorization" = "Bearer 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"; "Content-Type" = "application/json"}
$body = '{"model": "openai/gpt-4o-mini", "messages": [{"role": "system", "content": "Create n8n workflow JSON only"}, {"role": "user", "content": "Create a workflow that sends an email when a web form is submitted. Respond only with JSON"}], "temperature": 0.7, "max_tokens": 1000}'
try { $response = Invoke-RestMethod -Uri "https://openrouter.ai/api/v1/chat/completions" -Method POST -Headers $headers -Body $body; $response.choices[0].message.content } catch { $_.Exception.Message }
```

## Expected Results
- ✅ API key works (you got successful generation)
- ✅ Website builds without errors
- ✅ Templates page loads
- ✅ Can save/load workflows
- ✅ Extension auth works

## Troubleshooting
- If templates page shows error: Check Supabase migration ran
- If save fails: Check user is authenticated
- If extension auth fails: Reload extension after code changes
