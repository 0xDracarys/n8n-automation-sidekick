import { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, ArrowRight, Bot, Workflow, Shield, Code2, Star, ChevronRight, Check, Layers, GitBranch, Play, Menu, X, Copy, Download, Loader2, ChevronDown, AlertCircle, RotateCcw, Settings2, Mail, Lock, Eye, EyeOff, User, BarChart3 } from 'lucide-react';
import Templates from './pages/Templates';
import ServicesCatalog from './pages/ServicesCatalog';
import ErrorBoundary from './components/ErrorBoundary';

/* ── Professional n8n Workflow Generation Engine ── */
const N8N_SYSTEM_PROMPT = `You are a senior n8n workflow architect. You produce ONLY valid, import-ready n8n workflow JSON.

CRITICAL RULES:
1. Respond with ONLY the JSON object. No markdown, no backticks, no explanations.
2. Every workflow MUST start with exactly ONE trigger node.
3. Use ONLY real n8n node types from this list:

TRIGGER NODES:
- n8n-nodes-base.webhook (HTTP webhook, typeVersion:2)
- n8n-nodes-base.scheduleTrigger (cron/interval, typeVersion:1)
- n8n-nodes-base.manualTrigger (manual execution, typeVersion:1)
- n8n-nodes-base.emailReadImap (email trigger)
- n8n-nodes-base.formTrigger (form submission)

ACTION NODES:
- n8n-nodes-base.httpRequest (HTTP/API calls, typeVersion:4)
- n8n-nodes-base.emailSend (send email via SMTP)
- n8n-nodes-base.slack (Slack messages, typeVersion:2)
- n8n-nodes-base.discord (Discord messages)
- n8n-nodes-base.telegram (Telegram messages)
- n8n-nodes-base.googleSheets (Google Sheets, typeVersion:4)
- n8n-nodes-base.notion (Notion pages/databases)
- n8n-nodes-base.postgres (PostgreSQL)
- n8n-nodes-base.mysql (MySQL)
- n8n-nodes-base.stripe (Stripe payments)
- n8n-nodes-base.github (GitHub API)
- n8n-nodes-base.hubspot (HubSpot CRM)
- n8n-nodes-base.openAi (OpenAI/ChatGPT)

TRANSFORM/LOGIC NODES:
- n8n-nodes-base.set (set/rename fields, typeVersion:3)
- n8n-nodes-base.code (JavaScript/Python code, typeVersion:2)
- n8n-nodes-base.if (conditional branching, typeVersion:2)
- n8n-nodes-base.switch (multi-way branching, typeVersion:3)
- n8n-nodes-base.filter (filter items, typeVersion:2)
- n8n-nodes-base.merge (merge branches)
- n8n-nodes-base.splitInBatches (batch processing)
- n8n-nodes-base.wait (delay/pause)
- n8n-nodes-base.respondToWebhook (respond to webhook caller)
- n8n-nodes-base.noOp (no operation placeholder)

EXACT JSON STRUCTURE:
{
  "name": "Descriptive Workflow Name",
  "nodes": [
    {
      "parameters": {},
      "id": "uuid-format-id",
      "name": "Human Readable Name",
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": 1,
      "position": [x, y]
    }
  ],
  "connections": {
    "Source Node Name": {
      "main": [[{"node": "Target Node Name", "type": "main", "index": 0}]]
    }
  },
  "settings": {"executionOrder": "v1"}
}

KEY DETAILS:
- "position" is [x, y] ARRAY. Space nodes 250px apart horizontally starting at [250, 300].
- "connections" keys are the SOURCE node "name" string.
- Each node needs a unique UUID-like "id".
- Use realistic parameter values, not empty strings.
- For webhook: {"httpMethod":"POST","path":"webhook-path","options":{}}
- For httpRequest(v4): {"method":"GET","url":"https://api.example.com","options":{}}
- For code(v2): {"jsCode":"// code\\nreturn items;"}
- For set(v3): {"mode":"manual","duplicateItem":false,"assignments":{"assignments":[{"id":"uuid","name":"field","value":"val","type":"string"}]}}
- For slack(v2): {"resource":"message","operation":"post","channel":{"__rl":true,"value":"#channel","mode":"name"},"text":"msg","otherOptions":{}}
- For emailSend: {"fromEmail":"sender@example.com","toEmail":"recipient@example.com","subject":"Subject","text":"Body","options":{}}
- For googleSheets(v4): {"operation":"appendOrUpdate","documentId":{"__rl":true,"value":"sheet-id","mode":"id"},"sheetName":{"__rl":true,"value":"Sheet1","mode":"name"},"columns":{"mappingMode":"autoMapInputData","value":{}},"options":{}}`;

function _genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const _TV = { 'n8n-nodes-base.webhook': 2, 'n8n-nodes-base.httpRequest': 4, 'n8n-nodes-base.code': 2, 'n8n-nodes-base.set': 3, 'n8n-nodes-base.if': 2, 'n8n-nodes-base.switch': 3, 'n8n-nodes-base.filter': 2, 'n8n-nodes-base.googleSheets': 4, 'n8n-nodes-base.slack': 2 };

function fixWorkflow(wf) {
  if (!wf || typeof wf !== 'object') throw new Error('Invalid workflow object');
  if (!wf.name) wf.name = 'Generated Workflow';
  if (!Array.isArray(wf.nodes)) {
    if (wf.nodes && typeof wf.nodes === 'object') wf.nodes = Object.values(wf.nodes);
    else throw new Error('Missing nodes array');
  }
  if (wf.nodes.length === 0) throw new Error('Empty nodes array');

  const names = new Set();
  wf.nodes = wf.nodes.map((n, i) => {
    if (!n.id || n.id.length < 5) n.id = _genId();
    if (!n.name) n.name = 'Node ' + (i + 1);
    let base = n.name, c = 1;
    while (names.has(n.name)) n.name = base + ' ' + c++;
    names.add(n.name);
    if (!n.type) n.type = 'n8n-nodes-base.noOp';
    else if (!n.type.includes('.')) n.type = 'n8n-nodes-base.' + n.type;
    if (n.type === 'n8n-nodes-base.cron') n.type = 'n8n-nodes-base.scheduleTrigger';
    if (n.type === 'n8n-nodes-base.function') n.type = 'n8n-nodes-base.code';
    n.typeVersion = _TV[n.type] || n.typeVersion || 1;
    if (!Array.isArray(n.position)) {
      if (n.position && typeof n.position === 'object') n.position = [n.position.x || 250 + i * 250, n.position.y || 300];
      else n.position = [250 + i * 250, 300];
    }
    if (!n.parameters || typeof n.parameters !== 'object') n.parameters = {};
    return n;
  });

  if (!wf.connections || typeof wf.connections !== 'object' || Object.keys(wf.connections).length === 0) {
    wf.connections = {};
    for (let i = 0; i < wf.nodes.length - 1; i++) {
      wf.connections[wf.nodes[i].name] = { main: [[{ node: wf.nodes[i + 1].name, type: 'main', index: 0 }]] };
    }
  } else {
    const fixed = {};
    for (const [k, v] of Object.entries(wf.connections)) {
      if (v && v.main && Array.isArray(v.main)) {
        fixed[k] = { main: v.main.map(outs => {
          if (!Array.isArray(outs)) return [outs].filter(Boolean);
          return outs.map(c => typeof c === 'string' ? { node: c, type: 'main', index: 0 } : { node: c.node || '', type: c.type || 'main', index: c.index || 0 });
        })};
      }
    }
    wf.connections = fixed;
  }

  if (!wf.settings) wf.settings = { executionOrder: 'v1' };

  // Re-layout if stacked
  const pos = wf.nodes.map(n => n.position);
  if (wf.nodes.length > 1 && pos.every(p => p[0] === pos[0][0] && p[1] === pos[0][1])) {
    wf.nodes.forEach((n, i) => { n.position = [250 + i * 250, 300]; });
  }
  return wf;
}

function extractJSON(text) {
  if (typeof text !== 'string') return text;
  try { return JSON.parse(text); } catch {}
  let cl = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(cl); } catch {}
  let depth = 0, start = -1;
  for (let i = 0; i < cl.length; i++) {
    if (cl[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (cl[i] === '}') { depth--; if (depth === 0 && start !== -1) { try { return JSON.parse(cl.substring(start, i + 1)); } catch {} } }
  }
  throw new Error('Could not extract valid JSON from AI response');
}

async function callAI({ description, provider, apiKey, model }) {
  const urls = { openrouter: 'https://openrouter.ai/api/v1/chat/completions', openai: 'https://api.openai.com/v1/chat/completions', groq: 'https://api.groq.com/openai/v1/chat/completions' };
  const url = urls[provider];
  if (!url) throw new Error('Unsupported provider: ' + provider);
  if (!apiKey) throw new Error('API key is required');
  const headers = { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' };
  if (provider === 'openrouter') { headers['HTTP-Referer'] = 'https://n8n-sidekick.com'; headers['X-Title'] = 'n8n Automation Sidekick'; }
  const body = {
    model: model || 'openai/gpt-4o-mini',
    messages: [
      { role: 'system', content: N8N_SYSTEM_PROMPT },
      { role: 'user', content: 'Create a complete, production-ready n8n workflow for:\n\n"' + description + '"\n\nRequirements:\n- Start with the most appropriate trigger node\n- Use realistic parameter values\n- Create proper connections between all nodes\n- Space nodes 250px apart horizontally starting at [250,300]\n- Give each node a clear, descriptive name\n- Respond with ONLY the JSON object' }
    ],
    temperature: 0.4,
    max_tokens: 6000,
  };
  if (provider === 'openrouter' || provider === 'openai') body.response_format = { type: 'json_object' };
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(provider + ' API error ' + res.status + ': ' + (await res.text()));
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in AI response');
  const raw = extractJSON(content);
  const workflow = fixWorkflow(raw);
  return { workflow, provider, model: data.model || model, usage: data.usage || null };
}

const fade = { hidden: { opacity: 0, y: 30 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }) };

/* ── NAVBAR ── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Zap className="w-5 h-5 text-white" /></div>
          <span className="text-lg font-bold tracking-tight">n8n <span className="gradient-text">Sidekick</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={'text-sm font-medium transition-colors hover:text-indigo-300 ' + (loc.pathname === '/' ? 'text-indigo-300' : 'text-slate-400')}>Home</Link>
          <Link to="/builder" className={'text-sm font-medium transition-colors hover:text-indigo-300 ' + (loc.pathname === '/builder' ? 'text-indigo-300' : 'text-slate-400')}>Builder</Link>
          <Link to="/templates" className={'text-sm font-medium transition-colors hover:text-indigo-300 ' + (loc.pathname === '/templates' ? 'text-indigo-300' : 'text-slate-400')}>Templates</Link>
          <Link to="/services" className={'text-sm font-medium transition-colors hover:text-indigo-300 ' + (loc.pathname === '/services' ? 'text-indigo-300' : 'text-slate-400')}>Services</Link>
          <a href="/#features" className="text-sm font-medium text-slate-400 hover:text-indigo-300 transition-colors">Features</a>
          <a href="/#pricing" className="text-sm font-medium text-slate-400 hover:text-indigo-300 transition-colors">Pricing</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Log in</Link>
          <Link to="/builder" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5"><Sparkles className="w-4 h-4" /> Try Builder</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-400 hover:text-white">{open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
      </div>
      {open && (
        <div className="md:hidden glass px-6 py-4 flex flex-col gap-3">
          <Link to="/" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-white py-2">Home</Link>
          <Link to="/builder" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-white py-2">Builder</Link>
          <Link to="/templates" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-white py-2">Templates</Link>
          <Link to="/services" onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-white py-2">Services</Link>
          <Link to="/builder" onClick={() => setOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold"><Sparkles className="w-4 h-4" /> Try Builder</Link>
        </div>
      )}
    </nav>
  );
}

/* ── LANDING ── */
function Landing() {
  return (
    <main>
      <section className="relative pt-32 lg:pt-44 pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" /><div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" /></div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div variants={fade} initial="hidden" animate="visible" custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-xs font-semibold tracking-wider uppercase text-indigo-300 mb-8"><Sparkles className="w-3.5 h-3.5" /> Powered by AI</motion.div>
          <motion.h1 variants={fade} initial="hidden" animate="visible" custom={1} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">Build n8n Workflows <span className="gradient-text">in Seconds</span><br />with Natural Language</motion.h1>
          <motion.p variants={fade} initial="hidden" animate="visible" custom={2} className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">Describe what you want in plain English. Our AI instantly generates production-ready n8n workflows. Works on localhost, n8n Cloud, and Enterprise.</motion.p>
          <motion.div variants={fade} initial="hidden" animate="visible" custom={3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/builder" className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-lg shadow-xl shadow-indigo-500/25 hover:-translate-y-0.5 transition-all"><Sparkles className="w-5 h-5" /> Start Building Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass text-white font-semibold text-lg hover:bg-white/10 transition-all"><Play className="w-5 h-5" /> See How It Works</a>
          </motion.div>
          <motion.div variants={fade} initial="hidden" animate="visible" custom={4} className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[{ v: '10k+', l: 'Workflows Built' }, { v: '50+', l: 'Node Types' }, { v: '<5s', l: 'Generation Time' }].map((s) => (<div key={s.l} className="text-center"><div className="text-2xl sm:text-3xl font-bold gradient-text">{s.v}</div><div className="text-xs text-slate-500 mt-1">{s.l}</div></div>))}
          </motion.div>
          <motion.div variants={fade} initial="hidden" animate="visible" custom={5} className="mt-20 rounded-2xl overflow-hidden glow">
            <div className="glass rounded-2xl p-1"><div className="rounded-xl p-6 sm:p-8" style={{ background: '#1e1e42' }}>
              <div className="flex items-center gap-2 mb-4"><div className="w-3 h-3 rounded-full bg-red-400/80" /><div className="w-3 h-3 rounded-full bg-yellow-400/80" /><div className="w-3 h-3 rounded-full bg-green-400/80" /><span className="ml-3 text-xs text-slate-500 font-mono">n8n-sidekick</span></div>
              <div className="space-y-3 font-mono text-sm text-left">
                <p className="text-slate-400"><span className="text-indigo-400">$</span> describe &quot;Stripe payment → Google Sheets → Slack&quot;</p>
                <p className="text-green-400">✓ Analyzing prompt...</p>
                <p className="text-green-400">✓ Generated 4 nodes: Stripe Trigger → Set → Google Sheets → Slack</p>
                <p className="text-green-400">✓ Workflow ready — copy JSON or import directly</p>
              </div>
            </div></div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <motion.h2 variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-4xl lg:text-5xl font-bold tracking-tight">Everything you need to <span className="gradient-text">automate faster</span></motion.h2>
            <motion.p variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">From simple triggers to complex multi-step workflows, our AI handles it all.</motion.p>
          </div>
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              [Bot, 'AI-Powered Generation', 'GPT-4o, Claude, Gemini, Llama — pick your model and build complex workflows from a single sentence.'],
              [Workflow, 'Production-Ready JSON', 'Every workflow is valid n8n JSON with correct node types, parameters, and connections.'],
              [Zap, 'Instant Results', 'Generate workflows in under 5 seconds. Reduce build time by 80%.'],
              [Shield, 'Enterprise Security', 'BYOK model — your API keys never leave your browser. Zero data retention.'],
              [Layers, 'Multi-Provider', 'Switch between OpenRouter, OpenAI, Gemini, Groq, or local Ollama with one click.'],
              [GitBranch, 'Smart Connections', 'AI creates proper node connections, error handling, and context-aware suggestions.'],
            ].map(([Icon, title, desc], i) => (
              <motion.div key={title} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="group glass rounded-2xl p-8 hover:bg-white/5 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-orange-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><Icon className="w-6 h-6 text-indigo-300" /></div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 lg:py-32" style={{ background: 'rgba(26,26,62,0.3)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center"><motion.h2 variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-4xl lg:text-5xl font-bold tracking-tight">Three steps to <span className="gradient-text-orange">automation</span></motion.h2></div>
          <div className="mt-16 grid lg:grid-cols-3 gap-8">
            {[[Code2, '01', 'Describe Your Workflow', 'Type what you want in plain English.'], [Bot, '02', 'AI Generates JSON', 'Our AI maps your intent to n8n node types and builds complete workflows.'], [Play, '03', 'Import & Run', 'One-click deploy or copy JSON. Works on localhost, Cloud, Enterprise.']].map(([Icon, num, title, desc], i) => (
              <motion.div key={num} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="relative glass rounded-2xl p-8 text-center">
                <div className="text-6xl font-black gradient-text-orange opacity-20 absolute top-4 right-6">{num}</div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6"><Icon className="w-7 h-7 text-orange-400" /></div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center"><motion.h2 variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-4xl lg:text-5xl font-bold tracking-tight">Loved by <span className="gradient-text">automation teams</span></motion.h2></div>
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {[['Sarah Chen', 'DevOps Lead, Stripe', 'This tool cut our workflow creation time from hours to seconds.'], ['Marcus Rodriguez', 'CTO, ScaleUp', 'We replaced our entire workflow design process. JSON output is always production-ready.'], ['Emily Watson', 'Automation Engineer', 'The multi-provider support is incredible. I switch between GPT-4 and Claude.']].map(([name, role, text], i) => (
              <motion.div key={name} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="glass rounded-2xl p-8">
                <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(j => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}</div>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">{name.split(' ').map(n => n[0]).join('')}</div>
                  <div><div className="text-sm font-semibold">{name}</div><div className="text-xs text-slate-500">{role}</div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 lg:py-32" style={{ background: 'rgba(26,26,62,0.3)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center"><motion.h2 variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-4xl lg:text-5xl font-bold tracking-tight">Simple, transparent <span className="gradient-text">pricing</span></motion.h2></div>
          <div className="mt-16 grid lg:grid-cols-3 gap-8 items-start">
            {[
              ['Free', '$0', 'forever', 'Perfect for getting started', ['5 workflows / day', 'OpenRouter & Ollama', 'Basic templates', 'Community support'], 'Get Started', false],
              ['Pro', '$19', '/month', 'For power users & teams', ['Unlimited workflows', 'All AI providers', 'Priority generation', 'Workflow history', 'Custom templates', 'Priority support'], 'Start Free Trial', true],
              ['Enterprise', 'Custom', '', 'For organizations at scale', ['Everything in Pro', 'SSO & SAML', 'Dedicated instance', 'SLA guarantee', 'Custom integrations', 'Onboarding'], 'Contact Sales', false],
            ].map(([name, price, period, desc, feats, cta, pop], i) => (
              <motion.div key={name} variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className={'relative rounded-2xl p-8 ' + (pop ? 'glass glow ring-1 ring-indigo-500/30 lg:scale-105' : 'glass')}>
                {pop && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-orange-500 text-xs font-bold text-white">Most Popular</div>}
                <h3 className="text-xl font-bold">{name}</h3>
                <p className="text-sm text-slate-400 mt-1">{desc}</p>
                <div className="mt-6 flex items-baseline gap-1"><span className="text-4xl font-extrabold">{price}</span><span className="text-slate-400 text-sm">{period}</span></div>
                <ul className="mt-8 space-y-3">{feats.map(f => <li key={f} className="flex items-center gap-3 text-sm text-slate-400"><Check className="w-4 h-4 text-green-400 flex-shrink-0" /> {f}</li>)}</ul>
                <Link to="/builder" className={'mt-8 block text-center py-3 rounded-xl font-semibold text-sm transition-all ' + (pop ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:shadow-lg' : 'glass-light text-white hover:bg-white/10')}>{cta}</Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fade} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative glass rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" /><div className="absolute bottom-0 right-1/3 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" /></div>
            <div className="relative">
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Ready to automate <span className="gradient-text">smarter</span>?</h2>
              <p className="mt-4 text-slate-400 text-lg max-w-xl mx-auto">Join thousands of teams building n8n workflows with AI.</p>
              <div className="mt-8"><Link to="/builder" className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-lg shadow-xl shadow-indigo-500/25 hover:-translate-y-0.5 transition-all"><Sparkles className="w-5 h-5" /> Start Building Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></Link></div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-orange-500 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div><span className="font-bold">n8n Sidekick</span></div>
          <div className="flex items-center gap-8 text-sm text-slate-500"><a href="#" className="hover:text-white transition-colors">Privacy</a><a href="#" className="hover:text-white transition-colors">Terms</a><a href="#" className="hover:text-white transition-colors">Docs</a></div>
          <div className="text-xs text-slate-500">© 2025 n8n Automation Sidekick</div>
        </div>
      </footer>
    </main>
  );
}

/* ── BUILDER ── */
const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', models: [{ id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' }, { id: 'openai/gpt-4o', name: 'GPT-4o' }, { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5' }, { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0' }] },
  { id: 'openai', name: 'OpenAI', models: [{ id: 'gpt-4o-mini', name: 'GPT-4o Mini' }, { id: 'gpt-4o', name: 'GPT-4o' }] },
  { id: 'groq', name: 'Groq', models: [{ id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B' }, { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' }] },
];

function Builder() {
  const [prov, setProv] = useState(PROVIDERS[0]);
  const [model, setModel] = useState(PROVIDERS[0].models[0].id);
  const [apiKey, setApiKey] = useState('');
  const [desc, setDesc] = useState('');
  const [wf, setWf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showCfg, setShowCfg] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef(null);

  const switchProv = (id) => { const p = PROVIDERS.find(x => x.id === id); setProv(p); setModel(p.models[0].id); };

  const generate = async () => {
    if (!desc.trim()) { toast.error('Describe your workflow first'); return; }
    if (!apiKey.trim()) { toast.error('Enter your API key'); setShowCfg(true); return; }
    setLoading(true); setErr(null); setWf(null); setElapsed(0);
    const t0 = Date.now();
    timer.current = setInterval(() => setElapsed(((Date.now() - t0) / 1000).toFixed(1)), 100);
    try {
      const r = await callAI({ description: desc, provider: prov.id, apiKey, model });
      setWf(r.workflow); toast.success('Generated in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
    } catch (e) { setErr(e.message); toast.error('Generation failed'); }
    finally { clearInterval(timer.current); setElapsed(((Date.now() - t0) / 1000).toFixed(1)); setLoading(false); }
  };

  const copyJ = async () => { if (!wf) return; await navigator.clipboard.writeText(JSON.stringify(wf, null, 2)); setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000); };
  const dlJ = () => { if (!wf) return; const b = new Blob([JSON.stringify(wf, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (wf.name || 'workflow') + '.json'; a.click(); };

  return (
    <main className="min-h-screen pt-20">
      <div className="fixed inset-0 pointer-events-none -z-10"><div className="absolute top-20 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" /><div className="absolute bottom-20 right-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" /></div>
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Workflow <span className="gradient-text">Builder</span></h1>
          <p className="text-slate-400 mt-2">Describe your automation in natural language. AI does the rest.</p>
        </motion.div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            <div className="glass rounded-2xl overflow-hidden">
              <button onClick={() => setShowCfg(!showCfg)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3"><Settings2 className="w-5 h-5 text-indigo-300" /><div className="text-left"><div className="text-sm font-semibold">{prov.name}</div><div className="text-xs text-slate-500">{prov.models.find(m => m.id === model)?.name}</div></div></div>
                <ChevronDown className={'w-4 h-4 text-slate-500 transition-transform ' + (showCfg ? 'rotate-180' : '')} />
              </button>
              {showCfg && (
                <div className="px-6 pb-6 space-y-4 pt-4 border-t border-slate-700/50">
                  <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Provider</label>
                    <div className="grid grid-cols-3 gap-2">{PROVIDERS.map(p => <button key={p.id} onClick={() => switchProv(p.id)} className={'px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ' + (prov.id === p.id ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30' : 'glass-light text-slate-400 hover:text-white')}>{p.name}</button>)}</div>
                  </div>
                  <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Model</label>
                    <select value={model} onChange={e => setModel(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: '#1a1a3e', border: '1px solid #2e2e5a' }}>{prov.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                  </div>
                  <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">API Key</label>
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter your API key..." className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: '#1a1a3e', border: '1px solid #2e2e5a' }} />
                  </div>
                </div>
              )}
            </div>
            <div className="glass rounded-2xl p-6 flex-1 flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Describe Your Workflow</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. When a new Stripe payment arrives, save to Google Sheets and notify Slack..." className="flex-1 min-h-[180px] bg-transparent text-white placeholder:text-slate-600 text-sm leading-relaxed resize-none focus:outline-none" />
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="text-xs text-slate-500 mb-2">Try an example:</div>
                <div className="flex flex-wrap gap-2">
                  {['Stripe payment → Sheets → Slack', 'Monitor website changes → email alert', 'Incoming emails → extract attachments → Google Drive'].map((ex, i) => <button key={i} onClick={() => setDesc(ex)} className="px-3 py-1.5 rounded-lg glass-light text-xs text-slate-400 hover:text-white transition-colors">{ex}</button>)}
                </div>
              </div>
            </div>
            <button onClick={generate} disabled={loading || !desc.trim()} className="group w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-lg shadow-xl shadow-indigo-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              <span className="flex items-center justify-center gap-3">{loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating... {elapsed}s</> : <><Sparkles className="w-5 h-5" /> Generate Workflow <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}</span>
            </button>
          </div>
          <div className="flex flex-col">
            <div className="glass rounded-2xl flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3"><div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400/60" /><div className="w-3 h-3 rounded-full bg-yellow-400/60" /><div className="w-3 h-3 rounded-full bg-green-400/60" /></div><span className="text-xs text-slate-500 font-mono">workflow.json</span>{wf?.nodes && <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold">{wf.nodes.length} nodes</span>}</div>
                {wf && <div className="flex items-center gap-2"><button onClick={copyJ} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-light text-xs font-medium text-slate-400 hover:text-white transition-colors">{copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}</button><button onClick={dlJ} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-light text-xs font-medium text-slate-400 hover:text-white transition-colors"><Download className="w-3.5 h-3.5" /> Download</button></div>}
              </div>
              <div className="flex-1 p-6 overflow-auto min-h-[400px]">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 text-center"><div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-300 animate-spin" /></div><div className="text-sm font-semibold">Generating your workflow...</div><div className="text-xs text-slate-500">Using {prov.name} · {prov.models.find(m => m.id === model)?.name}</div></div>
                ) : err ? (
                  <div className="h-full flex flex-col items-center justify-center gap-4 text-center"><div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center"><AlertCircle className="w-8 h-8 text-red-400" /></div><div className="text-sm font-semibold text-red-400">Generation Failed</div><div className="text-xs text-slate-500 max-w-sm">{err}</div><button onClick={generate} className="flex items-center gap-2 px-4 py-2 rounded-xl glass-light text-xs font-medium text-slate-400 hover:text-white"><RotateCcw className="w-3.5 h-3.5" /> Try Again</button></div>
                ) : wf ? (
                  <div><div className="flex flex-wrap gap-2 mb-4">{wf.nodes?.map((n, i) => <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 text-xs font-medium text-indigo-300"><Zap className="w-3 h-3" /> {n.name || n.type?.split('.').pop()}</span>)}</div><pre className="text-xs font-mono text-slate-400 leading-relaxed whitespace-pre-wrap break-words">{JSON.stringify(wf, null, 2)}</pre></div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 text-center"><div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: '#1a1a3e' }}><Sparkles className="w-10 h-10 text-slate-700" /></div><div className="text-sm font-semibold text-slate-500">Your workflow will appear here</div><div className="text-xs text-slate-600">Describe your automation and click Generate</div></div>
                )}
              </div>
              {wf && <div className="px-6 py-3 flex items-center justify-between border-t border-slate-700/50"><div className="text-xs text-slate-500">Generated in {elapsed}s · {prov.name}</div><div className="text-xs text-green-400 font-medium">Ready to import</div></div>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ── AUTH PAGES ── */
function Login() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const submit = (e) => { e.preventDefault(); toast.error('Supabase auth not configured yet. Use the Builder directly!'); };
  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-orange-500 flex items-center justify-center mx-auto mb-4"><Zap className="w-7 h-7 text-white" /></div><h1 className="text-2xl font-bold">Welcome back</h1><p className="text-sm text-slate-400 mt-1">Sign in to your account</p></div>
        <div className="glass rounded-2xl p-8">
          <form onSubmit={submit} className="space-y-4">
            <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Email</label><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: '#1a1a3e', border: '1px solid #2e2e5a' }} /></div></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Password</label><div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter password" className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: '#1a1a3e', border: '1px solid #2e2e5a' }} /><button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"><ArrowRight className="w-4 h-4" /> Sign in</button>
          </form>
        </div>
        <p className="text-center text-sm text-slate-400 mt-6">No account? <Link to="/signup" className="text-indigo-300 hover:underline font-medium">Sign up</Link></p>
      </motion.div>
    </main>
  );
}

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const submit = (e) => { e.preventDefault(); toast.error('Supabase auth not configured yet. Use the Builder directly!'); };
  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-orange-500 flex items-center justify-center mx-auto mb-4"><Zap className="w-7 h-7 text-white" /></div><h1 className="text-2xl font-bold">Create your account</h1><p className="text-sm text-slate-400 mt-1">Start building workflows with AI</p></div>
        <div className="glass rounded-2xl p-8">
          <form onSubmit={submit} className="space-y-4">
            <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Full Name</label><div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: '#1a1a3e', border: '1px solid #2e2e5a' }} /></div></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Email</label><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: '#1a1a3e', border: '1px solid #2e2e5a' }} /></div></div>
            <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Password</label><div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 6 characters" className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" style={{ background: '#1a1a3e', border: '1px solid #2e2e5a' }} /><button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"><ArrowRight className="w-4 h-4" /> Create account</button>
          </form>
        </div>
        <p className="text-center text-sm text-slate-400 mt-6">Have an account? <Link to="/login" className="text-indigo-300 hover:underline font-medium">Sign in</Link></p>
      </motion.div>
    </main>
  );
}

/* ── APP ROOT ── */
export default function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e1e42', color: '#f1f5f9', border: '1px solid #2e2e5a' } }} />
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/services" element={<ServicesCatalog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
