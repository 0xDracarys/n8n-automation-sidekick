# 🚀 n8n Automation Sidekick - Demo Setup Guide

## 📋 Overview

This is a **demo version** of n8n Automation Sidekick that showcases the authentication system and visual workflow builder. The demo uses local storage for authentication, so you can test all features without setting up Firebase.

## 🔧 Quick Start

### 1. Open the Landing Page
Open `index.html` in your web browser to see the premium landing page.

### 2. Create an Account
1. Click **"Get Started"** or **"Sign In"**
2. Click **"Create Account"** 
3. Fill in any name, email, and password (minimum 6 characters)
4. Click **"Create Account"**

✅ **You're now logged in!** The account is stored in your browser's local storage.

### 3. Use the Visual Workflow Builder
1. Click **"Builder"** in the navigation
2. Drag nodes from the left palette to the canvas
3. Configure node properties in the right panel
4. Save your workflow

## 🎯 Features Available in Demo

### ✅ Authentication
- Sign up with any email/password
- User profile management
- Session persistence
- Local storage fallback

### ✅ Visual Workflow Builder
- 15+ n8n node types
- Drag-and-drop interface
- Node configuration
- Connection system
- Save/load workflows
- Export/import JSON

### ✅ Landing Page
- Premium futuristic design
- Responsive layout
- Authentication integration
- Interactive demos

## 🔒 Security Notice

**This is a DEMO version for testing purposes only:**
- Authentication uses local storage (not secure for production)
- No real Firebase backend
- Data is stored only in your browser
- Do not use real passwords or sensitive information

## 🌐 For Production Use

To deploy this with real Firebase:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project
   - Enable Authentication (Email/Password + Google)
   - Setup Firestore database
   - Get your config keys

2. **Update Configuration**
   - Replace `firebase-demo-config.js` with real Firebase config
   - Update `index.html` to use `firebase-config.js`
   - Configure Firebase security rules

3. **Deploy**
   - Upload to your hosting provider
   - Configure Firebase domain whitelist
   - Test all authentication flows

## 🛠️ Troubleshooting

### "An error occurred. Please try again."
- **Solution:** This is normal in demo mode! Use any email/password combination with at least 6 characters.

### Builder not loading
- **Solution:** Make sure you're logged in first. The builder requires authentication.

### Data not saving
- **Solution:** In demo mode, data is saved to local storage. Clearing browser data will remove everything.

### Google Sign-in not working
- **Solution:** Google OAuth is disabled in demo mode. Use email/password signup instead.

## 📱 Browser Compatibility

Works best with modern browsers:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎨 Customization

### Change Theme
Edit `landing.css` and modify the CSS variables at the top:
```css
:root {
    --primary-color: #FF6D5A;
    --secondary-color: #FF8E53;
    /* ... other colors */
}
```

### Add New Nodes
Edit `workflow-builder-web.js` and add to the `nodes` array in `populateNodePalette()`.

### Modify Authentication
Edit `firebase-demo-config.js` to change the authentication behavior.

## 📞 Support

For questions about:
- **Demo Setup:** Check this guide first
- **Production Deployment:** Refer to Firebase documentation
- **Custom Development:** Contact the development team

---

**Enjoy testing n8n Automation Sidekick! 🚀**
