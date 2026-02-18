// Debug Extension Script - Run this in browser console to check extension status
function debugExtension() {
    console.log('🔍 EXTENSION DEBUG REPORT');
    console.log('='.repeat(50));
    
    // Check basic elements
    console.log('📋 DOM Elements:');
    console.log('  Popup container:', !!document.querySelector('.app-container'));
    console.log('  Tab buttons:', document.querySelectorAll('.tab-btn').length);
    console.log('  Test buttons:', document.querySelectorAll('.test-btn').length);
    console.log('  Test results div:', !!document.getElementById('testResults'));
    console.log('  Test output div:', !!document.getElementById('testOutput'));
    
    // Check global objects
    console.log('\n🌐 Global Objects:');
    console.log('  window.sidekick:', !!window.sidekick);
    console.log('  window.testSuite:', !!window.testSuite);
    console.log('  window.debugSystem:', !!window.debugSystem);
    console.log('  window.debug:', !!window.debug);
    
    // Check test functions
    console.log('\n🧪 Test Functions:');
    console.log('  runQuickTest:', typeof window.runQuickTest);
    console.log('  testConnection:', typeof window.testConnection);
    console.log('  testPromptGeneration:', typeof window.testPromptGeneration);
    
    // Check settings
    if (window.sidekick) {
        console.log('\n⚙️ Settings:');
        window.sidekick.getSettings().then(settings => {
            console.log('  Provider:', settings.provider);
            console.log('  Ollama URL:', settings.ollamaUrl);
            console.log('  Model:', settings.model);
        });
    }
    
    // Check event listeners
    console.log('\n👂 Event Listeners:');
    const testButtons = document.querySelectorAll('.test-btn');
    testButtons.forEach((btn, index) => {
        console.log(`  Button ${index}: ${btn.onclick ? 'Has onclick' : 'No onclick'}`);
    });
    
    // Test Ollama connection directly
    console.log('\n🔗 Direct Ollama Test:');
    fetch('http://localhost:11434/api/tags')
        .then(r => r.json())
        .then(d => {
            console.log('  ✅ Direct connection successful');
            console.log('  Models:', d.models.map(m => m.name));
        })
        .catch(e => {
            console.log('  ❌ Direct connection failed:', e.message);
        });
    
    console.log('\n🎯 Quick Actions:');
    console.log('  - Run: debugExtension() for this report');
    console.log('  - Run: testConnection() to test Ollama');
    console.log('  - Run: runQuickTest() for full test');
    console.log('  - Click 🔍 button for debug panel');
    
    return {
        elements: {
            popup: !!document.querySelector('.app-container'),
            testButtons: document.querySelectorAll('.test-btn').length,
            testResults: !!document.getElementById('testResults')
        },
        globals: {
            sidekick: !!window.sidekick,
            testSuite: !!window.testSuite,
            debugSystem: !!window.debugSystem
        },
        functions: {
            runQuickTest: typeof window.runQuickTest,
            testConnection: typeof window.testConnection,
            testPromptGeneration: typeof window.testPromptGeneration
        }
    };
}

// Auto-run debug on load
console.log('🔧 Extension debug script loaded. Run debugExtension() for full report.');

// Make it globally available
window.debugExtension = debugExtension;
