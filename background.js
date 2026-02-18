// Background script for n8n Automation Sidekick
// Handles extension lifecycle and storage management

chrome.runtime.onInstalled.addListener(() => {
  console.log('n8n Automation Sidekick installed');
  
  // Set default settings
  chrome.storage.sync.set({
    settings: {
      apiKey: '',
      model: 'openai/gpt-4o-mini',
      temperature: '0.7'
    }
  });
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.settings) {
    console.log('Settings updated:', changes.settings.newValue);
  }
});

// Optional: Handle messages from popup if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStoredData') {
    chrome.storage.sync.get(['settings'], (result) => {
      sendResponse(result);
    });
    return true; // Keep the message channel open for async response
  }
});
