// Quick end-to-end test of the professional workflow generation
const API_KEY = process.argv[2] || process.env.OPENROUTER_API_KEY || '';
if (!API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not provided. Set environment variable or pass as argument.');
  process.exit(1);
}

const SYSTEM = `You are a senior n8n workflow architect. Produce ONLY valid, import-ready n8n workflow JSON.
Use real n8n node types: n8n-nodes-base.webhook(v2), n8n-nodes-base.httpRequest(v4), n8n-nodes-base.set(v3), n8n-nodes-base.slack(v2), n8n-nodes-base.googleSheets(v4), n8n-nodes-base.code(v2), n8n-nodes-base.if(v2), n8n-nodes-base.manualTrigger, n8n-nodes-base.scheduleTrigger, n8n-nodes-base.emailSend.
Position is [x,y] ARRAY. Space nodes 250px apart from [250,300].
Connections: {"Source Name":{"main":[[{"node":"Target","type":"main","index":0}]]}}
Include settings:{"executionOrder":"v1"}. Each node needs UUID id, typeVersion, parameters. Respond ONLY with JSON.`;

async function test() {
  console.log('Testing workflow generation with OpenRouter...');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://n8n-sidekick.com',
      'X-Title': 'n8n Sidekick'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: 'Create a workflow: When a webhook receives data, save it to Google Sheets and send a Slack notification. Respond with ONLY JSON.' }
      ],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    console.error('API Error:', res.status, await res.text());
    return;
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  let wf;
  try { wf = JSON.parse(content); } catch { 
    const m = content.match(/\{[\s\S]*\}/);
    if (m) wf = JSON.parse(m[0]);
    else { console.error('Failed to parse JSON'); console.log('Raw:', content.substring(0, 500)); return; }
  }

  console.log('\n=== RESULT ===');
  console.log('Name:', wf.name);
  console.log('Nodes:', wf.nodes?.length || 0);
  
  const issues = [];
  wf.nodes?.forEach((n, i) => {
    const posOk = Array.isArray(n.position);
    const typeOk = n.type?.startsWith('n8n-nodes-base.');
    const idOk = n.id && n.id.length >= 5;
    const tvOk = typeof n.typeVersion === 'number';
    console.log(`  ${i+1}. ${n.name} | ${n.type} | v${n.typeVersion} | pos:${JSON.stringify(n.position)} | params:${Object.keys(n.parameters||{}).length}`);
    if (!posOk) issues.push(`Node "${n.name}": position not array`);
    if (!typeOk) issues.push(`Node "${n.name}": bad type "${n.type}"`);
    if (!idOk) issues.push(`Node "${n.name}": missing/short id`);
    if (!tvOk) issues.push(`Node "${n.name}": missing typeVersion`);
  });

  console.log('\nConnections:');
  for (const [src, conn] of Object.entries(wf.connections || {})) {
    const targets = conn.main?.flat()?.map(c => c.node).join(', ') || 'none';
    console.log(`  ${src} -> ${targets}`);
  }

  console.log('\nSettings:', JSON.stringify(wf.settings));
  console.log('Tokens:', JSON.stringify(data.usage));

  if (issues.length === 0) {
    console.log('\n✅ ALL CHECKS PASSED - Valid n8n workflow!');
  } else {
    console.log('\n❌ ISSUES FOUND:');
    issues.forEach(i => console.log('  -', i));
  }
}

test().catch(e => console.error('Fatal:', e.message));
