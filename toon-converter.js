// TOON (Token-Oriented Object Notation) Implementation
// Reduces AI token costs by optimizing JSON structure for LLM consumption

class TOONConverter {
  constructor() {
    this.compactMode = true;
    this.preserveOrder = true;
  }

  // Convert JSON to TOON format
  jsonToTOON(jsonData, rootName = 'data') {
    try {
      if (Array.isArray(jsonData)) {
        return this.arrayToTOON(jsonData, rootName);
      } else if (typeof jsonData === 'object' && jsonData !== null) {
        return this.objectToTOON(jsonData, rootName);
      } else {
        return this.primitiveToTOON(jsonData, rootName);
      }
    } catch (error) {
      console.error('❌ Failed to convert JSON to TOON:', error);
      throw error;
    }
  }

  // Convert array to TOON
  arrayToTOON(array, name) {
    if (array.length === 0) {
      return `${name}[0]:`;
    }

    // Get all unique keys from objects in array
    const allKeys = new Set();
    array.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    const keys = Array.from(allKeys);
    const keyString = keys.join(',');

    let toon = `${name}[${array.length}]{${keyString}}:\n`;

    array.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        const values = keys.map(key => {
          const value = item[key];
          return this.formatValue(value);
        });
        toon += `  ${index + 1},${values.join(',')}\n`;
      } else {
        toon += `  ${index + 1},${this.formatValue(item)}\n`;
      }
    });

    return toon.trim();
  }

  // Convert object to TOON
  objectToTOON(obj, name) {
    const keys = Object.keys(obj);
    const keyString = keys.join(',');
    
    let toon = `${name}{${keyString}}:\n`;
    
    const values = keys.map(key => {
      const value = obj[key];
      return this.formatValue(value);
    });
    
    toon += `  ${values.join(',')}\n`;
    
    return toon.trim();
  }

  // Convert primitive to TOON
  primitiveToTOON(value, name) {
    return `${name}: ${this.formatValue(value)}`;
  }

  // Format value for TOON
  formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') {
      // Escape special characters but don't add quotes unless needed
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value); // Fallback for complex objects
    }
    return String(value);
  }

  // Convert TOON back to JSON
  toonToJSON(toonString) {
    try {
      const lines = toonString.split('\n').filter(line => line.trim());
      const result = {};

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Parse array definition: name[count]{keys}:
        const arrayMatch = trimmed.match(/^(\w+)\[(\d+)\]\{([^}]+)\}:$/);
        if (arrayMatch) {
          const [, name, count, keys] = arrayMatch;
          const keyList = keys.split(',').map(k => k.trim());
          const array = [];
          
          // Parse array data
          let currentLine = lines.indexOf(line) + 1;
          while (currentLine < lines.length && !lines[currentLine].trim().endsWith(':')) {
            const dataLine = lines[currentLine].trim();
            if (dataLine) {
              const values = this.parseTOONValues(dataLine);
              const obj = {};
              keyList.forEach((key, index) => {
                obj[key] = values[index] || null;
              });
              array.push(obj);
            }
            currentLine++;
          }
          
          result[name] = array;
          continue;
        }

        // Parse object definition: name{keys}:
        const objectMatch = trimmed.match(/^(\w+)\{([^}]+)\}:$/);
        if (objectMatch) {
          const [, name, keys] = objectMatch;
          const keyList = keys.split(',').map(k => k.trim());
          
          // Parse object data
          const dataLine = lines[lines.indexOf(line) + 1];
          if (dataLine) {
            const values = this.parseTOONValues(dataLine);
            const obj = {};
            keyList.forEach((key, index) => {
              obj[key] = values[index] || null;
            });
            result[name] = obj;
          }
          continue;
        }

        // Parse primitive: name: value
        const primitiveMatch = trimmed.match(/^(\w+):\s*(.+)$/);
        if (primitiveMatch) {
          const [, name, value] = primitiveMatch;
          result[name] = this.parseTOONValue(value);
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to convert TOON to JSON:', error);
      throw error;
    }
  }

  // Parse TOON values from data line
  parseTOONValues(dataLine) {
    // Remove index if present (e.g., "1,value1,value2" -> "value1,value2")
    const cleanLine = dataLine.replace(/^\d+,/, '');
    
    const values = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;

    for (let i = 0; i < cleanLine.length; i++) {
      const char = cleanLine[i];
      
      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
        continue;
      }

      if (char === ',' && !inQuotes) {
        values.push(this.parseTOONValue(current.trim()));
        current = '';
        continue;
      }

      current += char;
    }

    if (current) {
      values.push(this.parseTOONValue(current.trim()));
    }

    return values;
  }

  // Parse individual TOON value
  parseTOONValue(value) {
    if (value === 'null') return null;
    if (value === 'undefined') return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Check if it's a quoted string
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/\\"/g, '"');
    }
    
    // Check if it's a number
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    
    if (/^-?\d*\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    
    // Try to parse as JSON (for nested objects/arrays)
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // Calculate token savings
  calculateTokenSavings(jsonData, modelName = 'gpt-4') {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const toonString = this.jsonToTOON(jsonData);
    
    // Simple token estimation (rough approximation)
    const jsonTokens = this.estimateTokens(jsonString, modelName);
    const toonTokens = this.estimateTokens(toonString, modelName);
    
    const savings = jsonTokens - toonTokens;
    const savingsPercent = ((savings / jsonTokens) * 100).toFixed(1);
    
    return {
      jsonTokens,
      toonTokens,
      savings,
      savingsPercent,
      compressionRatio: (jsonString.length / toonString.length).toFixed(2)
    };
  }

  // Estimate token count (simplified)
  estimateTokens(text, modelName) {
    // Rough estimation based on model
    const tokensPerChar = {
      'gpt-4': 0.25,
      'gpt-3.5': 0.25,
      'claude': 0.25,
      'gemini': 0.25
    };
    
    const rate = tokensPerChar[modelName] || 0.25;
    return Math.ceil(text.length * rate);
  }

  // Optimize n8n workflow specifically
  optimizeN8nWorkflow(workflow) {
    const optimized = {
      name: workflow.name || 'Untitled Workflow',
      nodes: this.optimizeNodes(workflow.nodes || []),
      connections: this.optimizeConnections(workflow.connections || {}),
      settings: workflow.settings || {}
    };

    return this.jsonToTOON(optimized, 'workflow');
  }

  // Optimize nodes array
  optimizeNodes(nodes) {
    if (!Array.isArray(nodes)) return [];

    // Extract common node types and parameters
    const nodeTypes = {};
    const commonParams = {};
    
    nodes.forEach(node => {
      const type = node.type || 'unknown';
      nodeTypes[type] = (nodeTypes[type] || 0) + 1;
      
      // Extract common parameters
      Object.keys(node.parameters || {}).forEach(param => {
        commonParams[param] = (commonParams[param] || 0) + 1;
      });
    });

    return nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      typeVersion: node.typeVersion,
      position: node.position,
      parameters: node.parameters
    }));
  }

  // Optimize connections object
  optimizeConnections(connections) {
    const optimized = {};
    
    Object.keys(connections).forEach(nodeId => {
      const nodeConnections = connections[nodeId];
      if (nodeConnections.main && Array.isArray(nodeConnections.main)) {
        optimized[nodeId] = nodeConnections.main.map(conn => ({
          node: conn.node,
          type: conn.type,
          index: conn.index
        }));
      }
    });
    
    return optimized;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TOONConverter };
} else if (typeof window !== 'undefined') {
  window.TOONConverter = TOONConverter;
}
