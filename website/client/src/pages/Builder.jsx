import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Sparkles, Copy, Download, Check, Loader2, Zap, ChevronDown,
  AlertCircle, ArrowRight, RotateCcw, Settings2, Save
} from 'lucide-react';
import { generateWorkflowDirect } from '../lib/api';
import { supabase } from '../lib/supabase';
import { WorkflowStorage } from '../lib/workflow-storage.js';
import { WorkflowCanvas } from '../lib/workflow-canvas.js';

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', desc: 'GPT-4o, Claude, Gemini, Llama', models: [
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Fast)' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (Best)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
  ]},
  { id: 'openai', name: 'OpenAI', desc: 'Direct OpenAI access', models: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  ]},
  { id: 'groq', name: 'Groq', desc: 'Ultra-fast inference', models: [
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
  ]},
];

const EXAMPLE_PROMPTS = [
  'When a new Stripe payment arrives, save to Google Sheets and notify Slack',
  'Monitor a website for changes and send an email alert',
  'Process incoming emails, extract attachments, and upload to Google Drive',
  'When a GitHub issue is created, create a Trello card and notify Discord',
  'Schedule a daily report from a database and email it as a PDF',
];

export default function Builder() {
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [model, setModel] = useState(PROVIDERS[0].models[0].id);
  const [apiKey, setApiKey] = useState('');
  const [description, setDescription] = useState('');
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [previewMode, setPreviewMode] = useState('graph');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data?.session;
      setIsAuthenticated(!!session);
      setAuthEmail(session?.user?.email || '');
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setAuthEmail(session?.user?.email || '');
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Initialize workflow canvas when workflow changes
  useEffect(() => {
    if (workflow && previewMode === 'graph') {
      // Clear previous canvas
      const container = document.getElementById('workflowCanvas');
      if (container) {
        container.innerHTML = '';
      }
      
      const canvas = new WorkflowCanvas('workflowCanvas');
      canvas.render(workflow);
    }
  }, [workflow, previewMode]);

  const handleProviderChange = (id) => {
    const p = PROVIDERS.find(pr => pr.id === id);
    setProvider(p);
    setModel(p.models[0].id);
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to generate workflows');
      return;
    }

    if (!description.trim()) {
      toast.error('Please describe your workflow first');
      return;
    }
    if (!apiKey.trim()) {
      toast.error('Please enter your API key');
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setError(null);
    setWorkflow(null);
    setElapsed(0);

    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(((Date.now() - start) / 1000).toFixed(1)), 100);

    try {
      const result = await generateWorkflowDirect({
        description,
        provider: provider.id,
        apiKey,
        model,
      });
      setWorkflow(result.workflow);
      toast.success(`Workflow generated in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    } catch (err) {
      setError(err.message);
      toast.error('Generation failed');
    } finally {
      clearInterval(timerRef.current);
      setElapsed(((Date.now() - start) / 1000).toFixed(1));
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!workflow) return;
    await navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!workflow) return;
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name || 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded workflow JSON');
  };

  const handleSaveWorkflow = async () => {
    if (!workflow || !isAuthenticated) {
      toast.error('Please sign in to save workflows');
      return;
    }

    try {
      const workflowStorage = new WorkflowStorage(supabase);
      const workflowName = prompt('Enter a name for your workflow:', 'Generated Workflow');
      if (!workflowName) return;

      const privacy = confirm('Make this workflow public? (Click OK for public, Cancel for private)');
      const visibility = privacy ? 'public' : 'private';

      const saved = await workflowStorage.saveWorkflow(
        (await supabase.auth.getUser()).data.user.id,
        workflow,
        {
          name: workflowName,
          description: `Generated by AI: ${description || 'No description'}`,
          visibility,
          tags: extractTagsFromWorkflow(workflow)
        }
      );

      toast.success(`Workflow "${saved.name}" saved to your profile (${visibility})`);
      console.log('Saved workflow:', saved);
    } catch (error) {
      console.error('Save workflow failed:', error);
      toast.error('Failed to save workflow');
    }
  };

  const extractTagsFromWorkflow = (workflow) => {
    const tags = new Set();
    if (workflow?.nodes) {
      workflow.nodes.forEach(node => {
        if (node.type) {
          const nodeType = node.type.replace('n8n-nodes-base.', '');
          tags.add(nodeType);
        }
      });
    }
    return Array.from(tags).slice(0, 5);
  };

  const handleExampleClick = (prompt) => {
    setDescription(prompt);
  };

  const workflowJson = workflow ? JSON.stringify(workflow, null, 2) : '';
  const nodeCount = workflow?.nodes?.length || 0;

  const diagnostics = useMemo(() => {
    if (!workflow?.nodes?.length) {
      return { triggerCount: 0, noIncomingNonTrigger: [], invalidSources: [], edgeCount: 0 };
    }

    const names = new Set((workflow.nodes || []).map(n => n.name));
    const incoming = new Map([...names].map(n => [n, 0]));
    let edgeCount = 0;

    for (const [source, data] of Object.entries(workflow.connections || {})) {
      for (const branch of data?.main || []) {
        for (const conn of branch || []) {
          if (conn?.node && names.has(conn.node)) {
            incoming.set(conn.node, (incoming.get(conn.node) || 0) + 1);
            edgeCount += 1;
          }
        }
      }
    }

    const triggerNodes = (workflow.nodes || []).filter(n => /trigger|webhook/i.test(n.type || ''));

    return {
      triggerCount: triggerNodes.length,
      noIncomingNonTrigger: [...names].filter(n => !triggerNodes.some(t => t.name === n) && (incoming.get(n) || 0) === 0),
      invalidSources: Object.keys(workflow.connections || {}).filter(k => !names.has(k)),
      edgeCount,
    };
  }, [workflow]);

  const graphData = useMemo(() => {
    if (!workflow?.nodes?.length) return { nodes: [], edges: [] };

    const nodes = workflow.nodes.map((node, idx) => {
      const p = Array.isArray(node.position) ? node.position : [250 + idx * 250, 300];
      return { ...node, _x: Number(p[0]) || 0, _y: Number(p[1]) || 0 };
    });

    const minX = Math.min(...nodes.map(n => n._x));
    const maxX = Math.max(...nodes.map(n => n._x));
    const minY = Math.min(...nodes.map(n => n._y));
    const maxY = Math.max(...nodes.map(n => n._y));

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    const scaled = nodes.map(n => ({
      ...n,
      sx: 40 + ((n._x - minX) / width) * 520,
      sy: 24 + ((n._y - minY) / height) * 220,
    }));

    const byName = new Map(scaled.map(n => [n.name, n]));
    const edges = [];
    for (const [source, data] of Object.entries(workflow.connections || {})) {
      const src = byName.get(source);
      if (!src) continue;
      for (const branch of data?.main || []) {
        for (const conn of branch || []) {
          const dst = byName.get(conn?.node);
          if (dst) {
            edges.push({ x1: src.sx + 70, y1: src.sy + 18, x2: dst.sx, y2: dst.sy + 18 });
          }
        }
      }
    }

    return { nodes: scaled, edges };
  }, [workflow]);

  return (
    <main className="min-h-screen pt-20">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            Workflow <span className="gradient-text">Builder</span>
          </h1>
          <p className="text-text-secondary mt-2">Describe your automation in natural language. AI does the rest.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ─── LEFT: Input Panel ─── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            {/* Settings toggle */}
            <div className="glass rounded-2xl overflow-hidden">
              <button onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings2 className="w-5 h-5 text-primary-light" />
                  <div className="text-left">
                    <div className="text-sm font-semibold">{provider.name}</div>
                    <div className="text-xs text-text-secondary">{provider.models.find(m => m.id === model)?.name}</div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
                      {/* Provider */}
                      <div>
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Provider</label>
                        <div className="grid grid-cols-3 gap-2">
                          {PROVIDERS.map(p => (
                            <button key={p.id} onClick={() => handleProviderChange(p.id)}
                              className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                provider.id === p.id
                                  ? 'bg-primary/20 text-primary-light ring-1 ring-primary/30'
                                  : 'glass-light text-text-secondary hover:text-white'
                              }`}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Model */}
                      <div>
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Model</label>
                        <select value={model} onChange={e => setModel(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          {provider.models.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* API Key */}
                      <div>
                        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">API Key</label>
                        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                          placeholder="Enter your API key..."
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-light border border-border text-sm text-white placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Prompt input */}
            <div className="glass rounded-2xl p-6 flex-1 flex flex-col">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Describe Your Workflow</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. When a new Stripe payment arrives, save the customer data to Google Sheets and send a Slack notification..."
                className="flex-1 min-h-[180px] bg-transparent text-white placeholder:text-text-secondary/40 text-sm leading-relaxed resize-none focus:outline-none"
              />

              {/* Example prompts */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs text-text-secondary mb-2">Try an example:</div>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.slice(0, 3).map((p, i) => (
                    <button key={i} onClick={() => handleExampleClick(p)}
                      className="px-3 py-1.5 rounded-lg glass-light text-xs text-text-secondary hover:text-white transition-colors truncate max-w-[200px]"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={loading || !description.trim() || authLoading || !isAuthenticated}
              className="group relative w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-xl"
            >
              <span className="flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating... {elapsed}s
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Workflow
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>

            {!authLoading && !isAuthenticated && (
              <div className="glass rounded-xl p-3 text-xs text-text-secondary">
                Sign in required for generation. <Link to="/login" className="text-primary-light hover:underline">Go to Login</Link>
              </div>
            )}
            {!authLoading && isAuthenticated && (
              <div className="text-xs text-text-secondary px-1">Signed in as {authEmail}</div>
            )}
          </motion.div>

          {/* ─── RIGHT: Output Panel ─── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="glass rounded-2xl flex-1 flex flex-col overflow-hidden">
              {/* Output header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-error/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <span className="text-xs text-text-secondary font-mono">workflow.json</span>
                  {nodeCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">
                      {nodeCount} nodes
                    </span>
                  )}
                </div>
                {workflow && (
                  <div className="flex items-center gap-2">
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-light text-xs font-medium text-text-secondary hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-light text-xs font-medium text-text-secondary hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button onClick={handleSaveWorkflow}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-light text-xs font-medium text-text-secondary hover:text-white transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                )}
              </div>

              {/* Output body */}
              <div className="flex-1 p-6 overflow-auto">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center gap-4 text-center"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-primary-light animate-spin" />
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Generating your workflow...</div>
                        <div className="text-xs text-text-secondary mt-1">Using {provider.name} &middot; {provider.models.find(m => m.id === model)?.name}</div>
                      </div>
                    </motion.div>
                  ) : error ? (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center gap-4 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-error" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-error">Generation Failed</div>
                        <div className="text-xs text-text-secondary mt-1 max-w-sm">{error}</div>
                      </div>
                      <button onClick={handleGenerate}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl glass-light text-xs font-medium text-text-secondary hover:text-white transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Try Again
                      </button>
                    </motion.div>
                  ) : workflow ? (
                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* QA diagnostics */}
                      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="px-3 py-2 rounded-lg bg-surface-light text-xs text-text-secondary">Triggers: <span className={diagnostics.triggerCount === 1 ? 'text-success' : 'text-error'}>{diagnostics.triggerCount}</span></div>
                        <div className="px-3 py-2 rounded-lg bg-surface-light text-xs text-text-secondary">Edges: <span className="text-white">{diagnostics.edgeCount}</span></div>
                        <div className="px-3 py-2 rounded-lg bg-surface-light text-xs text-text-secondary">Orphans: <span className={diagnostics.noIncomingNonTrigger.length ? 'text-error' : 'text-success'}>{diagnostics.noIncomingNonTrigger.length}</span></div>
                        <div className="px-3 py-2 rounded-lg bg-surface-light text-xs text-text-secondary">Invalid sources: <span className={diagnostics.invalidSources.length ? 'text-error' : 'text-success'}>{diagnostics.invalidSources.length}</span></div>
                      </div>

                      <div className="mb-4 flex gap-2">
                        <button onClick={() => setPreviewMode('graph')} className={`px-3 py-1.5 rounded-lg text-xs ${previewMode === 'graph' ? 'bg-primary/20 text-primary-light' : 'glass-light text-text-secondary'}`}>Graph Preview</button>
                        <button onClick={() => setPreviewMode('json')} className={`px-3 py-1.5 rounded-lg text-xs ${previewMode === 'json' ? 'bg-primary/20 text-primary-light' : 'glass-light text-text-secondary'}`}>JSON Preview</button>
                      </div>

                      {previewMode === 'graph' ? (
                        <div className="mb-4 rounded-xl border border-border bg-surface-light/30 p-3 overflow-auto">
                          <div id="workflowCanvas" className="w-full h-[280px]"></div>
                        </div>
                      ) : null}

                      {/* Node summary */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {workflow.nodes?.map((node, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-xs font-medium text-primary-light">
                            <Zap className="w-3 h-3" />
                            {node.name || node.type?.split('.').pop()}
                          </span>
                        ))}
                      </div>
                      {/* JSON output */}
                      {previewMode === 'json' && (
                        <pre className="text-xs font-mono text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
                          {workflowJson}
                        </pre>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center gap-4 text-center min-h-[400px]"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-surface-light flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-border" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-secondary">Your workflow will appear here</div>
                        <div className="text-xs text-text-secondary/60 mt-1">Describe your automation and click Generate</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Output footer */}
              {workflow && (
                <div className="px-6 py-3 border-t border-border flex items-center justify-between">
                  <div className="text-xs text-text-secondary">
                    Generated in {elapsed}s &middot; {provider.name} &middot; {provider.models.find(m => m.id === model)?.name}
                  </div>
                  <div className="text-xs text-success font-medium">Ready to import</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
