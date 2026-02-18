// Comprehensive Debugging System for n8n Sidekick
class DebugSystem {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };
    this.currentLevel = this.logLevels.DEBUG;
    this.isProduction = window.location.protocol === 'chrome-extension:';
    
    this.initialize();
  }

  initialize() {
    // Create debug panel
    this.createDebugPanel();
    
    // Override console methods
    this.overrideConsole();
    
    // Add global error handlers
    this.addErrorHandlers();
    
    // Log initialization
    this.info('Debug System Initialized', {
      environment: this.isProduction ? 'extension' : 'web',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  }

  createDebugPanel() {
    // Create debug panel HTML
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 400px;
      height: 300px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      color: #fff;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      display: none;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;

    debugPanel.innerHTML = `
      <div style="background: #333; padding: 8px; border-bottom: 1px solid #555; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">🔍 Debug Console</span>
        <div>
          <button onclick="window.debugSystem.clearLogs()" style="background: #666; border: none; color: white; padding: 2px 8px; margin: 0 2px; border-radius: 3px; cursor: pointer;">Clear</button>
          <button onclick="window.debugSystem.exportLogs()" style="background: #666; border: none; color: white; padding: 2px 8px; margin: 0 2px; border-radius: 3px; cursor: pointer;">Export</button>
          <button onclick="window.debugSystem.togglePanel()" style="background: #666; border: none; color: white; padding: 2px 8px; margin: 0 2px; border-radius: 3px; cursor: pointer;">×</button>
        </div>
      </div>
      <div style="flex: 1; overflow-y: auto; padding: 8px;">
        <div id="debug-logs"></div>
      </div>
      <div style="background: #333; padding: 8px; border-top: 1px solid #555;">
        <input type="text" id="debug-filter" placeholder="Filter logs..." style="width: 100%; background: #222; border: 1px solid #555; color: white; padding: 4px; border-radius: 3px;">
      </div>
    `;

    document.body.appendChild(debugPanel);

    // Add filter functionality
    const filterInput = document.getElementById('debug-filter');
    filterInput.addEventListener('input', () => this.filterLogs(filterInput.value));

    // Create debug toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'debug-toggle';
    toggleBtn.innerHTML = '🔍';
    toggleBtn.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      background: #333;
      border: 1px solid #555;
      border-radius: 50%;
      color: white;
      font-size: 16px;
      cursor: pointer;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    toggleBtn.onclick = () => this.togglePanel();
    document.body.appendChild(toggleBtn);
  }

  overrideConsole() {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    console.log = (...args) => {
      originalConsole.log(...args);
      this.debug('CONSOLE', args);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      this.error('CONSOLE', args);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      this.warn('CONSOLE', args);
    };

    console.info = (...args) => {
      originalConsole.info(...args);
      this.info('CONSOLE', args);
    };

    console.debug = (...args) => {
      originalConsole.debug(...args);
      this.debug('CONSOLE', args);
    };
  }

  addErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.error('WINDOW_ERROR', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('UNHANDLED_PROMISE', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  log(level, category, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      stack: new Error().stack
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Update UI if panel is visible
    if (document.getElementById('debug-panel').style.display !== 'none') {
      this.updateLogDisplay();
    }
  }

  error(category, message, data = null) {
    this.log('ERROR', category, message, data);
  }

  warn(category, message, data = null) {
    this.log('WARN', category, message, data);
  }

  info(category, message, data = null) {
    this.log('INFO', category, message, data);
  }

  debug(category, message, data = null) {
    this.log('DEBUG', category, message, data);
  }

  trace(category, message, data = null) {
    this.log('TRACE', category, message, data);
  }

  updateLogDisplay() {
    const logsContainer = document.getElementById('debug-logs');
    if (!logsContainer) return;

    const filterValue = document.getElementById('debug-filter')?.value || '';
    const filteredLogs = this.filterLogsArray(filterValue);

    logsContainer.innerHTML = filteredLogs.map(log => {
      const color = this.getLevelColor(log.level);
      const time = new Date(log.timestamp).toLocaleTimeString();
      
      return `
        <div style="margin-bottom: 4px; padding: 4px; background: rgba(255,255,255,0.05); border-left: 3px solid ${color};">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: ${color}; font-weight: bold;">${log.level}</span>
            <span style="color: #888; font-size: 10px;">${time}</span>
          </div>
          <div style="color: #ccc; margin-bottom: 2px;">[${log.category}] ${log.message}</div>
          ${log.data ? `<div style="color: #888; font-size: 10px; white-space: pre-wrap;">${JSON.stringify(log.data, null, 2)}</div>` : ''}
        </div>
      `;
    }).join('');

    // Auto-scroll to bottom
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  getLevelColor(level) {
    const colors = {
      ERROR: '#ff4444',
      WARN: '#ffaa00',
      INFO: '#44aaff',
      DEBUG: '#888888',
      TRACE: '#666666'
    };
    return colors[level] || '#888888';
  }

  filterLogsArray(filter) {
    if (!filter) return this.logs;
    
    const lowerFilter = filter.toLowerCase();
    return this.logs.filter(log => 
      log.category.toLowerCase().includes(lowerFilter) ||
      log.message.toLowerCase().includes(lowerFilter) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(lowerFilter))
    );
  }

  filterLogs(filter) {
    this.updateLogDisplay();
  }

  clearLogs() {
    this.logs = [];
    this.updateLogDisplay();
    this.info('DEBUG_SYSTEM', 'Logs cleared');
  }

  exportLogs() {
    const logData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: this.logs
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `n8n-sidekick-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.info('DEBUG_SYSTEM', 'Logs exported');
  }

  togglePanel() {
    const panel = document.getElementById('debug-panel');
    const toggle = document.getElementById('debug-toggle');
    
    if (panel.style.display === 'none') {
      panel.style.display = 'flex';
      toggle.style.display = 'none';
      this.updateLogDisplay();
      this.info('DEBUG_SYSTEM', 'Debug panel opened');
    } else {
      panel.style.display = 'none';
      toggle.style.display = 'flex';
      this.info('DEBUG_SYSTEM', 'Debug panel closed');
    }
  }

  // Specialized logging methods for n8n Sidekick
  logAPIRequest(provider, url, method, headers, body) {
    this.debug('API_REQUEST', `${provider} ${method} ${url}`, {
      headers: this.sanitizeHeaders(headers),
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
    });
  }

  logAPIResponse(provider, status, data, duration) {
    this.debug('API_RESPONSE', `${provider} ${status} (${duration}ms)`, {
      status,
      dataLength: data ? (typeof data === 'string' ? data.length : JSON.stringify(data).length) : 0,
      data: data ? (typeof data === 'string' ? data.substring(0, 500) : JSON.stringify(data).substring(0, 500)) : null
    });
  }

  logWorkflowGeneration(prompt, provider, model, result, duration) {
    this.info('WORKFLOW_GENERATION', `${provider}/${model}`, {
      promptLength: prompt.length,
      prompt: prompt.substring(0, 200),
      success: !!result,
      duration,
      resultLength: result ? JSON.stringify(result).length : 0
    });
  }

  logAuthentication(action, provider, success, error) {
    this.info('AUTH', `${action} via ${provider}`, {
      success,
      error: error?.message
    });
  }

  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = sanitized.Authorization.substring(0, 20) + '...';
    }
    return sanitized;
  }

  // Performance monitoring
  startTimer(label) {
    const timer = {
      label,
      startTime: performance.now()
    };
    this.debug('TIMER_START', label);
    return timer;
  }

  endTimer(timer) {
    const duration = performance.now() - timer.startTime;
    this.debug('TIMER_END', `${timer.label}: ${duration.toFixed(2)}ms`);
    return duration;
  }
}

// Initialize debug system
window.debugSystem = new DebugSystem();

// Make it available globally for easy access
window.debug = {
  error: (category, message, data) => window.debugSystem.error(category, message, data),
  warn: (category, message, data) => window.debugSystem.warn(category, message, data),
  info: (category, message, data) => window.debugSystem.info(category, message, data),
  debug: (category, message, data) => window.debugSystem.debug(category, message, data),
  trace: (category, message, data) => window.debugSystem.trace(category, message, data),
  timer: (label) => window.debugSystem.startTimer(label),
  end: (timer) => window.debugSystem.endTimer(timer)
};
