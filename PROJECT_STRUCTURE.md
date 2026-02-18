# 📁 n8n Automation Sidekick - Project Structure

## 🗂️ Organized Directory Structure

```
n8n-automation-sidekick/
├── 📄 Core Application Files
│   ├── manifest.json              # Chrome extension manifest
│   ├── popup.html                 # Extension popup UI
│   ├── popup.js                   # Extension popup logic
│   ├── background.js              # Extension background script
│   ├── content-script.js          # n8n page integration
│   ├── content-script-enhanced.js # Enhanced n8n integration
│   ├── workflow-engine.js         # AI workflow generation
│   ├── workflow-builder.js         # Workflow builder UI
│   ├── workflow-builder-web.js    # Web workflow builder
│   ├── workflow-canvas.js         # Canvas rendering
│   ├── workflow-storage.js        # Database operations
│   ├── config.js                  # Configuration management
│   ├── environment.js             # Environment variables
│   ├── supabase-extension.js      # Supabase client for extension
│   └── styles.css                 # Extension styles
│
├── 📁 docs/                      # 📚 Organized Documentation
│   ├── README.md                  # Documentation index (THIS FILE)
│   ├── setup/                     # Setup & Installation
│   │   ├── DEVELOPMENT_SETUP.md
│   │   ├── DATABASE_SETUP_GUIDE.md
│   │   ├── EXTENSION_TEST_GUIDE.md
│   │   └── SETUP_GUIDE.md
│   ├── development/              # Development & Architecture
│   │   ├── BUILDER_GUIDE.md
│   │   └── IMPLEMENTATION_SUMMARY.md
│   ├── testing/                  # Testing & QA
│   │   ├── TESTING_GUIDE.md
│   │   ├── TEST_CHECKLIST.md
│   │   ├── AUTOMATED_TESTING_SUITE.md
│   │   └── COMPREHENSIVE_ENDPOINT_TESTING_REPORT.md
│   ├── troubleshooting/           # Troubleshooting Guides
│   │   ├── AUTHENTICATION_TROUBLESHOOTING.md
│   │   └── PROMPT_TROUBLESHOOTING.md
│   ├── architecture/             # System Architecture
│   │   ├── MICROSERVICES_ARCHITECTURE.md
│   │   └── COMPLETE_FILE_STRUCTURE_DOCUMENTATION.md
│   ├── api/                      # API Documentation
│   │   ├── API_TEST_RESULTS.md
│   │   └── QUICK_API_TEST.md
│   └── security/                 # Security Documentation
│       ├── AUTHENTICATION_FIXED.md
│       └── SUPABASE_AUTH_SETUP.md
│
├── 📁 website/                   # Web Platform
│   ├── server/                   # Express.js backend
│   │   ├── index.js              # Main server file
│   │   └── routes/               # API routes
│   │       ├── auth.js           # Authentication endpoints
│   │       └── workflow.js       # Workflow endpoints
│   ├── client/                   # Frontend (if added)
│   ├── package.json              # Server dependencies
│   └── .env                      # Server environment variables
│
├── 📁 config/                    # Configuration Files
│   ├── default.js                # Default configuration
│   ├── development.js           # Development config
│   └── production.js            # Production config
│
├── 📁 services/                  # Business Logic Services
│   ├── AuthService.js            # Authentication service
│   ├── ConfigManager.js          # Configuration management
│   ├── JWTService.js             # JWT token handling
│   ├── ServiceBasedAuthManager.js # Auth manager
│   └── ServiceBus.js             # Service communication
│
├── 📁 supabase-migrations/        # Database Migrations
│   └── 001_user_workflows.sql    # User workflows table
│
├── 📁 icons/                     # Extension Icons
│   ├── icon.svg                  # Main extension icon
│   └── icon-dark.svg             # Dark mode icon
│
├── 📁 archive/                   # 📦 Archived Documentation
│   └── [old .md files]           # Historical documentation
│
├── 📁 .vscode/                   # VS Code Configuration
│   └── launch.json               # Debug configuration
│
├── 📄 Configuration Files
│   ├── .env.example              # Environment variables template
│   ├── .env                      # Local environment (gitignored)
│   ├── .gitignore                # Git ignore rules
│   └── package.json              # Root package.json
│
├── 📄 Key Documentation (Root Level)
│   ├── README.md                 # Main project README
│   ├── PROJECT_STRUCTURE.md      # This file - Structure overview
│   ├── PROJECT_ISSUES_ANALYSIS.md # Current issues status
│   └── CRITICAL_FIXES_SUMMARY.md # Recent fixes summary
│
└── 📄 Utility & Test Files
    ├── automated-tests.js        # Automated test runner
    ├── test-suite.js             # Test suite
    ├── quick-test.js             # Quick test utilities
    └── [other test files]        # Various testing utilities
```

---

## 🎯 File Purpose & Location Guide

### **🔧 Core Functionality**
- **`manifest.json`** - Chrome extension configuration
- **`popup.js`** - Main extension UI logic
- **`workflow-engine.js`** - AI workflow generation engine
- **`environment.js`** - Environment variable management

### **🌐 Web Platform**
- **`website/server/`** - Express.js backend server
- **`website/.env`** - Server environment variables
- **`website/package.json`** - Server dependencies

### **📚 Documentation**
- **`docs/README.md`** - Documentation navigation hub
- **`docs/setup/`** - Installation and setup guides
- **`docs/troubleshooting/`** - Problem-solving guides
- **`docs/PROJECT_ISSUES_ANALYSIS.md`** - Current project status

### **🗄️ Database**
- **`supabase-migrations/`** - Database schema migrations
- **`workflow-storage.js`** - Database operations logic

### **⚙️ Configuration**
- **`config/`** - Environment-specific configurations
- **`.env.example`** - Environment variables template
- **`package.json`** - Project dependencies and scripts

---

## 🔍 Finding What You Need

### **🐛 Need to Fix Something?**
1. Check [`PROJECT_ISSUES_ANALYSIS.md`](PROJECT_ISSUES_ANALYSIS.md) for current issues
2. Look in [`docs/troubleshooting/`](docs/troubleshooting/) for specific problems
3. Review [`CRITICAL_FIXES_SUMMARY.md`](CRITICAL_FIXES_SUMMARY.md) for recent fixes

### **🔧 Setting Up Development?**
1. Follow [`docs/setup/DEVELOPMENT_SETUP.md`](docs/setup/DEVELOPMENT_SETUP.md)
2. Configure [`docs/setup/DATABASE_SETUP_GUIDE.md`](docs/setup/DATABASE_SETUP_GUIDE.md)
3. Test with [`docs/setup/EXTENSION_TEST_GUIDE.md`](docs/setup/EXTENSION_TEST_GUIDE.md)

### **🏗️ Understanding Architecture?**
1. Review [`docs/architecture/MICROSERVICES_ARCHITECTURE.md`](docs/architecture/MICROSERVICES_ARCHITECTURE.md)
2. Check [`docs/architecture/COMPLETE_FILE_STRUCTURE_DOCUMENTATION.md`](docs/architecture/COMPLETE_FILE_STRUCTURE_DOCUMENTATION.md)
3. Examine [`services/`](services/) for business logic

### **🧪 Running Tests?**
1. Use [`docs/testing/TESTING_GUIDE.md`](docs/testing/TESTING_GUIDE.md)
2. Check [`docs/testing/COMPREHENSIVE_ENDPOINT_TESTING_REPORT.md`](docs/testing/COMPREHENSIVE_ENDPOINT_TESTING_REPORT.md)
3. Run [`automated-tests.js`](automated-tests.js) for quick validation

### **🔌 API Integration?**
1. Review [`docs/api/`](docs/api/) for API documentation
2. Check [`workflow-engine.js`](workflow-engine.js) for AI provider integration
3. Examine [`website/server/routes/`](website/server/routes/) for API endpoints

---

## 📁 File Categories Quick Reference

### **🔴 Critical Files (DO NOT MODIFY WITHOUT CAREFUL CONSIDERATION)**
- `manifest.json` - Chrome extension configuration
- `environment.js` - Environment variables
- `website/.env` - Server credentials (gitignored)
- `.gitignore` - Git ignore rules

### **🟡 Core Application Files**
- `popup.js` - Extension main logic
- `workflow-engine.js` - AI integration
- `content-script*.js` - n8n integration
- `website/server/index.js` - Backend server

### **🟢 Documentation Files**
- All files in `docs/` directory
- `README.md` - Project overview
- `PROJECT_STRUCTURE.md` - This file

### **🔵 Utility Files**
- `automated-tests.js` - Test runner
- `config/` - Configuration files
- `services/` - Business logic services

---

## 🔄 Maintenance Guidelines

### **Adding New Features**
1. Create feature files in appropriate directories
2. Update documentation in `docs/`
3. Add tests in testing framework
4. Update `PROJECT_ISSUES_ANALYSIS.md` if needed

### **Fixing Bugs**
1. Identify affected files using this structure guide
2. Check `docs/troubleshooting/` for similar issues
3. Update relevant documentation
4. Record fix in `CRITICAL_FIXES_SUMMARY.md`

### **Documentation Updates**
1. Update relevant files in `docs/`
2. Maintain cross-references
3. Update this `PROJECT_STRUCTURE.md` if structure changes
4. Archive outdated documentation in `archive/`

---

## 🎯 Benefits of This Structure

### **✅ Easy Navigation**
- Clear categorization by purpose
- Logical grouping of related files
- Comprehensive documentation hub

### **✅ Maintainability**
- Separated concerns by directory
- Clear file ownership
- Organized documentation

### **✅ Scalability**
- Room for growth in each category
- Clear places for new features
- Archive for historical files

### **✅ Collaboration**
- Easy for new contributors to understand
- Clear areas of responsibility
- Comprehensive documentation

---

## 📞 Quick Help

### **🔍 Looking for a specific file?**
1. Check the category above
2. Use the file purpose guide
3. Search in the relevant directory

### **🐛 Found an issue with structure?**
1. Report in `PROJECT_ISSUES_ANALYSIS.md`
2. Suggest improvements
3. Help maintain organization

### **📚 Need more documentation?**
1. Check `docs/README.md` for complete guide
2. Review specific category documentation
3. Request additions in appropriate category

---

**🎉 This organized structure makes the project easy to navigate, maintain, and scale!**

For the most current project status, always check [`PROJECT_ISSUES_ANALYSIS.md`](PROJECT_ISSUES_ANALYSIS.md) and [`docs/README.md`](docs/README.md).
