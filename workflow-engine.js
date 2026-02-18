/**
 * Professional n8n Workflow Generation Engine
 * Shared between website and Chrome extension
 */

const N8N_SYSTEM_PROMPT = `You are an expert n8n workflow architect who creates COMPLETE, CONNECTED workflows. You MUST ensure every node has a purpose and proper connections.

ABSOLUTE REQUIREMENTS:
1. Respond with ONLY the JSON object. No markdown, no backticks, no explanations.
2. Every workflow MUST start with exactly ONE trigger node.
3. EVERY node MUST be connected - NO orphaned nodes allowed.
4. Create a LOGICAL data flow from trigger → processing → actions → notifications.
5. Each node must have MEANINGFUL parameters that serve the workflow purpose.

WORKFLOW DESIGN PRINCIPLES:
- Start with a trigger (webhook, schedule, manual, email)
- Add data processing nodes (set, code, filter, if/switch)
- Include action nodes (HTTP calls, database operations, API integrations)
- End with notifications/logging (email, Slack, webhook response)
- ALWAYS handle errors and edge cases

VALID NODE TYPES WITH TYPEVERSIONS:
TRIGGERS:
- n8n-nodes-base.webhook (v2) - HTTP webhook
- n8n-nodes-base.scheduleTrigger (v1) - Time-based
- n8n-nodes-base.manualTrigger (v1) - Manual start
- n8n-nodes-base.emailReadImap (v1) - Email trigger
- n8n-nodes-base.formTrigger (v1) - Form submission

PROCESSING:
- n8n-nodes-base.set (v3) - Transform/rename fields
- n8n-nodes-base.code (v2) - JavaScript/Python code
- n8n-nodes-base.if (v2) - Conditional branching
- n8n-nodes-base.switch (v3) - Multi-way branching
- n8n-nodes-base.filter (v2) - Filter data
- n8n-nodes-base.merge (v2) - Merge branches
- n8n-nodes-base.httpRequest (v4) - API calls
- n8n-nodes-base.function (v1) - Custom JavaScript functions

ACTIONS - COMMUNICATION:
- n8n-nodes-base.emailSend (v1) - Send emails
- n8n-nodes-base.slack (v2) - Slack messages
- n8n-nodes-base.discord (v1) - Discord messages
- n8n-nodes-base.telegram (v1) - Telegram bot
- n8n-nodes-base.microsoftTeams (v1) - Teams messages

ACTIONS - DATABASES:
- n8n-nodes-base.postgres (v1) - PostgreSQL
- n8n-nodes-base.mysql (v1) - MySQL
- n8n-nodes-base.mongodb (v1) - MongoDB
- n8n-nodes-base.redis (v1) - Redis cache
- n8n-nodes-base.airtable (v1) - Airtable
- n8n-nodes-base.notion (v2) - Notion databases

ACTIONS - CLOUD SERVICES:
- n8n-nodes-base.googleSheets (v4) - Google Sheets
- n8n-nodes-base.googleDrive (v1) - Google Drive
- n8n-nodes-base.awsS3 (v1) - AWS S3
- n8n-nodes-base.awsLambda (v1) - AWS Lambda
- n8n-nodes-base.azureBlobStorage (v1) - Azure Blob
- n8n-nodes-base.dropbox (v1) - Dropbox

ACTIONS - AI/ML:
- n8n-nodes-base.openAi (v1) - OpenAI/ChatGPT
- n8n-nodes-base.huggingFace (v1) - Hugging Face models
- n8n-nodes-base.stabilityAi (v1) - AI image generation
- n8n-nodes-base.anthropic (v1) - Claude AI
- n8n-nodes-base.googleGemini (v1) - Google Gemini

ACTIONS - BUSINESS:
- n8n-nodes-base.stripe (v1) - Stripe payments
- n8n-nodes-base.shopify (v1) - Shopify e-commerce
- n8n-nodes-base.salesforce (v1) - Salesforce CRM
- n8n-nodes-base.hubspot (v1) - HubSpot CRM
- n8n-nodes-base.jira (v1) - Jira project management
- n8n-nodes-base.asana (v1) - Asana tasks
- n8n-nodes-base.trello (v1) - Trello boards

ACTIONS - MONITORING:
- n8n-nodes-base.webhook (v2) - Send webhooks
- n8n-nodes-base.xml (v1) - XML processing
- n8n-nodes-base.htmlExtract (v1) - Web scraping
- n8n-nodes-base.dateTime (v1) - Date/time operations
- n8n-nodes-base.wait (v1) - Delays/timing

ERROR HANDLING:
- n8n-nodes-base.errorTrigger (v1) - Catch workflow errors
- n8n-nodes-base.stopAndError (v1) - Manual error handling
- n8n-nodes-base.noOp (v1) - Do nothing (placeholder)

JSON STRUCTURE (EXACT):
{
  "name": "Descriptive Workflow Name",
  "nodes": [
    {
      "parameters": {"detailed": "parameters"},
      "id": "uuid-v4-format",
      "name": "Human Readable Name",
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": correct_version,
      "position": [x, y]
    }
  ],
  "connections": {
    "sourceNodeId": {
      "main": [
        [
          {"node": "targetNodeId", "type": "main", "index": 0}
        ]
      ]
    }
  },
  "settings": {"executionOrder": "v1"}
}

CRITICAL RULES:
1. ONLY valid node types from the list above
2. Correct typeVersion for each node type
3. Every node MUST have proper connections
4. Positions must be unique and non-overlapping
5. Parameters must be realistic for the node type

CRITICAL CONNECTION RULES:
- "connections" keys MUST match EXACT node "name" values
- Every node (except final nodes) MUST have outgoing connections
- Every node (except trigger) MUST have incoming connections
- Branch nodes (if/switch) need connections for ALL paths
- Use "main" branch for primary flow, add error paths when needed

PARAMETER EXAMPLES:
Webhook: {"httpMethod":"POST","path":"webhook-path","options":{}}
HTTP Request: {"method":"GET","url":"https://api.example.com/data","options":{}}
Set (v3): {"mode":"manual","duplicateItem":false,"assignments":{"assignments":[{"id":"uuid","name":"fieldName","value":"={{ $json.field }}","type":"string"}]}}
Code (v2): {"jsCode":"// Process data\\nconst processed = items.map(item => ({...item, processed: true}));\\nreturn processed;"}
If (v2): {"conditions":{"options":{"caseSensitive":true},"conditions":[{"id":"uuid","leftValue":"={{ $json.field }}","rightValue":"value","operator":{"type":"string","operation":"="}}]}}
Slack (v2): {"resource":"message","operation":"post","channel":{"__rl":true,"value":"#general","mode":"name"},"text":"{{ $json.message }}","otherOptions":{}}
Email Send: {"fromEmail":"workflow@example.com","toEmail":"{{ $json.email }}","subject":"{{ $json.subject }}","text":"{{ $json.body }}","options":{}}
Google Sheets (v4): {"operation":"appendOrUpdate","documentId":{"__rl":true,"value":"your-sheet-id","mode":"id"},"sheetName":{"__rl":true,"value":"Sheet1","mode":"name"},"columns":{"mappingMode":"autoMapInputData","value":{}},"options":{}}

WORKFLOW VALIDATION CHECKLIST:
□ Exactly 1 trigger node
□ All nodes have unique IDs (UUID format)
□ All nodes have proper typeVersion
□ All nodes are connected (no orphans)
□ Data flows logically from trigger to actions
□ Parameters are realistic and functional
□ Position array [x,y] with 250px horizontal spacing
□ Error handling for conditional nodes
□ Final nodes don't have unnecessary outgoing connections

RESPONSE FORMAT:
Return ONLY the complete JSON workflow object. Ensure it's valid, connected, and executable in n8n.`;

function generateNodeId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const TYPE_VERSIONS = {
  'n8n-nodes-base.webhook': 2,
  'n8n-nodes-base.httpRequest': 4,
  'n8n-nodes-base.code': 2,
  'n8n-nodes-base.set': 3,
  'n8n-nodes-base.if': 2,
  'n8n-nodes-base.switch': 3,
  'n8n-nodes-base.filter': 2,
  'n8n-nodes-base.googleSheets': 4,
  'n8n-nodes-base.slack': 2,
  'n8n-nodes-base.scheduleTrigger': 1,
  'n8n-nodes-base.manualTrigger': 1,
};

function sanitizeExpressionsDeep(value) {
  if (typeof value === 'string') {
    return value
      .replace(/\{\{\s*item\./g, '{{$json.')
      .replace(/\$item\[['"]([^'"]+)['"]\]/g, '$json.$1');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeExpressionsDeep);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeExpressionsDeep(v)])
    );
  }
  return value;
}

function serializeNodeTargets(sourceNodeType, targets) {
  const asMainConn = (node) => ({ node, type: 'main', index: 0 });
  if (/n8n-nodes-base\.if$/i.test(sourceNodeType || '')) {
    if (targets.length <= 1) return [[...targets].map(asMainConn)];
    const [trueTarget, falseTarget, ...rest] = targets;
    return [
      [asMainConn(trueTarget), ...rest.map(asMainConn)],
      [asMainConn(falseTarget)],
    ];
  }
  if (/n8n-nodes-base\.switch$/i.test(sourceNodeType || '')) {
    return targets.map((node) => [asMainConn(node)]);
  }
  return [[...targets].map(asMainConn)];
}

function ensureNonOverlappingPositions(nodes) {
  if (!Array.isArray(nodes) || nodes.length < 2) return;

  const parsePos = (node, index) => {
    if (Array.isArray(node?.position) && node.position.length >= 2) {
      return [Number(node.position[0]), Number(node.position[1])];
    }
    return [250 + index * 250, 300];
  };

  const seen = new Set();
  let hasCollision = false;
  for (let i = 0; i < nodes.length; i++) {
    const [x, y] = parsePos(nodes[i], i);
    const key = `${Math.round(x)}:${Math.round(y)}`;
    if (seen.has(key)) {
      hasCollision = true;
      break;
    }
    seen.add(key);
  }

  if (!hasCollision) {
    nodes.forEach((node, index) => {
      const [x, y] = parsePos(node, index);
      node.position = [Number.isFinite(x) ? x : 250 + index * 250, Number.isFinite(y) ? y : 300];
    });
    return;
  }

  const used = new Set();
  const baseX = 250;
  const baseY = 300;
  const colGap = 320;
  const rowGap = 220;
  const cols = 5;

  nodes.forEach((node, index) => {
    let [x, y] = parsePos(node, index);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = baseX + (index % cols) * colGap;
      y = baseY + Math.floor(index / cols) * rowGap;
    }

    let key = `${Math.round(x)}:${Math.round(y)}`;
    if (used.has(key)) {
      let attempt = 0;
      do {
        attempt += 1;
        const slot = index + attempt;
        x = baseX + (slot % cols) * colGap;
        y = baseY + Math.floor(slot / cols) * rowGap;
        key = `${Math.round(x)}:${Math.round(y)}`;
      } while (used.has(key) && attempt < 200);
    }

    used.add(key);
    node.position = [Math.round(x), Math.round(y)];
  });
}

function validateConnectionIntegrity(nodes, connections) {
  const nodeNames = new Set(nodes.map(n => n.name));
  const missingNodes = new Set();

  // Check all source nodes exist
  for (const sourceName of Object.keys(connections)) {
    if (!nodeNames.has(sourceName)) {
      console.warn(`Connection source node "${sourceName}" does not exist in nodes array`);
      missingNodes.add(sourceName);
    }
  }

  // Check all target nodes exist
  for (const [sourceName, connectionData] of Object.entries(connections)) {
    if (!connectionData || !Array.isArray(connectionData.main)) continue;

    for (const branch of connectionData.main) {
      if (!Array.isArray(branch)) continue;
      for (const conn of branch) {
        const targetNode = typeof conn === 'string' ? conn : (conn?.node || conn?.name || '');
        if (targetNode && !nodeNames.has(targetNode)) {
          console.warn(`Connection target node "${targetNode}" does not exist in nodes array`);
          missingNodes.add(targetNode);
        }
      }
    }
  }

  if (missingNodes.size > 0) {
    console.error(`Workflow validation failed: Missing nodes in connections: ${[...missingNodes].join(', ')}`);
    // Remove invalid connections
    for (const missingNode of missingNodes) {
      delete connections[missingNode];
      // Also remove connections that reference the missing node
      for (const [source, connData] of Object.entries(connections)) {
        if (!connData || !Array.isArray(connData.main)) continue;
        connData.main = connData.main.map(branch => {
          if (!Array.isArray(branch)) return branch;
          return branch.filter(conn => {
            const target = typeof conn === 'string' ? conn : (conn?.node || conn?.name || '');
            return target !== missingNode;
          });
        }).filter(branch => branch.length > 0);
        if (connData.main.length === 0) {
          delete connections[source];
        }
      }
    }
    console.log(`Removed invalid connections referencing missing nodes: ${[...missingNodes].join(', ')}`);
  }

  return missingNodes.size === 0;
}

function ensureNonOverlappingPositions(nodes) {
  if (!nodes || nodes.length === 0) return;

  // Sort nodes by their x position for consistent layout
  nodes.sort((a, b) => (a.position?.[0] || 0) - (b.position?.[0] || 0));

  // Minimum spacing between nodes
  const MIN_SPACING = 350;
  const BASE_Y = 300;

  // Track used positions to prevent overlaps
  const usedPositions = new Set();

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node.position || !Array.isArray(node.position)) {
      node.position = [100 + (i * MIN_SPACING), BASE_Y];
      continue;
    }

    let [x, y] = node.position;
    let attempts = 0;
    const maxAttempts = 50;

    // Find a non-conflicting position
    while (attempts < maxAttempts) {
      const positionKey = `${Math.round(x)},${Math.round(y)}`;
      if (!usedPositions.has(positionKey)) {
        // Check for nearby positions that might cause overlaps
        let hasNearbyConflict = false;
        for (const existing of usedPositions) {
          const [ex, ey] = existing.split(',').map(Number);
          const distance = Math.sqrt((x - ex) ** 2 + (y - ey) ** 2);
          if (distance < MIN_SPACING * 0.8) { // Allow some tolerance
            hasNearbyConflict = true;
            break;
          }
        }

        if (!hasNearbyConflict) {
          usedPositions.add(positionKey);
          node.position = [Math.round(x), Math.round(y)];
          break;
        }
      }

      // Try next position
      x += MIN_SPACING;
      attempts++;

      // If we've tried too many horizontal positions, move to next row
      if (attempts % 10 === 0) {
        x = 100 + ((i % 5) * MIN_SPACING);
        y += 200; // Move down for branching layouts
      }
    }

    // If we couldn't find a good position, use a fallback
    if (attempts >= maxAttempts) {
      node.position = [100 + (i * MIN_SPACING), BASE_Y + (Math.floor(i / 5) * 200)];
      console.warn(`Could not find optimal position for node "${node.name}", using fallback`);
    }
  }

  // Ensure no two nodes have identical positions
  const positionMap = new Map();
  for (const node of nodes) {
    const posKey = `${node.position[0]},${node.position[1]}`;
    if (positionMap.has(posKey)) {
      // Offset slightly to avoid exact overlap
      node.position[1] += 50;
      console.warn(`Fixed duplicate position for node "${node.name}"`);
    }
    positionMap.set(posKey, node);
  }
}

function validateAndFixWorkflow(workflow) {
  if (!workflow || typeof workflow !== 'object') {
    throw new Error('Invalid workflow: not an object');
  }

  if (!workflow.name || typeof workflow.name !== 'string') {
    workflow.name = 'Generated Workflow';
  }

  if (!Array.isArray(workflow.nodes)) {
    if (workflow.nodes && typeof workflow.nodes === 'object') {
      workflow.nodes = Object.values(workflow.nodes);
    } else {
      workflow.nodes = [];
    }
  }

  if (workflow.nodes.length === 0) {
    throw new Error('Invalid workflow: empty nodes array');
  }

  const nodeNames = new Set();
  workflow.nodes = workflow.nodes.map((node, index) => {
    const fixed = {
      ...node,
      parameters: sanitizeExpressionsDeep(node?.parameters || {}),
      id: node?.id || generateNodeId(),
      name: node?.name || `Node ${index + 1}`,
      type: node?.type || 'n8n-nodes-base.noOp',
      typeVersion: typeof node?.typeVersion === 'number' ? node.typeVersion : undefined,
      position: Array.isArray(node?.position) ? node.position : [250 + index * 250, 300]
    };

    if (!fixed.type.startsWith('n8n-nodes-base.')) {
      fixed.type = fixed.type.includes('.') ? 'n8n-nodes-base.noOp' : `n8n-nodes-base.${fixed.type}`;
    }

    if (fixed.type === 'n8n-nodes-base.cron') fixed.type = 'n8n-nodes-base.scheduleTrigger';
    if (fixed.type === 'n8n-nodes-base.function') fixed.type = 'n8n-nodes-base.code';

    fixed.typeVersion = fixed.typeVersion || TYPE_VERSIONS[fixed.type] || 1;

    const base = fixed.name;
    let counter = 1;
    while (nodeNames.has(fixed.name)) {
      fixed.name = `${base} ${counter++}`;
    }
    nodeNames.add(fixed.name);

    return fixed;
  });

  // Enforce exactly one trigger and place it at the root.
  const triggerIndex = workflow.nodes.findIndex(n => /trigger|webhook/i.test(n.type || ''));
  if (triggerIndex > 0) {
    const [triggerNode] = workflow.nodes.splice(triggerIndex, 1);
    workflow.nodes.unshift(triggerNode);
  } else if (triggerIndex === -1) {
    workflow.nodes[0].type = 'n8n-nodes-base.manualTrigger';
    workflow.nodes[0].typeVersion = TYPE_VERSIONS['n8n-nodes-base.manualTrigger'] || 1;
  }

  for (let i = 1; i < workflow.nodes.length; i++) {
    if (/trigger|webhook/i.test(workflow.nodes[i].type || '')) {
      workflow.nodes[i].type = 'n8n-nodes-base.set';
      workflow.nodes[i].typeVersion = TYPE_VERSIONS['n8n-nodes-base.set'] || 3;
      workflow.nodes[i].parameters = workflow.nodes[i].parameters && Object.keys(workflow.nodes[i].parameters).length
        ? workflow.nodes[i].parameters
        : { mode: 'manual', duplicateItem: false, assignments: { assignments: [] } };
    }
  }

  const nodeNameSet = new Set(workflow.nodes.map(n => n.name));
  const rawConnections = workflow.connections && typeof workflow.connections === 'object' ? workflow.connections : {};

  // Build deterministic edge graph first.
  const edgeMap = new Map(workflow.nodes.map(n => [n.name, new Set()]));

  for (const [sourceName, connectionData] of Object.entries(rawConnections)) {
    if (!nodeNameSet.has(sourceName)) continue;
    if (!connectionData || !Array.isArray(connectionData.main)) continue;

    for (const branch of connectionData.main) {
      if (!Array.isArray(branch)) continue;
      for (const conn of branch) {
        const node = typeof conn === 'string' ? conn : (conn?.node || conn?.name || '');
        if (nodeNameSet.has(node)) edgeMap.get(sourceName).add(node);
      }
    }
  }

  // Always add a linear backbone so all nodes are part of the executable graph.
  for (let i = 0; i < workflow.nodes.length - 1; i++) {
    edgeMap.get(workflow.nodes[i].name).add(workflow.nodes[i + 1].name);
  }

  // Guarantee every non-root node has incoming edge.
  const incomingCount = new Map(workflow.nodes.map(n => [n.name, 0]));
  for (const [, targets] of edgeMap) {
    for (const target of targets) {
      incomingCount.set(target, (incomingCount.get(target) || 0) + 1);
    }
  }

  for (let i = 1; i < workflow.nodes.length; i++) {
    const curr = workflow.nodes[i].name;
    if ((incomingCount.get(curr) || 0) === 0) {
      const prev = workflow.nodes[i - 1].name;
      edgeMap.get(prev).add(curr);
      incomingCount.set(curr, 1);
    }
  }

  // Serialize edge map to n8n connections.
  const fixedConnections = {};
  const nodeTypeByName = new Map(workflow.nodes.map(n => [n.name, n.type]));
  for (const [source, targets] of edgeMap.entries()) {
    if (targets.size === 0) continue;
    const targetList = [...targets];
    fixedConnections[source] = {
      main: serializeNodeTargets(nodeTypeByName.get(source), targetList)
    };
  }

  workflow.connections = fixedConnections;
  workflow.settings = workflow.settings || { executionOrder: 'v1' };

  // Validate that all nodes referenced in connections exist in the nodes array
  validateConnectionIntegrity(workflow.nodes, fixedConnections);

  // Re-layout when any coordinates collide to prevent stacked nodes.
  ensureNonOverlappingPositions(workflow.nodes);

  return workflow;
}

function extractJSON(text) {
  if (typeof text !== 'string') return text;
  
  // Try direct parse first
  try { return JSON.parse(text); } catch {}
  
  // Remove markdown code fences
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  
  // Find the outermost JSON object
  let depth = 0;
  let start = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (cleaned[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(cleaned.substring(start, i + 1)); } catch {}
      }
    }
  }
  
  // Last resort: regex
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  
  throw new Error('Could not extract valid JSON from AI response');
}

async function generateWorkflow({ description, provider, apiKey, model, includeErrorHandling = true }) {
  const urls = {
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    google: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
  };

  const url = urls[provider];
  if (!url) throw new Error('Unsupported provider: ' + provider);
  if (!apiKey) throw new Error('API key is required');

  let headers = {
    'Content-Type': 'application/json'
  };

  let body;

  if (provider === 'google') {
    // Google Gemini API format
    headers['x-goog-api-key'] = apiKey;
    body = {
      contents: [{
        parts: [{
          text: `Create a complete, production-ready n8n workflow for the following requirement:

"${description}"

${includeErrorHandling ? 'Include proper error handling where appropriate.' : ''}

CRITICAL POSITIONING REQUIREMENTS:
- Space nodes MINIMUM 350px apart horizontally (x-axis) to prevent overlaps
- Start first node at x=100, y=300
- Use consistent Y-coordinate of 300 for horizontal workflow layout
- For branching workflows, offset Y by ±150px for parallel branches
- Ensure sufficient space for node labels and icons

VALIDATION REQUIREMENTS:
- EVERY node referenced in connections MUST exist in the nodes array
- No orphaned nodes - all nodes must be connected
- Use proper node typeVersions as specified

Requirements:
- Start with the most appropriate trigger node
- Use realistic parameter values (not placeholders)
- Create proper connections between all nodes
- Give each node a clear, descriptive name
- Respond with ONLY the JSON object, nothing else`
        }]
      }]
    };
  } else {
    // OpenAI/OpenRouter/Groq API format
    headers['Authorization'] = 'Bearer ' + apiKey;
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://n8n-sidekick.com';
      headers['X-Title'] = 'n8n Automation Sidekick';
    }

    const userPrompt = `Create a complete, production-ready n8n workflow for the following requirement:

"${description}"

${includeErrorHandling ? 'Include proper error handling where appropriate.' : ''}

CRITICAL POSITIONING REQUIREMENTS:
- Space nodes MINIMUM 350px apart horizontally (x-axis) to prevent overlaps
- Start first node at x=100, y=300
- Use consistent Y-coordinate of 300 for horizontal workflow layout
- For branching workflows, offset Y by ±150px for parallel branches
- Ensure sufficient space for node labels and icons

VALIDATION REQUIREMENTS:
- EVERY node referenced in connections MUST exist in the nodes array
- No orphaned nodes - all nodes must be connected
- Use proper node typeVersions as specified

Requirements:
- Start with the most appropriate trigger node
- Use realistic parameter values (not placeholders)
- Create proper connections between all nodes
- Give each node a clear, descriptive name
- Respond with ONLY the JSON object, nothing else`;

    body = {
      model: model || 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: N8N_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7
    };
  }

  // Add response_format for providers that support it
  if (provider === 'openrouter' || provider === 'openai') {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider} API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  let content;
  
  if (provider === 'google') {
    // Google Gemini response format
    content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  } else {
    // OpenAI/OpenRouter/Groq response format
    content = data.choices?.[0]?.message?.content;
  }
  
  if (!content) throw new Error('No content in AI response');

  // Extract and validate
  const rawWorkflow = extractJSON(content);
  const workflow = validateAndFixWorkflow(rawWorkflow);

  return {
    success: true,
    workflow,
    provider,
    model: data.model || model,
    usage: data.usage || null
  };
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateWorkflow, validateAndFixWorkflow, extractJSON, N8N_SYSTEM_PROMPT };
}
if (typeof window !== 'undefined') {
  window.workflowEngine = { generateWorkflow, validateAndFixWorkflow, extractJSON, N8N_SYSTEM_PROMPT };
  // Backwards compatibility
  window.createRobustWorkflowGenerator = function() {
    return {
      async generateWorkflow(description, provider, apiKey, model) {
        return await generateWorkflow({ description, provider, apiKey, model });
      }
    };
  };
}
