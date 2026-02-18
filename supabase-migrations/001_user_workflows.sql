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
