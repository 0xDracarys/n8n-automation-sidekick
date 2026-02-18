import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Sparkles, ArrowRight, Bot, Workflow, Shield, Clock,
  Code2, Globe, Star, ChevronRight, Check, Users, BarChart3,
  Layers, GitBranch, Play
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } })
};

function Section({ children, className = '', id }) {
  return (
    <section id={id} className={`relative py-24 lg:py-32 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">{children}</div>
    </section>
  );
}

function SectionLabel({ icon: Icon, text }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-xs font-semibold tracking-wider uppercase text-primary-light mb-6"
    >
      <Icon className="w-3.5 h-3.5" /> {text}
    </motion.div>
  );
}

/* ─── HERO ─── */
function Hero() {
  return (
    <Section className="pt-32 lg:pt-44 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative text-center max-w-4xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-xs font-semibold tracking-wider uppercase text-primary-light mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" /> Powered by AI &mdash; Built for Automation
        </motion.div>

        <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-balance"
        >
          Build n8n Workflows{' '}
          <span className="gradient-text">in Seconds</span>
          <br />
          with Natural Language
        </motion.h1>

        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
        >
          Describe what you want in plain English. Our AI instantly generates production-ready n8n workflows — no drag-and-drop required.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/builder"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Start Building Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#demo"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass text-white font-semibold text-lg hover:bg-white/10 transition-all"
          >
            <Play className="w-5 h-5" />
            Watch Demo
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
        >
          {[
            { value: '10k+', label: 'Workflows Built' },
            { value: '50+', label: 'Node Types' },
            { value: '99.9%', label: 'Uptime' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">{s.value}</div>
              <div className="text-xs text-text-secondary mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Hero visual */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}
          className="mt-20 relative rounded-2xl overflow-hidden glow"
        >
          <div className="glass rounded-2xl p-1">
            <div className="bg-surface-card rounded-xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-error/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-success/80" />
                <span className="ml-3 text-xs text-text-secondary font-mono">n8n-sidekick — workflow builder</span>
              </div>
              <div className="space-y-3 font-mono text-sm">
                <div className="text-text-secondary">
                  <span className="text-primary-light">$</span> describe &quot;When a new Stripe payment comes in, save to Google Sheets and notify Slack&quot;
                </div>
                <div className="text-success">
                  ✓ Analyzing prompt...
                </div>
                <div className="text-success">
                  ✓ Generated 4 nodes: Stripe Trigger → Set → Google Sheets → Slack
                </div>
                <div className="text-success">
                  ✓ Workflow ready — copy JSON or import directly to n8n
                </div>
                <div className="mt-4 p-4 rounded-lg bg-surface-light text-xs text-text-secondary overflow-x-auto">
                  {`{ "name": "Stripe → Sheets → Slack", "nodes": [{ "type": "n8n-nodes-base.stripeTrigger" }, { "type": "n8n-nodes-base.set" }, { "type": "n8n-nodes-base.googleSheets" }, { "type": "n8n-nodes-base.slack" }], "connections": { ... } }`}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ─── FEATURES ─── */
function Features() {
  const features = [
    { icon: Bot, title: 'AI-Powered Generation', desc: 'GPT-4o, Claude, Gemini, Llama — pick your model and watch it build complex workflows from a single sentence.' },
    { icon: Workflow, title: 'Production-Ready JSON', desc: 'Every workflow is valid n8n JSON with correct node types, parameters, and connections. Copy-paste and run.' },
    { icon: Zap, title: 'Instant Results', desc: 'Generate workflows in under 5 seconds. No more hours of manual drag-and-drop configuration.' },
    { icon: Shield, title: 'Enterprise Security', desc: 'Your API keys never leave your browser. Zero data retention. SOC 2 compliant architecture.' },
    { icon: Layers, title: 'Multi-Provider', desc: 'Switch between OpenRouter, OpenAI, Google Gemini, Groq, or local Ollama with a single click.' },
    { icon: GitBranch, title: 'Smart Connections', desc: 'AI understands data flow and automatically creates proper node connections and error handling.' },
  ];

  return (
    <Section id="features">
      <div className="text-center">
        <SectionLabel icon={Sparkles} text="Features" />
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-4xl lg:text-5xl font-bold tracking-tight"
        >
          Everything you need to{' '}
          <span className="gradient-text">automate faster</span>
        </motion.h2>
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
          className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto"
        >
          From simple triggers to complex multi-step workflows, our AI handles it all.
        </motion.p>
      </div>

      <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
            className="group glass rounded-2xl p-8 hover:bg-white/[0.03] transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <f.icon className="w-6 h-6 text-primary-light" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ─── HOW IT WORKS ─── */
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Describe Your Workflow', desc: 'Type what you want in plain English. Be as specific or as vague as you like.', icon: Code2 },
    { num: '02', title: 'AI Generates JSON', desc: 'Our AI analyzes your request and builds a complete n8n workflow with proper nodes and connections.', icon: Bot },
    { num: '03', title: 'Import & Run', desc: 'Copy the JSON, paste it into n8n, and your workflow is live. It\'s that simple.', icon: Play },
  ];

  return (
    <Section className="bg-surface-light/30" id="demo">
      <div className="text-center">
        <SectionLabel icon={Zap} text="How It Works" />
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-4xl lg:text-5xl font-bold tracking-tight"
        >
          Three steps to{' '}
          <span className="gradient-text-orange">automation</span>
        </motion.h2>
      </div>

      <div className="mt-16 grid lg:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <motion.div key={s.num} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
            className="relative glass rounded-2xl p-8 text-center"
          >
            <div className="text-6xl font-black gradient-text-orange opacity-20 absolute top-4 right-6">{s.num}</div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mx-auto mb-6">
              <s.icon className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-3">{s.title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
            {i < steps.length - 1 && (
              <ChevronRight className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-border" />
            )}
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ─── PRICING ─── */
function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      desc: 'Perfect for getting started',
      features: ['5 workflows / day', 'OpenRouter & Ollama', 'Basic templates', 'Community support'],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      desc: 'For power users & teams',
      features: ['Unlimited workflows', 'All AI providers', 'Priority generation', 'Workflow history', 'Custom templates', 'Priority support'],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      desc: 'For organizations at scale',
      features: ['Everything in Pro', 'SSO & SAML', 'Dedicated instance', 'SLA guarantee', 'Custom integrations', 'Onboarding & training'],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <Section id="pricing">
      <div className="text-center">
        <SectionLabel icon={BarChart3} text="Pricing" />
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-4xl lg:text-5xl font-bold tracking-tight"
        >
          Simple, transparent{' '}
          <span className="gradient-text">pricing</span>
        </motion.h2>
        <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
          className="mt-4 text-text-secondary text-lg"
        >
          Start free. Upgrade when you need more.
        </motion.p>
      </div>

      <div className="mt-16 grid lg:grid-cols-3 gap-8 items-start">
        {plans.map((p, i) => (
          <motion.div key={p.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
            className={`relative rounded-2xl p-8 ${
              p.popular
                ? 'glass glow ring-1 ring-primary/30 scale-105'
                : 'glass'
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-xs font-bold text-white">
                Most Popular
              </div>
            )}
            <h3 className="text-xl font-bold">{p.name}</h3>
            <p className="text-sm text-text-secondary mt-1">{p.desc}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">{p.price}</span>
              <span className="text-text-secondary text-sm">{p.period}</span>
            </div>
            <ul className="mt-8 space-y-3">
              {p.features.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-success shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/builder"
              className={`mt-8 block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                p.popular
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:shadow-primary/25'
                  : 'glass-light text-white hover:bg-white/10'
              }`}
            >
              {p.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ─── TESTIMONIALS ─── */
function Testimonials() {
  const reviews = [
    { name: 'Sarah Chen', role: 'DevOps Lead, Stripe', text: 'This tool cut our workflow creation time from hours to seconds. The AI understands complex automation patterns perfectly.', stars: 5 },
    { name: 'Marcus Rodriguez', role: 'CTO, ScaleUp', text: 'We replaced our entire workflow design process with n8n Sidekick. The JSON output is always production-ready.', stars: 5 },
    { name: 'Emily Watson', role: 'Automation Engineer', text: 'The multi-provider support is incredible. I switch between GPT-4 and Claude depending on the complexity. Game changer.', stars: 5 },
  ];

  return (
    <Section className="bg-surface-light/30">
      <div className="text-center">
        <SectionLabel icon={Star} text="Testimonials" />
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-4xl lg:text-5xl font-bold tracking-tight"
        >
          Loved by{' '}
          <span className="gradient-text">automation teams</span>
        </motion.h2>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-8">
        {reviews.map((r, i) => (
          <motion.div key={r.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
            className="glass rounded-2xl p-8"
          >
            <div className="flex gap-1 mb-4">
              {Array.from({ length: r.stars }).map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">&ldquo;{r.text}&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                {r.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-text-secondary">{r.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <Section>
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="relative glass rounded-3xl p-12 sm:p-16 text-center overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />
        </div>
        <div className="relative">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Ready to automate{' '}
            <span className="gradient-text">smarter</span>?
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-xl mx-auto">
            Join thousands of teams building n8n workflows with AI. Start free, no credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/builder"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Start Building Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">n8n Sidekick</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-text-secondary">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
          <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
        </div>
        <div className="text-xs text-text-secondary">&copy; 2025 n8n Automation Sidekick. All rights reserved.</div>
      </div>
    </footer>
  );
}

/* ─── LANDING PAGE ─── */
export default function Landing() {
  return (
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
