// DEMO Firebase Configuration - For Testing Only
// This uses local storage instead of real Firebase

const firebaseConfig = {
    apiKey: "demo-key-not-real",
    authDomain: "demo.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:demo"
};

// Initialize Demo System (no Firebase)
let auth = null;
let db = null;
let storage = null;
let firebase = null;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoSystem();
});

function initializeDemoSystem() {
    console.log('🚀 Initializing n8n Sidekick Demo Mode');
    
    // Force demo mode - don't try to initialize Firebase
    window.authManager = new AuthManager();
    window.workflowManager = new WorkflowManager();
    
    console.log('✅ Demo system ready - using local storage');
    
    // Show demo notification
    setTimeout(() => {
        if (typeof showNotification === 'function') {
            showNotification('Demo mode active! Use any email/password to sign up.', 'info');
        }
    }, 1000);
}

// Demo Authentication Manager with local storage
class AuthManager {
    constructor() {
        this.user = null;
        this.authStateListeners = [];
        this.useLocalStorage = true; // Force local storage mode
        this.init();
    }

    init() {
        console.log('🔐 Using local storage authentication (demo mode)');
        this.initLocalStorage();
    }

    initLocalStorage() {
        // Try to get user from localStorage
        const storedUser = localStorage.getItem('demoUser');
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
                console.log('👤 Restored user session:', this.user.email);
                this.updateUI(this.user);
                this.notifyAuthStateChange(this.user);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('demoUser');
            }
        }
    }

    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
    }

    notifyAuthStateChange(user) {
        this.authStateListeners.forEach(callback => callback(user));
    }

    updateUI(user) {
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userMenu = document.querySelectorAll('.user-menu');
        const userName = document.querySelectorAll('.user-name');
        const userEmail = document.querySelectorAll('.user-email');

        if (user) {
            // User is logged in
            authButtons.forEach(el => el.style.display = 'none');
            userMenu.forEach(el => el.style.display = 'flex');
            userName.forEach(el => el.textContent = user.displayName || 'Demo User');
            userEmail.forEach(el => el.textContent = user.email || 'demo@example.com');
        } else {
            // User is logged out
            authButtons.forEach(el => el.style.display = 'flex');
            userMenu.forEach(el => el.style.display = 'none');
        }
    }

    async signIn(email, password) {
        console.log('🔑 Attempting sign in with local storage');
        return this.signInLocalStorage(email, password);
    }

    async signUp(email, password, displayName) {
        console.log('📝 Attempting sign up with local storage');
        return this.signUpLocalStorage(email, password, displayName);
    }

    // Local storage authentication methods
    signInLocalStorage(email, password) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                const storedUser = localStorage.getItem('demoUser');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    if (user.email === email) {
                        this.user = user;
                        localStorage.setItem('userAuthenticated', 'true'); // Set consistent flag
                        this.updateUI(user);
                        this.notifyAuthStateChange(user);
                        console.log('✅ Sign in successful:', user.email);
                        resolve(user);
                    } else {
                        reject(new Error('No account found with this email address.'));
                    }
                } else {
                    reject(new Error('No account found. Please sign up first.'));
                }
            }, 500); // Simulate API delay
        });
    }

    signUpLocalStorage(email, password, displayName) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                // Validate inputs
                if (!email || !password || !displayName) {
                    reject(new Error('Please fill in all fields.'));
                    return;
                }
                
                if (password.length < 6) {
                    reject(new Error('Password should be at least 6 characters long.'));
                    return;
                }

                // Check if email already exists
                const storedUser = localStorage.getItem('demoUser');
                if (storedUser) {
                    const existingUser = JSON.parse(storedUser);
                    if (existingUser.email === email) {
                        reject(new Error('An account with this email already exists.'));
                        return;
                    }
                }

                // Create new user
                const user = {
                    uid: 'demo_' + Date.now(),
                    email: email,
                    displayName: displayName,
                    photoURL: `https://picsum.photos/seed/${email}/100/100.jpg`,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };

                this.user = user;
                localStorage.setItem('demoUser', JSON.stringify(user));
                localStorage.setItem('userAuthenticated', 'true'); 
                this.updateUI(user);
                this.notifyAuthStateChange(user);
                
                console.log('✅ Account created successfully:', user.email);
                resolve(user);
            }, 800); // Simulate API delay
        });
    }

    async signInWithGoogle() {
        throw new Error('Google sign-in not available in demo mode. Please use email/password.');
    }

    async signOut() {
        console.log('🚪 Signing out...');
        this.user = null;
        localStorage.removeItem('demoUser');
        localStorage.removeItem('userAuthenticated'); // Remove consistent flag
        this.updateUI(null);
        this.notifyAuthStateChange(null);
        console.log('✅ Signed out successfully');
    }

    async resetPassword(email) {
        throw new Error('Password reset not available in demo mode.');
    }

    async updateUserProfile(updates) {
        if (!this.user) {
            throw new Error('No authenticated user');
        }
        
        try {
            const updatedUser = { ...this.user, ...updates };
            this.user = updatedUser;
            localStorage.setItem('demoUser', JSON.stringify(updatedUser));
            this.updateUI(updatedUser);
            console.log('✅ Profile updated successfully');
        } catch (error) {
            throw new Error('Failed to update profile');
        }
    }

    async getUserData() {
        return this.user;
    }

    getErrorMessage(errorCode) {
        return 'Authentication failed. Please try again.';
    }

    getCurrentUser() {
        return this.user;
    }

    isAuthenticated() {
        return this.user !== null;
    }
}

// Demo Workflow Manager with local storage
class WorkflowManager {
    constructor() {
        this.workflows = [];
        this.currentWorkflow = null;
        this.loadWorkflows();
    }

    async saveWorkflow(workflowData, name = null) {
        const authManager = window.authManager;
        if (!authManager.isAuthenticated()) {
            throw new Error('You must be logged in to save workflows');
        }

        try {
            const workflow = {
                id: workflowData.id || this.generateId(),
                name: name || workflowData.name || 'Untitled Workflow',
                description: workflowData.description || '',
                data: JSON.stringify(workflowData),
                type: workflowData.type || 'generated',
                status: workflowData.status || 'draft',
                tags: workflowData.tags || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: authManager.user.uid
            };

            // Save to localStorage (demo mode)
            let workflows = JSON.parse(localStorage.getItem('demoWorkflows') || '[]');
            workflows.push(workflow);
            localStorage.setItem('demoWorkflows', JSON.stringify(workflows));
            
            this.workflows = workflows;
            return workflow.id;
        } catch (error) {
            throw new Error('Failed to save workflow');
        }
    }

    async getUserWorkflows() {
        const authManager = window.authManager;
        if (!authManager.isAuthenticated()) {
            return [];
        }

        this.loadWorkflows();
        return this.workflows.filter(w => w.userId === authManager.user.uid);
    }

    loadWorkflows() {
        try {
            const stored = localStorage.getItem('demoWorkflows');
            this.workflows = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading workflows:', error);
            this.workflows = [];
        }
    }

    generateId() {
        return 'workflow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize managers
window.workflowManager = new WorkflowManager();

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.log('Notification:', message, type);
        return;
    }
    
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

// Export for global access
window.showNotification = showNotification;
