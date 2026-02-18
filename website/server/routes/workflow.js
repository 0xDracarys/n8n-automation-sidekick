const express = require('express');
const router = express.Router();
const { generateWorkflow: generateWithEngine } = require('../../../workflow-engine');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://egabjbrvvhkutivbogjg.supabase.co',
  process.env.SUPABASE_ANON_KEY || ''
);

const PROVIDER_CONFIGS = {
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    getHeaders: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://n8n-sidekick.com',
      'X-Title': 'n8n Automation Sidekick'
    })
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    getHeaders: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    getHeaders: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  }
};

// Generate workflow
router.post('/generate', async (req, res) => {
  try {
    const { description, provider, apiKey, model } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }

    if (!PROVIDER_CONFIGS[provider]) {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    const result = await generateWithEngine({
      description,
      provider,
      apiKey,
      model,
      includeErrorHandling: true,
    });

    res.json({
      success: true,
      workflow: result.workflow,
      provider: result.provider || provider,
      model: result.model || model,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Workflow generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save workflow
router.post('/save', async (req, res) => {
  try {
    const { workflow, name, description, visibility, tags, userId } = req.body;

    if (!workflow || !name || !userId) {
      return res.status(400).json({ error: 'Workflow, name, and userId are required' });
    }

    const { data, error } = await supabase
      .from('user_workflows')
      .insert({
        user_id: userId,
        name,
        description: description || '',
        workflow_data: workflow,
        visibility: visibility || 'private',
        tags: tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    res.json({
      success: true,
      workflowId: data.id,
      message: 'Workflow saved successfully'
    });

  } catch (error) {
    console.error('Workflow save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user workflows
router.get('/templates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('public_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      templates: data
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test provider connection
router.post('/test-connection', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }

    const config = PROVIDER_CONFIGS[provider];
    if (!config) {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    const response = await fetch(config.url.replace('/chat/completions', '/models'), {
      headers: config.getHeaders(apiKey)
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Connection failed' });
    }

    const data = await response.json();
    res.json({
      success: true,
      provider,
      modelsCount: data.data?.length || 0
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
