// Authentication JavaScript
class AuthUI {
    constructor() {
        this.currentModal = null;
        this.init();
    }

    init() {
        // Listen to auth state changes
        window.authManager.onAuthStateChange((user) => {
            this.updateBuilderAccess(user);
            this.updateNavigation(user);
        });
        
        // Initialize builder access
        this.updateBuilderAccess(window.authManager.getCurrentUser());
    }

    updateBuilderAccess(user) {
        const loginPrompt = document.getElementById('builderLoginPrompt');
        const builderContainer = document.getElementById('webBuilderContainer');
        
        console.log('🔧 Updating builder access...');
        console.log('User logged in:', !!user);
        console.log('Login prompt:', !!loginPrompt);
        console.log('Builder container:', !!builderContainer);
        
        if (user && builderContainer) {
            // User is logged in, show builder
            console.log('✅ User authenticated, showing builder');
            if (loginPrompt) {
                loginPrompt.style.display = 'none';
            }
            this.initializeWebBuilder();
        } else if (builderContainer && loginPrompt) {
            // User is not logged in, show login prompt
            console.log('❌ User not authenticated, showing login prompt');
            loginPrompt.style.display = 'flex';
        }
    }

    updateNavigation(user) {
        // This is handled by the AuthManager's updateUI method
        // But we can add additional logic here if needed
        if (user) {
            console.log('User logged in:', user.displayName || user.email);
        } else {
            console.log('User logged out');
        }
    }

    initializeWebBuilder() {
        const builderContainer = document.getElementById('webBuilderContainer');
        console.log('🔧 AuthUI: Initializing web builder...');
        console.log('Builder container:', !!builderContainer);
        console.log('WebWorkflowBuilder available:', typeof window.WebWorkflowBuilder !== 'undefined');
        console.log('Already initialized:', builderContainer?.hasAttribute('data-initialized'));
        
        if (builderContainer && !builderContainer.hasAttribute('data-initialized')) {
            // Initialize the web workflow builder
            if (window.WebWorkflowBuilder) {
                // Clear any existing content first
                builderContainer.innerHTML = '';
                
                window.webBuilder = new WebWorkflowBuilder('webBuilderContainer');
                builderContainer.setAttribute('data-initialized', 'true');
                console.log('✅ AuthUI: Web workflow builder initialized successfully');
            } else {
                console.error('❌ AuthUI: WebWorkflowBuilder class not available');
            }
        } else if (builderContainer?.hasAttribute('data-initialized')) {
            console.log('ℹ️ AuthUI: Builder already initialized');
        }
    }
}

// Initialize Auth UI
window.authUI = new AuthUI();

// Modal Functions
function showLoginModal() {
    hideAllModals();
    const modal = document.getElementById('loginModal');
    const overlay = document.getElementById('authOverlay');
    
    modal.classList.add('active');
    overlay.classList.add('active');
    window.authUI.currentModal = 'login';
    
    // Focus on email input
    setTimeout(() => {
        document.getElementById('loginEmail').focus();
    }, 300);
}

function showSignupModal() {
    hideAllModals();
    const modal = document.getElementById('signupModal');
    const overlay = document.getElementById('authOverlay');
    
    modal.classList.add('active');
    overlay.classList.add('active');
    window.authUI.currentModal = 'signup';
    
    // Focus on name input
    setTimeout(() => {
        document.getElementById('signupName').focus();
    }, 300);
}

function closeAuthModals() {
    const modals = document.querySelectorAll('.auth-modal');
    const overlay = document.getElementById('authOverlay');
    
    modals.forEach(modal => modal.classList.remove('active'));
    overlay.classList.remove('active');
    window.authUI.currentModal = null;
    
    // Clear forms
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
    clearFormErrors();
}

function hideAllModals() {
    const modals = document.querySelectorAll('.auth-modal');
    const overlay = document.getElementById('authOverlay');
    
    modals.forEach(modal => modal.classList.remove('active'));
    overlay.classList.remove('active');
}

function switchToSignup() {
    closeAuthModals();
    showSignupModal();
}

function switchToLogin() {
    closeAuthModals();
    showLoginModal();
}

// Form Handlers
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    clearFormErrors();
    
    try {
        await window.authManager.signIn(email, password);
        showNotification('Welcome back! You are now logged in.', 'success');
        closeAuthModals();
        
        // Track login event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'login', {
                'method': 'email'
            });
        }
    } catch (error) {
        showFormError('loginForm', error.message);
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showFormError('signupForm', 'Passwords do not match.');
        return;
    }
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    clearFormErrors();
    
    try {
        await window.authManager.signUp(email, password, name);
        showNotification('Account created successfully! Welcome to n8n Sidekick.', 'success');
        closeAuthModals();
        
        // Track signup event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'sign_up', {
                'method': 'email'
            });
        }
    } catch (error) {
        showFormError('signupForm', error.message);
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

async function handleGoogleSignIn() {
    try {
        await window.authManager.signInWithGoogle();
        showNotification('Welcome! You are now logged in with Google.', 'success');
        closeAuthModals();
        
        // Track login event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'login', {
                'method': 'google'
            });
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleLogout() {
    try {
        await window.authManager.signOut();
        showNotification('You have been logged out successfully.', 'info');
        
        // Track logout event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'logout');
        }
        
        // Hide user dropdown
        document.getElementById('userDropdown').classList.remove('active');
        
        // Update builder access
        window.authUI.updateBuilderAccess(null);
    } catch (error) {
        showNotification('Error logging out. Please try again.', 'error');
    }
}

async function showPasswordReset() {
    const email = prompt('Enter your email address for password reset:');
    if (!email) return;
    
    try {
        await window.authManager.resetPassword(email);
        showNotification('Password reset email sent! Check your inbox.', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('active');
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
        if (!e.target.closest('.user-menu')) {
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeDropdown);
        }
    });
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const icon = notification.querySelector('.notification-icon');
    const messageEl = notification.querySelector('.notification-message');
    
    // Set message and type
    messageEl.textContent = message;
    notification.className = `notification ${type}`;
    
    // Set icon
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    icon.className = `notification-icon ${icons[type]}`;
    
    // Show notification
    notification.classList.add('show');
    
    // Hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Form Error Handling
function showFormError(formId, message) {
    const form = document.getElementById(formId);
    const formGroup = form.querySelector('.form-group');
    
    // Add error class to form
    form.classList.add('error');
    
    // Create or update error message
    let errorEl = form.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        formGroup.appendChild(errorEl);
    }
    errorEl.textContent = message;
    
    // Shake animation
    form.style.animation = 'shake 0.5s';
    setTimeout(() => {
        form.style.animation = '';
    }, 500);
}

function clearFormErrors() {
    const forms = document.querySelectorAll('#loginForm, #signupForm');
    forms.forEach(form => {
        form.classList.remove('error');
        const errorEl = form.querySelector('.error-message');
        if (errorEl) {
            errorEl.remove();
        }
    });
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape to close modals
    if (e.key === 'Escape' && window.authUI.currentModal) {
        closeAuthModals();
    }
    
    // Enter to submit forms
    if (e.key === 'Enter' && window.authUI.currentModal) {
        const activeModal = document.querySelector('.auth-modal.active');
        if (activeModal) {
            const form = activeModal.querySelector('form');
            if (form && document.activeElement.tagName !== 'BUTTON') {
                form.dispatchEvent(new Event('submit'));
            }
        }
    }
});

// Close modals when clicking overlay
document.getElementById('authOverlay').addEventListener('click', closeAuthModals);

// Prevent modal close when clicking inside modal
document.querySelectorAll('.auth-modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});

// Form validation
document.getElementById('signupForm').addEventListener('input', function(e) {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const confirmGroup = document.getElementById('signupConfirmPassword').closest('.form-group');
    
    if (confirmPassword && password !== confirmPassword) {
        confirmGroup.classList.add('error');
    } else {
        confirmGroup.classList.remove('error');
    }
});

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Add email validation to forms
document.getElementById('loginEmail').addEventListener('blur', function() {
    const emailGroup = this.closest('.form-group');
    if (this.value && !validateEmail(this.value)) {
        emailGroup.classList.add('error');
    } else {
        emailGroup.classList.remove('error');
    }
});

document.getElementById('signupEmail').addEventListener('blur', function() {
    const emailGroup = this.closest('.form-group');
    if (this.value && !validateEmail(this.value)) {
        emailGroup.classList.add('error');
    } else {
        emailGroup.classList.remove('error');
    }
});

// Password strength indicator
document.getElementById('signupPassword').addEventListener('input', function() {
    const password = this.value;
    const strength = calculatePasswordStrength(password);
    updatePasswordStrength(strength);
});

function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return strength;
}

function updatePasswordStrength(strength) {
    const strengthLevels = ['weak', 'fair', 'good', 'strong', 'very-strong'];
    const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#10b981'];
    
    // Remove existing strength indicator
    const existingIndicator = document.querySelector('.password-strength');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    if (strength > 0) {
        const indicator = document.createElement('div');
        indicator.className = 'password-strength';
        indicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${(strength / 5) * 100}%; background: ${strengthColors[strength - 1]}"></div>
            </div>
            <span class="strength-text">${strengthLevels[strength - 1]}</span>
        `;
        
        const passwordGroup = document.getElementById('signupPassword').closest('.form-group');
        passwordGroup.appendChild(indicator);
    }
}

// Add password strength styles
const passwordStrengthStyles = document.createElement('style');
passwordStrengthStyles.textContent = `
    .password-strength {
        margin-top: 8px;
    }
    
    .strength-bar {
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 4px;
    }
    
    .strength-fill {
        height: 100%;
        transition: width 0.3s ease, background 0.3s ease;
    }
    
    .strength-text {
        font-size: 12px;
        color: #6b7280;
        text-transform: capitalize;
    }
`;
document.head.appendChild(passwordStrengthStyles);

// Export for global access
window.showLoginModal = showLoginModal;
window.showSignupModal = showSignupModal;
window.closeAuthModals = closeAuthModals;
window.switchToSignup = switchToSignup;
window.switchToLogin = switchToLogin;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleLogout = handleLogout;
window.showPasswordReset = showPasswordReset;
window.toggleUserDropdown = toggleUserDropdown;
