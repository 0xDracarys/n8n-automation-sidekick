# Supabase Setup Instructions

## 🚀 Quick Setup (5 minutes)

### 1. Run Database Migration
Copy the entire contents of `MANUAL_SUPABASE_SETUP.sql` and paste into:
**https://supabase.com/dashboard/project/egabjbrvvhkutivbogjg/sql**

Click **Run** to execute the migration.

### 2. Verify Setup
After running the migration, verify these tables exist:
- ✅ `user_workflows` table
- ✅ `public_templates` view  
- ✅ RLS policies enabled
- ✅ Functions: `increment_workflow_usage`, `rate_workflow`

### 3. Test Authentication
Your Supabase is already configured in the `.env` files:
- URL: `https://egabjbrvvhkutivbogjg.supabase.co`
- Anon Key: Already set

### 4. Start Testing
1. **Server**: `cd website/server && npm run server` (port 3001)
2. **Client**: `cd website/client && npm run dev` (port 5175)
3. **Visit**: `http://localhost:5175/builder`

### 5. Test Flow
1. Click **Sign Up** → Create account
2. Check email for confirmation
3. **Sign In** with your credentials
4. Generate workflow → Save to profile
5. Visit `/templates` to see gallery

## 🔧 What the Migration Does

```sql
-- Creates user workflow storage
CREATE TABLE user_workflows (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  workflow_data JSONB NOT NULL,
  visibility TEXT DEFAULT 'private',
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  used_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0
);

-- Creates public templates view
CREATE VIEW public_templates AS
SELECT uw.*, u.email as author_email 
FROM user_workflows uw 
JOIN auth.users u ON uw.user_id = u.id 
WHERE uw.visibility = 'public';

-- Enables RLS (Row Level Security)
ALTER TABLE user_workflows ENABLE ROW LEVEL SECURITY;

-- Creates security policies
CREATE POLICY "Users can view own workflows" ON user_workflows 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public workflows are viewable by everyone" ON user_workflows 
  FOR SELECT USING (visibility = 'public');
```

## ⚡ After Migration

The system will support:
- ✅ User authentication (signup/login)
- ✅ Private workflow storage
- ✅ Public template gallery
- ✅ Usage tracking and ratings
- ✅ Extension auth sync

## 🐛 Troubleshooting

If auth doesn't work:
1. Verify migration ran successfully
2. Check browser console for errors
3. Ensure Supabase URL/key are correct in `.env`
4. Try clearing browser cache

The MCP connection issue doesn't affect this - the manual SQL setup will work perfectly.
