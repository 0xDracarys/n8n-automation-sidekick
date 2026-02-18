# Deployment Runbook (Market-Ready Baseline)

## 1) Environment and secrets

## Website server (`website/.env`)
Required:
- `PORT=3001`
- `CLIENT_URL=https://your-frontend-domain`
- `SUPABASE_URL=...`
- `SUPABASE_ANON_KEY=...`

Recommended:
- `NODE_ENV=production`

## Website client (`website/client/.env`)
Required:
- `VITE_API_URL=https://your-api-domain/api`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

## Extension (`extension.env`)
Required:
- `SUPABASE_URL=...`
- `SUPABASE_ANON_KEY=...`
- default provider/model values only (no hardcoded paid API keys)

Security rules:
1. Never commit real keys in `.env.example`.
2. Keep provider API keys user-supplied in Setup tab or runtime env.
3. Rotate leaked keys immediately.

---

## 2) Local run (Windows)

### API server
```powershell
npm install --prefix website
npm run start --prefix website
```
Server health:
```powershell
curl http://localhost:3001/api/health
```

### Client app
```powershell
npm install --prefix website/client
npm run dev --prefix website/client
```

### Build checks
```powershell
npm run build --prefix website/client
node --check workflow-engine.js
node --check popup.js
node --check content-script-enhanced.js
```

---

## 3) Production deploy sequence

1. Provision Supabase project + auth providers + redirect URLs.
2. Deploy API (`website/server`) with HTTPS and `CLIENT_URL` locked.
3. Build/deploy client (`website/client/dist`) to static host/CDN.
4. Point `VITE_API_URL` to production API.
5. Smoke test:
   - Login/signup
   - Generate workflow
   - Copy/import to n8n
   - Builder graph/json diagnostics
6. Publish extension package only after regression suite passes.

---

## 4) Operational standards

1. Enable request logging and error monitoring on API.
2. Add rate limiting (recommended next patch).
3. Keep CORS strict to known frontend domains.
4. Pin dependency ranges and run monthly update cadence.
5. Keep a rollback bundle of last known-good extension ZIP.
