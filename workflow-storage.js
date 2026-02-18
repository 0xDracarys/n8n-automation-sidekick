// Workflow Storage Service using Supabase MCP
class WorkflowStorage {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  // Save workflow to user's profile
  async saveWorkflow(userId, workflowData, options = {}) {
    const {
      name = 'Untitled Workflow',
      description = '',
      visibility = 'private',
      tags = []
    } = options;

    try {
      const { data, error } = await this.supabase
        .from('user_workflows')
        .insert({
          user_id: userId,
          name,
          description,
          workflow_data: workflowData,
          visibility,
          tags
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save workflow:', error);
      throw error;
    }
  }

  // Get user's workflows (private + their public ones)
  async getUserWorkflows(userId, visibility = null) {
    try {
      let query = this.supabase
        .from('user_workflows')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (visibility) {
        query = query.eq('visibility', visibility);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch user workflows:', error);
      throw error;
    }
  }

  // Get public templates for gallery
  async getPublicTemplates(limit = 50, offset = 0, tags = []) {
    try {
      let query = this.supabase
        .from('public_templates')
        .select('*')
        .order('used_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (tags.length > 0) {
        query = query.contains('tags', tags);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch public templates:', error);
      throw error;
    }
  }

  // Update workflow visibility
  async updateWorkflowVisibility(workflowId, userId, visibility) {
    try {
      const { data, error } = await this.supabase
        .from('user_workflows')
        .update({ visibility })
        .eq('id', workflowId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update workflow visibility:', error);
      throw error;
    }
  }

  // Delete workflow
  async deleteWorkflow(workflowId, userId) {
    try {
      const { error } = await this.supabase
        .from('user_workflows')
        .delete()
        .eq('id', workflowId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      throw error;
    }
  }

  // Increment usage count (for templates)
  async incrementUsage(workflowId) {
    try {
      const { error } = await this.supabase
        .rpc('increment_workflow_usage', { workflow_id: workflowId });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to increment usage:', error);
      throw error;
    }
  }

  // Rate a public workflow
  async rateWorkflow(workflowId, rating) {
    try {
      const { data, error } = await this.supabase
        .rpc('rate_workflow', { workflow_id: workflowId, new_rating: rating });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to rate workflow:', error);
      throw error;
    }
  }

  // Search workflows
  async searchWorkflows(query, userId = null, visibility = 'public') {
    try {
      let supabaseQuery = this.supabase
        .from('user_workflows')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('visibility', visibility)
        .order('used_count', { ascending: false });

      if (userId) {
        supabaseQuery = supabaseQuery.or(`user_id.eq.${userId},visibility.eq.public`);
      }

      const { data, error } = await supabaseQuery;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to search workflows:', error);
      throw error;
    }
  }
}

// Export for use in extension and website
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WorkflowStorage };
} else if (typeof window !== 'undefined') {
  window.WorkflowStorage = WorkflowStorage;
}
