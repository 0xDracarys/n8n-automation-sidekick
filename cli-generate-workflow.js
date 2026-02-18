#!/usr/bin/env node
/*
 * Terminal CLI for n8n workflow generation using shared workflow-engine.
 * Usage example:
 * node cli-generate-workflow.js --provider openrouter --model openai/gpt-4o-mini --description "Build a lead intake workflow" --out ./workflow.json
 */

const fs = require('fs');
const path = require('path');
const { generateWorkflow } = require('./workflow-engine');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function usage() {
  console.log(`\nUsage:\n  node cli-generate-workflow.js --description "<workflow prompt>" [options]\n\nOptions:\n  --provider <openrouter|openai|groq>    AI provider (default: openrouter)\n  --model <model-name>                   Model for selected provider\n  --description "<prompt>"               Required natural language workflow prompt\n  --out <file-path>                      Save workflow JSON to file\n  --print                                Print full workflow JSON to stdout\n  --help                                 Show help\n\nEnvironment variables for API keys:\n  OPENROUTER_API_KEY (for openrouter)\n  OPENAI_API_KEY     (for openai)\n  GROQ_API_KEY       (for groq)\n`);
}

function getApiKeyForProvider(provider) {
  if (provider === 'openrouter') return process.env.OPENROUTER_API_KEY || '';
  if (provider === 'openai') return process.env.OPENAI_API_KEY || '';
  if (provider === 'groq') return process.env.GROQ_API_KEY || '';
  return '';
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    usage();
    process.exit(0);
  }

  const provider = String(args.provider || 'openrouter').toLowerCase();
  const description = args.description || '';
  const model = args.model || undefined;
  const outPath = args.out ? path.resolve(process.cwd(), args.out) : '';
  const shouldPrint = Boolean(args.print);

  if (!description.trim()) {
    console.error('Error: --description is required.');
    usage();
    process.exit(1);
  }

  if (!['openrouter', 'openai', 'groq'].includes(provider)) {
    console.error(`Error: Unsupported provider \"${provider}\". Use openrouter, openai, or groq.`);
    process.exit(1);
  }

  const apiKey = getApiKeyForProvider(provider);
  if (!apiKey) {
    console.error(`Error: Missing API key for provider ${provider}.`);
    console.error('Set the matching env var before running this command.');
    process.exit(1);
  }

  console.log(`Generating workflow with provider=${provider}${model ? `, model=${model}` : ''}...`);

  const result = await generateWorkflow({
    description,
    provider,
    apiKey,
    model,
    includeErrorHandling: true,
  });

  const workflow = result.workflow;
  const payload = JSON.stringify(workflow, null, 2);

  console.log('Generation complete.');
  console.log(`Workflow: ${workflow.name || 'Generated Workflow'}`);
  console.log(`Nodes: ${Array.isArray(workflow.nodes) ? workflow.nodes.length : 0}`);

  if (outPath) {
    fs.writeFileSync(outPath, payload, 'utf8');
    console.log(`Saved JSON to: ${outPath}`);
  }

  if (shouldPrint || !outPath) {
    console.log(payload);
  }
}

main().catch((error) => {
  console.error('Generation failed:', error?.message || error);
  process.exit(1);
});
