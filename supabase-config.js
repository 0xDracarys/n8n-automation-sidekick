// Supabase Configuration
window.SUPABASE_CONFIG = {
  url: 'https://egabjbrvvhkutivbogjg.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYWJqYnJ2dmhrdXRpdmJvZ2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTM1NzMsImV4cCI6MjA4NjgyOTU3M30.Nak3nrBV3wpJaZWJC8KLcHQpWu3_V_R_RMB-rMQPhBw',
  publishableKey: 'sb_publishable_IQfhDiiVIMwdE5_osNH8Ug_xtILDr9K'
};

// Initialize Supabase client
window.supabaseClient = null;

async function initializeSupabase() {
  try {
    // Load Supabase SDK
    if (typeof window.supabase === 'undefined') {
      await loadSupabaseSDK();
    }
    
    window.supabaseClient = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );
    
    console.log('✅ Supabase initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    return false;
  }
}

async function loadSupabaseSDK() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Authentication Manager using Supabase
class SupabaseAuthManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.initialized = false;
  }

  async initialize() {
    try {
      await initializeSupabase();
      
      // Get initial session
      const { data: { session }, error } = await window.supabaseClient.auth.getSession();
      if (error) throw error;
      
      if (session) {
        this.user = session.user;
        this.isAuthenticated = true;
        console.log('✅ User authenticated:', this.user.email);
      }
      
      // Listen for auth changes
      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Auth state changed:', event);
        if (session) {
          this.user = session.user;
          this.isAuthenticated = true;
          console.log('✅ User signed in:', this.user.email);
        } else {
          this.user = null;
          this.isAuthenticated = false;
          console.log('👋 User signed out');
        }
        this.updateUI();
      });
      
      this.initialized = true;
      console.log('✅ SupabaseAuthManager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SupabaseAuthManager:', error);
    }
  }

  async signUp(email, password) {
    try {
      console.log('🔐 Signing up user:', email);
      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log('✅ Sign up successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      console.log('🔐 Signing in user:', email);
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log('✅ Sign in successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      console.log('👋 Signing out user');
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) throw error;
      
      console.log('✅ Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    try {
      console.log('📧 Sending password reset to:', email);
      const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      console.log('✅ Password reset email sent');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      return { success: false, error: error.message };
    }
  }

  updateUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    
    if (this.isAuthenticated && this.user) {
      if (authButtons) authButtons.style.display = 'none';
      if (userInfo) {
        userInfo.style.display = 'block';
        userInfo.innerHTML = `
          <span>👤 ${this.user.email}</span>
          <button onclick="window.supabaseAuth.signOut()">Sign Out</button>
        `;
      }
    } else {
      if (authButtons) authButtons.style.display = 'block';
      if (userInfo) userInfo.style.display = 'none';
    }
  }

  getCurrentUser() {
    return this.user;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }
}

// Backend API Manager using Supabase Edge Functions
class SupabaseBackendManager {
  constructor() {
    this.client = null;
  }

  async initialize() {
    if (!window.supabaseClient) {
      await initializeSupabase();
    }
    this.client = window.supabaseClient;
  }

  async logWorkflowGeneration(data) {
    try {
      const { error } = await this.client
        .from('workflow_generations')
        .insert([{
          user_id: window.supabaseAuth.user?.id,
          prompt: data.prompt,
          provider: data.provider,
          model: data.model,
          workflow: data.workflow,
          success: data.success,
          error: data.error,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      console.log('✅ Workflow generation logged');
    } catch (error) {
      console.error('❌ Failed to log workflow generation:', error);
    }
  }

  async getUserStats() {
    try {
      const { data, error } = await this.client
        .from('workflow_generations')
        .select('*')
        .eq('user_id', window.supabaseAuth.user?.id);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      return [];
    }
  }

  async saveWorkflow(workflow, name, description) {
    try {
      const { data, error } = await this.client
        .from('saved_workflows')
        .insert([{
          user_id: window.supabaseAuth.user?.id,
          name,
          description,
          workflow,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      console.log('✅ Workflow saved');
      return data;
    } catch (error) {
      console.error('❌ Failed to save workflow:', error);
      throw error;
    }
  }

  async getSavedWorkflows() {
    try {
      const { data, error } = await this.client
        .from('saved_workflows')
        .select('*')
        .eq('user_id', window.supabaseAuth.user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Failed to get saved workflows:', error);
      return [];
    }
  }
}

// Initialize global instances
window.supabaseAuth = new SupabaseAuthManager();
window.supabaseBackend = new SupabaseBackendManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.supabaseAuth.initialize();
  window.supabaseBackend.initialize();
});
