// Quick test of the workflow generation engine
const API_KEY = process.env.OPENROUTER_API_KEY || '';

if (!API_KEY) {
  console.log('Usage: set OPENROUTER_API_KEY env var first');
  console.log('Or: node test-generation.js YOUR_API_KEY');
  process.exit(1);
}

const N8N_SYSTEM_PROMPT = `You are a senior n8n workflow architect. You produce ONLY valid, import-ready n8n workflow JSON.

CRITICAL RULES:
1. Respond with ONLY the JSON object. No markdown, no backticks, no explanations.
2. Every workflow MUST start with exactly ONE trigger node.
3. Use ONLY real n8n node types.

TRIGGER NODES: n8n-nodes-base.webhook(v2), n8n-nodes-base.scheduleTrigger(v1), n8n-nodes-base.manualTrigger(v1)
ACTION NODES: n8n-nodes-base.httpRequest(v4), n8n-nodes-base.emailSend, n8n-nodes-base.slack(v2), n8n-nodes-base.googleSheets(v4)
TRANSFORM NODES: n8n-nodes-base.set(v3), n8n-nodes-base.code(v2), n8n-nodes-base.if(v2), n8n-nodes-base.filter(v2)

JSON STRUCTURE:
{
  "name": "Workflow Name",
  "nodes": [{"parameters":{},"id":"uuid","name":"Name","type":"n8n-nodes-base.type","typeVersion":1,"position":[x,y]}],
  "connections": {"Source Name":{"main":[[{"node":"Target Name","type":"main","index":0}]]}},
  "settings": {"executionOrder":"v1"}
}

- "position" is [x,y] ARRAY. Space 250px apart horizontally from [250,300].
- Use realistic parameter values.
- For webhook: {"httpMethod":"POST","path":"webhook-path","options":{}}
- For httpRequest(v4): {"method":"GET","url":"https://api.example.com","options":{}}
- For slack(v2): {"resource":"message","operation":"post","channel":{"__rl":true,"value":"#channel","mode":"name"},"text":"msg","otherOptions":{}}`;

async function test() {
  console.log('Testing workflow generation with OpenRouter...\n');
  
  const description = 'When a new Stripe payment arrives, save the customer data to Google Sheets and send a Slack notification';
  
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://n8n-sidekick.com',
      'X-Title': 'n8n Automation Sidekick'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: N8N_SYSTEM_PROMPT },
        { role: 'user', content: `Create a complete, production-ready n8n workflow for:\n\n"${description}"\n\nRequirements:\n- Start with the most appropriate trigger node\n- Use realistic parameter values\n- Create proper connections between all nodes\n- Space nodes 250px apart horizontally starting at [250,300]\n- Give each node a clear, descriptive name\n- Respond with ONLY the JSON object` }
      ],
      temperature: 0.4,
      max_tokens: 6000,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('API Error:', res.status, err);
    return;
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  
  let workflow;
  try {
    workflow = JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) workflow = JSON.parse(m[0]);
    else { console.error('Failed to parse JSON'); return; }
  }

  console.log('=== WORKFLOW GENERATED ===');
  console.log('Name:', workflow.name);
  console.log('Nodes:', workflow.nodes?.length || 0);
  workflow.nodes?.forEach((n, i) => {
    console.log(`  ${i+1}. ${n.name} (${n.type}) at [${n.position}]`);
    console.log(`     typeVersion: ${n.typeVersion}, params: ${Object.keys(n.parameters || {}).join(', ') || 'none'}`);
  });
  console.log('Connections:', Object.keys(workflow.connections || {}).length, 'source nodes');
  for (const [src, conn] of Object.entries(workflow.connections || {})) {
    const targets = conn.main?.flat()?.map(c => c.node).join(', ') || 'none';
    console.log(`  ${src} → ${targets}`);
  }
  console.log('\n=== VALIDATION ===');
  
  // Check for common issues
  const issues = [];
  if (!workflow.nodes || workflow.nodes.length === 0) issues.push('No nodes');
  if (!workflow.connections || Object.keys(workflow.connections).length === 0) issues.push('No connections');
  
  const hasTrigger = workflow.nodes?.some(n => n.type?.includes('Trigger') || n.type?.includes('trigger') || n.type?.includes('webhook'));
  if (!hasTrigger) issues.push('No trigger node');
  
  workflow.nodes?.forEach(n => {
    if (!n.type?.startsWith('n8n-nodes-base.')) issues.push(`Bad type: ${n.type}`);
    if (!Array.isArray(n.position)) issues.push(`Bad position on ${n.name}: ${JSON.stringify(n.position)}`);
    if (!n.id || n.id.length < 5) issues.push(`Missing/short id on ${n.name}`);
  });
  
  if (issues.length === 0) {
    console.log('✅ All checks passed!');
  } else {
    issues.forEach(i => console.log('❌ ' + i));
  }
  
  console.log('\n=== FULL JSON ===');
  console.log(JSON.stringify(workflow, null, 2));
  
  console.log('\nTokens used:', data.usage);
}

test().catch(console.error);
