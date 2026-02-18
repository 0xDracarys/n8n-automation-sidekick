const API_BASE = import.meta.env.VITE_API_URL || '/api';

import { TOONWorkflowOptimizer } from './toon-workflow-optimizer.js';

// Initialize TOON optimizer
const toonOptimizer = new TOONWorkflowOptimizer();
toonOptimizer.setEnabled(true);

function sanitizeExpressionsDeep(value) {
  if (typeof value === 'string') {
    return value
      .replace(/\{\{\s*item\./g, '{{$json.')
      .replace(/\$item\[['"]([^'"]+)['"]\]/g, '$json.$1');
  }
  if (Array.isArray(value)) return value.map(sanitizeExpressionsDeep);
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
    // Updated to match server-side AI generation: 350px minimum spacing
    return [100 + index * 350, 300];
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
      // Updated to match server-side AI generation spacing
      node.position = [Number.isFinite(x) ? x : 100 + index * 350, Number.isFinite(y) ? y : 300];
    });
    return;
  }

  const used = new Set();
  // Updated to match server-side AI generation: start at x=100, use 350px spacing
  const baseX = 100;
  const baseY = 300;
  const colGap = 350; // Minimum spacing to match AI generation
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

function enforceConnectedWorkflow(workflow) {
  if (!workflow || typeof workflow !== 'object') throw new Error('Invalid workflow');
  if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) throw new Error('Workflow has no nodes');

  // Normalize nodes
  const names = new Set();
  workflow.nodes = workflow.nodes.map((node, i) => {
    const fixed = {
      ...node,
      id: node?.id || crypto.randomUUID(),
      name: node?.name || `Node ${i + 1}`,
      type: node?.type || 'n8n-nodes-base.noOp',
      typeVersion: typeof node?.typeVersion === 'number' ? node.typeVersion : 1,
      parameters: sanitizeExpressionsDeep(node?.parameters || {}),
      position: Array.isArray(node?.position) ? node.position : [250 + i * 250, 300],
    };

    const base = fixed.name;
    let n = 1;
    while (names.has(fixed.name)) fixed.name = `${base} ${n++}`;
    names.add(fixed.name);
    return fixed;
  });

  // Ensure the first node is a trigger so the graph has a valid root.
  const triggerIndex = workflow.nodes.findIndex(n => /trigger|webhook/i.test(n.type || ''));
  if (triggerIndex > 0) {
    const [triggerNode] = workflow.nodes.splice(triggerIndex, 1);
    workflow.nodes.unshift(triggerNode);
  } else if (triggerIndex === -1) {
    workflow.nodes[0].type = 'n8n-nodes-base.manualTrigger';
    workflow.nodes[0].typeVersion = 1;
  }

  // Enforce exactly one trigger by demoting extra trigger-like nodes.
  for (let i = 1; i < workflow.nodes.length; i++) {
    if (/trigger|webhook/i.test(workflow.nodes[i].type || '')) {
      workflow.nodes[i].type = 'n8n-nodes-base.set';
      workflow.nodes[i].typeVersion = 3;
      workflow.nodes[i].parameters = workflow.nodes[i].parameters && Object.keys(workflow.nodes[i].parameters).length
        ? workflow.nodes[i].parameters
        : { mode: 'manual', duplicateItem: false, assignments: { assignments: [] } };
    }
  }

  const validNames = new Set(workflow.nodes.map(n => n.name));
  const rawConnections = workflow.connections && typeof workflow.connections === 'object' ? workflow.connections : {};

  // Build a deterministic edge graph first, then serialize to n8n connection format.
  const edgeMap = new Map(workflow.nodes.map(n => [n.name, new Set()]));

  // Keep valid edges from AI output.
  for (const [source, c] of Object.entries(rawConnections)) {
    if (!validNames.has(source) || !Array.isArray(c?.main)) continue;
    for (const branch of c.main) {
      if (!Array.isArray(branch)) continue;
      for (const conn of branch) {
        const target = conn?.node || conn?.name || '';
        if (validNames.has(target)) edgeMap.get(source).add(target);
      }
    }
  }

  // Force a linear backbone so every node participates in at least one path.
  for (let i = 0; i < workflow.nodes.length - 1; i++) {
    const src = workflow.nodes[i].name;
    const dst = workflow.nodes[i + 1].name;
    edgeMap.get(src).add(dst);
  }

  // Guarantee incoming edges for all non-root nodes.
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

  // Serialize edge graph back to n8n connections.
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
  ensureNonOverlappingPositions(workflow.nodes);
  return workflow;
}

export async function generateWorkflow({ description, provider, apiKey, model }) {
  const res = await fetch(`${API_BASE}/workflow/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, provider, apiKey, model })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Generation failed');
  }
  return res.json();
}

export async function testConnection({ provider, apiKey }) {
  const res = await fetch(`${API_BASE}/workflow/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, apiKey })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Connection failed');
  }
  return res.json();
}

// Direct client-side generation (fallback when server is not running)
export async function generateWorkflowDirect(prompt, provider = 'openrouter', model = null, apiKey = null) {
  // Optimize prompt with TOON for better AI understanding and cost savings
  const optimizedPrompt = toonOptimizer.optimizeUserPrompt(prompt);
  
  console.log('🎯 Using TOON optimization for workflow generation');
  console.log(`💰 Estimated token savings: ${toonOptimizer.toonConverter.calculateTokenSavings({prompt}).savingsPercent}%`);
  
  const PROVIDER_URLS = {
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions'
  };

  const url = PROVIDER_URLS[provider];
  if (!url) throw new Error(`Unsupported provider: ${provider}`);

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://n8n-sidekick.com';
    headers['X-Title'] = 'n8n Automation Sidekick';
  }

  const systemPrompt = `You are an expert n8n workflow architect.
Return ONLY valid import-ready n8n workflow JSON.

Hard requirements:
- Exactly one trigger node.
- Every non-trigger node must have an incoming connection.
- Every non-terminal node must have an outgoing connection.
- No detached or orphaned nodes.
- Connections must reference exact node names.
- Create complete end-to-end flow (trigger -> processing -> action/output).
- Use realistic parameters and correct n8n node types/typeVersions.

Output schema:
{
  "name": "...",
  "nodes": [{"id":"...","name":"...","type":"n8n-nodes-base...","typeVersion":1,"position":[x,y],"parameters":{}}],
  "connections": {"Source Node": {"main": [[{"node":"Target Node","type":"main","index":0}]]}},
  "settings": {"executionOrder":"v1"}
}`;

  const body = {
    model: model || 'openai/gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create an n8n workflow for: ${description}` }
    ],
    temperature: 0.7,
    max_tokens: 4000,
  };

  // Groq frequently rejects strict json_object mode for complex prompts.
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
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  let workflow;
  const content = data.choices[0].message.content;
  try {
    workflow = typeof content === 'string' ? JSON.parse(content) : content;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) workflow = JSON.parse(match[0]);
    else throw new Error('Failed to parse workflow JSON');
  }

  workflow = enforceConnectedWorkflow(workflow);

  return { success: true, workflow, provider, model };
}
