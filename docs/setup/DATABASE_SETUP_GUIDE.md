# 🗄️ Database Setup Guide for n8n Automation Sidekick

## 📋 Overview

The n8n Automation Sidekick requires a Supabase database with specific tables and views to store user workflows, templates, and authentication data.

## 🔧 Step-by-Step Setup

### **Step 1: Access Your Supabase Project**

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. You should see your project URL: `https://egabjbrvvhkutivbogjg.supabase.co`

### **Step 2: Execute the Migration Script**

Copy and paste the following SQL script into the Supabase SQL Editor and run it:

```sql
-- User Workflows Table
CREATE TABLE IF NOT EXISTS user_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workflow_data JSONB NOT NULL,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  used_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5)
);

-- Public Templates View (optimized read-only for gallery)
CREATE OR REPLACE VIEW public_templates AS
SELECT 
  uw.id,
  uw.name,
  uw.description,
  uw.workflow_data,
  uw.tags,
  uw.created_at,
  uw.updated_at,
  uw.used_count,
  uw.rating,
  u.email as author_email,
  u.raw_user_meta_data->>'display_name' as author_name
FROM user_workflows uw
JOIN auth.users u ON uw.user_id = u.id
WHERE uw.visibility = 'public'
  AND uw.workflow_data IS NOT NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_workflows_user_id ON user_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workflows_visibility ON user_workflows(visibility);
CREATE INDEX IF NOT EXISTS idx_user_workflows_created_at ON user_workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_workflows_tags ON user_workflows USING GIN(tags);

-- RLS Policies
ALTER TABLE user_workflows ENABLE ROW LEVEL SECURITY;

-- Users can view their own workflows (private + public)
CREATE POLICY "Users can view own workflows" ON user_workflows
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own workflows
CREATE POLICY "Users can insert own workflows" ON user_workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own workflows
CREATE POLICY "Users can update own workflows" ON user_workflows
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own workflows
CREATE POLICY "Users can delete own workflows" ON user_workflows
  FOR DELETE USING (auth.uid() = user_id);

-- Everyone can view public templates (read-only)
CREATE POLICY "Public workflows are viewable by everyone" ON user_workflows
  FOR SELECT USING (visibility = 'public');

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_workflow_usage(workflow_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_workflows 
  SET used_count = used_count + 1 
  WHERE id = workflow_id;
END;
$$ LANGUAGE plpgsql;

-- Function to rate a workflow
CREATE OR REPLACE FUNCTION rate_workflow(workflow_id UUID, new_rating DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  current_rating DECIMAL;
  current_count INTEGER;
BEGIN
  SELECT rating, used_count INTO current_rating, current_count
  FROM user_workflows 
  WHERE id = workflow_id AND visibility = 'public';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow not found or not public';
  END IF;
  
  -- Simple average rating (you could make this more sophisticated)
  UPDATE user_workflows 
  SET rating = ROUND(((current_rating * current_count) + new_rating) / (current_count + 1), 2)
  WHERE id = workflow_id;
  
  RETURN new_rating;
END;
$$ LANGUAGE plpgsql;
```

### **Step 3: Verify Setup**

After running the SQL, verify the setup by running these queries:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'user_workflows';

-- Test the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_workflows' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the view
SELECT COUNT(*) as template_count 
FROM public_templates 
LIMIT 1;
```

### **Step 4: Test Database Connection**

Test the database connection by running this simple query in the SQL Editor:

```sql
-- Test basic table access
SELECT 'Database connection successful!' as status;
```

## 🔍 Verification Checklist

After completing the setup, verify:

- ✅ **user_workflows table exists** with correct structure
- ✅ **public_templates view** is accessible
- ✅ **Indexes** are created for performance
- ✅ **RLS policies** are enabled
- ✅ **Functions** (increment_workflow_usage, rate_workflow) are created
- ✅ **No syntax errors** in SQL execution

## 🚨 Troubleshooting

### **Common Issues**

#### **Permission Denied**
- **Issue**: `permission denied for table user_workflows`
- **Solution**: Ensure RLS policies are correctly set up and you're authenticated

#### **Table Not Found**
- **Issue**: `relation "user_workflows" does not exist`
- **Solution**: Re-run the migration script completely

#### **View Not Accessible**
- **Issue**: `permission denied for view public_templates`
- **Solution**: Check if the view was created successfully

#### **Function Not Found**
- **Issue**: `function increment_workflow_usage does not exist`
- **Solution**: Re-run the function creation part of the script

### **Manual Fixes**

If the automated setup fails, you can manually create the tables:

1. **Create Table**: Run the `CREATE TABLE` statement first
2. **Add Indexes**: Run the `CREATE INDEX` statements
3. **Enable RLS**: Run `ALTER TABLE user_workflows ENABLE ROW LEVEL SECURITY`
4. **Add Policies**: Run each `CREATE POLICY` statement individually
5. **Create Functions**: Run the `CREATE OR REPLACE FUNCTION` statements

## 🎯 Next Steps

Once the database is set up:

1. **Test Authentication**: Try signing up/signing in through the extension
2. **Test Workflow Saving**: Create a workflow and save it to verify table functionality
3. **Test Template Gallery**: Make a workflow public to test the view
4. **Test Rating System**: Rate a public workflow to test the rating function

## 📚 Additional Information

- **Table Purpose**: Stores user workflows with metadata
- **View Purpose**: Provides read-only access to public templates
- **RLS Purpose**: Ensures users can only access their own data
- **Functions Purpose**: Handles usage tracking and rating calculations

## 🔐 Security Notes

- **RLS Policies**: Ensure users can only access their own data
- **Public Templates**: Only workflows marked as 'public' are visible to everyone
- **API Keys**: Keep your Supabase API keys secure and never commit them to version control

---

**Your database is now ready for the n8n Automation Sidekick!** 🎉
