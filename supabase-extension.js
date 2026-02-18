// Supabase Client for Extension
// This file provides Supabase client initialization for the Chrome extension

// Load Supabase client dynamically to avoid build issues
class SupabaseExtensionClient {
  constructor() {
    this.client = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Supabase client...');
      
      // Check if Supabase is available globally
      if (typeof window.supabase !== 'undefined') {
        console.log('✅ Using global Supabase object');
        this.client = window.supabase.createClient(
          window.ENVIRONMENT?.SUPABASE?.url || 'your-supabase-url',
          window.ENVIRONMENT?.SUPABASE?.anonKey || 'your-supabase-anon-key'
        );
        this.isInitialized = true;
        console.log('✅ Supabase client initialized successfully');
        return true;
      } else {
        console.log('⏳ Loading Supabase from CDN...');
        await this.loadSupabaseFromCDN();
        return this.initialize();
      }
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async loadSupabaseFromCDN() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => {
        console.log('✅ Supabase loaded from CDN');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Supabase from CDN');
        reject(new Error('Failed to load Supabase'));
      };
      document.head.appendChild(script);
    });
  }

  getClient() {
    if (!this.isInitialized) {
      throw new Error('Supabase client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  // Authentication methods
  async signIn(email, password) {
    const client = this.getClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  async signUp(email, password) {
    const client = this.getClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    const client = this.getClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    try {
      const client = this.getClient();
      const { data: { user }, error } = await client.auth.getUser();
      if (error) {
        console.warn('No active session found:', error.message);
        return null;
      }
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async onAuthStateChange(callback) {
    const client = this.getClient();
    return client.auth.onAuthStateChange(callback);
  }

  // Database methods
  async saveWorkflow(workflowData) {
    const client = this.getClient();
    const { data, error } = await client
      .from('workflows')
      .insert([workflowData])
      .select();
    
    if (error) throw error;
    return data;
  }

  async getWorkflows(userId) {
    const client = this.getClient();
    const { data, error } = await client
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async updateWorkflow(id, workflowData) {
    const client = this.getClient();
    const { data, error } = await client
      .from('workflows')
      .update(workflowData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  }

  async deleteWorkflow(id) {
    const client = this.getClient();
    const { error } = await client
      .from('workflows')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Analytics/Logging methods
  async logWorkflowGeneration(logData) {
    const client = this.getClient();
    const { data, error } = await client
      .from('workflow_logs')
      .insert([logData])
      .select();
    
    if (error) throw error;
    return data;
  }
}

// Create global instance
window.supabaseExtension = new SupabaseExtensionClient();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.supabaseExtension.initialize();
  });
} else {
  window.supabaseExtension.initialize();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SupabaseExtensionClient;
}
