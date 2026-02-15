// Firebase Configuration - Load from environment variables or config
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "your-api-key-here",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789012",
    appId: process.env.FIREBASE_APP_ID || "your-app-id",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "your-measurement-id"
};

// Initialize Firebase with error handling
let firebase;
let auth;
let db;
let storage;

try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
    } else {
        firebase.app();
        console.log("Firebase already initialized");
    }
    
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    // Enable offline persistence for Firestore
    db.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code === 'unimplemented') {
                console.warn('The current browser does not support persistence.');
            }
        });
        
} catch (error) {
    console.error("Firebase initialization error:", error);
    // Show user-friendly error
    document.addEventListener('DOMContentLoaded', () => {
        showNotification('Firebase configuration error. Please check your setup.', 'error');
    });
}

// Authentication Manager
class AuthManager {
    constructor() {
        this.user = null;
        this.authStateListeners = [];
        this.init();
    }

    init() {
        // Check if Firebase auth is available
        if (!auth) {
            console.error("Firebase auth not initialized");
            return;
        }
        
        // Listen to auth state changes
        auth.onAuthStateChanged((user) => {
            this.user = user;
            this.notifyAuthStateChange(user);
            this.updateUI(user);
        });
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
        const loginBtn = document.querySelectorAll('.login-btn');
        const logoutBtn = document.querySelectorAll('.logout-btn');
        const userName = document.querySelectorAll('.user-name');
        const userEmail = document.querySelectorAll('.user-email');

        if (user) {
            // User is logged in
            authButtons.forEach(el => el.style.display = 'none');
            userMenu.forEach(el => el.style.display = 'flex');
            userName.forEach(el => el.textContent = user.displayName || 'User');
            userEmail.forEach(el => el.textContent = user.email);
        } else {
            // User is logged out
            authButtons.forEach(el => el.style.display = 'flex');
            userMenu.forEach(el => el.style.display = 'none');
        }
    }

    async signIn(email, password) {
        if (!auth) {
            throw new Error('Firebase auth not available. Please refresh the page.');
        }
        
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            console.log('Sign in successful:', result.user.email);
            return result.user;
        } catch (error) {
            console.error('Sign in error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    async signUp(email, password, displayName) {
        if (!auth) {
            throw new Error('Firebase auth not available. Please refresh the page.');
        }
        
        try {
            // Validate inputs
            if (!email || !password || !displayName) {
                throw new Error('Please fill in all fields.');
            }
            
            if (password.length < 6) {
                throw new Error('Password should be at least 6 characters long.');
            }
            
            console.log('Attempting to create account for:', email);
            const result = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update display name
            await result.user.updateProfile({ displayName });
            console.log('Profile updated with display name:', displayName);
            
            // Create user document in Firestore
            await this.createUserDocument(result.user);
            console.log('User document created in Firestore');
            
            return result.user;
        } catch (error) {
            console.error('Sign up error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    async signInWithGoogle() {
        if (!auth) {
            throw new Error('Firebase auth not available. Please refresh the page.');
        }
        
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            
            // Create user document if it doesn't exist
            await this.createUserDocument(result.user);
            
            return result.user;
        } catch (error) {
            console.error('Google sign in error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    async signOut() {
        if (!auth) {
            console.error('Firebase auth not available');
            return;
        }
        
        try {
            await auth.signOut();
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    async resetPassword(email) {
        if (!auth) {
            throw new Error('Firebase auth not available. Please refresh the page.');
        }
        
        try {
            await auth.sendPasswordResetEmail(email);
            return true;
        } catch (error) {
            console.error('Password reset error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    async createUserDocument(user) {
        if (!db) {
            console.error('Firestore not available');
            return;
        }
        
        try {
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || '',
                    photoURL: user.photoURL || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    subscription: {
                        plan: 'free',
                        status: 'active',
                        expiresAt: null
                    },
                    usage: {
                        workflowsGenerated: 0,
                        workflowsBuilt: 0,
                        lastActive: firebase.firestore.FieldValue.serverTimestamp()
                    },
                    preferences: {
                        theme: 'light',
                        notifications: true,
                        autoSave: true
                    }
                };
                
                await userRef.set(userData);
                console.log('User document created successfully');
            }
        } catch (error) {
            console.error('Error creating user document:', error);
            // Don't throw error here as it's not critical for auth
        }
    }

    async updateUserProfile(updates) {
        if (!this.user || !db) {
            throw new Error('User not authenticated or database not available');
        }
        
        try {
            const userRef = db.collection('users').doc(this.user.uid);
            await userRef.update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            throw new Error('Failed to update profile');
        }
    }

    async getUserData() {
        if (!this.user || !db) {
            return null;
        }
        
        try {
            const userDoc = await db.collection('users').doc(this.user.uid).get();
            return userDoc.data();
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your internet connection.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
            'auth/popup-blocked': 'Sign-in popup was blocked by the browser. Please allow popups.',
            'auth/cancelled-popup-request': 'Sign-in was cancelled.',
            'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
            'auth/invalid-api-key': 'Invalid API key. Please check your Firebase configuration.',
            'auth/app-deleted': 'This application has been deleted.',
            'auth/app-not-authorized': 'This application is not authorized to use Firebase Authentication.',
            'auth/argument-error': 'Invalid arguments provided.',
            'auth/invalid-tenant-id': 'Invalid tenant ID.',
            'auth/tenant-id-mismatch': 'Tenant ID mismatch.',
            'auth/unsupported-tenant-operation': 'Unsupported tenant operation.',
            'auth/invalid-credential': 'Invalid credential.',
            'auth/invalid-verification-code': 'Invalid verification code.',
            'auth/invalid-verification-id': 'Invalid verification ID.',
            'auth/custom-token-mismatch': 'Custom token mismatch.',
            'auth/invalid-custom-token': 'Invalid custom token.',
            'auth/captcha-check-failed': 'reCAPTCHA check failed.',
            'auth/app-not-verified': 'App not verified.',
            'auth/web-storage-unsupported': 'Web storage is not supported.',
            'auth/quota-exceeded': 'Quota exceeded.',
            'auth/invalid-app-credential': 'Invalid app credential.',
            'auth/invalid-app-id': 'Invalid app ID.',
            'auth/invalid-user-token': 'Invalid user token.',
            'auth/requires-recent-login': 'This operation requires recent authentication. Please log in again.',
            'auth/credential-too-old-login-recently': 'Credential is too old. Please log in again.',
            'auth/expired-action-code': 'Action code has expired.',
            'auth/invalid-action-code': 'Invalid action code.',
            'auth/missing-email': 'Email address is required.',
            'auth/missing-password': 'Password is required.',
            'auth/missing-verification-code': 'Verification code is required.',
            'auth/missing-verification-id': 'Verification ID is required.',
            'auth/invalid-continue-uri': 'Invalid continue URI.',
            'auth/unauthorized-continue-uri': 'Unauthorized continue URI.',
            'auth/invalid-dynamic-link-domain': 'Invalid dynamic link domain.',
            'auth/invalid-provider-id': 'Invalid provider ID.',
            'auth/invalid-oauth-client-id': 'Invalid OAuth client ID.',
            'auth/unauthorized-domain': 'Unauthorized domain.',
            'auth/invalid-receiver-captcha': 'Invalid reCAPTCHA token.',
            'auth/invalid-sender': 'Invalid sender.',
            'auth/invalid-recipient-email': 'Invalid recipient email.',
            'auth/missing-iframe-start': 'Missing iframe start.',
            'auth/missing-ios-bundle-id': 'Missing iOS bundle ID.',
            'auth/missing-android-package-name': 'Missing Android package name.',
            'auth/missing-app-credential': 'Missing app credential.',
            'auth/missing-verification-code': 'Missing verification code.',
            'auth/missing-continue-uri': 'Missing continue URI.',
            'auth/missing-phone-number': 'Missing phone number.',
            'auth/invalid-phone-number': 'Invalid phone number.',
            'auth/missing-application-identifier': 'Missing application identifier.',
            'auth/invalid-application-identifier': 'Invalid application identifier.'
        };
        
        return errorMessages[errorCode] || `Authentication error: ${errorCode}. Please try again.`;
    }

    getCurrentUser() {
        return this.user;
    }

    isAuthenticated() {
        return this.user !== null;
    }
}

// Workflow Manager
class WorkflowManager {
    constructor() {
        this.workflows = [];
        this.currentWorkflow = null;
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
                type: workflowData.type || 'generated', // 'generated', 'built', 'template'
                status: workflowData.status || 'draft',
                tags: workflowData.tags || [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: authManager.user.uid
            };

            const workflowRef = await db.collection('workflows').add(workflow);
            
            // Update user usage stats
            await this.updateUserUsage();
            
            return workflowRef.id;
        } catch (error) {
            throw new Error('Failed to save workflow');
        }
    }

    async getUserWorkflows() {
        const authManager = window.authManager;
        if (!authManager.isAuthenticated()) {
            return [];
        }

        try {
            const snapshot = await db.collection('workflows')
                .where('userId', '==', authManager.user.uid)
                .orderBy('updatedAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                data: JSON.parse(doc.data().data)
            }));
        } catch (error) {
            console.error('Error fetching workflows:', error);
            return [];
        }
    }

    async getWorkflow(workflowId) {
        try {
            const doc = await db.collection('workflows').doc(workflowId).get();
            if (!doc.exists) throw new Error('Workflow not found');
            
            const workflow = doc.data();
            return {
                id: doc.id,
                ...workflow,
                data: JSON.parse(workflow.data)
            };
        } catch (error) {
            throw new Error('Failed to get workflow');
        }
    }

    async updateWorkflow(workflowId, updates) {
        try {
            await db.collection('workflows').doc(workflowId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            throw new Error('Failed to update workflow');
        }
    }

    async deleteWorkflow(workflowId) {
        try {
            await db.collection('workflows').doc(workflowId).delete();
        } catch (error) {
            throw new Error('Failed to delete workflow');
        }
    }

    async updateUserUsage() {
        const authManager = window.authManager;
        if (!authManager.isAuthenticated()) return;

        try {
            const userRef = db.collection('users').doc(authManager.user.uid);
            await userRef.update({
                'usage.workflowsGenerated': firebase.firestore.FieldValue.increment(1),
                'usage.lastActive': firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating usage:', error);
        }
    }

    generateId() {
        return 'workflow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize managers
window.authManager = new AuthManager();
window.workflowManager = new WorkflowManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, WorkflowManager };
}
