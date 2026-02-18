-- Supabase Database Schema for n8n Automation Sidekick
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow generations log
CREATE TABLE IF NOT EXISTS workflow_generations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  workflow JSONB,
  success BOOLEAN NOT NULL,
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved workflows
CREATE TABLE IF NOT EXISTS saved_workflows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workflow JSONB NOT NULL,
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings and preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'openrouter',
  openrouter_api_key TEXT,
  openai_api_key TEXT,
  google_api_key TEXT,
  ollama_url TEXT DEFAULT 'http://localhost:11434',
  groq_api_key TEXT,
  model TEXT,
  temperature TEXT DEFAULT '0.7',
  max_tokens INTEGER DEFAULT 4000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_used INTEGER,
  cost DECIMAL(10, 6),
  request_type TEXT NOT NULL, -- 'generation', 'test', 'validation'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates (user-contributed)
CREATE TABLE IF NOT EXISTS user_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  workflow JSONB NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_generations_user_id ON workflow_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_generations_created_at ON workflow_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_workflows_user_id ON saved_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_workflows_created_at ON saved_workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON user_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_approved ON user_templates(is_approved);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Workflow generations policies
CREATE POLICY "Users can view own generations" ON workflow_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON workflow_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Saved workflows policies
CREATE POLICY "Users can view own workflows" ON saved_workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflows" ON saved_workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows" ON saved_workflows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows" ON saved_workflows
  FOR DELETE USING (auth.uid() = user_id);

-- Public workflows policy
CREATE POLICY "Anyone can view public workflows" ON saved_workflows
  FOR SELECT USING (is_public = TRUE);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- API usage policies
CREATE POLICY "Users can view own usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User templates policies
CREATE POLICY "Users can view own templates" ON user_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON user_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON user_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved templates" ON user_templates
  FOR SELECT USING (is_approved = TRUE);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_workflows_updated_at BEFORE UPDATE ON saved_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_templates_updated_at BEFORE UPDATE ON user_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_generations', (SELECT COUNT(*) FROM workflow_generations WHERE user_id = user_uuid),
    'successful_generations', (SELECT COUNT(*) FROM workflow_generations WHERE user_id = user_uuid AND success = TRUE),
    'failed_generations', (SELECT COUNT(*) FROM workflow_generations WHERE user_id = user_uuid AND success = FALSE),
    'saved_workflows', (SELECT COUNT(*) FROM saved_workflows WHERE user_id = user_uuid),
    'total_tokens_used', (SELECT COALESCE(SUM(tokens_used), 0) FROM api_usage WHERE user_id = user_uuid),
    'total_cost', (SELECT COALESCE(SUM(cost), 0) FROM api_usage WHERE user_id = user_uuid),
    'favorite_provider', (SELECT provider FROM (
      SELECT provider, COUNT(*) as count 
      FROM workflow_generations 
      WHERE user_id = user_uuid 
      GROUP BY provider 
      ORDER BY count DESC 
      LIMIT 1
    ) sub),
    'last_generation', (SELECT created_at FROM workflow_generations 
      WHERE user_id = user_uuid 
      ORDER BY created_at DESC 
      LIMIT 1)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
