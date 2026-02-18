// Authentication UI Component for Supabase
class AuthUI {
  constructor() {
    this.isVisible = false;
    this.currentMode = 'signin'; // 'signin', 'signup', 'reset'
    this.initialize();
  }

  initialize() {
    this.createAuthModal();
    this.setupEventListeners();
    this.updateUI();
  }

  createAuthModal() {
    // Create auth modal HTML
    const authModal = document.createElement('div');
    authModal.id = 'auth-modal';
    authModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    authModal.innerHTML = `
      <div class="auth-modal-content" style="
        background: white;
        border-radius: 12px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        position: relative;
      ">
        <button class="auth-close-btn" style="
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        ">×</button>
        
        <div class="auth-header" style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #333; font-size: 24px;">n8n Sidekick</h2>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Sign in to save your workflows</p>
        </div>

        <div class="auth-form">
          <!-- Sign In Form -->
          <div id="signin-form" class="auth-form-section">
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; color: #333; font-size: 14px;">Email</label>
              <input type="email" id="signin-email" placeholder="Enter your email" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
              ">
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 4px; color: #333; font-size: 14px;">Password</label>
              <input type="password" id="signin-password" placeholder="Enter your password" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
              ">
            </div>
            <button id="signin-btn" style="
              width: 100%;
              padding: 12px;
              background: #ff6d5a;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              margin-bottom: 12px;
            ">Sign In</button>
            <button id="forgot-password-btn" style="
              width: 100%;
              padding: 8px;
              background: none;
              color: #666;
              border: none;
              font-size: 12px;
              cursor: pointer;
              text-decoration: underline;
            ">Forgot your password?</button>
          </div>

          <!-- Sign Up Form -->
          <div id="signup-form" class="auth-form-section" style="display: none;">
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; color: #333; font-size: 14px;">Email</label>
              <input type="email" id="signup-email" placeholder="Enter your email" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
              ">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; color: #333; font-size: 14px;">Password</label>
              <input type="password" id="signup-password" placeholder="Create a password" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
              ">
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 4px; color: #333; font-size: 14px;">Confirm Password</label>
              <input type="password" id="signup-confirm-password" placeholder="Confirm your password" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
              ">
            </div>
            <button id="signup-btn" style="
              width: 100%;
              padding: 12px;
              background: #ff6d5a;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              margin-bottom: 12px;
            ">Create Account</button>
          </div>

          <!-- Reset Password Form -->
          <div id="reset-form" class="auth-form-section" style="display: none;">
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 4px; color: #333; font-size: 14px;">Email</label>
              <input type="email" id="reset-email" placeholder="Enter your email" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
              ">
            </div>
            <button id="reset-btn" style="
              width: 100%;
              padding: 12px;
              background: #ff6d5a;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              margin-bottom: 12px;
            ">Send Reset Email</button>
          </div>
        </div>

        <div class="auth-footer" style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            <span id="auth-switch-text">Don't have an account?</span>
            <button id="auth-switch-btn" style="
              background: none;
              border: none;
              color: #ff6d5a;
              cursor: pointer;
              text-decoration: underline;
              font-size: 12px;
              margin-left: 4px;
            ">Sign Up</button>
          </p>
        </div>

        <div id="auth-message" style="
          margin-top: 16px;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          display: none;
        "></div>
      </div>
    `;

    document.body.appendChild(authModal);
  }

  setupEventListeners() {
    // Close button
    document.querySelector('.auth-close-btn').addEventListener('click', () => this.hide());

    // Switch between forms
    document.getElementById('auth-switch-btn').addEventListener('click', () => this.switchMode());

    // Sign in
    document.getElementById('signin-btn').addEventListener('click', () => this.handleSignIn());

    // Sign up
    document.getElementById('signup-btn').addEventListener('click', () => this.handleSignUp());

    // Reset password
    document.getElementById('reset-btn').addEventListener('click', () => this.handleResetPassword());
    document.getElementById('forgot-password-btn').addEventListener('click', () => this.showResetForm());

    // Enter key submission
    ['signin-email', 'signin-password'].forEach(id => {
      document.getElementById(id).addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSignIn();
      });
    });

    ['signup-email', 'signup-password', 'signup-confirm-password'].forEach(id => {
      document.getElementById(id).addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSignUp();
      });
    });

    document.getElementById('reset-email').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleResetPassword();
    });
  }

  switchMode() {
    const forms = ['signin', 'signup', 'reset'];
    const currentIndex = forms.indexOf(this.currentMode);
    this.currentMode = forms[(currentIndex + 1) % 2]; // Toggle between signin and signup
    
    this.updateFormDisplay();
  }

  showResetForm() {
    this.currentMode = 'reset';
    this.updateFormDisplay();
  }

  updateFormDisplay() {
    // Hide all forms
    document.querySelectorAll('.auth-form-section').forEach(form => {
      form.style.display = 'none';
    });

    // Show current form
    document.getElementById(`${this.currentMode}-form`).style.display = 'block';

    // Update switch text and button
    const switchText = document.getElementById('auth-switch-text');
    const switchBtn = document.getElementById('auth-switch-btn');

    if (this.currentMode === 'signin') {
      switchText.textContent = "Don't have an account? ";
      switchBtn.textContent = 'Sign Up';
    } else if (this.currentMode === 'signup') {
      switchText.textContent = 'Already have an account? ';
      switchBtn.textContent = 'Sign In';
    } else if (this.currentMode === 'reset') {
      switchText.textContent = 'Remember your password? ';
      switchBtn.textContent = 'Sign In';
      this.currentMode = 'signin'; // Reset to signin after showing reset
    }

    this.clearMessage();
  }

  async handleSignIn() {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;

    if (!email || !password) {
      this.showMessage('Please fill in all fields', 'error');
      return;
    }

    this.showLoading('Signing in...');

    try {
      const result = await window.supabaseAuth.signIn(email, password);
      
      if (result.success) {
        this.showMessage('Successfully signed in!', 'success');
        setTimeout(() => this.hide(), 1500);
      } else {
        this.showMessage(result.error, 'error');
      }
    } catch (error) {
      this.showMessage('An unexpected error occurred', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async handleSignUp() {
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (!email || !password || !confirmPassword) {
      this.showMessage('Please fill in all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.showMessage('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      this.showMessage('Password must be at least 6 characters', 'error');
      return;
    }

    this.showLoading('Creating account...');

    try {
      const result = await window.supabaseAuth.signUp(email, password);
      
      if (result.success) {
        this.showMessage('Account created! Please check your email to verify.', 'success');
        setTimeout(() => {
          this.currentMode = 'signin';
          this.updateFormDisplay();
        }, 2000);
      } else {
        this.showMessage(result.error, 'error');
      }
    } catch (error) {
      this.showMessage('An unexpected error occurred', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async handleResetPassword() {
    const email = document.getElementById('reset-email').value.trim();

    if (!email) {
      this.showMessage('Please enter your email', 'error');
      return;
    }

    this.showLoading('Sending reset email...');

    try {
      const result = await window.supabaseAuth.resetPassword(email);
      
      if (result.success) {
        this.showMessage('Password reset email sent! Please check your inbox.', 'success');
        setTimeout(() => {
          this.currentMode = 'signin';
          this.updateFormDisplay();
        }, 2000);
      } else {
        this.showMessage(result.error, 'error');
      }
    } catch (error) {
      this.showMessage('An unexpected error occurred', 'error');
    } finally {
      this.hideLoading();
    }
  }

  showMessage(text, type) {
    const messageEl = document.getElementById('auth-message');
    messageEl.textContent = text;
    messageEl.style.display = 'block';
    
    if (type === 'error') {
      messageEl.style.background = '#fee';
      messageEl.style.color = '#c00';
      messageEl.style.border = '1px solid #fcc';
    } else if (type === 'success') {
      messageEl.style.background = '#efe';
      messageEl.style.color = '#060';
      messageEl.style.border = '1px solid #cfc';
    }
  }

  clearMessage() {
    const messageEl = document.getElementById('auth-message');
    messageEl.style.display = 'none';
    messageEl.textContent = '';
  }

  showLoading(text) {
    const submitBtn = document.getElementById(`${this.currentMode}-btn`);
    submitBtn.textContent = text;
    submitBtn.disabled = true;
  }

  hideLoading() {
    const submitBtn = document.getElementById(`${this.currentMode}-btn`);
    if (this.currentMode === 'signin') {
      submitBtn.textContent = 'Sign In';
    } else if (this.currentMode === 'signup') {
      submitBtn.textContent = 'Create Account';
    } else if (this.currentMode === 'reset') {
      submitBtn.textContent = 'Send Reset Email';
    }
    submitBtn.disabled = false;
  }

  show(mode = 'signin') {
    this.currentMode = mode;
    this.updateFormDisplay();
    document.getElementById('auth-modal').style.display = 'flex';
    this.isVisible = true;
    
    // Clear form fields
    document.querySelectorAll('input').forEach(input => input.value = '');
  }

  hide() {
    document.getElementById('auth-modal').style.display = 'none';
    this.isVisible = false;
    this.clearMessage();
  }

  updateUI() {
    // Update UI based on authentication state
    if (window.supabaseAuth?.isUserAuthenticated()) {
      // User is signed in
      this.hide();
      this.updateAuthButtons(true);
    } else {
      // User is signed out
      this.updateAuthButtons(false);
    }
  }

  updateAuthButtons(isAuthenticated) {
    // Update any auth-related buttons in the main UI
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) {
      if (isAuthenticated) {
        authButtons.innerHTML = `
          <span style="margin-right: 12px;">👤 ${window.supabaseAuth.getCurrentUser().email}</span>
          <button onclick="window.authUI.signOut()" style="background: none; border: 1px solid #ddd; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Sign Out</button>
        `;
      } else {
        authButtons.innerHTML = `
          <button onclick="window.authUI.show('signin')" style="background: #ff6d5a; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">Sign In</button>
          <button onclick="window.authUI.show('signup')" style="background: none; border: 1px solid #ff6d5a; color: #ff6d5a; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Sign Up</button>
        `;
      }
    }
  }

  async signOut() {
    try {
      const result = await window.supabaseAuth.signOut();
      if (result.success) {
        this.updateUI();
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
}

// Initialize auth UI
window.authUI = new AuthUI();

// Listen for auth state changes
if (window.supabaseAuth) {
  window.supabaseAuth.updateUI = () => {
    window.authUI.updateUI();
  };
}
