# QA Test Matrix (Pre-Launch)

## A) Workflow generation correctness

1. Providers: OpenRouter, OpenAI, Groq
   - Expected: valid JSON object, at least one trigger, no orphan nodes.
2. Long prompt stress test (200+ words)
   - Expected: complete flow; no disconnected nodes.
3. Invalid/malformed provider output simulation
   - Expected: parser recovery or explicit error message.

## B) Connection integrity and layout

1. IF node branch test
   - Expected: `main[0]` and `main[1]` properly split.
2. Duplicate-position input test
   - Expected: non-overlapping normalized node positions.
3. Repeat import/copy 5 times on same n8n canvas
   - Expected: new workflows offset, no stacking.

## C) Extension UX path

1. Generate -> Copy -> Paste to n8n
2. Generate -> Import to n8n (direct inject)
3. Import fallback to clipboard when content script path unavailable
4. Buttons disabled before generation and enabled after success

Expected:
- Clear success/error feedback
- No null DOM errors in popup console

## D) Auth validation

Website:
1. Login
2. Signup
3. Builder generate blocked when signed out
4. Builder generate allowed when signed in

Extension:
1. Sign in / sign up / sign out from Setup tab
2. Auth state persists across popup reopen

## E) API/network resilience

1. Invalid API key per provider -> clear provider-specific error
2. 429/rate-limit response -> user-facing retry guidance
3. Network offline -> graceful error message

---

## Terminal test commands

```powershell
# Syntax
node --check workflow-engine.js
node --check popup.js
node --check content-script-enhanced.js

# Client build
npm run build --prefix website/client

# Server health (when running)
curl http://localhost:3001/api/health

# CLI generation
$env:OPENROUTER_API_KEY="<your-key>"
node cli-generate-workflow.js --provider openrouter --model openai/gpt-4o-mini --description "When payment succeeds, append row and notify Slack" --out .\sample-workflow.json
```

---

## Release gate (must pass)

- [ ] No node overlap regressions
- [ ] All auth flows pass
- [ ] All 3 provider paths pass basic generation
- [ ] Client build passes
- [ ] API health and generate endpoint pass
- [ ] Extension manual smoke test passes on n8n cloud and localhost:5678
